import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FORGELINE — Operations Forge',
  description: 'Multi-user collaborative project management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#060709] text-[#ECE8DF] antialiased">
        {children}
      </body>
    </html>
  );
}
