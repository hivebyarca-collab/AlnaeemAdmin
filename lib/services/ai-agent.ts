// Server-side only module (imported exclusively by route handlers / server actions).

/**
 * AI agent for WhatsApp conversations. Provider-abstracted (OpenAI-compatible
 * chat completions) so the model can be swapped without touching callers.
 * The agent may ONLY act through the restricted tools below, which reuse the
 * application repository. Secrets never reach the browser.
 */
import {
  getProducts, getProduct, listAdminProducts, getProductPriceSyp, getSettings,
  getConversationById, insertMessage, setConversationFlags, type Product,
} from '@/lib/database';

export type AgentMode = 'AUTO' | 'ASSIST' | 'MANUAL';

export type AgentToolsConfig = { highValueThresholdUsd?: number; escalationKeywords?: string[] };

function escalationConfig(): Required<AgentToolsConfig> {
  const settings = getSettings();
  return {
    highValueThresholdUsd: Number(settings.ai_high_value_threshold_usd ?? 500),
    escalationKeywords: (settings.ai_escalation_keywords ?? 'بشري,موظف,ادعاء,شكوى,دفع,انسحاب').split(',').map((keyword) => keyword.trim()).filter(Boolean),
  };
}

/* ---------- Restricted tools (safe access to store information) ---------- */

export const agentTools = {
  searchProducts(query: string): Product[] {
    return listAdminProducts({ query, pageSize: 5 }).rows;
  },
  getProductDetails(id: string): Product | undefined {
    return getProduct(id);
  },
  checkStock(id: string): { available: number } | undefined {
    const product = getProduct(id);
    if (!product) return undefined;
    return { available: product.stock_quantity - product.reserved_quantity };
  },
  getProductPrice(id: string) {
    const product = getProduct(id);
    if (!product) return undefined;
    return { usd: product.price_usd, syp: getProductPriceSyp(product) };
  },
  getStorefrontProducts(): Product[] {
    return getProducts().filter((product) => product.is_active === 1).slice(0, 20);
  },
  handoffToAdmin(conversationId: string, reason: string) {
    setConversationFlags(conversationId, { needs_admin: true, ai_paused: true });
    return { conversationId, reason, requiresHuman: true } as const;
  },
};

/* --------------------------- Escation detection --------------------------- */

export function shouldEscalate(message: string, proposedTotalUsd?: number, confidence = 1): { escalate: boolean; reason?: string } {
  const config = escalationConfig();
  const lowered = message.toLowerCase();
  if (config.escalationKeywords.some((keyword) => lowered.includes(keyword.toLowerCase()))) return { escalate: true, reason: 'RULE_KEYWORD' };
  if (proposedTotalUsd !== undefined && proposedTotalUsd >= config.highValueThresholdUsd) return { escalate: true, reason: 'HIGH_VALUE_ORDER' };
  if (confidence < 0.6) return { escalate: true, reason: 'LOW_CONFIDENCE' };
  return { escalate: false };
}

/* ----------------------------- Provider call ----------------------------- */

export function isAgentConfigured(): boolean {
  return Boolean(process.env.AI_PROVIDER_API_KEY);
}

export type AgentReply = { text: string; escalate: boolean; reason?: string; suggestions?: string[]; configured: boolean };

/**
 * Produces a reply for an inbound customer message. In ASSIST mode the reply
 * is a suggestion the admin must approve; in AUTO mode the caller sends it.
 * When no provider is configured the agent stays safely disabled.
 */
export async function generateAgentReply(input: {
  conversationId: string; customerMessage: string; mode: AgentMode; history: { role: 'customer' | 'ai' | 'admin'; body: string }[];
}): Promise<AgentReply> {
  const conversation = getConversationById(input.conversationId);
  if (conversation?.ai_paused) return { text: '', escalate: false, configured: isAgentConfigured(), reason: 'AI_PAUSED' };
  if (!isAgentConfigured()) {
    if (input.mode === 'AUTO') {
      insertMessage({ conversation_id: input.conversationId, direction: 'outbound', sender_type: 'system', body: 'الأداة الذكية غير مفعّلة حالياً. سيتواصل معك أحد الموظفين قريباً.' });
    }
    insertMessage({ conversation_id: input.conversationId, direction: 'outbound', sender_type: 'system', body: 'تم تحويل المحادثة إلى إدارة المتجر.' });
    return { text: '', escalate: true, reason: 'PROVIDER_NOT_CONFIGURED', configured: false };
  }
  const catalog = agentTools.getStorefrontProducts().map((product) => `${product.name} (${product.sku})`).join('; ');
  const systemPrompt = [
    'أنت مساعد خدمة عملاء لمتجر النعيم للألعاب (AL NAEEM Gaming Store).',
    'أجب بالعربية وباختصار. لا تخترع منتجات أو أسعاراً غير موجودة في القائمة.',
    `المنتجات المتوفرة حالياً: ${catalog}`,
    'إذا كان السؤال عن دفع أو شكوى أو طلب موظف بشري، اطلب تحويل المحادثة للإدارة.',
  ].join('\n');
  try {
    const response = await fetch(`${process.env.AI_PROVIDER_BASE_URL ?? 'https://openrouter.ai/api/v1'}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.AI_PROVIDER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_PROVIDER_MODEL ?? 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...input.history.slice(-8).map((entry) => ({ role: entry.role === 'customer' ? 'user' : 'assistant', content: entry.body })),
          { role: 'user', content: input.customerMessage },
        ],
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    const escalation = shouldEscalate(input.customerMessage);
    return { text, escalate: escalation.escalate, reason: escalation.reason, configured: true };
  } catch (error) {
    return { text: '', escalate: true, reason: error instanceof Error ? error.message : 'PROVIDER_ERROR', configured: true };
  }
}
