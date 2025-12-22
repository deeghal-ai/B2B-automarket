'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle, Loader2, RefreshCw, HelpCircle } from 'lucide-react';
import type { InspectionReportData, InspectionApiResponse } from '@/types/inspection';
import { getGradeColors } from '@/types/inspection';

interface Props {
  vehicleId: string;
  inspectionReportLink: string | null;
}

interface ConclusionItemProps {
  isPositive: boolean | null;
  positiveText: string;
  negativeText: string;
}

function ConclusionItem({ isPositive, positiveText, negativeText }: ConclusionItemProps) {
  if (isPositive === null) return null;
  
  return (
    <div className="flex items-center gap-2">
      <CheckCircle className={`h-5 w-5 ${isPositive ? 'text-red-500' : 'text-emerald-500'}`} />
      <span className={`text-sm ${isPositive ? 'text-red-600' : 'text-emerald-600'}`}>
        {isPositive ? negativeText : positiveText}
      </span>
    </div>
  );
}

export function InspectionReportCard({ vehicleId, inspectionReportLink }: Props) {
  const [report, setReport] = useState<InspectionReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  const fetchReport = async (forceRefresh = false) => {
    if (!inspectionReportLink) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const method = forceRefresh ? 'POST' : 'GET';
      const response = await fetch(`/api/inspection/${vehicleId}`, { method });
      const result: InspectionApiResponse = await response.json();
      
      if (result.success && result.data) {
        setReport(result.data);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load inspection report');
      console.error('Inspection fetch error:', err);
    } finally {
      setLoading(false);
      setHasAttempted(true);
    }
  };

  useEffect(() => {
    if (inspectionReportLink && !hasAttempted) {
      fetchReport();
    }
  }, [vehicleId, inspectionReportLink, hasAttempted]);

  // Don't render if no inspection link
  if (!inspectionReportLink) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Card className="mt-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-emerald-700 font-medium">Analyzing inspection report...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !report) {
    return (
      <Card className="mt-6 border-orange-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Inspection Report</h3>
            <Button variant="outline" size="sm" onClick={() => fetchReport(true)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <a
            href={inspectionReportLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            View Original Report <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    );
  }

  // No report data
  if (!report) {
    return null;
  }

  const gradeColors = getGradeColors(report.overallGrade);

  return (
    <Card className="mt-6 bg-gradient-to-br from-emerald-50/50 to-white border-emerald-100 overflow-hidden">
      <CardContent className="py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Inspection Report</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchReport(true)}
            disabled={loading}
            className="text-muted-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Grade and Conclusions */}
        <div className="flex items-start gap-8 mb-6">
          {/* Overall Grade */}
          <div className="flex items-center gap-2">
            <span className={`text-6xl font-bold ${gradeColors.text}`}>
              {report.overallGrade.charAt(0).toUpperCase()}
            </span>
            <button className="text-gray-400 hover:text-gray-600">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Conclusions Row */}
          <div className="flex flex-wrap gap-6 pt-2">
            <ConclusionItem
              isPositive={report.isAccidentCar}
              positiveText="No Accident Damage"
              negativeText="Accident Damage"
            />
            <ConclusionItem
              isPositive={report.isFloodCar}
              positiveText="No Water Damage"
              negativeText="Water Damage"
            />
            <ConclusionItem
              isPositive={report.isFireCar}
              positiveText="No Fire Damage"
              negativeText="Fire Damage"
            />
          </div>
        </div>

        {/* Scores Grid */}
        {(report.accidentScore || report.floodScore || report.fireScore || report.deepScore) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg border">
            {report.accidentScore && (
              <ScoreItem label="Accident Check" score={report.accidentScore} />
            )}
            {report.floodScore && (
              <ScoreItem label="Flood Check" score={report.floodScore} />
            )}
            {report.fireScore && (
              <ScoreItem label="Fire Check" score={report.fireScore} />
            )}
            {report.deepScore && (
              <ScoreItem label="Deep Inspection" score={report.deepScore} />
            )}
          </div>
        )}

        {/* Inspection Date */}
        {report.inspectionDate && (
          <p className="text-sm text-muted-foreground mb-4">
            Inspected: {report.inspectionDate}
          </p>
        )}

        {/* View Full Report Button */}
        <a
          href={inspectionReportLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <Button variant="outline" className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50">
            View Full Report
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}

interface ScoreItemProps {
  label: string;
  score: string;
}

function ScoreItem({ label, score }: ScoreItemProps) {
  // Parse score like "9/70"
  const parts = score.split('/');
  const issues = parseInt(parts[0]) || 0;
  const total = parseInt(parts[1]) || 0;
  const passed = total - issues;
  
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <CheckCircle className="h-4 w-4 text-emerald-500" />
        <span className="font-semibold text-gray-900">{passed}</span>
        {issues > 0 && (
          <>
            <span className="text-orange-500 font-semibold ml-1">⚠ {issues}</span>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
