import { apiFetch, type ApiCollection } from '@/lib/api/client';
import {
  isServiceRequestStatus,
  isServiceRequestType,
  type ServiceRequestEvent,
  type ServiceRequestRecord,
  type ServiceRequestStatus,
  type ServiceRequestType,
} from '@/lib/service-requests';

type ApiRequest = Record<string, unknown>;

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function asNullable(value: unknown): string | null {
  const text = asString(value).trim();
  return text ? text : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function mapEvent(raw: ApiRequest, requestId: string): ServiceRequestEvent | null {
  const id = asString(raw.id);
  if (!id) return null;
  return {
    id,
    request_id: asString(raw.request_id ?? raw.requestId) || requestId,
    event: asString(raw.event) || 'received',
    detail: asNullable(raw.detail),
    actor: asString(raw.actor) || 'system',
    created_at: asString(raw.created_at ?? raw.createdAt) || new Date().toISOString(),
  };
}

export function mapServiceRequest(raw: ApiRequest): ServiceRequestRecord | null {
  const id = asString(raw.id);
  const reference = asString(raw.reference_code ?? raw.referenceCode);
  const type = raw.type;
  const status = raw.status;
  if (!id || !reference || !isServiceRequestType(type) || !isServiceRequestStatus(status)) return null;
  const details = raw.details_json ?? raw.detailsJson ?? raw.details;
  const detailsJson = typeof details === 'string' ? details : JSON.stringify(details ?? {});
  const eventsRaw = raw.events;
  return {
    id,
    reference_code: reference,
    type,
    status,
    customer_name: asString(raw.customer_name ?? raw.customerName),
    phone: asString(raw.phone),
    email: asNullable(raw.email),
    preferred_contact: asNullable(raw.preferred_contact ?? raw.preferredContact),
    location: asNullable(raw.location),
    customer_notes: asNullable(raw.customer_notes ?? raw.customerNotes),
    admin_notes: asNullable(raw.admin_notes ?? raw.adminNotes),
    details_json: detailsJson,
    total_cents: asNumber(raw.total_cents ?? raw.totalCents),
    currency: asString(raw.currency) || 'USD',
    source: asString(raw.source) || 'storefront',
    locale: asString(raw.locale) || 'ar',
    created_at: asString(raw.created_at ?? raw.createdAt) || new Date().toISOString(),
    updated_at: asString(raw.updated_at ?? raw.updatedAt) || new Date().toISOString(),
    events: Array.isArray(eventsRaw)
      ? eventsRaw.flatMap((item) => {
          if (!item || typeof item !== 'object') return [];
          const mapped = mapEvent(item as ApiRequest, id);
          return mapped ? [mapped] : [];
        })
      : undefined,
  };
}

export async function listServiceRequests(filters: {
  type?: ServiceRequestType | 'all';
  status?: ServiceRequestStatus | 'all';
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.query) params.set('q', filters.query);
  params.set('page', String(filters.page ?? 1));
  params.set('pageSize', String(filters.pageSize ?? 20));
  const response = await apiFetch<ApiCollection<ApiRequest>>(`/service-requests?${params.toString()}`);
  const rows = (response.data ?? []).map(mapServiceRequest).filter((row): row is ServiceRequestRecord => Boolean(row));
  return {
    rows,
    total: response.meta?.total ?? rows.length,
    page: response.meta?.page ?? filters.page ?? 1,
    pageSize: response.meta?.pageSize ?? filters.pageSize ?? 20,
  };
}

export async function getServiceRequestCounts() {
  return apiFetch<{ total: number; byType: Record<string, number>; byStatus: Record<string, number> }>('/service-requests/summary');
}

export async function getServiceRequest(idOrReference: string) {
  try {
    const response = await apiFetch<{ data: ApiRequest }>(`/service-requests/${encodeURIComponent(idOrReference)}`);
    return mapServiceRequest(response.data);
  } catch {
    return null;
  }
}

export async function updateServiceRequest(
  id: string,
  changes: { status?: ServiceRequestStatus; adminNotes?: string | null },
  actor: string,
  eventDetail?: string,
) {
  const response = await apiFetch<{ data: ApiRequest }>(`/service-requests/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: changes.status,
      adminNotes: changes.adminNotes,
      actor,
      eventDetail,
    }),
  });
  return mapServiceRequest(response.data);
}
