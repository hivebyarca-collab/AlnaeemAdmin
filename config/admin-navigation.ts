import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  FolderTree,
  Home,
  Image,
  LayoutTemplate,
  Percent,
  Settings,
  ShoppingBag,
  Tag,
  UsersRound,
  Warehouse,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match nested routes, e.g. /products/new under /products */
  matchPrefix?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const adminNavigation: NavSection[] = [
  {
    title: 'الرئيسية',
    items: [{ label: 'لوحة التحكم', href: '/', icon: Home }],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'المنتجات', href: '/products', icon: Boxes, matchPrefix: true },
      { label: 'التصنيفات', href: '/categories', icon: FolderTree },
      { label: 'العلامات التجارية', href: '/brands', icon: Tag },
    ],
  },
  {
    title: 'المخزون',
    items: [{ label: 'المخزون', href: '/inventory', icon: Warehouse }],
  },
  {
    title: 'المبيعات',
    items: [
      { label: 'الطلبات', href: '/orders', icon: ShoppingBag, matchPrefix: true },
      { label: 'العملاء', href: '/customers', icon: UsersRound, matchPrefix: true },
    ],
  },
  {
    title: 'التسويق',
    items: [
      { label: 'العروض', href: '/promotions', icon: Percent },
    ],
  },
  {
    title: 'المحتوى',
    items: [
      { label: 'الموقع', href: '/website', icon: LayoutTemplate },
      { label: 'الوسائط', href: '/media', icon: Image },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { label: 'المستخدمون', href: '/users', icon: UsersRound },
      { label: 'الإعدادات', href: '/settings', icon: Settings },
    ],
  },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') return pathname === '/';
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href;
}
