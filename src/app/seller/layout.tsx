import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { LayoutDashboard, Upload, Package } from 'lucide-react';

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?redirect=/seller');
  }

  // Verify user is a seller
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { seller: true },
  });

  if (!user || user.role !== 'SELLER' || !user.seller) {
    redirect('/buyer');
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4 hidden md:block">
        <nav className="space-y-2">
          <Link
            href="/seller"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/seller/upload"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
          >
            <Upload className="h-5 w-5" />
            Upload Vehicles
          </Link>
          <Link
            href="/seller/inventory"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
          >
            <Package className="h-5 w-5" />
            Inventory
          </Link>
        </nav>

        <div className="mt-8 p-3 bg-muted rounded-md">
          <p className="text-sm font-medium">{user.seller.companyName}</p>
          <p className="text-xs text-muted-foreground">
            {user.seller.city}, {user.seller.country}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
