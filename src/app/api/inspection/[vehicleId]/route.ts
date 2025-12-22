import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeInspectionReport, InspectionFetchError } from '@/lib/inspection-scraper';
import type { InspectionApiResponse } from '@/types/inspection';

interface RouteParams {
  params: Promise<{ vehicleId: string }>;
}

/**
 * GET /api/inspection/[vehicleId]
 * Fetch cached inspection report or scrape from source
 */
export async function GET(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<InspectionApiResponse>> {
  try {
    const { vehicleId } = await params;

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, data: null, error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    // Check for cached inspection report
    const cached = await prisma.inspectionReport.findUnique({
      where: { vehicleId },
    });

    if (cached) {
      return NextResponse.json({
        success: true,
        data: {
          id: cached.id,
          vehicleId: cached.vehicleId,
          sourceUrl: cached.sourceUrl,
          overallGrade: cached.overallGrade,
          inspectionDate: cached.inspectionDate,
          accidentScore: cached.accidentScore,
          floodScore: cached.floodScore,
          fireScore: cached.fireScore,
          deepScore: cached.deepScore,
          isAccidentCar: cached.isAccidentCar,
          isFloodCar: cached.isFloodCar,
          isFireCar: cached.isFireCar,
          scrapedAt: cached.scrapedAt,
        },
      });
    }

    // No cached data - check if vehicle has inspection report link
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { inspectionReportLink: true },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, data: null, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    if (!vehicle.inspectionReportLink) {
      // No inspection report link available
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Scrape the inspection report
    try {
      const { data: extractedData, rawResponse } = await scrapeInspectionReport(
        vehicle.inspectionReportLink
      );

      // Validate required fields
      if (!extractedData.overallGrade) {
        console.error('OpenAI extraction failed - no overallGrade found:', extractedData);
        return NextResponse.json({
          success: false,
          data: null,
          error: 'Failed to extract inspection data. The report format may have changed. Please try again.',
        });
      }

      // Save to database
      const saved = await prisma.inspectionReport.create({
        data: {
          vehicle: { connect: { id: vehicleId } },
          sourceUrl: vehicle.inspectionReportLink,
          overallGrade: extractedData.overallGrade,
          inspectionDate: extractedData.inspectionDate || null,
          accidentScore: extractedData.accidentScore || null,
          floodScore: extractedData.floodScore || null,
          fireScore: extractedData.fireScore || null,
          deepScore: extractedData.deepScore || null,
          isAccidentCar: extractedData.isAccidentCar ?? null,
          isFloodCar: extractedData.isFloodCar ?? null,
          isFireCar: extractedData.isFireCar ?? null,
          rawResponse: JSON.parse(rawResponse),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: saved.id,
          vehicleId: saved.vehicleId,
          sourceUrl: saved.sourceUrl,
          overallGrade: saved.overallGrade,
          inspectionDate: saved.inspectionDate,
          accidentScore: saved.accidentScore,
          floodScore: saved.floodScore,
          fireScore: saved.fireScore,
          deepScore: saved.deepScore,
          isAccidentCar: saved.isAccidentCar,
          isFloodCar: saved.isFloodCar,
          isFireCar: saved.isFireCar,
          scrapedAt: saved.scrapedAt,
        },
      });
    } catch (scrapeError) {
      console.error('Failed to scrape inspection report:', scrapeError);
      
      // Provide more helpful error messages based on error type
      let errorMessage = 'Failed to fetch inspection report. Please try again later.';
      
      if (scrapeError instanceof InspectionFetchError) {
        if (scrapeError.isTimeout) {
          errorMessage = 'The inspection report server is not responding. This may be due to network restrictions accessing Chinese servers.';
        } else if (scrapeError.isNetworkError) {
          errorMessage = 'Unable to reach the inspection report server. The service may be temporarily unavailable or blocked in your region.';
        }
      }
      
      return NextResponse.json({
        success: false,
        data: null,
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('Inspection API error:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inspection/[vehicleId]
 * Force re-scrape of inspection report (invalidate cache)
 */
export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<InspectionApiResponse>> {
  try {
    const { vehicleId } = await params;

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, data: null, error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    // Get vehicle with inspection report link
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { inspectionReportLink: true },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, data: null, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    if (!vehicle.inspectionReportLink) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Vehicle has no inspection report link',
      });
    }

    // Delete existing cached report if any
    await prisma.inspectionReport.deleteMany({
      where: { vehicleId },
    });

    // Scrape fresh data
    try {
      const { data: extractedData, rawResponse } = await scrapeInspectionReport(
        vehicle.inspectionReportLink
      );

      // Validate required fields
      if (!extractedData.overallGrade) {
        console.error('OpenAI extraction failed - no overallGrade found:', extractedData);
        return NextResponse.json({
          success: false,
          data: null,
          error: 'Failed to extract inspection data. The report format may have changed. Please try again.',
        });
      }

      // Save to database
      const saved = await prisma.inspectionReport.create({
        data: {
          vehicle: { connect: { id: vehicleId } },
          sourceUrl: vehicle.inspectionReportLink,
          overallGrade: extractedData.overallGrade,
          inspectionDate: extractedData.inspectionDate || null,
          accidentScore: extractedData.accidentScore || null,
          floodScore: extractedData.floodScore || null,
          fireScore: extractedData.fireScore || null,
          deepScore: extractedData.deepScore || null,
          isAccidentCar: extractedData.isAccidentCar ?? null,
          isFloodCar: extractedData.isFloodCar ?? null,
          isFireCar: extractedData.isFireCar ?? null,
          rawResponse: JSON.parse(rawResponse),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: saved.id,
          vehicleId: saved.vehicleId,
          sourceUrl: saved.sourceUrl,
          overallGrade: saved.overallGrade,
          inspectionDate: saved.inspectionDate,
          accidentScore: saved.accidentScore,
          floodScore: saved.floodScore,
          fireScore: saved.fireScore,
          deepScore: saved.deepScore,
          isAccidentCar: saved.isAccidentCar,
          isFloodCar: saved.isFloodCar,
          isFireCar: saved.isFireCar,
          scrapedAt: saved.scrapedAt,
        },
      });
    } catch (scrapeError) {
      console.error('Failed to scrape inspection report:', scrapeError);
      
      // Provide more helpful error messages based on error type
      let errorMessage = 'Failed to fetch inspection report. Please try again later.';
      
      if (scrapeError instanceof InspectionFetchError) {
        if (scrapeError.isTimeout) {
          errorMessage = 'The inspection report server is not responding. This may be due to network restrictions accessing Chinese servers.';
        } else if (scrapeError.isNetworkError) {
          errorMessage = 'Unable to reach the inspection report server. The service may be temporarily unavailable or blocked in your region.';
        }
      }
      
      return NextResponse.json({
        success: false,
        data: null,
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('Inspection API error:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

