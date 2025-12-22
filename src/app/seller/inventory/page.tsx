import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InventoryClient } from '@/components/seller/inventory-client';
import { Upload, Loader2, Plus } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            View, manage, and publish your vehicles
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/seller/vehicle/add">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </Link>
          <Link href="/seller/upload">
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Button>
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <InventoryClient />
      </Suspense>
    </div>
  );
}

