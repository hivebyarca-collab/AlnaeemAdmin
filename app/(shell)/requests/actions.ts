'use server';

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin-auth';
import { isServiceRequestStatus, type ServiceRequestStatus } from '@/lib/service-requests';
import { getServiceRequest, updateServiceRequest } from '@/services/adapters/api/service-request.repository';

export type AdminRequestActionResult = { ok: true } | { ok: false; error: string };

async function requireAdminActor() {
  const session = await getAdminSession();
  if (!session) return { ok: false as const, error: 'يلزم تسجيل دخول الإدارة' };
  return { ok: true as const, actor: session.email || session.name || 'admin' };
}

export async function updateRequestStatus(requestId: string, status: string): Promise<AdminRequestActionResult> {
  try {
    const auth = await requireAdminActor();
    if (!auth.ok) return auth;
    if (!isServiceRequestStatus(status)) return { ok: false, error: 'حالة غير معروفة' };
    const existing = await getServiceRequest(requestId.trim());
    if (!existing) return { ok: false, error: 'الطلب غير موجود' };
    const updated = await updateServiceRequest(existing.id, { status: status as ServiceRequestStatus }, auth.actor);
    if (!updated) return { ok: false, error: 'تعذر تحديث الطلب' };
    revalidatePath('/requests');
    revalidatePath(`/requests/${existing.id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'تعذر تحديث الطلب' };
  }
}

export async function sendRequestToOffice(requestId: string): Promise<AdminRequestActionResult> {
  try {
    const auth = await requireAdminActor();
    if (!auth.ok) return auth;
    const existing = await getServiceRequest(requestId.trim());
    if (!existing) return { ok: false, error: 'الطلب غير موجود' };
    if (existing.status === 'sent-to-office') return { ok: true };
    const updated = await updateServiceRequest(existing.id, { status: 'sent-to-office' }, auth.actor, 'أُرسل الطلب إلى المكتب');
    if (!updated) return { ok: false, error: 'تعذر إرسال الطلب إلى المكتب' };
    revalidatePath('/requests');
    revalidatePath(`/requests/${existing.id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'تعذر إرسال الطلب إلى المكتب' };
  }
}

export async function saveRequestNotes(requestId: string, notes: string): Promise<AdminRequestActionResult> {
  try {
    const auth = await requireAdminActor();
    if (!auth.ok) return auth;
    const existing = await getServiceRequest(requestId.trim());
    if (!existing) return { ok: false, error: 'الطلب غير موجود' };
    const updated = await updateServiceRequest(existing.id, { adminNotes: notes.trim() || null }, auth.actor);
    if (!updated) return { ok: false, error: 'تعذر حفظ الملاحظات' };
    revalidatePath(`/requests/${existing.id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'تعذر حفظ الملاحظات' };
  }
}
