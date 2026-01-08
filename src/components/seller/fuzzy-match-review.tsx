/**
 * Fuzzy Match Review Component
 * ============================
 * 
 * This component allows sellers to review and accept/reject fuzzy match suggestions
 * before importing their vehicle data.
 * 
 * File location: src/components/seller/fuzzy-match-review.tsx
 */

'use client';

import { useState } from 'react';
import { Check, X, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Types
interface FuzzyMatchResult {
  originalValue: string;
  matchedValue: string | null;
  confidence: number;
  status: 'exact' | 'auto_corrected' | 'needs_review' | 'no_match';
  suggestions: string[];
}

interface VehicleMMVValidation {
  rowIndex: number;
  makeResult: FuzzyMatchResult;
  modelResult: FuzzyMatchResult;
  variantResult: FuzzyMatchResult;
  isValid: boolean;
  needsReview: boolean;
  correctedMake: string | null;
  correctedModel: string | null;
  correctedVariant: string | null;
}

interface FuzzyMatchReviewProps {
  validationResults: VehicleMMVValidation[];
  onAcceptAll: (accepted: VehicleMMVValidation[]) => void;
  onBack: () => void;
}

// Status Badge Component
function StatusBadge({ status }: { status: FuzzyMatchResult['status'] }) {
  const variants = {
    exact: { label: 'Exact Match', className: 'bg-green-100 text-green-800' },
    auto_corrected: { label: 'Auto-Corrected', className: 'bg-blue-100 text-blue-800' },
    needs_review: { label: 'Needs Review', className: 'bg-yellow-100 text-yellow-800' },
    no_match: { label: 'No Match', className: 'bg-red-100 text-red-800' },
  };
  
  const { label, className } = variants[status];
  
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', className)}>
      {label}
    </Badge>
  );
}

// Field Match Row Component
function FieldMatchRow({
  fieldName,
  result,
  onSelectSuggestion,
}: {
  fieldName: string;
  result: FuzzyMatchResult;
  onSelectSuggestion: (value: string) => void;
}) {
  const showSuggestions = result.status === 'needs_review' || result.status === 'no_match';
  
  return (
    <div className="grid grid-cols-4 gap-4 items-center py-2 border-b border-gray-100 last:border-0">
      <div className="font-medium text-sm text-gray-700">{fieldName}</div>
      <div className="text-sm">
        <span className="text-gray-500">"{result.originalValue}"</span>
      </div>
      <div className="text-sm">
        {result.matchedValue ? (
          <span className="text-green-700 font-medium">"{result.matchedValue}"</span>
        ) : showSuggestions && result.suggestions.length > 0 ? (
          <Select onValueChange={onSelectSuggestion}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {result.suggestions.map((suggestion) => (
                <SelectItem key={suggestion} value={suggestion}>
                  {suggestion} ({Math.round(result.confidence)}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-red-500">No match found</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={result.status} />
        <span className="text-xs text-gray-400">{Math.round(result.confidence)}%</span>
      </div>
    </div>
  );
}

// Vehicle Review Card Component
function VehicleReviewCard({
  validation,
  isExpanded,
  isAccepted,
  isRejected,
  hasCorrection,
  onToggle,
  onAccept,
  onReject,
  onUpdateField,
}: {
  validation: VehicleMMVValidation;
  isExpanded: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  hasCorrection: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
  onUpdateField: (field: 'make' | 'model' | 'variant', value: string) => void;
}) {
  const getStatusIcon = () => {
    // Show accepted/rejected status first
    if (isAccepted) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (isRejected) {
      return <X className="h-5 w-5 text-gray-400" />;
    }
    // Then show validation status
    if (validation.isValid) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (validation.needsReview) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };
  
  const getSummary = () => {
    const make = validation.makeResult.originalValue;
    const model = validation.modelResult.originalValue;
    const variant = validation.variantResult.originalValue;
    return `${make} ${model} ${variant}`;
  };

  // Determine if the Accept button should be enabled
  // Valid if: already valid, OR has any correction made, OR has matched values
  const canAccept = validation.isValid || 
    hasCorrection || 
    (validation.makeResult.matchedValue && validation.modelResult.matchedValue && validation.variantResult.matchedValue);
  
  return (
    <Card className={cn(
      'transition-all',
      // Rejected rows are grayed out
      isRejected && 'opacity-50 border-gray-200 bg-gray-50/50',
      // Accepted rows get green styling
      !isRejected && isAccepted && 'border-green-300 bg-green-50/50',
      // Default styling based on validation status
      !isRejected && !isAccepted && validation.isValid && 'border-green-200 bg-green-50/30',
      !isRejected && !isAccepted && validation.needsReview && 'border-yellow-200 bg-yellow-50/30',
      !isRejected && !isAccepted && !validation.isValid && !validation.needsReview && 'border-red-200 bg-red-50/30',
    )}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className={cn("font-medium", isRejected && "line-through text-gray-400")}>
              Row {validation.rowIndex + 1}
            </div>
            <div className={cn("text-sm text-gray-500", isRejected && "line-through")}>
              {getSummary()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRejected ? (
            <Badge variant="outline" className="bg-gray-100 text-gray-500">
              Skipped
            </Badge>
          ) : isAccepted ? (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Accepted
            </Badge>
          ) : validation.isValid ? (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Ready to Import
            </Badge>
          ) : validation.needsReview ? (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              Review Required
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              Cannot Import
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <CardContent className="border-t pt-4">
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-gray-500 uppercase pb-2">
              <div>Field</div>
              <div>Original</div>
              <div>Corrected/Suggestion</div>
              <div>Status</div>
            </div>
            <FieldMatchRow
              fieldName="Make"
              result={validation.makeResult}
              onSelectSuggestion={(v) => onUpdateField('make', v)}
            />
            <FieldMatchRow
              fieldName="Model"
              result={validation.modelResult}
              onSelectSuggestion={(v) => onUpdateField('model', v)}
            />
            <FieldMatchRow
              fieldName="Variant"
              result={validation.variantResult}
              onSelectSuggestion={(v) => onUpdateField('variant', v)}
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            {isRejected ? (
              <Button variant="outline" size="sm" onClick={onAccept}>
                <Check className="h-4 w-4 mr-1" />
                Undo Skip
              </Button>
            ) : isAccepted ? (
              <Button variant="outline" size="sm" onClick={onReject}>
                <X className="h-4 w-4 mr-1" />
                Skip Instead
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={onReject}>
                  <X className="h-4 w-4 mr-1" />
                  Skip This Row
                </Button>
                <Button
                  size="sm"
                  onClick={onAccept}
                  disabled={!canAccept}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept & Continue
                </Button>
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Main Component
export function FuzzyMatchReview({
  validationResults,
  onAcceptAll,
  onBack,
}: FuzzyMatchReviewProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [acceptedRows, setAcceptedRows] = useState<Set<number>>(new Set());
  const [rejectedRows, setRejectedRows] = useState<Set<number>>(new Set());
  const [corrections, setCorrections] = useState<Map<number, Partial<VehicleMMVValidation>>>(new Map());
  
  // Categorize results
  const validRows = validationResults.filter(r => r.isValid);
  const reviewRows = validationResults.filter(r => r.needsReview);
  const invalidRows = validationResults.filter(r => !r.isValid && !r.needsReview);
  
  const toggleExpand = (rowIndex: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  };
  
  const handleAccept = (rowIndex: number) => {
    setAcceptedRows(prev => new Set(prev).add(rowIndex));
    setRejectedRows(prev => {
      const next = new Set(prev);
      next.delete(rowIndex);
      return next;
    });
    // Collapse the row after accepting and expand the next row that needs review
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.delete(rowIndex);
      // Find next row that needs attention
      const needsAttention = validationResults.filter(r => 
        r.needsReview && !acceptedRows.has(r.rowIndex) && !rejectedRows.has(r.rowIndex) && r.rowIndex !== rowIndex
      );
      if (needsAttention.length > 0) {
        next.add(needsAttention[0].rowIndex);
      }
      return next;
    });
  };
  
  const handleReject = (rowIndex: number) => {
    setRejectedRows(prev => new Set(prev).add(rowIndex));
    setAcceptedRows(prev => {
      const next = new Set(prev);
      next.delete(rowIndex);
      return next;
    });
    // Collapse the row after rejecting and expand the next row that needs review
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.delete(rowIndex);
      // Find next row that needs attention
      const needsAttention = validationResults.filter(r => 
        r.needsReview && !acceptedRows.has(r.rowIndex) && !rejectedRows.has(r.rowIndex) && r.rowIndex !== rowIndex
      );
      if (needsAttention.length > 0) {
        next.add(needsAttention[0].rowIndex);
      }
      return next;
    });
  };
  
  const handleUpdateField = (rowIndex: number, field: 'make' | 'model' | 'variant', value: string) => {
    setCorrections(prev => {
      const next = new Map(prev);
      const current = next.get(rowIndex) || {};
      next.set(rowIndex, {
        ...current,
        [`corrected${field.charAt(0).toUpperCase() + field.slice(1)}`]: value,
      });
      return next;
    });
  };
  
  // Check if a row has any corrections
  const hasCorrection = (rowIndex: number): boolean => {
    const correction = corrections.get(rowIndex);
    return !!(correction?.correctedMake || correction?.correctedModel || correction?.correctedVariant);
  };
  
  const handleProceed = () => {
    // Combine auto-accepted valid rows with manually accepted rows
    const toImport = validationResults.filter(r => {
      // If rejected, always exclude
      if (rejectedRows.has(r.rowIndex)) return false;
      // If valid, include by default
      if (r.isValid) return true;
      // If manually accepted, include
      if (acceptedRows.has(r.rowIndex)) return true;
      return false;
    });
    
    // Apply any manual corrections
    const finalResults = toImport.map(r => {
      const correction = corrections.get(r.rowIndex);
      if (correction) {
        return { ...r, ...correction };
      }
      return r;
    });
    
    onAcceptAll(finalResults);
  };
  
  // Calculate ready to import count using the same logic as handleProceed
  const readyToImportCount = validationResults.filter(r => {
    // If rejected, always exclude
    if (rejectedRows.has(r.rowIndex)) return false;
    // If valid, include by default
    if (r.isValid) return true;
    // If manually accepted, include
    if (acceptedRows.has(r.rowIndex)) return true;
    return false;
  }).length;
  
  // Count valid rows that are not rejected (for the section header)
  const validNotRejectedCount = validRows.filter(r => !rejectedRows.has(r.rowIndex)).length;
  
  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Review Make/Model/Variant Matches
          </CardTitle>
          <CardDescription>
            We've validated your vehicle data against our master database. Please review the matches below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{validationResults.length}</div>
              <div className="text-sm text-gray-500">Total Rows</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{validRows.length}</div>
              <div className="text-sm text-green-600">Valid/Auto-Corrected</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{reviewRows.length}</div>
              <div className="text-sm text-yellow-600">Needs Review</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{invalidRows.length}</div>
              <div className="text-sm text-red-600">No Match Found</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Valid Rows Section */}
      {validRows.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Ready to Import ({validNotRejectedCount})
          </h3>
          <div className="space-y-2">
            {validRows.map(validation => (
              <VehicleReviewCard
                key={validation.rowIndex}
                validation={validation}
                isExpanded={expandedRows.has(validation.rowIndex)}
                isAccepted={acceptedRows.has(validation.rowIndex)}
                isRejected={rejectedRows.has(validation.rowIndex)}
                hasCorrection={hasCorrection(validation.rowIndex)}
                onToggle={() => toggleExpand(validation.rowIndex)}
                onAccept={() => handleAccept(validation.rowIndex)}
                onReject={() => handleReject(validation.rowIndex)}
                onUpdateField={(field, value) => handleUpdateField(validation.rowIndex, field, value)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Review Required Section */}
      {reviewRows.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Needs Review ({reviewRows.length})
          </h3>
          <div className="space-y-2">
            {reviewRows.map(validation => (
              <VehicleReviewCard
                key={validation.rowIndex}
                validation={validation}
                isExpanded={expandedRows.has(validation.rowIndex)}
                isAccepted={acceptedRows.has(validation.rowIndex)}
                isRejected={rejectedRows.has(validation.rowIndex)}
                hasCorrection={hasCorrection(validation.rowIndex)}
                onToggle={() => toggleExpand(validation.rowIndex)}
                onAccept={() => handleAccept(validation.rowIndex)}
                onReject={() => handleReject(validation.rowIndex)}
                onUpdateField={(field, value) => handleUpdateField(validation.rowIndex, field, value)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Invalid Section */}
      {invalidRows.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Cannot Import ({invalidRows.length})
          </h3>
          <p className="text-sm text-gray-500">
            These rows have Make/Model/Variant combinations that don&apos;t exist in our database.
            They will be skipped during import.
          </p>
          <div className="space-y-2">
            {invalidRows.map(validation => (
              <VehicleReviewCard
                key={validation.rowIndex}
                validation={validation}
                isExpanded={expandedRows.has(validation.rowIndex)}
                isAccepted={acceptedRows.has(validation.rowIndex)}
                isRejected={rejectedRows.has(validation.rowIndex)}
                hasCorrection={hasCorrection(validation.rowIndex)}
                onToggle={() => toggleExpand(validation.rowIndex)}
                onAccept={() => handleAccept(validation.rowIndex)}
                onReject={() => handleReject(validation.rowIndex)}
                onUpdateField={(field, value) => handleUpdateField(validation.rowIndex, field, value)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back to Column Mapping
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {readyToImportCount} of {validationResults.length} rows ready to import
          </span>
          <Button onClick={handleProceed} disabled={readyToImportCount === 0}>
            Continue to Import ({readyToImportCount} rows)
          </Button>
        </div>
      </div>
    </div>
  );
}
