import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'tunneru | Request Inspector',
  description: 'Real-time HTTP request inspector and webhook debugger for tunneru',
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
