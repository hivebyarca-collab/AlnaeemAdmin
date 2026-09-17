'use client';

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="admin-empty" role="alert">
      <h2>تعذر الاتصال بالخادم</h2>
      <p>حدث خطأ أثناء تحميل لوحة التحكم. تحقق من واجهة البرمجة ثم أعد المحاولة.</p>
      <button type="button" className="admin-btn admin-btn--primary" onClick={() => reset()}>
        إعادة المحاولة
      </button>
    </div>
  );
}
