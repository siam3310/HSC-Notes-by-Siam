import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'HSC Notes by Siam',
  description: 'A comprehensive collection of study notes for HSC students. Build with love by Mahamudun Nabi Siam',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <meta name="google-site-verification" content="yAFfTwqZrPnN9SKdzxCNipM_H63nQuqk8YkIZDlDOcc" />
      <body className="antialiased font-sans">
        <AppLayout>
            {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
