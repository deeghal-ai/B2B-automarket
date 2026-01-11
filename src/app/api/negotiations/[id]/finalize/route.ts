import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/negotiations/[id]/finalize - Buyer finalizes terms
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current negotiation
    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
    });

    if (!negotiation) {
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
    }

    // Only buyer can finalize
    if (negotiation.buyerId !== user.id) {
      return NextResponse.json({ error: 'Only buyer can finalize terms' }, { status: 403 });
    }

    // Can only finalize from DRAFT status
    if (negotiation.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only finalize from draft status' },
        { status: 400 }
      );
    }

    // Update status to BUYER_FINALIZED
    const updated = await prisma.negotiation.update({
      where: { id },
      data: { status: 'BUYER_FINALIZED' },
      include: {
        seller: true,
        items: {
          include: {
            vehicle: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Calculate totals
    const systemTotal = updated.items.reduce(
      (sum, item) => sum + Number(item.systemPrice),
      0
    );
    const negotiatedTotal = updated.items.reduce(
      (sum, item) => sum + Number(item.offerPrice),
      0
    );

    return NextResponse.json({
      ...updated,
      systemTotal,
      negotiatedTotal,
      savings: systemTotal - negotiatedTotal,
      tokenDueNow: negotiatedTotal * (updated.depositPercent / 100),
      finalBalance: negotiatedTotal * (1 - updated.depositPercent / 100),
      userRole: 'BUYER',
    });
  } catch (error) {
    console.error('Error finalizing negotiation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
