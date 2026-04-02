import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Ninja Games',
  description: 'Ninja Games Gaming Center - Your gaming companion',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ninja Games',
  },
  icons: {
    icon: '/img/icon-192.png',
    apple: '/img/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
