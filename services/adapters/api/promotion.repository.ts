import { apiData, apiFetch } from '@/lib/api/client';

export type ApiPromotionStatus = 'NORMAL' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED';

export type ApiPromotion = {
  id: string;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  enabled: boolean;
  status: ApiPromotionStatus;
  percentage: number | null;
  salePriceMinor: number | null;
  startsAt: string | null;
  endsAt: string | null;
  showOnHomepage: boolean;
  priority: number;
  productId: string | null;
  product: { id: string; sku: string; name: string; slug: string; priceMinor: number; currency: string } | null;
};

export type PromotionWriteInput = {
  productId: string;
  name?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  percentage?: number | null;
  salePriceMinor?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  enabled?: boolean;
  showOnHomepage?: boolean;
  priority?: number;
};

export async function listPromotions() {
  return apiData<ApiPromotion[]>('/promotions');
}

export async function savePromotion(input: PromotionWriteInput) {
  return apiData<ApiPromotion>('/promotions', { method: 'POST', body: JSON.stringify(input) });
}

export async function updatePromotion(id: string, input: Partial<PromotionWriteInput>) {
  return apiData<ApiPromotion>(`/promotions/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function promotionAction(id: string, action: 'enable' | 'disable' | 'end' | 'extend') {
  return apiData<ApiPromotion>(`/promotions/${id}/${action}`, { method: 'POST' });
}

export async function deletePromotion(id: string) {
  await apiFetch(`/promotions/${id}`, { method: 'DELETE', emptyResponse: true });
}
