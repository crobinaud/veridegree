import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VeriDegree | Soulbound Academic Credentials',
  description:
    'Verifiable university degrees as Soulbound NFTs. Secure, permanent, and tamper-proof academic credentials on the blockchain.',
  keywords: [
    'blockchain',
    'diploma',
    'SBT',
    'soulbound token',
    'academic',
    'verification',
    'ethereum',
  ],
  authors: [{ name: 'VeriDegree Team' }],
  openGraph: {
    title: 'VeriDegree | Soulbound Academic Credentials',
    description: 'Verifiable university degrees as Soulbound NFTs.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
