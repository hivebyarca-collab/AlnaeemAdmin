import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { catalogService, productService } from '@/services';

export const metadata = { title: 'تعديل منتج' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await productService.getProduct(id);
  if (!product) notFound();
  const categories = (await catalogService.getCategories()).map((c) => ({ id: c.id, label: c.name_ar }));
  const brands = (await catalogService.getBrands()).map((b) => ({ id: b.id, name: b.name }));
  return (
    <div className="admin-page-body">
      <PageHeader title={`تعديل: ${product.name}`} description={product.sku} emoji="✏️" />
      <ProductForm
        categories={categories}
        brands={brands}
        initial={{
          id: product.id, name: product.name, brand: product.brand, model: product.model, sku: product.sku,
          category: product.category, price: String(product.price_usd ?? ''), costPrice: product.cost_price != null ? String(product.cost_price) : '',
          quantity: String(product.stock_quantity), lowStockThreshold: String(product.low_stock_threshold),
          description: product.description, isActive: product.is_active === 1,
          imagePath: product.image_path ?? null, barcode: product.barcode ?? null,
          imageSourceUrl: product.image_source_url ?? null, imageSourceDomain: product.image_source_domain ?? null,
          imageWidth: product.image_width ?? null, imageHeight: product.image_height ?? null,
        }}
      />
    </div>
  );
}
