import Link from 'next/link';
import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';

export function ScaffoldPage({
  title,
  description,
  emoji,
  planned,
}: {
  title: string;
  description: string;
  emoji?: string;
  planned: string[];
}) {
  return (
    <div className="admin-page-body">
      <PageHeader title={title} description={description} emoji={emoji} />
      <div className="admin-empty">
        <Construction aria-hidden="true" className="text-[var(--accent)]" />
        <h2>قيد التطوير — يتطلب ربط al-naeem-api</h2>
        <p>هذه الصفحة جاهزة هيكلياً. الوظائف التالية ستُفعَّل عند توفر واجهة برمجة التطبيقات:</p>
        <ul className="admin-status-list">
          {planned.map((item) => (
            <li key={item}><span>{item}</span><span className="badge">مخطط</span></li>
          ))}
        </ul>
        <Link href="/" className="admin-btn">← العودة للوحة التحكم</Link>
      </div>
    </div>
  );
}
