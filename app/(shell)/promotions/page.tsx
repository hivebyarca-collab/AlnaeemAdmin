import { ScaffoldPage } from '@/components/shared/scaffold-page';

export const metadata = { title: 'العروض' };

export default function PromotionsPage() {
  return (
    <ScaffoldPage
      title="العروض والترويج"
      description="إدارة الخصومات والمنتجات المميزة واللافتات"
      emoji="🎯"
      planned={['إنشاء وتحرير أكواد الخصم', 'منتجات مميزة', 'لافتات ترويجية', 'جدولة العروض']}
    />
  );
}
