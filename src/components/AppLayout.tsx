
'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <>
      {isAdminRoute ? (
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      ) : (
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
            {children}
          </main>
          <Footer />
        </div>
      )}
    </>
  );
}
