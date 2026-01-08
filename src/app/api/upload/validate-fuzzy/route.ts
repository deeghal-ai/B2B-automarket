import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { MasterDataLoader, FuzzyMatcher, VehicleMMVValidation } from '@/lib/fuzzy-matcher';

// Cache master data in memory
let cachedMasterData: MasterDataLoader | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getMasterData(): Promise<MasterDataLoader> {
  const now = Date.now();
  
  if (cachedMasterData && now - lastCacheTime < CACHE_TTL) {
    return cachedMasterData;
  }
  
  const entries = await prisma.masterVehicleData.findMany({
    select: { make: true, model: true, variant: true },
  });
  
  cachedMasterData = new MasterDataLoader();
  cachedMasterData.load(entries);
  lastCacheTime = now;
  
  return cachedMasterData;
}

interface ValidateFuzzyRequest {
  vehicles: Array<{
    rowIndex: number;
    make: string;
    model: string;
    variant: string;
  }>;
}

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ValidateFuzzyRequest = await request.json();
    const { vehicles } = body;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ error: 'No vehicles to validate' }, { status: 400 });
    }

    // Load master data and create matcher
    const masterData = await getMasterData();
    const matcher = new FuzzyMatcher(masterData, {
      autoCorrectThreshold: 90,
      reviewThreshold: 70,
    });

    // Validate all vehicles
    const results = matcher.validateBatch(vehicles);

    // Categorize results
    const valid = results.filter(r => r.isValid);
    const needsReview = results.filter(r => r.needsReview);
    const invalid = results.filter(r => !r.isValid && !r.needsReview);

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        valid: valid.length,
        needsReview: needsReview.length,
        invalid: invalid.length,
      },
      results,
    });
  } catch (error) {
    console.error('Fuzzy validation error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}