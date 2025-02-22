import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  StarHalf,
  StarOff,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import CandidateProfile from './CandidateProfile';

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  status: 'available' | 'unavailable' | 'pending';
  rating: number;
  skills: string[];
  experience_years: number;
  preferred_locations: string[];
  created_at: string;
  last_active_at: string;
  completed_projects: number;
};

const statusColors = {
  available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  unavailable: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
} as const;

const ITEMS_PER_PAGE = 10;

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(prev => {
        const newCandidates = data || [];
        return page === 1 ? newCandidates : [...prev, ...newCandidates];
      });
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast({
        title: 'Error loading candidates',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [page]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const matchesSearch = (
        candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
        candidate.preferred_locations.some(location => location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
      const matchesSkill = skillFilter === 'all' || candidate.skills.includes(skillFilter);
      
      return matchesSearch && matchesStatus && matchesSkill;
    });
  }, [candidates, searchQuery, statusFilter, skillFilter]);

  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    candidates.forEach(candidate => {
      candidate.skills.forEach(skill => skillSet.add(skill));
    });
    return Array.from(skillSet).sort();
  }, [candidates]);

  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarHalf key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else {
        stars.push(<StarOff key={i} className="h-4 w-4 text-muted-foreground" />);
      }
    }
    
    return <div className="flex">{stars}</div>;
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex-none space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Candidates</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-[180px]">
              <Briefcase className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {allSkills.map(skill => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-background">Name</TableHead>
                <TableHead className="sticky top-0 bg-background">Contact</TableHead>
                <TableHead className="sticky top-0 bg-background">Skills</TableHead>
                <TableHead className="sticky top-0 bg-background">Status</TableHead>
                <TableHead className="sticky top-0 bg-background">Rating</TableHead>
                <TableHead className="sticky top-0 bg-background">Experience</TableHead>
                <TableHead className="sticky top-0 bg-background">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No candidates found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="font-medium">{candidate.full_name}</div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {candidate.preferred_locations.join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {candidate.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          {candidate.phone_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 3).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {candidate.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{candidate.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={statusColors[candidate.status]}
                      >
                        {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {renderRating(candidate.rating)}
                      <div className="text-xs text-muted-foreground mt-1">
                        {candidate.completed_projects} projects completed
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-3 w-3" />
                          {candidate.experience_years} years
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Last active: {new Date(candidate.last_active_at).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedCandidateId(candidate.id)}
                        >
                          View Profile
                        </Button>
                        <Button variant="ghost" size="sm">
                          Contact
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoading && candidates.length >= page * ITEMS_PER_PAGE && (
          <div className="flex justify-center p-4">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!selectedCandidateId} onOpenChange={() => setSelectedCandidateId(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
          </DialogHeader>
          {selectedCandidateId && (
            <CandidateProfile id={selectedCandidateId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
