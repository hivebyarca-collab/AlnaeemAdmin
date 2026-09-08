import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryForm, CategoryDeleteButton } from '@/components/admin/category-form';
import { catalogService } from '@/services';

export const metadata = { title: 'التصنيفات' };

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof catalogService.getCategories>> = [];
  try {
    categories = await catalogService.getCategories();
  } catch {
    /* empty */
  }

  return (
    <div className="admin-page-body">
      <PageHeader
        title="التصنيفات"
        description="إدارة تصنيفات المنتجات — القراءة والكتابة متاحة عند تشغيل al-naeem-api"
        emoji="📁"
      />
      <CategoryForm />
      {categories.length === 0 ? (
        <div className="admin-empty"><h2>لا توجد تصنيفات</h2><p>شغّل <code dir="ltr">npm run db:seed</code> أو أنشئ تصنيفاً جديداً.</p></div>
      ) : (
        <div className="admin-panel admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>المعرّف</th><th>الاسم (عربي)</th><th>الاسم (English)</th><th>الإجراءات</th></tr></thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td dir="ltr">{category.id}</td>
                    <td>{category.name_ar}</td>
                    <td dir="ltr">{category.name_en}</td>
                    <td><CategoryDeleteButton id={category.id} label={category.name_ar} /></td>
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
