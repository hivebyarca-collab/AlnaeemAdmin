'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Bell, Boxes, CirclePlus, Headphones, Home, LogOut, Menu, Search, Settings, ShoppingBag, Tag, UsersRound, X,
} from 'lucide-react';

const adminLinks = [
  { label: 'الرئيسية', href: '/admin', icon: Home },
  { label: 'إضافة منتج', href: '/admin/products/new', icon: CirclePlus },
  { label: 'قائمة المنتجات', href: '/admin/products', icon: Boxes },
  { label: 'الطلبات', href: '/admin/orders', icon: ShoppingBag },
  { label: 'العملاء', href: '/admin/clients', icon: UsersRound },
  { label: 'العروض', href: null, icon: Tag, soon: true },
  { label: 'الإعدادات', href: '/admin/settings', icon: Settings },
];

export function AdminShell({ children, dateLabel }: { children: React.ReactNode; dateLabel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-page">
      {open && <button type="button" className="admin-scrim" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}
      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`} aria-label="التنقل في لوحة الإدارة">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-mark">N</span>
          <span><b>AL <em>NAEEM</em></b><small>GAMING STORE</small></span>
        </Link>
        <nav className="admin-nav">
          {adminLinks.map(({ label, href, icon: NavIcon }) =>
            href ? (
              <Link key={label} href={href} onClick={() => setOpen(false)} className={pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`)) || (href === '/admin/products' && pathname === '/admin/products') ? 'is-active' : ''} aria-current={pathname === href ? 'page' : undefined}>
                <NavIcon aria-hidden="true" /><span>{label}</span>
              </Link>
            ) : (
              <span key={label} className="admin-nav-soon" aria-disabled="true" title="قريباً">
                <NavIcon aria-hidden="true" /><span>{label}</span><small>قريباً</small>
              </span>
            ),
          )}
        </nav>
        <Link href="/" className="admin-exit">
          <LogOut aria-hidden="true" /><span>عرض واجهة المتجر</span>
        </Link>
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
            <input type="search" placeholder="ابحث عن منتج، طلب، عميل ..." aria-label="البحث في لوحة الإدارة" />
            <kbd dir="ltr">⌘ K</kbd>
          </label>
          <button type="button" className="admin-bell" aria-label="الإشعارات">
            <Bell aria-hidden="true" />
          </button>
          <button type="button" className="admin-burger admin-burger--close" aria-label="إغلاق القائمة" onClick={() => setOpen(false)}><X aria-hidden="true" /></button>
        </header>
        {children}
      </div>
    </div>
  );
}
