import type { Order, OrderItem, OrderRow, OrderStatus, CustomerDetail, CustomerRow, User } from '@/types';
import { minorToDollars } from './money';

export type ApiOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type ApiPaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export type ApiCustomer = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
  addresses?: unknown[];
  orders?: ApiOrder[];
};

export type ApiOrderItem = {
  id: string;
  orderId?: string;
  productId?: string | null;
  productName: string;
  sku: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
};

export type ApiOrder = {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customer?: ApiCustomer | null;
  status: ApiOrderStatus;
  paymentStatus: ApiPaymentStatus;
  subtotalMinor: number;
  discountMinor?: number;
  shippingMinor?: number;
  totalMinor: number;
  currency: string;
  notes?: string | null;
  items?: ApiOrderItem[];
  createdAt: string;
  updatedAt: string;
};

const statusFromApi: Record<ApiOrderStatus, OrderStatus> = {
  PENDING: 'SUBMITTED',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const statusToApi: Record<OrderStatus, ApiOrderStatus> = {
  SUBMITTED: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PROCESSING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const paymentFromApi: Record<ApiPaymentStatus, 'unpaid' | 'paid' | 'refunded'> = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  REFUNDED: 'refunded',
};

export function mapOrderStatusFromApi(status: ApiOrderStatus): OrderStatus {
  return statusFromApi[status] ?? 'SUBMITTED';
}

export function mapOrderStatusToApi(status: OrderStatus): ApiOrderStatus {
  return statusToApi[status] ?? 'PENDING';
}

function customerName(customer?: ApiCustomer | null): string {
  if (!customer) return 'عميل';
  return [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() || 'عميل';
}

export function mapOrderItemFromApi(item: ApiOrderItem, orderId: string): OrderItem {
  return {
    id: item.id,
    order_id: item.orderId ?? orderId,
    product_id: item.productId ?? null,
    pc_build_id: null,
    item_name: item.productName,
    quantity: item.quantity,
    unit_price: minorToDollars(item.unitPriceMinor),
    is_demo: 0,
  };
}

export function mapOrderFromApi(dto: ApiOrder): Order & { items: OrderItem[] } {
  const items = (dto.items ?? []).map((item) => mapOrderItemFromApi(item, dto.id));
  return {
    id: dto.id,
    customer_id: dto.customerId ?? null,
    pc_build_id: null,
    total: minorToDollars(dto.totalMinor),
    currency: dto.currency || 'USD',
    status: mapOrderStatusFromApi(dto.status),
    source: 'website',
    payment_status: paymentFromApi[dto.paymentStatus] ?? 'unpaid',
    conversation_id: null,
    notes: dto.notes ?? null,
    contact_name: customerName(dto.customer),
    contact_phone: dto.customer?.phone ?? '',
    contact_email: dto.customer?.email ?? null,
    is_demo: 0,
    created_at: typeof dto.createdAt === 'string' ? dto.createdAt : new Date(dto.createdAt).toISOString(),
    updated_at: typeof dto.updatedAt === 'string' ? dto.updatedAt : new Date(dto.updatedAt).toISOString(),
    items,
  };
}

export function mapOrderRowFromApi(dto: ApiOrder): OrderRow {
  const order = mapOrderFromApi(dto);
  return {
    id: order.id,
    customer_id: order.customer_id,
    pc_build_id: null,
    total: order.total,
    currency: order.currency,
    status: order.status,
    contact_name: order.contact_name,
    contact_phone: order.contact_phone,
    contact_email: order.contact_email,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: order.items as unknown as Array<Record<string, unknown>>,
  };
}

export function mapCustomerRowFromApi(dto: ApiCustomer): CustomerRow {
  const fullName = [dto.firstName, dto.lastName].filter(Boolean).join(' ').trim();
  const orders = dto.orders ?? [];
  const totalSpentUsd = orders.reduce((sum, order) => sum + minorToDollars(order.totalMinor), 0);
  return {
    id: dto.id,
    full_name: fullName || 'عميل',
    phone: dto.phone ?? null,
    email: dto.email ?? null,
    status: 'active',
    is_disabled: 0,
    notes: null,
    sources: ['website'],
    orderCount: orders.length,
    totalSpentUsd,
    lastOrderAt: orders[0]?.createdAt ?? null,
  };
}

export function mapCustomerDetailFromApi(dto: ApiCustomer): CustomerDetail {
  const fullName = [dto.firstName, dto.lastName].filter(Boolean).join(' ').trim() || 'عميل';
  const user: User & { notes?: string | null; is_disabled?: number } = {
    id: dto.id,
    full_name: fullName,
    phone: dto.phone ?? null,
    email: dto.email ?? null,
    role: 'CUSTOMER',
    status: 'active',
    language: 'ar',
    theme: 'dark',
    location: '',
    is_demo: 0,
    created_at: typeof dto.createdAt === 'string' ? dto.createdAt : new Date(dto.createdAt).toISOString(),
    updated_at: typeof dto.updatedAt === 'string' ? dto.updatedAt : new Date(dto.updatedAt).toISOString(),
    notes: null,
    is_disabled: 0,
  };
  const orders = (dto.orders ?? []).map((order) => mapOrderFromApi(order));
  return {
    user,
    orders,
    conversation: undefined,
    messages: [],
    totalSpentUsd: orders.reduce((sum, order) => sum + order.total, 0),
    addresses: dto.addresses ?? [],
  };
}
