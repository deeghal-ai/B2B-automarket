# Feature Spec: Vehicle Detail Page

## Overview

When a buyer clicks on a vehicle (from grouped listings or anywhere), they see a full detail page with all specs, images, and the ability to add to cart.

## User Stories

### US-1: View Full Details
**As a** buyer
**I want to** see complete vehicle information
**So that** I can make an informed purchase decision

### US-2: View Images
**As a** buyer
**I want to** see all vehicle photos
**So that** I can assess the condition

### US-3: Add to Cart
**As a** buyer
**I want to** add this vehicle to my cart
**So that** I can include it in my purchase

### US-4: Return to Listings
**As a** buyer
**I want to** go back to the grouped listings
**So that** I can continue browsing

## UI Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [← Back to listings]                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │                                 │  │ Toyota Camry LE 2022         │  │
│  │         [Main Image]            │  │ White • 25,000 km            │  │
│  │                                 │  │                              │  │
│  │                                 │  │ Price: $18,500 USD           │  │
│  └─────────────────────────────────┘  │                              │  │
│  [📷][📷][📷][📷][📷]                 │ Seller: ABC Auto Trading     │  │
│                                       │ 📍 Shanghai, China           │  │
│                                       │                              │  │
│                                       │ [Add to Cart 🛒]             │  │
│                                       │ [Contact Seller ✉️]          │  │
│                                       └──────────────────────────────┘  │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Specifications                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ VIN            │ 1HGCV1F34LA123456                              │   │
│  │ Registration   │ 沪A12345                                        │   │
│  │ Condition      │ Excellent                                       │   │
│  │ Body Type      │ Sedan                                           │   │
│  │ Fuel Type      │ Petrol                                          │   │
│  │ Transmission   │ Automatic                                       │   │
│  │ Drivetrain     │ FWD                                             │   │
│  │ Engine         │ 2.5L 4-Cylinder                                 │   │
│  │ Horsepower     │ 203 HP                                          │   │
│  │ Seating        │ 5 passengers                                    │   │
│  │ Doors          │ 4                                               │   │
│  │ Regional Specs │ Chinese                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Features                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Leather Seats    ✓ Sunroof         ✓ Navigation               │   │
│  │ ✓ Bluetooth        ✓ Backup Camera   ✓ Keyless Entry            │   │
│  │ ✓ Heated Seats     ✓ Apple CarPlay   ✓ Lane Assist              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Description                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Well-maintained vehicle with full service history. Single owner │   │
│  │ from new, always serviced at authorized dealer. No accidents.   │   │
│  │ Perfect condition inside and out.                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

```typescript
// src/app/buyer/vehicle/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { VehicleGallery } from '@/components/buyer/vehicle-gallery';
import { VehicleSpecs } from '@/components/buyer/vehicle-specs';
import { AddToCartButton } from '@/components/buyer/add-to-cart-button';

export default async function VehicleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { 
      id: params.id,
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
  
  return (
    <div className="max-w-6xl mx-auto">
      <BackButton />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <VehicleGallery images={vehicle.images} />
        
        <div>
          <h1 className="text-2xl font-bold">
            {vehicle.make} {vehicle.model} {vehicle.variant} {vehicle.year}
          </h1>
          <p className="text-muted-foreground">
            {vehicle.color} • {vehicle.mileage.toLocaleString()} km
          </p>
          
          <p className="text-3xl font-bold mt-4">
            ${Number(vehicle.price).toLocaleString()} {vehicle.currency}
          </p>
          
          <div className="mt-4">
            <p className="font-medium">{vehicle.seller.companyName}</p>
            <p className="text-sm text-muted-foreground">
              📍 {vehicle.city}, {vehicle.country}
            </p>
          </div>
          
          <div className="mt-6 flex gap-3">
            <AddToCartButton vehicle={vehicle} />
            <ContactSellerButton sellerId={vehicle.sellerId} />
          </div>
        </div>
      </div>
      
      <VehicleSpecs vehicle={vehicle} />
      <VehicleFeatures features={vehicle.features} />
      <VehicleDescription description={vehicle.description} />
    </div>
  );
}
```

## Files to Create

```
src/
├── app/
│   └── buyer/
│       └── vehicle/
│           └── [id]/
│               └── page.tsx
└── components/
    └── buyer/
        ├── vehicle-gallery.tsx
        ├── vehicle-specs.tsx
        ├── vehicle-features.tsx
        ├── add-to-cart-button.tsx
        └── contact-seller-button.tsx
```
