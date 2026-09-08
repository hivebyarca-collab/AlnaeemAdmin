import { PageHeader } from '@/components/shared/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { catalogService } from '@/services';

export const metadata = { title: 'إضافة منتج' };

export default function NewProductPage() {
  const categories = catalogService.getCategories().map((c) => ({ id: c.id, label: c.name_ar }));
  const brands = catalogService.getBrands().map((b) => ({ id: b.id, name: b.name }));
  return (
    <div className="admin-page-body">
      <PageHeader title="إضافة منتج جديد" description="قم بإضافة منتج جديد إلى متجر النعيم" emoji="📦" />
      <ProductForm initial={{}} categories={categories} brands={brands} />
    </div>
  );
}
