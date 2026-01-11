import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/negotiations/[id]/messages - Get messages for a negotiation
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this negotiation
    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
    });

    if (!negotiation) {
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
    }

    // Check if user is buyer or seller
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { seller: true },
    });

    const isBuyer = negotiation.buyerId === user.id;
    const isSeller = dbUser?.seller?.id === negotiation.sellerId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.negotiationMessage.findMany({
      where: { negotiationId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/negotiations/[id]/messages - Send a message
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify user has access to this negotiation
    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
    });

    if (!negotiation) {
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
    }

    // Check if user is buyer or seller and determine role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { seller: true },
    });

    const isBuyer = negotiation.buyerId === user.id;
    const isSeller = dbUser?.seller?.id === negotiation.sellerId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const senderRole = isBuyer ? 'BUYER' : 'SELLER';

    // Create the message
    const message = await prisma.negotiationMessage.create({
      data: {
        negotiationId: id,
        senderId: user.id,
        senderRole,
        content: content.trim(),
      },
    });

    // Update negotiation updatedAt
    await prisma.negotiation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
