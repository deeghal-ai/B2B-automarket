import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { VehicleEditForm } from '@/components/seller/vehicle-edit-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface EditVehiclePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { id } = await params;

  // Auth check
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  // Get seller
  const seller = await prisma.seller.findUnique({
    where: { userId: authUser.id },
  });

  if (!seller) {
    redirect('/login');
  }

  // Fetch vehicle with ownership check
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      images: true,
    },
  });

  if (!vehicle) {
    notFound();
  }

  // Verify ownership
  if (vehicle.sellerId !== seller.id) {
    redirect('/seller/inventory');
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/seller/inventory">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Vehicle</h1>
        <p className="text-muted-foreground">
          {vehicle.make} {vehicle.model} ({vehicle.year})
        </p>
      </div>

      <VehicleEditForm vehicle={vehicle} />
    </div>
  );
}

