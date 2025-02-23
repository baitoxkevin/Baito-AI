import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CandidateAnalysisDialog } from './CandidateAnalysisDialog';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Github,
  Linkedin,
  ExternalLink,
  DollarSign,
  Brain
} from 'lucide-react';

// Type definitions for candidate data
interface Experience {
  title: string;
  company: string;
  start_date: string;
  end_date?: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  start_year: string;
  end_year?: string;
  description: string;
}

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  profile_image_url?: string;
  status: string;
  timezone?: string;
  preferred_locations?: string[];
  hourly_rate: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  bio?: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
};

function ProfileSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <Skeleton className="h-8 w-48" />
      <Card>
        <div className="p-8">
          <div className="flex items-start gap-8">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-40" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface CandidateProfileProps {
  id: string;
}

export default function CandidateProfile({ id }: CandidateProfileProps) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  useEffect(() => {
    async function fetchCandidate() {
      try {
        const { data, error: fetchError } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setCandidate(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load candidate');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCandidate();
  }, [id]);

  if (isLoading) return <ProfileSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <h2 className="text-2xl font-bold text-destructive">{error}</h2>
      </div>
    );
  }
  if (!candidate) return null;

  return (
    <div className="space-y-8 p-6">
      <Card className="overflow-hidden">
        <div className="p-8">
          <div className="flex items-start gap-8">
            <Avatar className="h-32 w-32">
              <AvatarImage src={candidate.profile_image_url || undefined} alt={candidate.full_name} />
              <AvatarFallback className="text-3xl">{candidate.full_name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-4xl font-bold mb-2">{candidate.full_name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground text-lg mb-4">
                  <MapPin className="h-5 w-5" />
                  <span>{candidate.preferred_locations?.join(', ') || 'No location specified'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="text-base px-4 py-1" variant={
                  candidate.status === 'available' ? 'secondary' :
                  candidate.status === 'unavailable' ? 'destructive' : 'default'
                }>
                  {candidate.status}
                </Badge>
                <Badge className="text-base px-4 py-1" variant="secondary">
                  <DollarSign className="h-4 w-4 mr-1" />
                  ${candidate.hourly_rate}/hr
                </Badge>
              </div>

              <div className="flex items-center gap-6 text-base">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span>{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{candidate.phone_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{candidate.timezone}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {candidate.linkedin_url && (
                  <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" 
                     className="text-muted-foreground hover:text-foreground">
                    <Linkedin className="h-6 w-6" />
                  </a>
                )}
                {candidate.github_url && (
                  <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                     className="text-muted-foreground hover:text-foreground">
                    <Github className="h-6 w-6" />
                  </a>
                )}
                {candidate.portfolio_url && (
                  <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer"
                     className="text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-6 w-6" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Tabs defaultValue="about" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="about" className="text-base px-6">About</TabsTrigger>
              <TabsTrigger value="experience" className="text-base px-6">Experience</TabsTrigger>
              <TabsTrigger value="skills" className="text-base px-6">Skills</TabsTrigger>
              <TabsTrigger value="education" className="text-base px-6">Education</TabsTrigger>
            </TabsList>
            
            <Button
              variant="outline"
              onClick={() => setIsAnalysisOpen(true)}
            >
              <Brain className="h-4 w-4 mr-2" />
              Analyze Profile
            </Button>
          </div>

          <TabsContent value="about" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">About</h3>
              <p className="text-muted-foreground">{candidate.bio || 'No bio available'}</p>
            </Card>
          </TabsContent>

          <TabsContent value="experience" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Work Experience</h3>
              {candidate.experience?.length > 0 ? (
                <div className="space-y-6">
                  {candidate.experience.map((exp: Experience, index: number) => (
                    <div key={index} className="border-l-2 border-muted pl-4 pb-4">
                      <h4 className="font-semibold">{exp.title}</h4>
                      <p className="text-muted-foreground">{exp.company}</p>
                      <p className="text-sm text-muted-foreground">
                        {exp.start_date} - {exp.end_date || 'Present'}
                      </p>
                      <p className="mt-2">{exp.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No experience listed</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills?.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Education</h3>
              {candidate.education?.length > 0 ? (
                <div className="space-y-6">
                  {candidate.education.map((edu: Education, index: number) => (
                    <div key={index} className="border-l-2 border-muted pl-4 pb-4">
                      <h4 className="font-semibold">{edu.degree}</h4>
                      <p className="text-muted-foreground">{edu.institution}</p>
                      <p className="text-sm text-muted-foreground">
                        {edu.start_year} - {edu.end_year || 'Present'}
                      </p>
                      <p className="mt-2">{edu.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No education listed</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CandidateAnalysisDialog
        open={isAnalysisOpen}
        onOpenChange={setIsAnalysisOpen}
        candidate={candidate}
      />
    </div>
  );
}
