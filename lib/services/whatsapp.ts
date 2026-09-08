// Server-side only module (imported exclusively by route handlers / server actions).

/**
 * WhatsApp Business Cloud API service. Credentials stay server-side.
 * Without credentials every function reports a disconnected state —
 * no fake "connected" status is ever produced.
 */
export type WhatsAppConfig = {
  accessToken: string | null; phoneNumberId: string | null; businessAccountId: string | null;
  verifyToken: string | null; appSecret: string | null;
};

export function getWhatsAppConfig(): WhatsAppConfig {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? null,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? null,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? null,
    appSecret: process.env.WHATSAPP_APP_SECRET ?? null,
  };
}

export function isWhatsAppConfigured(config = getWhatsAppConfig()): boolean {
  return Boolean(config.accessToken && config.phoneNumberId);
}

export type SendResult = { ok: boolean; providerMessageId?: string; error?: string };

/** Sends a text message through the Cloud API. */
export async function sendWhatsAppText(phone: string, body: string): Promise<SendResult> {
  const config = getWhatsAppConfig();
  if (!isWhatsAppConfigured(config)) return { ok: false, error: 'WHATSAPP_NOT_CONFIGURED' };
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace('+', ''), type: 'text', text: { body } }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { ok: false, error: `HTTP_${response.status}` };
    const data = (await response.json()) as { messages?: Array<{ id: string }> };
    return { ok: true, providerMessageId: data.messages?.[0]?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'UNKNOWN' };
  }
}

/** GET webhook verification handshake. */
export function verifyWebhook(mode: string | null, token: string | null, challenge: string | null): { ok: boolean; challenge?: string } {
  const config = getWhatsAppConfig();
  if (!config.verifyToken) return { ok: false };
  if (mode === 'subscribe' && token === config.verifyToken) return { ok: true, challenge: challenge ?? undefined };
  return { ok: false };
}

/** X-Hub-Signature-256 verification using the app secret. */
export async function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const appSecret = getWhatsAppConfig().appSecret;
  if (!appSecret) return false; // cannot verify without the secret; treat as unverified
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const crypto = await import('node:crypto');
  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const supplied = signatureHeader.slice(7);
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(supplied, 'hex'));
}
