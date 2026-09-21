import { PageHeader } from '@/components/shared/page-header';
import { PromotionManager } from '@/components/admin/promotion-manager';
import { listPromotions } from '@/services/adapters/api/promotion.repository';
import { productService } from '@/services';
import { minorToDollars } from '@/lib/api/mappers/money';
import { toActionError } from '@/lib/api/errors';

export const metadata = { title: 'العروض' };

export default async function PromotionsPage() {
  let promotions: Awaited<ReturnType<typeof listPromotions>> = [];
  let products: Array<{ id: string; name: string; sku: string; priceUsd: number }> = [];
  let error: string | null = null;
  try {
    const [promoRows, catalog] = await Promise.all([
      listPromotions(),
      productService.listProducts({ page: 1, pageSize: 100 }),
    ]);
    promotions = promoRows;
    products = catalog.rows.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      priceUsd: product.price_usd ?? 0,
    }));
    for (const promo of promotions) {
      if (promo.product && !products.some((product) => product.id === promo.productId)) {
        products.unshift({
          id: promo.product.id,
          name: promo.product.name,
          sku: promo.product.sku,
          priceUsd: minorToDollars(promo.product.priceMinor),
        });
      }
    }
  } catch (caught) {
    error = toActionError(caught);
  }

  return (
    <div className="admin-page-body">
      <PageHeader title="العروض والترويج" description="عروض المنتجات: نسبة أو سعر ثابت، جدولة، وحالة يحسبها الخادم." emoji="🎯" />
      {error ? <div className="admin-empty" role="alert"><h2>تعذر تحميل العروض</h2><p>{error}</p></div> : <PromotionManager promotions={promotions} products={products} />}
    </div>
  );
}
