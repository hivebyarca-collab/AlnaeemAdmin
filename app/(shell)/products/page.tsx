import Image from 'next/image';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { ProductRowActions } from '@/components/admin/product-row-actions';
import { catalogService, productService } from '@/services';

export const metadata = { title: 'قائمة المنتجات' };

type SearchParams = Promise<{ q?: string; category?: string; brand?: string; stock?: string; active?: string; page?: string }>;

export default async function ProductListPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;
  let data: Awaited<ReturnType<typeof productService.listProducts>> | null = null;
  let categories: Awaited<ReturnType<typeof catalogService.getCategories>> = [];
  let brands: Awaited<ReturnType<typeof catalogService.getBrands>> = [];
  let dbError = false;
  try {
    data = productService.listProducts({
      query: filters.q, category: filters.category, brand: filters.brand,
      stock: filters.stock as 'in' | 'low' | 'out' | undefined, active: filters.active as 'active' | 'hidden' | undefined,
      page: Number(filters.page ?? 1) || 1, pageSize: 10,
    });
    categories = catalogService.getCategories();
    brands = catalogService.getBrands();
  } catch {
    dbError = true;
  }

  if (dbError || !data) {
    return <div className="admin-empty" role="alert"><h2>تعذر تحميل المنتجات</h2><p>تأكد من تهيئة قاعدة البيانات المحلية ثم أعد المحاولة.</p></div>;
  }

  const totalPages = Math.max(Math.ceil(data.total / data.pageSize), 1);
  const stockPill = (available: number, threshold: number) => {
    if (available <= 0) return <span className="stock-pill stock-pill--out">غير متوفر</span>;
    if (available <= threshold) return <span className="stock-pill stock-pill--low" dir="ltr">{available} منخفض</span>;
    return <span className="stock-pill stock-pill--in" dir="ltr">{available}</span>;
  };

  return (
    <div className="admin-page-body">
      <PageHeader title="قائمة المنتجات" description="كل ما في متجرك في مكان واحد — ابحث، صفِّ، وعدّل بضغطة." emoji="📦" />

      <form className="admin-filter-bar">
        <Link href="/products/new" className="admin-btn admin-btn--primary"><Plus aria-hidden="true" /> إضافة منتج جديد</Link>
        <label className="admin-filter-search"><Search aria-hidden="true" /><input name="q" defaultValue={filters.q ?? ''} placeholder="ابحث في المنتجات..." aria-label="البحث في المنتجات" /></label>
        <select name="category" defaultValue={filters.category ?? 'all'} aria-label="التصنيف">
          <option value="all">كل الفئات</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name_ar}</option>)}
        </select>
        <select name="brand" defaultValue={filters.brand ?? 'all'} aria-label="العلامة التجارية">
          <option value="all">كل العلامات</option>
          {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
        <select name="stock" defaultValue={filters.stock ?? 'all'} aria-label="حالة المخزون">
          <option value="all">كل الحالات</option>
          <option value="in">متوفر</option>
          <option value="low">منخفض</option>
          <option value="out">غير متوفر</option>
        </select>
        <select name="active" defaultValue={filters.active ?? 'all'} aria-label="حالة الظهور">
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="hidden">مخفي</option>
        </select>
        <button type="submit" className="admin-btn">تطبيق</button>
      </form>

      {data.rows.length === 0 ? (
        <div className="admin-empty">
          <h2>لا توجد منتجات مطابقة</h2>
          <Link href="/products/new" className="admin-btn admin-btn--primary">إضافة منتج</Link>
        </div>
      ) : (
        <div className="admin-panel admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>صورة</th><th>المنتج</th><th>العلامة</th><th>SKU</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((product) => {
                  const available = product.stock_quantity - product.reserved_quantity;
                  return (
                    <tr key={product.id}>
                      <td>
                        {product.image_path
                          ? <Image src={product.image_path} alt="" width={56} height={42} unoptimized className="admin-table-thumb" />
                          : <span className="admin-table-thumb admin-table-thumb--empty" aria-hidden="true" />}
                      </td>
                      <td><Link href={`/products/${product.id}`} className="admin-table-title">{product.name}</Link></td>
                      <td dir="ltr">{product.brand} {product.model}</td>
                      <td dir="ltr">{product.sku}</td>
                      <td dir="ltr">${(product.price_usd ?? 0).toLocaleString('en-US')}</td>
                      <td>{stockPill(available, product.low_stock_threshold)}</td>
                      <td><span className={`badge ${product.is_active ? 'badge--active' : 'badge--hidden'}`}>{product.is_active ? 'نشط' : 'مخفي'}</span></td>
                      <td><ProductRowActions id={product.id} sku={product.sku} isActive={product.is_active === 1} hasImage={Boolean(product.image_path)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <footer className="admin-pagination">
            <span dir="rtl">من {data.total} منتج — صفحة {data.page}</span>
            <nav aria-label="صفحات المنتجات">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => index + 1).map((pageNumber) => (
                <Link
                  key={pageNumber} href={`/products?${new URLSearchParams({ ...(filters as Record<string, string>), page: String(pageNumber) })}`}
                  className={pageNumber === data.page ? 'is-current' : ''} aria-current={pageNumber === data.page ? 'page' : undefined}
                >
                  {pageNumber}
                </Link>
              ))}
            </nav>
          </footer>
        </div>
      )}
    </div>
  );
}
