import { getUsers, getSettings } from '@/lib/database';
import { isImageSearchConfigured } from '@/lib/services/image-search';
import { isWhatsAppConfigured, getWhatsAppConfig } from '@/lib/services/whatsapp';
import { isAgentConfigured } from '@/lib/services/ai-agent';
import { SettingsTabs } from '@/components/admin/settings-tabs';

export const metadata = { title: 'الإعدادات' };

export default function SettingsPage() {
  const settings = getSettings();
  const users = getUsers().filter((user) => user.role !== 'CUSTOMER');
  const whatsapp = getWhatsAppConfig();

  const serviceStatus = [
    { label: 'البحث عن الصور (Serper)', connected: isImageSearchConfigured() },
    { label: 'واتساب للأعمال (Cloud API)', connected: isWhatsAppConfigured(whatsapp) },
    { label: 'وكيل الذكاء الاصطناعي', connected: isAgentConfigured() },
  ];

  return (
    <div className="admin-page-body">
      <header className="admin-page-header">
        <h1><span aria-hidden="true">⚙️</span> الإعدادات</h1>
        <p>إدارة إعدادات المتجر والتكامل الخارجي</p>
      </header>
      <SettingsTabs settings={settings} serviceStatus={serviceStatus} users={users.map((user) => ({ id: user.id, full_name: user.full_name, email: user.email, role: user.role, status: user.status }))} />
    </div>
  );
}
