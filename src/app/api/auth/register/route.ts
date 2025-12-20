import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, role, companyName, country, city } = body;

    // Validate required fields
    if (!userId || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['BUYER', 'SELLER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Seller-specific validation
    if (role === 'SELLER' && (!companyName || !country || !city)) {
      return NextResponse.json(
        { error: 'Seller requires company name, country, and city' },
        { status: 400 }
      );
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        role,
        ...(role === 'SELLER' && {
          seller: {
            create: {
              companyName,
              country,
              city,
            },
          },
        }),
      },
      include: {
        seller: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
