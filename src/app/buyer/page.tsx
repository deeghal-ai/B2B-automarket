import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatPrice, formatMileage } from '@/lib/utils';

export default async function BuyerBrowsePage() {
  // For now, just show all published vehicles
  // We'll add dynamic grouping next
  const vehicles = await prisma.vehicle.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      seller: true,
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const vehicleCount = await prisma.vehicle.count({
    where: { status: 'PUBLISHED' },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Vehicles</h1>
        <p className="text-muted-foreground">
          {vehicleCount} vehicles available
        </p>
      </div>

      {/* Placeholder for grouping controls - coming next */}
      <Card className="mb-6 bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            🚧 Dynamic grouping controls coming soon! For now, showing all vehicles.
          </p>
        </CardContent>
      </Card>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No vehicles available yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/buyer/vehicle/${vehicle.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  {/* Image placeholder */}
                  <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                    {vehicle.images[0] ? (
                      <img
                        src={vehicle.images[0].url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <span className="text-4xl">🚗</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {vehicle.make} {vehicle.model} {vehicle.variant}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.year} • {vehicle.color}
                        </p>
                      </div>
                      <Badge variant="secondary">{vehicle.condition}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatMileage(vehicle.mileage)}
                      </span>
                      <span className="font-bold text-lg">
                        {formatPrice(Number(vehicle.price), vehicle.currency)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {vehicle.seller.companyName} • {vehicle.seller.city}, {vehicle.seller.country}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
