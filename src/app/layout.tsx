import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/AppLayout';

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
      <body className="antialiased">
        <AppLayout>
            {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
