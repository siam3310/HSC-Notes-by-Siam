import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/AppLayout';
import { Bungee_Shade, Comic_Relief } from 'next/font/google';

const fontSans = Comic_Relief({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-sans',
});

const fontTitle = Bungee_Shade({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-title',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${fontSans.variable} ${fontTitle.variable}`}>
      <head>
          <title>HSC Notes</title>
          <meta name="description" content="A comprehensive collection of study notes for HSC students." />
      </head>
      <body className={`font-sans antialiased`}>
        <AppLayout>
            {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
