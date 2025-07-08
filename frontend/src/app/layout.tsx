import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'TokenWise - Solana Wallet Intelligence',
  description: 'A dashboard for tracking and analyzing Solana wallet activity.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${GeistSans.className} bg-gray-900 text-gray-100`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8 bg-gray-800">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
