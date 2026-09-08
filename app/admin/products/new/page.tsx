import { ProductForm } from '@/components/admin/product-form';

export const metadata = { title: 'إضافة منتج' };

export default function NewProductPage() {
  return (
    <div className="admin-page-body">
      <header className="admin-page-header">
        <h1><span aria-hidden="true">📦</span> إضافة منتج جديد</h1>
        <p>قم بإضافة منتج جديد إلى متجرك في النعيم للإلكترونيات</p>
      </header>
      <ProductForm initial={{}} />
    </div>
  );
}
