# Feature Spec: Negotiation Module

## Overview

A seller-level deal room where buyers can negotiate prices, terms (incoterm, deposit %), and chat with sellers. Replaces the "Submit Quote Request" button in cart with per-seller "Negotiate" buttons.

## User Stories

### US-1: Start Negotiation
**As a** buyer  
**I want to** start a negotiation with a seller for all my cart items from them  
**So that** I can propose custom pricing and terms

### US-2: Propose Terms
**As a** buyer  
**I want to** set my offer price per vehicle, select incoterm (FOB/CIF), and deposit %  
**So that** I can propose a deal that works for me

### US-3: Chat with Seller
**As a** buyer or seller  
**I want to** send messages in the negotiation thread  
**So that** we can discuss the deal details

### US-4: Finalize Terms
**As a** buyer  
**I want to** lock in my proposed terms  
**So that** the seller can review and approve

### US-5: Approve Terms
**As a** seller  
**I want to** approve the buyer's finalized terms  
**So that** the deal can proceed to checkout

### US-6: View Incoming Negotiations
**As a** seller  
**I want to** see all negotiation requests from buyers  
**So that** I can respond to them

## UI Design

### Negotiation Modal (Two-Column Layout)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐                                                                     │
│ │   📊     │  Negotiation with Beijing Auto Co.        [2 ASSETS]           [X] │
│ └──────────┘  GROUPED SELLER-LEVEL DEAL ROOM                                     │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│  $ PRICE & TERMS BREAKDOWN             │  💬 MULTI-ASSET DISCUSSION THREAD       │
│                                        │                          ● Buyer ● Seller│
├────────────────────────────────────────┼─────────────────────────────────────────┤
│                                        │                                         │
│  ┌──────────────────────────────────┐  │  ┌─────────────────────────────────────┐│
│  │ [IMG] Toyota Camry               │  │  │ SELLER                    10:30 AM  ││
│  │       2023 • QTY: 1              │  │  │ Hi! I can offer a discount if you   ││
│  │                    SYSTEM PRICE  │  │  │ take the full lot. Terms are FOB.   ││
│  │                        $15,000   │  │  └─────────────────────────────────────┘│
│  │                                  │  │                                         │
│  │  OFFER PER UNIT         SAVINGS  │  │  ┌─────────────────────────────────────┐│
│  │  $ [14500    ]           -$500   │  │  │ YOU                       10:35 AM  ││
│  └──────────────────────────────────┘  │  │ Sounds good! Can we do 10% deposit? ││
│                                        │  └─────────────────────────────────────┘│
│  ┌──────────────────────────────────┐  │                                         │
│  │ [IMG] Honda Accord               │  │                                         │
│  │       2022 • QTY: 1              │  │                                         │
│  │                    SYSTEM PRICE  │  │                                         │
│  │                        $12,000   │  │                                         │
│  │                                  │  │                                         │
│  │  OFFER PER UNIT         SAVINGS  │  │                                         │
│  │  $ [11500    ]           -$500   │  │                                         │
│  └──────────────────────────────────┘  │                                         │
│                                        │                                         │
│  INCOTERM SELECTION    DEPOSIT %       │                                         │
│  [FOB] [CIF]          [10%][20%][30%]  │                                         │
│                                        │                                         │
│  ┌──────────────────────────────────┐  │                                         │
│  │ SYSTEM TOTAL VALUE    $27,000    │  │                                         │
│  │ NEGOTIATED DEAL       $26,000    │  │                                         │
│  │                                  │  │                                         │
│  │ TOKEN DUE NOW         $2,600     │  │                                         │
│  │ FINAL BALANCE         $23,400    │  │                                         │
│  └──────────────────────────────────┘  │                                         │
│                                        ├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │  ┌─────────────────────────────────────┐│
│  │      Finalize Terms as Buyer     │  │  │ Type your message...          [▶]  ││
│  └──────────────────────────────────┘  │  └─────────────────────────────────────┘│
└────────────────────────────────────────┴─────────────────────────────────────────┘
```

### Action Button States

| Status | Buyer View | Seller View |
|--------|------------|-------------|
| DRAFT | "Finalize Terms as Buyer" (enabled) | "Waiting for Buyer" (disabled) |
| BUYER_FINALIZED | "Terms Locked" ✓ (disabled, green) | "Approve Terms as Seller" (enabled) |
| SELLER_APPROVED | "Proceed to Checkout" (enabled) | "Terms Approved" ✓ (disabled, green) |

### Cart Page Changes

Replace the global "Submit Quote Request" button with per-seller "Negotiate" buttons:

```
┌─ Seller: ABC Auto Trading ─────────────────────────────────────┐
│                                                                │
│  [Vehicle 1]  [Vehicle 2]  ...                                │
│                                                                │
│  Seller Total: $37,700                                        │
│                                                                │
│  [Negotiate →]                                                │
└────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Database Schema

```prisma
model Negotiation {
  id             String            @id @default(cuid())
  buyerId        String
  sellerId       String
  status         NegotiationStatus @default(DRAFT)
  incoterm       String            @default("FOB")
  depositPercent Int               @default(10)
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  buyer    User                 @relation("BuyerNegotiations", fields: [buyerId], references: [id])
  seller   Seller               @relation(fields: [sellerId], references: [id])
  items    NegotiationItem[]
  messages NegotiationMessage[]

  @@index([buyerId])
  @@index([sellerId])
  @@index([status])
}

model NegotiationItem {
  id            String  @id @default(cuid())
  negotiationId String
  vehicleId     String
  systemPrice   Decimal @db.Decimal(12, 2)
  offerPrice    Decimal @db.Decimal(12, 2)

  negotiation Negotiation @relation(fields: [negotiationId], references: [id], onDelete: Cascade)
  vehicle     Vehicle     @relation(fields: [vehicleId], references: [id])

  @@index([negotiationId])
}

model NegotiationMessage {
  id            String   @id @default(cuid())
  negotiationId String
  senderId      String
  senderRole    String   // "BUYER" or "SELLER"
  content       String
  createdAt     DateTime @default(now())

  negotiation Negotiation @relation(fields: [negotiationId], references: [id], onDelete: Cascade)

  @@index([negotiationId])
}

enum NegotiationStatus {
  DRAFT
  BUYER_FINALIZED
  SELLER_APPROVED
  CANCELLED
}
```

### API Endpoints

#### POST /api/negotiations
Create a new negotiation from cart items for a specific seller.

**Request:**
```json
{
  "sellerId": "seller_123",
  "items": [
    { "vehicleId": "vehicle_1", "offerPrice": 14500 },
    { "vehicleId": "vehicle_2", "offerPrice": 11500 }
  ],
  "incoterm": "FOB",
  "depositPercent": 10
}
```

**Response:**
```json
{
  "id": "neg_123",
  "status": "DRAFT",
  "items": [...],
  "messages": []
}
```

#### GET /api/negotiations
List negotiations for the authenticated user (as buyer or seller).

**Query params:** `role=buyer|seller`, `status=DRAFT|BUYER_FINALIZED|SELLER_APPROVED`

#### GET /api/negotiations/[id]
Get full negotiation details including items, messages, and computed totals.

#### PATCH /api/negotiations/[id]
Update negotiation terms (only allowed in DRAFT status).

**Request:**
```json
{
  "items": [
    { "vehicleId": "vehicle_1", "offerPrice": 14000 }
  ],
  "incoterm": "CIF",
  "depositPercent": 20
}
```

#### POST /api/negotiations/[id]/finalize
Buyer finalizes terms (changes status to BUYER_FINALIZED).

#### POST /api/negotiations/[id]/approve
Seller approves terms (changes status to SELLER_APPROVED).

#### POST /api/negotiations/[id]/messages
Send a chat message.

**Request:**
```json
{
  "content": "Can we discuss the delivery timeline?"
}
```

### Workflow States

```
DRAFT
  │
  │ [Buyer can: edit offers, change terms, send messages]
  │ [Seller can: send messages, view current offer]
  │
  ▼
BUYER_FINALIZED
  │
  │ [Buyer can: view, send messages]
  │ [Seller can: approve, send messages]
  │
  ▼
SELLER_APPROVED
  │
  │ [Both can: view, proceed to checkout]
  │
  ▼
(Checkout Flow - separate feature)
```

### Key Calculations

```typescript
// System Total = sum of all vehicle system prices
const systemTotal = items.reduce((sum, item) => sum + item.systemPrice, 0);

// Negotiated Deal = sum of all offer prices
const negotiatedDeal = items.reduce((sum, item) => sum + item.offerPrice, 0);

// Savings = System Total - Negotiated Deal
const savings = systemTotal - negotiatedDeal;

// Token Due Now = Negotiated Deal * (depositPercent / 100)
const tokenDueNow = negotiatedDeal * (depositPercent / 100);

// Final Balance = Negotiated Deal - Token Due Now
const finalBalance = negotiatedDeal - tokenDueNow;
```

## Files to Create

```
src/
├── app/
│   ├── api/
│   │   └── negotiations/
│   │       ├── route.ts                    # POST create, GET list
│   │       └── [id]/
│   │           ├── route.ts                # GET details, PATCH update
│   │           ├── finalize/route.ts       # POST finalize
│   │           ├── approve/route.ts        # POST approve
│   │           └── messages/route.ts       # POST send message
│   ├── buyer/
│   │   └── cart/page.tsx                   # Update with Negotiate buttons
│   └── seller/
│       └── negotiations/
│           └── page.tsx                    # Seller negotiations list
└── components/
    └── buyer/
        ├── negotiation-modal.tsx           # Main modal container
        ├── negotiation-terms.tsx           # Left panel (pricing/terms)
        └── negotiation-chat.tsx            # Right panel (messages)
```

## Edge Cases

1. **Vehicle sold during negotiation**: Check vehicle status before approval
2. **Price changed by seller**: Compare with current vehicle price on approval
3. **Multiple active negotiations**: Allow only one active negotiation per buyer-seller pair
4. **Cancelled negotiation**: Add cancel functionality with CANCELLED status
5. **Empty offer price**: Default to system price if no offer provided

## Success Criteria

- [ ] Buyer can start negotiation from cart for a seller
- [ ] Buyer can modify offer prices per vehicle
- [ ] Buyer can select incoterm (FOB/CIF) and deposit % (10/20/30)
- [ ] Buyer and seller can exchange messages
- [ ] Buyer can finalize terms
- [ ] Seller can view and approve finalized terms
- [ ] Approved negotiations are ready for checkout
- [ ] Seller can see list of incoming negotiations
