import type { Metadata } from 'next';
import { Inter, Tajawal } from 'next/font/google';
import './globals.css';

const arabic = Tajawal({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['400', '500', '700', '800', '900'],
  display: 'swap',
});

const latin = Inter({
  variable: '--font-latin',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'لوحة تحكم النعيم | AL NAEEM Admin',
    template: '%s | AL NAEEM Admin',
  },
  description: 'تطبيق إدارة مستقل لمتجر النعيم للألعاب.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${arabic.variable} ${latin.variable}`}>{children}</body>
    </html>
  );
}
