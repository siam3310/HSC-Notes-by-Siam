import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'HSC ICT Notes',
  description: 'A comprehensive collection of ICT study notes for HSC students.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <meta name="google-site-verification" content="yAFfTwqZrPnN9SKdzxCNipM_H63nQuqk8YkIZDlDOcc" />
      <title>HSC Notes by Siam</title>
<meta name="title" content="HSC Notes " />
<meta name="description" content="A comprehensive collection of study notes for HSC students. Build with love by Mahamudun Nabi Siam" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://hscnotes.vercel.app/" />
<meta property="og:title" content="HSC Notes " />
<meta property="og:description" content="A comprehensive collection of study notes for HSC students. Build with love by Mahamudun Nabi Siam" />
<meta property="og:image" content="https://hscnotes.netlify.app/favicon.ico" />
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://hscnotes.vercel.app/" />
<meta property="twitter:title" content="HSC Notes" />
<meta property="twitter:description" content="A comprehensive collection of study notes for HSC students. Build with love by Mahamudun Nabi Siam" />
<meta property="twitter:image" content="https://hscnotes.netlify.app/favicon.ico" />

      <body className="antialiased font-sans">
        <AppLayout>
            {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
