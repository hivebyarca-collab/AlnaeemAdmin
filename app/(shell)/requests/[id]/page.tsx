import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { RequestDetail } from '@/components/requests/request-detail';
import { getServiceRequest } from '@/services/adapters/api/service-request.repository';

export const metadata = { title: 'تفاصيل الطلب' };

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getServiceRequest(id);
  if (!request) notFound();
  return (
    <div className="admin-page-body">
      <PageHeader title={request.reference_code} description="تفاصيل طلب الخدمة وإجراءات المكتب." />
      <RequestDetail request={request} />
    </div>
  );
}
