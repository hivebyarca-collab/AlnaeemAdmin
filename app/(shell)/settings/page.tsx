import { SettingsTabs } from '@/components/admin/settings-tabs';
import { PageHeader } from '@/components/shared/page-header';
import { settingsService } from '@/services';
import { isImageSearchConfigured } from '@/lib/services/image-search';
import { isWhatsAppConfigured, getWhatsAppConfig } from '@/lib/services/whatsapp';
import { isAgentConfigured } from '@/lib/services/ai-agent';

export const metadata = { title: 'الإعدادات' };

export default function SettingsPage() {
  const settings = settingsService.getAll();
  const users = settingsService.getAdminUsers();
  const whatsapp = getWhatsAppConfig();

  const serviceStatus = [
    { label: 'البحث عن الصور (Serper)', connected: isImageSearchConfigured() },
    { label: 'واتساب للأعمال (Cloud API)', connected: isWhatsAppConfigured(whatsapp) },
    { label: 'وكيل الذكاء الاصطناعي', connected: isAgentConfigured() },
  ];

  return (
    <div className="admin-page-body">
      <PageHeader title="الإعدادات" description="إدارة إعدادات المتجر والتكامل الخارجي" emoji="⚙️" />
      <SettingsTabs
        settings={settings}
        serviceStatus={serviceStatus}
        users={users.map((user) => ({ id: user.id, full_name: user.full_name, email: user.email, role: user.role, status: user.status }))}
      />
    </div>
  );
}
