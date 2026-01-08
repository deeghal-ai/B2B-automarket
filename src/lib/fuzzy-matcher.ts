/**
 * Fuzzy Matching Implementation for Auto Marketplace
 * ===================================================
 * 
 * This file contains the TypeScript implementation that can be added to
 * your Next.js project for fuzzy matching Make/Model/Variant against master data.
 * 
 * Install: npm install fastest-levenshtein string-similarity
 * 
 * File location: src/lib/fuzzy-matcher.ts
 */

// ============================================================================
// TYPES
// ============================================================================

export type MatchStatus = 'exact' | 'auto_corrected' | 'needs_review' | 'no_match';

export interface FuzzyMatchResult {
  originalValue: string;
  matchedValue: string | null;
  confidence: number; // 0-100
  status: MatchStatus;
  suggestions: string[];
}

export interface VehicleMMVValidation {
  makeResult: FuzzyMatchResult;
  modelResult: FuzzyMatchResult;
  variantResult: FuzzyMatchResult;
  isValid: boolean;
  needsReview: boolean;
  correctedMake: string | null;
  correctedModel: string | null;
  correctedVariant: string | null;
}

export interface MasterDataEntry {
  make: string;
  model: string;
  variant: string;
}

export interface FuzzyMatchConfig {
  autoCorrectThreshold: number;  // Default: 90
  reviewThreshold: number;       // Default: 70
  maxSuggestions: number;        // Default: 3
}

// ============================================================================
// FUZZY MATCHING UTILITIES (Pure JavaScript - no external deps needed)
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate similarity ratio (0-100) between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  return Math.round((1 - distance / maxLen) * 100);
}

/**
 * Find best matches from a list of options
 */
function findBestMatches(
  value: string,
  options: string[],
  limit: number = 5
): Array<{ value: string; score: number }> {
  if (!value || options.length === 0) return [];
  
  const scored = options.map(option => ({
    value: option,
    score: calculateSimilarity(value, option)
  }));
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ============================================================================
// MASTER DATA LOADER
// ============================================================================

export class MasterDataLoader {
  private data: MasterDataEntry[] = [];
  private makeSet: Set<string> = new Set();
  private modelsByMake: Map<string, Set<string>> = new Map();
  private variantsByMakeModel: Map<string, Set<string>> = new Map();
  
  /**
   * Load master data from array (e.g., from database or parsed Excel)
   */
  load(entries: MasterDataEntry[]): void {
    this.data = entries;
    this.buildIndexes();
  }
  
  private buildIndexes(): void {
    this.makeSet.clear();
    this.modelsByMake.clear();
    this.variantsByMakeModel.clear();
    
    for (const entry of this.data) {
      // Index makes
      this.makeSet.add(entry.make);
      
      // Index models by make
      if (!this.modelsByMake.has(entry.make)) {
        this.modelsByMake.set(entry.make, new Set());
      }
      this.modelsByMake.get(entry.make)!.add(entry.model);
      
      // Index variants by make+model
      const key = `${entry.make}|${entry.model}`;
      if (!this.variantsByMakeModel.has(key)) {
        this.variantsByMakeModel.set(key, new Set());
      }
      this.variantsByMakeModel.get(key)!.add(entry.variant);
    }
  }
  
  getMakes(): string[] {
    return Array.from(this.makeSet);
  }
  
  getModels(make: string): string[] {
    return Array.from(this.modelsByMake.get(make) || []);
  }
  
  getVariants(make: string, model: string): string[] {
    const key = `${make}|${model}`;
    return Array.from(this.variantsByMakeModel.get(key) || []);
  }
  
  getAllModels(): string[] {
    const allModels = new Set<string>();
    for (const models of this.modelsByMake.values()) {
      models.forEach(m => allModels.add(m));
    }
    return Array.from(allModels);
  }
  
  getAllVariants(): string[] {
    const allVariants = new Set<string>();
    for (const variants of this.variantsByMakeModel.values()) {
      variants.forEach(v => allVariants.add(v));
    }
    return Array.from(allVariants);
  }
}

// ============================================================================
// FUZZY MATCHER CLASS
// ============================================================================

export class FuzzyMatcher {
  private masterData: MasterDataLoader;
  private config: FuzzyMatchConfig;
  
  constructor(
    masterData: MasterDataLoader,
    config: Partial<FuzzyMatchConfig> = {}
  ) {
    this.masterData = masterData;
    this.config = {
      autoCorrectThreshold: config.autoCorrectThreshold ?? 90,
      reviewThreshold: config.reviewThreshold ?? 70,
      maxSuggestions: config.maxSuggestions ?? 3,
    };
  }
  
  /**
   * Perform fuzzy matching against a list of valid options
   */
  private fuzzyMatch(value: string, validOptions: string[]): FuzzyMatchResult {
    if (!value || validOptions.length === 0) {
      return {
        originalValue: value || '',
        matchedValue: null,
        confidence: 0,
        status: 'no_match',
        suggestions: [],
      };
    }
    
    const normalized = value.trim();
    
    // Check for exact match (case-insensitive)
    const exactMatch = validOptions.find(
      opt => opt.toLowerCase() === normalized.toLowerCase()
    );
    
    if (exactMatch) {
      return {
        originalValue: value,
        matchedValue: exactMatch,
        confidence: 100,
        status: 'exact',
        suggestions: [],
      };
    }
    
    // Perform fuzzy matching
    const matches = findBestMatches(normalized, validOptions, 5);
    
    if (matches.length === 0) {
      return {
        originalValue: value,
        matchedValue: null,
        confidence: 0,
        status: 'no_match',
        suggestions: [],
      };
    }
    
    const bestMatch = matches[0];
    const suggestions = matches
      .slice(0, this.config.maxSuggestions)
      .map(m => m.value);
    
    let status: MatchStatus;
    if (bestMatch.score >= this.config.autoCorrectThreshold) {
      status = 'auto_corrected';
    } else if (bestMatch.score >= this.config.reviewThreshold) {
      status = 'needs_review';
    } else {
      status = 'no_match';
    }
    
    return {
      originalValue: value,
      matchedValue: status !== 'no_match' ? bestMatch.value : null,
      confidence: bestMatch.score,
      status,
      suggestions,
    };
  }
  
  /**
   * Validate Make/Model/Variant with cascading fuzzy matching
   */
  validateMMV(make: string, model: string, variant: string): VehicleMMVValidation {
    // Step 1: Validate Make
    const makeResult = this.fuzzyMatch(make, this.masterData.getMakes());
    const resolvedMake = makeResult.matchedValue;
    
    // Step 2: Validate Model (depends on resolved make)
    let modelResult: FuzzyMatchResult;
    if (resolvedMake) {
      const validModels = this.masterData.getModels(resolvedMake);
      modelResult = this.fuzzyMatch(model, validModels);
    } else {
      // No valid make - match against all models for suggestions only
      modelResult = this.fuzzyMatch(model, this.masterData.getAllModels());
      modelResult.status = 'no_match';
      modelResult.matchedValue = null;
    }
    const resolvedModel = modelResult.matchedValue;
    
    // Step 3: Validate Variant (depends on resolved make + model)
    let variantResult: FuzzyMatchResult;
    if (resolvedMake && resolvedModel) {
      const validVariants = this.masterData.getVariants(resolvedMake, resolvedModel);
      variantResult = this.fuzzyMatch(variant, validVariants);
    } else {
      // No valid make+model - match against all variants for suggestions only
      variantResult = this.fuzzyMatch(variant, this.masterData.getAllVariants());
      variantResult.status = 'no_match';
      variantResult.matchedValue = null;
    }
    
    // Determine overall status
    const allResults = [makeResult, modelResult, variantResult];
    const allExactOrCorrected = allResults.every(
      r => r.status === 'exact' || r.status === 'auto_corrected'
    );
    const anyNeedsReview = allResults.some(r => r.status === 'needs_review');
    const anyNoMatch = allResults.some(r => r.status === 'no_match');
    
    return {
      makeResult,
      modelResult,
      variantResult,
      isValid: allExactOrCorrected,
      needsReview: anyNeedsReview && !anyNoMatch,
      correctedMake: makeResult.matchedValue,
      correctedModel: modelResult.matchedValue,
      correctedVariant: variantResult.matchedValue,
    };
  }
  
  /**
   * Batch validate multiple vehicles
   */
  validateBatch(
    vehicles: Array<{ make: string; model: string; variant: string; rowIndex: number }>
  ): Array<VehicleMMVValidation & { rowIndex: number }> {
    return vehicles.map(v => ({
      rowIndex: v.rowIndex,
      ...this.validateMMV(v.make, v.model, v.variant),
    }));
  }
}

// ============================================================================
// EXAMPLE USAGE IN API ROUTE
// ============================================================================

/*
// src/app/api/upload/validate-mmv/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MasterDataLoader, FuzzyMatcher } from '@/lib/fuzzy-matcher';

// Cache master data in memory (refresh periodically)
let cachedMasterData: MasterDataLoader | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getMasterData(): Promise<MasterDataLoader> {
  const now = Date.now();
  
  if (cachedMasterData && now - lastCacheTime < CACHE_TTL) {
    return cachedMasterData;
  }
  
  // Fetch from database
  const entries = await prisma.masterVehicleData.findMany({
    select: { make: true, model: true, variant: true },
  });
  
  cachedMasterData = new MasterDataLoader();
  cachedMasterData.load(entries);
  lastCacheTime = now;
  
  return cachedMasterData;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicles } = body; // Array of { make, model, variant, rowIndex }
    
    const masterData = await getMasterData();
    const matcher = new FuzzyMatcher(masterData, {
      autoCorrectThreshold: 90,
      reviewThreshold: 70,
    });
    
    const results = matcher.validateBatch(vehicles);
    
    // Separate into categories
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
    console.error('MMV Validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}
*/

// ============================================================================
// PRISMA SCHEMA ADDITION
// ============================================================================

/*
Add to your prisma/schema.prisma:

model MasterVehicleData {
  id        String   @id @default(cuid())
  make      String
  model     String
  variant   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([make, model, variant])
  @@index([make])
  @@index([make, model])
}
*/

export default FuzzyMatcher;
