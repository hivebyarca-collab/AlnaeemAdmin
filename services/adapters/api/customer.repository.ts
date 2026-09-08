import { apiData, apiFetch, type ApiEnvelope } from '@/lib/api/client';
import {
  mapCustomerDetailFromApi,
  mapCustomerRowFromApi,
  type ApiCustomer,
} from '@/lib/api/mappers/order-customer';
import type { CustomerRepository } from '../../repositories/customer.repository';

export const apiCustomerRepository: CustomerRepository = {
  async list(query) {
    const response = await apiFetch<ApiEnvelope<ApiCustomer[]>>('/customers');
    let rows = (response.data ?? []).map(mapCustomerRowFromApi);
    if (query?.trim()) {
      const needle = query.trim().toLowerCase();
      rows = rows.filter(
        (row) =>
          row.full_name.toLowerCase().includes(needle) ||
          row.phone?.includes(needle) ||
          row.email?.toLowerCase().includes(needle),
      );
    }
    return rows;
  },

  async getDetail(id) {
    try {
      const customer = await apiData<ApiCustomer>(`/customers/${id}`);
      return mapCustomerDetailFromApi(customer);
    } catch {
      return undefined;
    }
  },

  async update() {
    // Customer write endpoints are not in the Admin integration contract yet.
    return false;
  },

  async anonymize() {
    throw new Error('Customer anonymization requires a future API endpoint');
  },

  normalizePhone(phone: string) {
    return phone.replace(/\s+/g, '').trim();
  },
};
