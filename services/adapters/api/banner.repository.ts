import { apiData, apiFetch, type ApiEnvelope } from '@/lib/api/client';

export type ApiBanner = {
  id: string;
  key: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageUrlDark: string;
  imageUrlLight: string;
  altText: string | null;
  link: string | null;
  href: string | null;
  placement: 'HERO' | 'PROMO';
  active: boolean;
  position: number;
  sortOrder: number;
};

export type BannerWriteInput = {
  key?: string | null;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  imageUrlLight?: string | null;
  altText?: string | null;
  link?: string | null;
  placement: 'HERO' | 'PROMO';
  active?: boolean;
  position?: number;
};

export async function listBanners() {
  const response = await apiFetch<ApiEnvelope<ApiBanner[]>>('/banners');
  return response.data ?? [];
}

export async function saveBanner(input: BannerWriteInput) {
  return apiData<ApiBanner>('/banners', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateBanner(id: string, input: Partial<BannerWriteInput>) {
  return apiData<ApiBanner>(`/banners/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function reorderBanners(ids: string[]) {
  return apiData<ApiBanner[]>('/banners/reorder', { method: 'POST', body: JSON.stringify({ ids }) });
}

export async function deleteBanner(id: string) {
  await apiFetch(`/banners/${id}`, { method: 'DELETE', emptyResponse: true });
}

export async function uploadBannerImage(input: { filename: string; contentType: 'image/jpeg' | 'image/png' | 'image/webp'; dataBase64: string }) {
  return apiData<{ url: string }>('/media/uploads', { method: 'POST', body: JSON.stringify(input), timeoutMs: 30_000 });
}
