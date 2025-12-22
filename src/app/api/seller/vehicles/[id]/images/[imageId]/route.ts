import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string; imageId: string }>;
}

// Helper to extract file path from Supabase URL
function extractFilePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/vehicle-images\/(.+)/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

// PATCH - Set image as primary
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: vehicleId, imageId } = await params;

    // Auth check
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get seller
    const seller = await prisma.seller.findUnique({
      where: { userId: authUser.id },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Verify vehicle belongs to seller
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    if (vehicle.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify image belongs to vehicle
    const image = await prisma.vehicleImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.vehicleId !== vehicleId) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Update: set all images to non-primary, then set this one as primary
    await prisma.$transaction([
      prisma.vehicleImage.updateMany({
        where: { vehicleId },
        data: { isPrimary: false },
      }),
      prisma.vehicleImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    // Return updated image
    const updatedImage = await prisma.vehicleImage.findUnique({
      where: { id: imageId },
    });

    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE - Delete image
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: vehicleId, imageId } = await params;

    // Auth check
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get seller
    const seller = await prisma.seller.findUnique({
      where: { userId: authUser.id },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Verify vehicle belongs to seller
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    if (vehicle.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get image
    const image = await prisma.vehicleImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.vehicleId !== vehicleId) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const wasPrimary = image.isPrimary;

    // Delete from Supabase Storage
    const filePath = extractFilePath(image.url);
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from('vehicle-images')
        .remove([filePath]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
        // Continue anyway to delete the database record
      }
    }

    // Delete VehicleImage record
    await prisma.vehicleImage.delete({
      where: { id: imageId },
    });

    // If deleted image was primary, set another as primary
    if (wasPrimary) {
      const remainingImages = await prisma.vehicleImage.findMany({
        where: { vehicleId },
        orderBy: { order: 'asc' },
        take: 1,
      });

      if (remainingImages.length > 0) {
        await prisma.vehicleImage.update({
          where: { id: remainingImages[0].id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

