// TypeScript types for Inspection Report feature

export interface InspectionReportData {
  id: string;
  vehicleId: string;
  sourceUrl: string;

  // Extracted data
  overallGrade: string; // E, D, C, B, A
  inspectionDate: string | null;

  // Category scores (X/Y format)
  accidentScore: string | null; // e.g., "9/70"
  floodScore: string | null; // e.g., "7/27"
  fireScore: string | null; // e.g., "0/23"
  deepScore: string | null; // e.g., "13/42"

  // Conclusions
  isAccidentCar: boolean | null;
  isFloodCar: boolean | null;
  isFireCar: boolean | null;

  scrapedAt: Date;
}

// Response from OpenAI Vision API extraction
export interface ExtractedInspectionData {
  overallGrade: string;
  inspectionDate?: string;
  accidentScore?: string;
  floodScore?: string;
  fireScore?: string;
  deepScore?: string;
  isAccidentCar?: boolean;
  isFloodCar?: boolean;
  isFireCar?: boolean;
}

// API response types
export interface InspectionApiResponse {
  success: boolean;
  data: InspectionReportData | null;
  error?: string;
  isScraping?: boolean;
}

// Parsed score for UI display
export interface ParsedScore {
  current: number;
  total: number;
  percentage: number;
}

// Helper function to parse score string like "9/70" into components
export function parseScore(score: string | null): ParsedScore | null {
  if (!score) return null;
  const match = score.match(/^(\d+)\/(\d+)$/);
  if (!match) return null;
  const current = parseInt(match[1], 10);
  const total = parseInt(match[2], 10);
  return {
    current,
    total,
    percentage: total > 0 ? (current / total) * 100 : 0,
  };
}

// Grade color mapping
export const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
  B: { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-500' },
  C: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  D: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
  E: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
};

// Get grade color classes
export function getGradeColors(grade: string): { bg: string; text: string; border: string } {
  const normalizedGrade = grade.toUpperCase().charAt(0);
  return gradeColors[normalizedGrade] || gradeColors.E;
}

