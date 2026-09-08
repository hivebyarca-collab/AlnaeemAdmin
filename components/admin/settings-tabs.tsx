'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { saveAdminSettings } from '@/app/actions';

const tabs = [
  { id: 'whatsapp', label: 'واتساب' }, { id: 'store', label: 'المتجر' }, { id: 'website', label: 'الموقع' },
  { id: 'products', label: 'المنتجات' }, { id: 'orders', label: 'الطلبات' }, { id: 'users', label: 'مستخدمو الإدارة' }, { id: 'security', label: 'الأمان' },
] as const;

const weekdays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function SettingsTabs({ settings, serviceStatus, users }: {
  settings: Record<string, string>;
  serviceStatus: { label: string; connected: boolean }[];
  users: { id: string; full_name: string; email: string | null; role: string; status: string }[];
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('whatsapp');
  const [values, setValues] = useState<Record<string, string>>({ ...settings });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const save = (keys: string[]) => {
    startTransition(async () => {
      const result = await saveAdminSettings(Object.fromEntries(keys.map((key) => [key, values[key] ?? ''])));
      setMessage({ ok: result.ok, text: result.ok ? result.message ?? 'تم' : result.error ?? 'خطأ' });
      if (result.ok) router.refresh();
    });
  };

  const saveButton = (keys: string[]) => (
    <button type="button" className="admin-btn admin-btn--primary" disabled={pending} onClick={() => save(keys)}>
      {pending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} حفظ
    </button>
  );

  return (
    <div className="admin-settings">
      <div className="admin-tabs" role="tablist" aria-label="أقسام الإعدادات">
        {tabs.map((entry) => (
          <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} className={`admin-tab ${tab === entry.id ? 'is-active' : ''}`} onClick={() => setTab(entry.id)}>
            {entry.label}
          </button>
        ))}
      </div>

      {message && <p className={`admin-callout ${message.ok ? 'admin-callout--ok' : 'admin-callout--error'}`} aria-live="polite">{message.text}</p>}
      <SettingsPanels tab={tab} values={values} set={set} saveButton={saveButton} serviceStatus={serviceStatus} users={users} />
    </div>
  );
}

function SettingsPanels({ tab, values, set, saveButton, serviceStatus, users }: {
  tab: (typeof tabs)[number]['id'];
  values: Record<string, string>;
  set: (key: string, value: string) => void;
  saveButton: (keys: string[]) => React.ReactNode;
  serviceStatus: { label: string; connected: boolean }[];
  users: { id: string; full_name: string; email: string | null; role: string; status: string }[];

}) {
  if (tab !== 'whatsapp') return <OtherPanels tab={tab} values={values} set={set} saveButton={saveButton} users={users} />;
  const waConnected = serviceStatus.find((status) => status.label.includes('واتساب'))?.connected ?? false;
  const aiConnected = serviceStatus.find((status) => status.label.includes('ذكاء'))?.connected ?? false;
  return (
    <div className="admin-settings-grid">
      <section className="admin-panel" aria-label="الرقم المتصل">
        <header className="admin-panel-title"><h2>الرقم المتصل</h2></header>
        <div className="admin-detail-list">
          <div><dt>حالة الاتصال</dt><dd><span className={`badge ${waConnected ? 'badge--active' : 'badge--hidden'}`}>{waConnected ? 'متصل' : 'غير متصل'}</span></dd></div>
          <div><dt>رقم الهاتف</dt><dd dir="ltr">{values.whatsapp_connected_number || '—'}</dd></div>
        </div>
        <p className="admin-callout admin-callout--warn">
          الاتصال يُدار عبر متغيرات البيئة (<code dir="ltr">WHATSAPP_ACCESS_TOKEN</code>، <code dir="ltr">WHATSAPP_PHONE_NUMBER_ID</code>). لا يوجد اتصال وهمي أبداً.
        </p>
        <label>رقم الواتساب المعروض<input dir="ltr" value={values.whatsapp_connected_number ?? ''} onChange={(event) => set('whatsapp_connected_number', event.target.value)} placeholder="+963..." /></label>
        {saveButton(['whatsapp_connected_number'])}
      </section>

      <section className="admin-panel" aria-label="الذكاء الاصطناعي">
        <header className="admin-panel-title"><h2>الذكاء الاصطناعي</h2><small>{aiConnected ? 'المزود مهيأ' : 'لا يوجد مزود AI — الوكيل معطّل بأمان'}</small></header>
        <label>تشغيل الذكاء الاصطناعي
          <select value={values.whatsapp_ai_enabled ?? '0'} onChange={(event) => set('whatsapp_ai_enabled', event.target.value)}>
            <option value="1">مفعّل</option><option value="0">معطّل</option>
          </select>
        </label>
        <label>نمط التشغيل
          <select value={values.whatsapp_ai_mode ?? 'MANUAL'} onChange={(event) => set('whatsapp_ai_mode', event.target.value)}>
            <option value="AUTO">تلقائي (AUTO)</option>
            <option value="ASSIST">مساعدة (ASSIST)</option>
            <option value="MANUAL">يدوي (MANUAL)</option>
          </select>
        </label>
        <label>رسالة الترحيب
          <textarea rows={3} maxLength={300} value={values.whatsapp_greeting ?? ''} onChange={(event) => set('whatsapp_greeting', event.target.value)} />
          <small dir="ltr">{(values.whatsapp_greeting ?? '').length}/300</small>
        </label>
        <label>كلمات التحويل للإدارة (مفصولة بفواصل)<input value={values.ai_escalation_keywords ?? ''} onChange={(event) => set('ai_escalation_keywords', event.target.value)} /></label>
        <label>حد قيمة الطلب العالي (دولار)<input dir="ltr" type="number" min="0" value={values.ai_high_value_threshold_usd ?? ''} onChange={(event) => set('ai_high_value_threshold_usd', event.target.value)} /></label>
        {saveButton(['whatsapp_ai_enabled', 'whatsapp_ai_mode', 'whatsapp_greeting', 'ai_escalation_keywords', 'ai_high_value_threshold_usd'])}
      </section>

      <section className="admin-panel" aria-label="ساعات العمل">
        <header className="admin-panel-title"><h2>ساعات العمل</h2><small>لكل يوم: مفتاح التشغيل وأوقات الفتح والإغلاق</small></header>
        {weekdays.map((day, index) => (
          <div className="admin-hours-row" key={day}>
            <span>{day}</span>
            <label><input type="checkbox" checked={(values[`hours_${index}_open`] ?? '0') === '1'} onChange={(event) => set(`hours_${index}_open`, event.target.checked ? '1' : '0')} /> مفتوح</label>
            <label><input type="time" dir="ltr" value={values[`hours_${index}_from`] ?? ''} onChange={(event) => set(`hours_${index}_from`, event.target.value)} aria-label={`من ${day}`} /></label>
            <label><input type="time" dir="ltr" value={values[`hours_${index}_to`] ?? ''} onChange={(event) => set(`hours_${index}_to`, event.target.value)} aria-label={`إلى ${day}`} /></label>
          </div>
        ))}
        {saveButton(weekdays.flatMap((_, index) => [`hours_${index}_open`, `hours_${index}_from`, `hours_${index}_to`]))}
      </section>

      <section className="admin-panel" aria-label="حالة الخدمات">
        <header className="admin-panel-title"><h2>حالة الخدمات</h2><small>معلومات حقيقية من بيئة الخادم</small></header>
        <ul className="admin-status-list">
          {serviceStatus.map((status) => (
            <li key={status.label}>
              <span>{status.label}</span>
              <span className={`badge ${status.connected ? 'badge--active' : 'badge--hidden'}`} dir="ltr">{status.connected ? 'CONNECTED' : 'NOT CONFIGURED'}</span>
            </li>
          ))}
          <li><span>Webhook واتساب</span><code dir="ltr">/api/whatsapp/webhook</code></li>
        </ul>
      </section>
    </div>
  );
}

function OtherPanels({ tab, values, set, saveButton, users }: {
  tab: (typeof tabs)[number]['id'];
  values: Record<string, string>;
  set: (key: string, value: string) => void;
  saveButton: (keys: string[]) => React.ReactNode;
  users: { id: string; full_name: string; email: string | null; role: string; status: string }[];
}) {
  if (tab === 'store') {
    return (
      <section className="admin-panel" aria-label="إعدادات المتجر">
        <header className="admin-panel-title"><h2>المتجر</h2></header>
        <div className="admin-field-grid">
          <label>اسم المتجر<input value={values.store_name ?? ''} onChange={(event) => set('store_name', event.target.value)} /></label>
          <label>هاتف التواصل<input dir="ltr" value={values.store_phone ?? ''} onChange={(event) => set('store_phone', event.target.value)} /></label>
          <label>العنوان<input value={values.store_address ?? ''} onChange={(event) => set('store_address', event.target.value)} /></label>
          <label>سعر صرف الدولار (ل.س)<input dir="ltr" type="number" min="1" value={values.syp_per_usd ?? ''} onChange={(event) => set('syp_per_usd', event.target.value)} /></label>
        </div>
        {saveButton(['store_name', 'store_phone', 'store_address', 'syp_per_usd'])}
      </section>
    );
  }
  if (tab === 'website') {
    return (
      <section className="admin-panel" aria-label="إعدادات الموقع">
        <header className="admin-panel-title"><h2>الموقع</h2><small>وصف ظاهر في صفحات المتجر</small></header>
        <label>وصف الموقع<textarea rows={3} value={values.site_description ?? ''} onChange={(event) => set('site_description', event.target.value)} /></label>
        {saveButton(['site_description'])}
      </section>
    );
  }
  if (tab === 'products') {
    return (
      <section className="admin-panel" aria-label="إعدادات المنتجات">
        <header className="admin-panel-title"><h2>المنتجات</h2></header>
        <div className="admin-field-grid">
          <label>حد المخزون المنخفض الافتراضي<input dir="ltr" type="number" min="0" value={values.products_default_low_stock ?? '2'} onChange={(event) => set('products_default_low_stock', event.target.value)} /></label>
          <label>نوع الباركود الافتراضي
            <select value={values.products_barcode_type ?? 'code128'} onChange={(event) => set('products_barcode_type', event.target.value)}>
              <option value="code128">Code 128</option>
            </select>
          </label>
          <label>صيغة الصور المفضلة
            <select value={values.products_image_format ?? 'webp'} onChange={(event) => set('products_image_format', event.target.value)}>
              <option value="webp">WebP</option><option value="png">PNG</option>
            </select>
          </label>
        </div>
        {saveButton(['products_default_low_stock', 'products_barcode_type', 'products_image_format'])}
      </section>
    );
  }
  if (tab === 'orders') {
    return (
      <section className="admin-panel" aria-label="إعدادات الطلبات">
        <header className="admin-panel-title"><h2>الطلبات</h2></header>
        <label>إشعار الإدارة عند طلب جديد
          <select value={values.orders_notify ?? '1'} onChange={(event) => set('orders_notify', event.target.value)}>
            <option value="1">نعم</option><option value="0">لا</option>
          </select>
        </label>
        {saveButton(['orders_notify'])}
      </section>
    );
  }
  if (tab === 'users') {
    return (
      <section className="admin-panel" aria-label="مستخدمو الإدارة">
        <header className="admin-panel-title"><h2>مستخدمو الإدارة</h2><small>حسابات ADMIN و STAFF الحالية</small></header>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الحالة</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}><td>{user.full_name}</td><td dir="ltr">{user.email ?? '—'}</td><td dir="ltr">{user.role}</td><td dir="ltr">{user.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }
  return (
    <section className="admin-panel" aria-label="الأمان">
      <header className="admin-panel-title"><h2>الأمان</h2></header>
      <p className="admin-callout admin-callout--warn">
        المصادقة الحالية تعتمد على <code dir="ltr">AL_NAEEM_ADMIN_SESSION_TOKEN</code> أو <code dir="ltr">ADMIN_DEV_BYPASS=true</code> للتطوير فقط.
        كل الإجراءات الخطرة تُنفَّذ عبر Server Actions على الخادم. عند النشر يجب استبدال نظام التطوير بمصادقة حقيقية عبر AL NAEEM API وتقييد لوحة التحكم بجلسات موثقة (RBAC مستقبلي).
      </p>
      <ul className="admin-status-list">
        <li><span>أسرار واتساب / Serper / AI</span><span className="badge badge--active" dir="ltr">SERVER-ONLY</span></li>
        <li><span>التحقق من توقيع Webhook</span><span className="badge" dir="ltr">X-Hub-Signature-256</span></li>
      </ul>
    </section>
  );
}
