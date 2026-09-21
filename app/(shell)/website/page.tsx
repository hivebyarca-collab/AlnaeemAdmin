import { PageHeader } from '@/components/shared/page-header';
import { HomepageBannerManager } from '@/components/admin/homepage-banner-manager';
import { listBanners } from '@/services/adapters/api/banner.repository';
import { toActionError } from '@/lib/api/errors';

export const metadata = { title: 'الموقع' };

export default async function WebsitePage() {
  let banners: Awaited<ReturnType<typeof listBanners>> = [];
  let error: string | null = null;
  try {
    banners = await listBanners();
  } catch (caught) {
    error = toActionError(caught);
  }

  return (
    <div className="admin-page-body">
      <PageHeader title="بانرات الصفحة الرئيسية" description="بانر رئيسي وعروض صغيرة. كل سجل منطقي يملك صورة داكنة وصورة فاتحة." emoji="🌐" />
      {error ? <div className="admin-empty" role="alert"><h2>تعذر تحميل البانرات</h2><p>{error}</p></div> : <HomepageBannerManager banners={banners} />}
    </div>
  );
}
