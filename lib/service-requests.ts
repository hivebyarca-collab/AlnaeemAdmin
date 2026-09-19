export const SERVICE_REQUEST_TYPES = ['maintenance', 'upgrade', 'pc-build', 'sell-hardware'] as const;
export type ServiceRequestType = (typeof SERVICE_REQUEST_TYPES)[number];

export const SERVICE_REQUEST_STATUSES = [
  'new',
  'reviewing',
  'sent-to-office',
  'contacted',
  'in-progress',
  'completed',
  'cancelled',
] as const;
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const SERVICE_REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  new: 'جديد',
  reviewing: 'قيد المراجعة',
  'sent-to-office': 'أُرسل إلى المكتب',
  contacted: 'تم التواصل',
  'in-progress': 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export const SERVICE_REQUEST_TYPE_LABELS: Record<ServiceRequestType, string> = {
  maintenance: 'صيانة',
  upgrade: 'إضافات وترقيات',
  'pc-build': 'تجميعة PC',
  'sell-hardware': 'بيع جهاز',
};

export function isServiceRequestType(value: unknown): value is ServiceRequestType {
  return typeof value === 'string' && (SERVICE_REQUEST_TYPES as readonly string[]).includes(value);
}

export function isServiceRequestStatus(value: unknown): value is ServiceRequestStatus {
  return typeof value === 'string' && (SERVICE_REQUEST_STATUSES as readonly string[]).includes(value);
}

export type ServiceRequestEvent = {
  id: string;
  request_id: string;
  event: string;
  detail: string | null;
  actor: string;
  created_at: string;
};

export type ServiceRequestRecord = {
  id: string;
  reference_code: string;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  customer_name: string;
  phone: string;
  email: string | null;
  preferred_contact: string | null;
  location: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  details_json: string;
  total_cents: number | null;
  currency: string;
  source: string;
  locale: string;
  created_at: string;
  updated_at: string;
  events?: ServiceRequestEvent[];
};

export type MaintenanceDetails = {
  device: string;
  deviceModel?: string;
  brand?: string;
  serial?: string;
  problem: string;
  description: string;
  specifications?: string;
  attachments?: Array<{ name: string; size: number; type: string }>;
};

export type UpgradeDetails = {
  deviceType: string;
  currentSpecs?: string;
  upgradeCategory: string;
  requestedUpgrade: string;
  desiredOutcome?: string;
  budget?: string;
  selectedProducts?: Array<{ id?: string; sku?: string; name: string }>;
};

export type PcBuildDetails = {
  buildId: string;
  buildName: string;
  caseName: string;
  compatibilityPercent: number;
  items: Array<{
    slot: string;
    label: string;
    name: string;
    priceCents: number;
    quantity: number;
    productId?: string;
    sku?: string;
  }>;
  subtotalCents: number;
  accessoriesCents: number;
  assemblyFeeCents: number;
  totalCents: number;
  delivery?: string;
  budget?: string;
  pricesAreDemo?: boolean;
};

export type SellHardwareDetails = {
  deviceName: string;
  deviceType: string;
  condition: string;
  usageDuration: string;
  expectedPrice?: string;
};
