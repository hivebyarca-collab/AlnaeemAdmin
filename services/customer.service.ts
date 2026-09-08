import { sqliteCustomerRepository } from './adapters/sqlite/customer.repository';
import type { CustomerRepository } from './repositories/customer.repository';

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  listCustomers(query?: string) {
    return this.repository.list(query);
  }

  getCustomerDetail(id: string) {
    return this.repository.getDetail(id);
  }

  updateCustomer(
    id: string,
    changes: {
      full_name?: string;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
      is_disabled?: boolean;
    },
  ) {
    const payload = {
      ...changes,
      is_disabled:
        changes.is_disabled === undefined ? undefined : changes.is_disabled ? 1 : 0,
    };
    return this.repository.update(id, payload);
  }

  anonymizeCustomer(id: string) {
    return this.repository.anonymize(id);
  }

  normalizePhone(phone: string) {
    return this.repository.normalizePhone(phone);
  }
}

export const customerService = new CustomerService(sqliteCustomerRepository);
