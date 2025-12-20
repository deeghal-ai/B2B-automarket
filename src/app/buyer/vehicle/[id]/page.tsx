import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check } from 'lucide-react';
import {
  formatPrice,
  formatMileage,
  formatNumber,
  conditionLabels,
  bodyTypeLabels,
  fuelTypeLabels,
  transmissionLabels,
  drivetrainLabels,
} from '@/lib/utils';
import { AddToCartButton } from '@/components/buyer/add-to-cart-button';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id,
      status: 'PUBLISHED',
    },
    include: {
      seller: true,
      images: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  const specs = [
    { label: 'VIN', value: vehicle.vin },
    { label: 'Registration', value: vehicle.registrationNo || 'N/A' },
    { label: 'Condition', value: conditionLabels[vehicle.condition] || vehicle.condition },
    { label: 'Body Type', value: bodyTypeLabels[vehicle.bodyType] || vehicle.bodyType },
    { label: 'Fuel Type', value: fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType },
    { label: 'Transmission', value: transmissionLabels[vehicle.transmission] || vehicle.transmission },
    { label: 'Drivetrain', value: drivetrainLabels[vehicle.drivetrain] || vehicle.drivetrain },
    { label: 'Engine', value: vehicle.engineSize ? `${vehicle.engineSize}L` : 'N/A' },
    { label: 'Cylinders', value: vehicle.cylinders?.toString() || 'N/A' },
    { label: 'Horsepower', value: vehicle.horsepower ? `${vehicle.horsepower} HP` : 'N/A' },
    { label: 'Seating', value: vehicle.seatingCapacity ? `${vehicle.seatingCapacity} passengers` : 'N/A' },
    { label: 'Doors', value: vehicle.doors?.toString() || 'N/A' },
    { label: 'Regional Specs', value: vehicle.regionalSpecs || 'N/A' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/buyer"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
            {vehicle.images[0] ? (
              <img
                src={vehicle.images[0].url}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-6xl">🚗</span>
            )}
          </div>
          {vehicle.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {vehicle.images.slice(0, 5).map((image, i) => (
                <div
                  key={image.id}
                  className="aspect-video bg-muted rounded cursor-pointer hover:opacity-80"
                >
                  <img
                    src={image.url}
                    alt={`${vehicle.make} ${vehicle.model} ${i + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">
                {vehicle.make} {vehicle.model} {vehicle.variant}
              </h1>
              <p className="text-lg text-muted-foreground">
                {vehicle.year} • {vehicle.color} • {formatMileage(vehicle.mileage)}
              </p>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {conditionLabels[vehicle.condition]}
            </Badge>
          </div>

          <p className="text-4xl font-bold mb-6">
            {formatPrice(Number(vehicle.price), vehicle.currency)}
          </p>

          <Card className="mb-6">
            <CardContent className="py-4">
              <p className="font-medium">{vehicle.seller.companyName}</p>
              <p className="text-sm text-muted-foreground">
                📍 {vehicle.city}, {vehicle.country}
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-3 mb-8">
            <AddToCartButton
              vehicle={{
                id: vehicle.id,
                sellerId: vehicle.sellerId,
                sellerName: vehicle.seller.companyName,
                make: vehicle.make,
                model: vehicle.model,
                variant: vehicle.variant,
                year: vehicle.year,
                color: vehicle.color,
                mileage: vehicle.mileage,
                price: Number(vehicle.price),
                vin: vehicle.vin,
                imageUrl: vehicle.images[0]?.url || null,
              }}
            />
            <Button variant="outline" className="flex-1">
              Contact Seller
            </Button>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {specs.map((spec) => (
              <div key={spec.label}>
                <p className="text-sm text-muted-foreground">{spec.label}</p>
                <p className="font-medium">{spec.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      {vehicle.features.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {vehicle.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {vehicle.description && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{vehicle.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
