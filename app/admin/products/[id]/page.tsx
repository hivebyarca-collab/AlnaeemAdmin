import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/database';
import { ProductForm } from '@/components/admin/product-form';

export const metadata = { title: 'تعديل منتج' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  return (
    <div className="admin-page-body">
      <header className="admin-page-header">
        <h1><span aria-hidden="true">✏️</span> تعديل: {product.name}</h1>
        <p dir="ltr">{product.sku}</p>
      </header>
      <ProductForm
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
