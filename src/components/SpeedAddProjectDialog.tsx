/**
 * Speed Add Project Dialog
 * Allows users to paste a job ad and auto-fill project form fields using AI
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { extractProjectFromJobAd, aiResultToProjectFormData, getConfidenceColor, AIProjectExtractionResult } from '@/lib/ai-project-extractor';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SpeedAddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataExtracted: (data: any) => void;
}

export function SpeedAddProjectDialog({
  open,
  onOpenChange,
  onDataExtracted
}: SpeedAddProjectDialogProps) {
  const [jobAdText, setJobAdText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<AIProjectExtractionResult | null>(null);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (!jobAdText.trim()) {
      toast({
        title: "Empty Input",
        description: "Please paste a job ad to extract project information.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setExtractionResult(null);

    try {
      const result = await extractProjectFromJobAd(jobAdText);
      setExtractionResult(result);

      if (result.overallConfidence < 50) {
        toast({
          title: "Low Confidence",
          description: "The AI had difficulty extracting information. Please review and edit the fields.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Extraction Successful",
          description: `Project information extracted with ${result.overallConfidence}% confidence.`,
        });
      }
    } catch (error: any) {
      console.error('Speed add extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: error.message || "Failed to extract project information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseExtractedData = () => {
    if (!extractionResult) return;

    const formData = aiResultToProjectFormData(extractionResult);
    onDataExtracted(formData);
    onOpenChange(false);

    // Clear state for next use
    setJobAdText('');
    setExtractionResult(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setJobAdText('');
    setExtractionResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            <DialogTitle className="text-2xl">Speed Add Project</DialogTitle>
          </div>
          <DialogDescription>
            Paste a job advertisement below and AI will automatically extract project information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input Area */}
          <div className="space-y-2">
            <label htmlFor="job-ad" className="text-sm font-medium">
              Job Advertisement
            </label>
            <Textarea
              id="job-ad"
              placeholder="Paste your job ad here...&#10;&#10;Example:&#10;Looking for 10 promoters for a Samsung product launch at Mid Valley Mall&#10;Date: 15-17 December 2024&#10;Time: 10am - 6pm&#10;Pay: RM15/hour&#10;Requirements: Speak Mandarin, age 18-35"
              value={jobAdText}
              onChange={(e) => setJobAdText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500">
              Tip: Include dates, times, location, number of staff, pay rate, and requirements for best results
            </p>
          </div>

          {/* Extract Button */}
          {!extractionResult && (
            <Button
              onClick={handleExtract}
              disabled={isProcessing || !jobAdText.trim()}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting with AI...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Extract Project Information
                </>
              )}
            </Button>
          )}

          {/* Extraction Results */}
          {extractionResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Overall Confidence */}
              <Alert className={cn(
                extractionResult.overallConfidence >= 70 ? 'border-green-200 bg-green-50' :
                extractionResult.overallConfidence >= 50 ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              )}>
                {extractionResult.overallConfidence >= 70 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <AlertDescription className={cn(
                  extractionResult.overallConfidence >= 70 ? 'text-green-800' :
                  extractionResult.overallConfidence >= 50 ? 'text-yellow-800' :
                  'text-red-800'
                )}>
                  <strong>Overall Confidence: {extractionResult.overallConfidence}%</strong>
                  <p className="mt-1 text-sm">
                    {extractionResult.overallConfidence >= 70
                      ? 'High quality extraction. Review and confirm the fields below.'
                      : extractionResult.overallConfidence >= 50
                      ? 'Moderate quality extraction. Please review and edit fields as needed.'
                      : 'Low quality extraction. Please manually verify all fields.'}
                  </p>
                </AlertDescription>
              </Alert>

              {/* Extracted Fields */}
              <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Extracted Information</h4>
                {Object.entries(extractionResult.fields).map(([fieldName, extraction]) => (
                  <div key={fieldName} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize text-gray-700">
                        {fieldName.replace(/_/g, ' ')}:
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getConfidenceColor(extraction.confidence))}
                      >
                        {extraction.confidence}
                      </Badge>
                    </div>
                    <div className="text-sm bg-white p-2 rounded border">
                      {Array.isArray(extraction.value) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {extraction.value.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <span>{extraction.value || <em className="text-gray-400">Not found</em>}</span>
                      )}
                    </div>
                    {extraction.reasoning && (
                      <p className="text-xs text-gray-500 italic">
                        {extraction.reasoning}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Warnings */}
              {extractionResult.warnings.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Warnings:</strong>
                    <ul className="mt-1 list-disc list-inside text-sm">
                      {extractionResult.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Suggestions */}
              {extractionResult.suggestions.length > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Suggestions:</strong>
                    <ul className="mt-1 list-disc list-inside text-sm">
                      {extractionResult.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleExtract}
                  variant="outline"
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Re-extract
                </Button>
                <Button
                  onClick={handleUseExtractedData}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Use This Data
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleCancel} variant="ghost">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
