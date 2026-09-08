import { ScaffoldPage } from '@/components/shared/scaffold-page';

export const metadata = { title: 'الوسائط' };

export default function MediaPage() {
  return (
    <ScaffoldPage
      title="مكتبة الوسائط"
      description="صور المنتجات وأصول الموقع"
      emoji="🖼️"
      planned={['رفع وإدارة الصور', 'تصنيف الوسائط', 'ربط S3/CDN', 'تحسين الصور']}
    />
  );
}
