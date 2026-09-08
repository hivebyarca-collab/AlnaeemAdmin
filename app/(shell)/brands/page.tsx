import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { BrandForm, BrandDeleteButton } from '@/components/admin/brand-form';
import { catalogService } from '@/services';

export const metadata = { title: 'العلامات التجارية' };

export default async function BrandsPage() {
  let brands: Awaited<ReturnType<typeof catalogService.getBrands>> = [];
  try {
    brands = await catalogService.getBrands();
  } catch {
    /* empty */
  }

  return (
    <div className="admin-page-body">
      <PageHeader
        title="العلامات التجارية"
        description="إدارة العلامات — القراءة والكتابة متاحة عند تشغيل al-naeem-api"
        emoji="🏷️"
      />
      <BrandForm />
      {brands.length === 0 ? (
        <div className="admin-empty"><h2>لا توجد علامات</h2><p>أنشئ علامة جديدة أو شغّل البذور التطويرية.</p></div>
      ) : (
        <div className="admin-panel admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>المعرّف</th><th>الاسم</th><th>الإجراءات</th></tr></thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td dir="ltr">{brand.id}</td>
                    <td dir="ltr">{brand.name}</td>
                    <td><BrandDeleteButton id={brand.id} label={brand.name} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Link href="/products" className="admin-btn">← المنتجات</Link>
    </div>
  );
}
