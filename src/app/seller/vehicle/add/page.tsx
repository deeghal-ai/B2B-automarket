import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { VehicleEditForm } from '@/components/seller/vehicle-edit-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function AddVehiclePage() {
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

  return (
    <div>
      <div className="mb-6">
        <Link href="/seller/inventory">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add New Vehicle</h1>
        <p className="text-muted-foreground">
          Fill in the details to add a single vehicle to your inventory
        </p>
      </div>

      <VehicleEditForm mode="add" />
    </div>
  );
}

