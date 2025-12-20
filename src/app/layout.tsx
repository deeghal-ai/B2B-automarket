import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/shared/header';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AutoMarket B2B - Used Car Marketplace',
  description: 'B2B marketplace for bulk used car purchases from China to UAE',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let user = null;
  if (authUser) {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { email: true, role: true },
    });
    if (dbUser) {
      user = {
        email: dbUser.email,
        role: dbUser.role as 'BUYER' | 'SELLER' | 'ADMIN',
      };
    }
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Header user={user} />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
