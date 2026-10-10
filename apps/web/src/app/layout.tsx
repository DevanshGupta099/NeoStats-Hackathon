import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/providers/query-provider';
import { AuthProvider } from '@/lib/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { GlobalCanvas } from '@/components/canvas/global-canvas';
import { SmoothScroll } from '@/components/layout/smooth-scroll';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'FORGELINE — High-Concurrency Project Engine',
  description: 'Industrial real-time project operations platform with optimistic concurrency control',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-void text-bone antialiased selection:bg-plasma selection:text-void font-body">
        <SmoothScroll>
          <QueryProvider>
            <AuthProvider>
              <div id="app-root" className="relative min-h-screen">
                <GlobalCanvas />
                <AppShell>{children}</AppShell>
                <Toaster />
              </div>
            </AuthProvider>
          </QueryProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
