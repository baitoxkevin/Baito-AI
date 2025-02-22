import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getAIResponse } from '@/lib/ai';
import { Loader2 } from 'lucide-react';

type AnalysisDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: any;
};

type AnalysisSection = {
  title: string;
  content: string[];
};

export function CandidateAnalysisDialog({ open, onOpenChange, candidate }: AnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<AnalysisSection[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeProfile = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const prompt = `Please analyze this candidate's profile and provide a professional summary. Focus on their technical skills, achievements, core competencies, and qualifications. Return ONLY a valid JSON response with this exact structure:
      {
        "sections": [
          {
            "title": "Technical Expertise",
            "content": ["point 1", "point 2"]
          },
          {
            "title": "Professional Achievements",
            "content": ["achievement 1", "achievement 2"]
          },
          {
            "title": "Core Competencies",
            "content": ["competency 1", "competency 2"]
          },
          {
            "title": "Key Qualifications",
            "content": ["qualification 1", "qualification 2"]
          }
        ]
      }

      Candidate data: ${JSON.stringify(candidate)}`;

      const response = await getAIResponse([{ role: 'user', content: prompt }], candidate.id);
      
      try {
        // Try to extract JSON if response contains additional text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : response;
        const parsedResponse = JSON.parse(jsonStr);
        
        if (!parsedResponse.sections) {
          throw new Error('Invalid response format: missing sections');
        }
        
        setAnalysis(parsedResponse.sections);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Failed to parse AI response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze profile');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Profile Analysis</DialogTitle>
        </DialogHeader>

        {!analysis.length && !isAnalyzing && !error && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <p className="text-muted-foreground text-center">
              Get an AI-powered analysis of this candidate's profile, including technical skills,
              achievements, and core competencies.
            </p>
            <Button onClick={analyzeProfile}>
              Start Analysis
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing profile...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={analyzeProfile}>
              Retry Analysis
            </Button>
          </div>
        )}

        {analysis.length > 0 && (
          <div className="space-y-6">
            {analysis.map((section, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-lg font-semibold">{section.title}</h3>
                <ul className="list-disc list-inside space-y-1">
                  {section.content.map((point, pointIndex) => (
                    <li key={pointIndex} className="text-muted-foreground">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={analyzeProfile}>
                Refresh Analysis
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
