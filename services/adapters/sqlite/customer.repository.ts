import {
  anonymizeClient,
  getClientDetail,
  listClients,
  normalizePhone,
  updateClient,
} from '@/lib/database';
import type { CustomerRepository } from '../../repositories/customer.repository';

export const sqliteCustomerRepository: CustomerRepository = {
  list: async (query) => listClients(query),
  getDetail: async (id) => getClientDetail(id) as Awaited<ReturnType<CustomerRepository['getDetail']>>,
  update: async (id, changes) => updateClient(id, changes),
  anonymize: async (id) => {
    anonymizeClient(id);
  },
  normalizePhone,
};
