import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { catalogService } from '@/services';

export const metadata = { title: 'التصنيفات' };

export default function CategoriesPage() {
  let categories: ReturnType<typeof catalogService.getCategories> = [];
  try {
    categories = catalogService.getCategories();
  } catch {
    /* empty */
  }

  return (
    <div className="admin-page-body">
      <PageHeader title="التصنيفات" description="إدارة تصنيفات المنتجات — القراءة من SQLite التطويري" emoji="📁" />
      <p className="admin-callout admin-callout--warn">إنشاء وتعديل التصنيفات يتطلب al-naeem-api — العرض الحالي للقراءة فقط.</p>
      {categories.length === 0 ? (
        <div className="admin-empty"><h2>لا توجد تصنيفات</h2><p>شغّل <code dir="ltr">npm run db:seed</code></p></div>
      ) : (
        <div className="admin-panel admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>المعرّف</th><th>الاسم (عربي)</th><th>الاسم (English)</th></tr></thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td dir="ltr">{category.id}</td>
                    <td>{category.name_ar}</td>
                    <td dir="ltr">{category.name_en}</td>
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
