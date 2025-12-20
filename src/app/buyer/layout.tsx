import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?redirect=/buyer');
  }

  // Verify user exists in our database
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  });

  if (!user) {
    redirect('/login');
  }

  // If they're a seller trying to access buyer pages, redirect them
  if (user.role === 'SELLER') {
    redirect('/seller');
  }

  return <div className="container mx-auto py-6 px-4">{children}</div>;
}
