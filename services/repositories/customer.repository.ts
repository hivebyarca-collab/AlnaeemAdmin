import type { CustomerDetail, CustomerRow } from '@/types';

export interface CustomerRepository {
  list(query?: string): Promise<CustomerRow[]>;
  getDetail(id: string): Promise<CustomerDetail | undefined>;
  update(
    id: string,
    changes: {
      full_name?: string;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
      is_disabled?: number;
    },
  ): Promise<boolean>;
  anonymize(id: string): Promise<void>;
  normalizePhone(phone: string): string;
}
