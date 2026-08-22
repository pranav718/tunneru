import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tunneru.knightkun.codes'),
  title: {
    default: 'tunneru | your localhost, on the public internet',
    template: '%s | tunneru',
  },
  description: 'zero-dependency tunneling with a custom 9-byte binary multiplexer, interactive terminal tui, and instant request replay. fast, private, self-hosted.',
  keywords: [
    'tunnel',
    'localhost',
    'webhook',
    'tui',
    'multiplexer',
    'ngrok alternative',
    'self-hosted',
    'developer tools',
    'reverse proxy',
  ],
  authors: [{ name: 'pranav718' }],
  creator: 'pranav718',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tunneru.knightkun.codes',
    title: 'tunneru | your localhost, on the public internet',
    description: 'zero-dependency tunneling with a custom 9-byte binary multiplexer, interactive terminal tui, and instant request replay.',
    siteName: 'tunneru',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'tunneru | your localhost, on the public internet',
    description: 'zero-dependency tunneling with a custom 9-byte binary multiplexer, interactive terminal tui, and instant request replay.',
    creator: '@pranav718',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#0e0c0d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
