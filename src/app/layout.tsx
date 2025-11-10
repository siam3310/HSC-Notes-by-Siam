import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/AppLayout';
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
          <title>HSC Notes</title>
          <meta name="description" content="A comprehensive collection of study notes for HSC students." />
      </head>
      <body className={`${ptSans.variable} font-sans antialiased`}>
        <AppLayout>
            {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
