import { ScaffoldPage } from '@/components/shared/scaffold-page';

export const metadata = { title: 'الموقع' };

export default function WebsitePage() {
  return (
    <ScaffoldPage
      title="محتوى الموقع"
      description="إدارة الصفحة الرئيسية والأقسام والتنقل"
      emoji="🌐"
      planned={['Hero الرئيسية', 'أقسام مميزة', 'قوائم التنقل', 'بانرات ترويجية']}
    />
  );
}
