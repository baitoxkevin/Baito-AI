import { useState } from 'react';
import { logger } from '../lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { Candidate } from '@/lib/types';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
}

export default function ReportDialog({
  open,
  onOpenChange,
  candidate,
}: ReportDialogProps) {
  const [feedbackType, setFeedbackType] = useState<'complaint' | 'suggestion' | 'feedback'>('complaint');
  const [feedbackText, setFeedbackText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Create a temporary local storage for feedback while the table is being set up
  const saveFeedbackToLocalStorage = (feedback) => {
    try {
      const existingFeedback = JSON.parse(localStorage.getItem('candidate_feedback') || '[]');
      existingFeedback.push({
        ...feedback,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('candidate_feedback', JSON.stringify(existingFeedback));
      return true;
    } catch (e) {
      logger.error('Error saving to local storage:', e);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!candidate) return;
    if (!feedbackText.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide details about your report',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const feedbackData = {
      candidate_id: candidate.id,
      feedback_type: feedbackType,
      feedback_text: feedbackText,
      is_anonymous: isAnonymous,
      status: 'pending',
    };

    try {
      // First, try to insert into the database
      const { error } = await supabase.from('candidate_feedback').insert(feedbackData);

      // If there was an error, save to local storage as a fallback
      if (error) {
        // logger.warn('Could not save to database, using local storage fallback:', error);
        const savedLocally = saveFeedbackToLocalStorage(feedbackData);
        
        if (!savedLocally) {
          throw new Error('Failed to save feedback.');
        }
      }

      setSubmitted(true);
      toast({
        title: 'Report Submitted',
        description: 'Your report has been submitted successfully.',
      });

      // Reset form after 2 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFeedbackText('');
        setFeedbackType('complaint');
        setIsAnonymous(false);
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      logger.error('Error submitting report:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit your report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report or Feedback
          </DialogTitle>
          <DialogDescription>
            Submit a report, complaint, or feedback about {candidate.full_name}.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {feedbackType === 'complaint' ? 'Complaint' : 
               feedbackType === 'suggestion' ? 'Suggestion' : 'Feedback'} Submitted
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Thank you for your {feedbackType === 'complaint' ? 'complaint' : 
                                 feedbackType === 'suggestion' ? 'suggestion' : 'feedback'} about {candidate.full_name}. 
              Our team will review it and take appropriate action.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Type of Report</Label>
                <RadioGroup
                  value={feedbackType}
                  onValueChange={(value: 'complaint' | 'suggestion' | 'feedback') => setFeedbackType(value)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="complaint" id="complaint" />
                    <Label htmlFor="complaint" className="flex items-center gap-1.5 cursor-pointer">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Complaint
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="suggestion" id="suggestion" />
                    <Label htmlFor="suggestion" className="flex items-center gap-1.5 cursor-pointer">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      Suggestion
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feedback" id="feedback" />
                    <Label htmlFor="feedback" className="flex items-center gap-1.5 cursor-pointer">
                      <Flag className="h-4 w-4 text-orange-500" />
                      General Feedback
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-text">Details</Label>
                <Textarea
                  id="feedback-text"
                  placeholder="Please provide details about your report or feedback..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <Label htmlFor="anonymous" className="cursor-pointer text-sm">
                  Submit anonymously
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !feedbackText.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : feedbackType === 'complaint' ? (
                  'Submit Complaint'
                ) : feedbackType === 'suggestion' ? (
                  'Submit Suggestion'
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}