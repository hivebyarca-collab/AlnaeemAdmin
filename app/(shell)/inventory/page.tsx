import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { InventoryAdjustForm } from '@/components/admin/inventory-adjust-form';
import { inventoryService } from '@/services';

export const metadata = { title: 'المخزون' };

export default async function InventoryPage() {
  let inventory: Awaited<ReturnType<typeof inventoryService.listInventory>> = [];
  let lowStock: Awaited<ReturnType<typeof inventoryService.getLowStockProducts>> = [];
  try {
    [inventory, lowStock] = await Promise.all([
      inventoryService.listInventory(),
      inventoryService.getLowStockProducts(),
    ]);
  } catch {
    /* empty */
  }

  const productOptions = inventory.map((item) => ({ id: item.productId, name: item.productName }));

  return (
    <div className="admin-page-body">
      <PageHeader
        title="المخزون"
        description="نظرة على مستويات المخزون وتسجيل حركات إعادة التخزين والتعديل"
        emoji="📊"
      />
      <InventoryAdjustForm products={productOptions} />
      {inventory.length === 0 ? (
        <div className="admin-empty"><h2>لا توجد بيانات مخزون</h2><p>أضف منتجات أو شغّل al-naeem-api لعرض المخزون.</p></div>
      ) : (
        <>
          {lowStock.length > 0 && (
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
          <div className="admin-panel admin-table-panel">
            <header className="admin-panel-title"><h2>قائمة المخزون</h2></header>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>محجوز</th>
                    <th>المتاح</th>
                    <th>حد التنبيه</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const available = item.quantity - item.reservedQuantity;
                    const isLow = available <= item.lowStockThreshold;
                    return (
                      <tr key={item.id}>
                        <td><Link href={`/products/${item.productId}`} className="admin-table-title">{item.productName}</Link></td>
                        <td dir="ltr">{item.quantity}</td>
                        <td dir="ltr">{item.reservedQuantity}</td>
                        <td>
                          <span className={`stock-pill ${isLow ? 'stock-pill--low' : 'stock-pill--in'}`} dir="ltr">{available}</span>
                        </td>
                        <td dir="ltr">{item.lowStockThreshold}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
