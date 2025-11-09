'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="en" className="dark">
      <head>
          <title>HSC Hand Notes by Siam</title>
          <meta name="description" content="Digital handwritten study notes for HSC students." />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {isAdminRoute ? (
          <div className="flex flex-col min-h-screen">
             {children}
          </div>
        ) : (
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </div>
        )}
        <Toaster />
      </body>
    </html>
  );
}
