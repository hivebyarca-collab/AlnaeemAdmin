import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { inventoryService } from '@/services';

export const metadata = { title: 'المخزون' };

export default function InventoryPage() {
  let lowStock: ReturnType<typeof inventoryService.getLowStockProducts> = [];
  try {
    lowStock = inventoryService.getLowStockProducts();
  } catch {
    /* empty */
  }

  return (
    <div className="admin-page-body">
      <PageHeader title="المخزون" description="نظرة على المنتجات منخفضة المخزون — بيانات SQLite التطويرية" emoji="📊" />
      <p className="admin-callout admin-callout--warn">تعديلات المخزون المركزية وتسويات الكميات ستُفعَّل مع al-naeem-api.</p>
      {lowStock.length === 0 ? (
        <div className="admin-empty"><h2>لا توجد تنبيهات مخزون</h2></div>
      ) : (
        <div className="admin-panel admin-table-panel">
          <header className="admin-panel-title"><h2>منتجات منخفضة المخزون</h2></header>
          <ul className="admin-lowstock-list">
            {lowStock.map((product) => (
              <li key={product.id}>
                <Link href={`/products/${product.id}`}>{product.name}</Link>
                <span className="stock-pill stock-pill--low" dir="ltr">{product.stock_quantity - product.reserved_quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
