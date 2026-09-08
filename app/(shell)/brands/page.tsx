import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { catalogService } from '@/services';

export const metadata = { title: 'العلامات التجارية' };

export default function BrandsPage() {
  let brands: ReturnType<typeof catalogService.getBrands> = [];
  try {
    brands = catalogService.getBrands();
  } catch {
    /* empty */
  }

  return (
    <div className="admin-page-body">
      <PageHeader title="العلامات التجارية" description="إدارة العلامات — القراءة من SQLite التطويري" emoji="🏷️" />
      <p className="admin-callout admin-callout--warn">إنشاء وتعديل العلامات يتطلب al-naeem-api — العرض الحالي للقراءة فقط.</p>
      {brands.length === 0 ? (
        <div className="admin-empty"><h2>لا توجد علامات</h2></div>
      ) : (
        <div className="admin-panel admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>المعرّف</th><th>الاسم</th></tr></thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id}><td dir="ltr">{brand.id}</td><td dir="ltr">{brand.name}</td></tr>
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
