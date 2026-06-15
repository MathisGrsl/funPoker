import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'funPoker',
    description: 'Online poker app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
