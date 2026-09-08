import type { CustomerDetail, CustomerRow } from '@/types';

export interface CustomerRepository {
  list(query?: string): CustomerRow[];
  getDetail(id: string): CustomerDetail | undefined;
  update(
    id: string,
    changes: {
      full_name?: string;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
      is_disabled?: number;
    },
  ): boolean;
  anonymize(id: string): void;
  normalizePhone(phone: string): string;
}
