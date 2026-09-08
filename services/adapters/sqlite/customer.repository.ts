import {
  anonymizeClient,
  getClientDetail,
  listClients,
  normalizePhone,
  updateClient,
} from '@/lib/database';
import type { CustomerRepository } from '../../repositories/customer.repository';

export const sqliteCustomerRepository: CustomerRepository = {
  list: listClients,
  getDetail: (id) => getClientDetail(id) as import('@/types').CustomerDetail | undefined,
  update: updateClient,
  anonymize: anonymizeClient,
  normalizePhone,
};
