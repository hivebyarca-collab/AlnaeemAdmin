'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Bell, Headphones, LogOut, Menu, Search, X } from 'lucide-react';
import { adminNavigation, isNavActive } from '@/config/admin-navigation';
import { logoutAction } from '@/lib/auth-actions';

export function AdminShell({ children, dateLabel }: { children: React.ReactNode; dateLabel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggingOut, startLogout] = useTransition();

  return (
    <div className="admin-page">
      {open && <button type="button" className="admin-scrim" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}
      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`} aria-label="التنقل في لوحة الإدارة">
        <Link href="/" className="admin-brand" onClick={() => setOpen(false)}>
          <span className="admin-brand-mark">N</span>
          <span><b>AL <em>NAEEM</em></b><small>ADMIN</small></span>
        </Link>
        <nav className="admin-nav">
          {adminNavigation.map((section) => (
            <div key={section.title} className="admin-nav-section">
              <span className="admin-nav-section-title">{section.title}</span>
              {section.items.map((item) => {
                const NavIcon = item.icon;
                const active = isNavActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={active ? 'is-active' : ''}
                    aria-current={active ? 'page' : undefined}
                  >
                    <NavIcon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <button
          type="button"
          className="admin-logout"
          disabled={loggingOut}
          onClick={() => startLogout(() => { void logoutAction(); })}
        >
          <LogOut aria-hidden="true" />
          <span>{loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}</span>
        </button>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <button type="button" className="admin-burger" aria-label="فتح القائمة" aria-expanded={open} onClick={() => setOpen(true)}><Menu aria-hidden="true" /></button>
          <div className="admin-welcome">
            <div className="admin-avatar"><Headphones aria-hidden="true" /></div>
            <div>
              <span>{dateLabel || '\u00a0'}</span>
              <strong>مدير المتجر</strong>
              <small dir="ltr">ADMIN / 001</small>
            </div>
          </div>
          <label className="admin-search">
            <Search aria-hidden="true" />
            <input type="search" placeholder="ابحث عن منتج، طلب، عميل ..." aria-label="البحث في لوحة الإدارة" disabled />
            <kbd dir="ltr">⌘ K</kbd>
          </label>
          <button type="button" className="admin-bell" aria-label="الإشعارات" disabled>
            <Bell aria-hidden="true" />
          </button>
          <button type="button" className="admin-burger admin-burger--close" aria-label="إغلاق القائمة" onClick={() => setOpen(false)}><X aria-hidden="true" /></button>
        </header>
        {children}
      </div>
    </div>
  );
}
