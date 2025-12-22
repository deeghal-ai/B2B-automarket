# Data Model Specification

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │   Seller     │       │   Vehicle    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ email        │──1:1──│ userId       │──1:N──│ sellerId     │
│ role         │       │ companyName  │       │ make         │
│ createdAt    │       │ country      │       │ model        │
└──────────────┘       │ city         │       │ year         │
                       │ phone        │       │ price        │
                       └──────────────┘       │ status       │
                                              │ ...          │
                                              └──────────────┘
                                                     │
                                                     │ N:1
                                                     ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Order     │       │  OrderItem   │       │ VehicleImage │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │──1:N──│ id           │       │ id           │
│ buyerId      │       │ orderId      │       │ vehicleId    │
│ status       │       │ vehicleId    │       │ url          │
│ totalAmount  │       │ price        │       │ isPrimary    │
│ createdAt    │       └──────────────┘       └──────────────┘
└──────────────┘

┌──────────────┐       ┌──────────────┐
│    Cart      │       │  CartItem    │
├──────────────┤       ├──────────────┤
│ id           │──1:N──│ id           │
│ userId       │       │ cartId       │
│ updatedAt    │       │ vehicleId    │
└──────────────┘       │ addedAt      │
                       └──────────────┘

┌──────────────────┐
│  ColumnMapping   │
├──────────────────┤
│ id               │
│ sellerId         │
│ name             │
│ mapping (JSON)   │
│ createdAt        │
└──────────────────┘
```

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER & AUTH
// ============================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  role      Role     @default(BUYER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  seller Seller?
  cart   Cart?
  orders Order[]
}

enum Role {
  BUYER
  SELLER
  ADMIN
}

// ============================================
// SELLER
// ============================================

model Seller {
  id          String   @id @default(cuid())
  userId      String   @unique
  companyName String
  country     String
  city        String
  phone       String?
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  vehicles       Vehicle[]
  columnMappings ColumnMapping[]
}

// ============================================
// VEHICLE (Core Entity)
// ============================================

model Vehicle {
  id String @id @default(cuid())

  // Ownership
  sellerId String
  seller   Seller @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  // Identification
  vin            String  @unique
  registrationNo String?

  // ===== GROUPING FIELDS (indexed for performance) =====
  make      String // Toyota, Honda, BMW
  model     String // Camry, Accord, X5
  variant   String? // LE, SE, Sport, xDrive
  year      Int
  color     String
  condition Condition
  bodyType  BodyType

  // Specifications
  regionalSpecs   String? // GCC, American, European, Japanese
  fuelType        FuelType
  transmission    Transmission
  drivetrain      Drivetrain
  engineSize      Float? // in liters (e.g., 2.5)
  cylinders       Int?
  horsepower      Int?
  seatingCapacity Int?
  doors           Int?
  mileage         Int // in kilometers

  // Location
  city    String
  country String

  // Content
  description String?
  features    String[] // Array of feature strings

  // Pricing
  price    Decimal?      @db.Decimal(12, 2) // Nullable for RFQ vehicles
  currency String        @default("USD")
  incoterm String?       // FOB or CIF (required when price is set)
  status   VehicleStatus @default(DRAFT)

  // External Links
  inspectionReportLink String? // URL to vehicle inspection report

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  images     VehicleImage[]
  cartItems  CartItem[]
  orderItems OrderItem[]

  // ===== INDEXES FOR GROUPING QUERIES =====
  @@index([sellerId, status])
  @@index([make, model, year])
  @@index([make, model, variant, year, color, condition])
  @@index([status, make])
  @@index([status, country])
}

model VehicleImage {
  id        String   @id @default(cuid())
  vehicleId String
  url       String
  isPrimary Boolean  @default(false)
  order     Int      @default(0)
  createdAt DateTime @default(now())

  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  @@index([vehicleId])
}

// ============================================
// ENUMS
// ============================================

enum Condition {
  EXCELLENT
  GOOD
  FAIR
  POOR
}

enum BodyType {
  SEDAN
  SUV
  HATCHBACK
  COUPE
  CONVERTIBLE
  WAGON
  VAN
  TRUCK
  PICKUP
  OTHER
}

enum FuelType {
  PETROL
  DIESEL
  HYBRID
  ELECTRIC
  PLUGIN_HYBRID
  OTHER
}

enum Transmission {
  AUTOMATIC
  MANUAL
  CVT
  DCT
  OTHER
}

enum Drivetrain {
  FWD
  RWD
  AWD
  FOUR_WD
}

enum VehicleStatus {
  DRAFT
  PUBLISHED
  SOLD
  RESERVED
}

// ============================================
// CART (Buyer's Shopping Cart)
// ============================================

model Cart {
  id        String   @id @default(cuid())
  userId    String   @unique
  updatedAt DateTime @updatedAt

  user  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items CartItem[]
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  vehicleId String
  addedAt   DateTime @default(now())

  cart    Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  @@unique([cartId, vehicleId]) // Can't add same vehicle twice
  @@index([cartId])
}

// ============================================
// ORDERS
// ============================================

model Order {
  id          String      @id @default(cuid())
  buyerId     String
  status      OrderStatus @default(PENDING)
  totalAmount Decimal     @db.Decimal(14, 2)
  currency    String      @default("USD")
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  buyer User        @relation(fields: [buyerId], references: [id])
  items OrderItem[]

  @@index([buyerId])
  @@index([status])
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  vehicleId String
  price     Decimal @db.Decimal(12, 2)
  currency  String  @default("USD")

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  vehicle Vehicle @relation(fields: [vehicleId], references: [id])

  @@index([orderId])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

// ============================================
// COLUMN MAPPING (For Excel Uploads)
// ============================================

model ColumnMapping {
  id        String   @id @default(cuid())
  sellerId  String
  name      String // "My Standard Export", "Auction Format"
  mapping   Json // { "theirColumn": "ourField", ... }
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  seller Seller @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@index([sellerId])
}
```

## Field Details

### Vehicle Grouping Fields

These fields are the ones buyers can group by:

| Field | Type | Grouping Priority | Notes |
|-------|------|-------------------|-------|
| make | String | High | Brand name (Toyota, Honda) |
| model | String | High | Model name (Camry, Civic) |
| variant | String? | Medium | Trim level (LE, SE, Sport) |
| year | Int | High | Manufacturing year |
| color | String | Medium | Exterior color |
| condition | Enum | High | EXCELLENT, GOOD, FAIR, POOR |
| bodyType | Enum | Medium | SEDAN, SUV, etc. |

### Database Indexes Strategy

```sql
-- For general browsing
CREATE INDEX idx_vehicle_status_make ON vehicles(status, make);

-- For seller's inventory management
CREATE INDEX idx_vehicle_seller_status ON vehicles(seller_id, status);

-- For common grouping patterns
CREATE INDEX idx_vehicle_grouping ON vehicles(make, model, year);

-- For full grouping flexibility
CREATE INDEX idx_vehicle_full_grouping ON vehicles(make, model, variant, year, color, condition);
```

## Column Mapping JSON Structure

The mapping is stored as **field → Excel header** (inverted from Excel header → field). This makes it easier to display required fields and validate that all required fields are mapped.

```json
{
  "mapping": {
    "make": "Brand",
    "model": "Car Model",
    "variant": "Trim",
    "year": "Year of Manufacture",
    "color": "Exterior Color",
    "condition": "Vehicle Condition",
    "bodyType": "Body Style",
    "regionalSpecs": "Specs Region",
    "fuelType": "Fuel",
    "transmission": "Gearbox",
    "drivetrain": "Drive",
    "engineSize": "Engine (L)",
    "cylinders": "Cylinders",
    "horsepower": "HP",
    "seatingCapacity": "Seats",
    "doors": "Doors",
    "mileage": "KM",
    "city": "City",
    "country": "Country",
    "description": "Description",
    "vin": "VIN Number",
    "registrationNo": "Reg No",
    "price": "Price USD",
    "features": "Features"
  }
}
```

### TypeScript Type

```typescript
// Maps VehicleField → Excel header (or null if not mapped)
type ColumnMappingState = Partial<Record<VehicleField, string | null>>;

// Example:
const mapping: ColumnMappingState = {
  make: 'Brand',
  model: 'Car Model',
  year: 'Year',
  // ... other mappings
};
```

## Required vs Optional Fields

> **Note**: Per [DECISION-011], required fields for Excel import have been reduced to 6 to minimize friction for sellers. Other database-required fields use smart defaults during import.

### Required for Excel Import (Must Be Mapped)

These 6 fields must be mapped from the Excel file:

| Field | Type | Notes |
|-------|------|-------|
| make | String | Brand name (Toyota, Honda) |
| model | String | Model name (Camry, Civic) |
| year | Int | Must be 1900 - current year + 1 |
| color | String | Exterior color |
| variant | String | Trim level (LE, SE, Sport) |
| condition | Enum | EXCELLENT, GOOD, FAIR, POOR |

### Optional (With Smart Defaults)

These fields are optional in Excel mapping. If not mapped, defaults are applied:

| Field | Type | Default Value |
|-------|------|---------------|
| vin | String | Auto-generated placeholder (TEMP...) |
| price | Decimal? | null (RFQ - Request for Quote) |
| mileage | Int | 0 |
| bodyType | Enum | OTHER |
| fuelType | Enum | OTHER |
| transmission | Enum | OTHER |
| drivetrain | Enum | FWD |
| city | String | Seller's city |
| country | String | Seller's country |
| currency | String | USD (or from UI dropdown when price mapped) |
| incoterm | String? | null (FOB/CIF from UI when price mapped) |
| inspectionReportLink | String? | null |
| registrationNo | String | null |
| regionalSpecs | String | null |
| engineSize | Float | null |
| cylinders | Int | null |
| horsepower | Int | null |
| seatingCapacity | Int | null |
| doors | Int | null |
| description | String | null |
| features | String[] | [] |

### Pricing Fields Logic

When **price is mapped** from Excel:
- Currency is required (either mapped from Excel or selected via dropdown)
- Incoterm is required (either mapped from Excel or selected via FOB/CIF toggle)
- Vehicles with valid price values are displayed with price

When **price is NOT mapped**:
- All vehicles display as "RFQ" (Request for Quote)
- Currency and Incoterm are not required
- Buyers must request a quote for pricing

### Enum Normalization

The import process normalizes common variations to valid enum values:

| Enum | Common Inputs → Normalized Value |
|------|----------------------------------|
| condition | "Excellent", "excellent" → EXCELLENT |
| bodyType | "sedan", "Saloon" → SEDAN; "suv", "Crossover" → SUV |
| fuelType | "Petrol", "Gas", "Gasoline" → PETROL; "EV" → ELECTRIC |
| transmission | "Auto", "AT" → AUTOMATIC; "MT", "Stick" → MANUAL |
| drivetrain | "4x4", "4WD" → FOUR_WD; "All Wheel Drive" → AWD |

