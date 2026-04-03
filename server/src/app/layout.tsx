import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ninja Games - Gaming Center',
  description: 'The ultimate gaming cafe experience',
  icons: { icon: '/logo.jpeg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ninja-dark min-h-screen">{children}</body>
    </html>
  );
}
