import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Briefcase, CalendarDays, Users, Clock, DollarSign } from 'lucide-react';
import type { Project } from '@/lib/types';
import { format } from 'date-fns';

interface JobDiscoveryCardProps {
  project: Project; // Using Project type for consistency
}

const JobDiscoveryCard: React.FC<JobDiscoveryCardProps> = ({ project }) => {
  // Fallback for description if it's too long or missing
  const shortDescription = project.description
    ? (project.description.length > 150 ? project.description.substring(0, 147) + '...' : project.description)
    : 'No description available.';

  return (
    <Card className="w-full h-[500px] flex flex-col shadow-lg rounded-xl overflow-hidden bg-white"> {/* Fixed height for consistent card size in stack, added bg-white */}
      {/* Optional: Image/Logo section */}
      {project.brand_logo_url ? (
        <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden border-b">
          <img src={project.brand_logo_url} alt={`${project.company_name || 'Company'} logo`} className="object-contain h-full w-full p-2" />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border-b">
           <Briefcase className="w-16 h-16 text-slate-500 opacity-70" />
        </div>
      )}

      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-xl font-bold truncate text-gray-800" title={project.title}>
          {project.title || 'Untitled Project'}
        </CardTitle>
        <CardDescription className="flex items-center text-sm text-gray-600 pt-1">
          <Building2 className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
          {project.company_name || 'N/A Company'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-3 overflow-y-auto text-sm px-4 pb-4">
        <div className="flex items-start text-gray-700">
          <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-rose-500" />
          <span>{project.venue_address || 'Location not specified'}</span>
        </div>

        {project.start_date && (
          <div className="flex items-center text-gray-700">
            <CalendarDays className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
            <span>
              {format(new Date(project.start_date), 'dd MMM yyyy')}
              {project.end_date && ` - ${format(new Date(project.end_date), 'dd MMM yyyy')}`}
            </span>
          </div>
        )}

        {project.working_hours_start && project.working_hours_end && (
          <div className="flex items-center text-gray-700">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
            {project.working_hours_start} - {project.working_hours_end}
          </div>
        )}

        {/* Assuming crew_count and filled_positions might be 0, so check if they are numbers */}
        {typeof project.crew_count === 'number' && typeof project.filled_positions === 'number' && (project.crew_count - project.filled_positions > 0) && (
           <div className="flex items-center text-gray-700">
             <Users className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
             {project.crew_count - project.filled_positions} open spot(s)
           </div>
        )}

        <p className="text-gray-600 leading-relaxed pt-2">
          {shortDescription}
        </p>

        <div className="pt-2 flex flex-wrap gap-2">
          {project.event_type && <Badge variant="secondary">{project.event_type}</Badge>}
          {project.priority && <Badge variant={project.priority === 'high' ? 'destructive' : 'outline'}>{project.priority}</Badge>}
          {project.salary_range && (
            <Badge variant="outline" className="border-green-500 text-green-600">
              <DollarSign className="h-3 w-3 mr-1" />
              {project.salary_range}
            </Badge>
          )}
          {project.status === 'active' && <Badge className="bg-green-500">Active Now</Badge>}
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-gray-50 border-t mt-auto"> {/* Ensure footer is at the bottom */}
        <p className="text-xs text-gray-500 text-center w-full">Swipe left to pass, right to like</p>
      </CardFooter>
    </Card>
  );
};

export default JobDiscoveryCard;

// Developer Note:
// Ensure the Project type in src/lib/types.ts includes fields like:
// id: string | number;
// title: string;
// company_name?: string;
// venue_address?: string;
// description?: string;
// brand_logo_url?: string;
// start_date?: string | Date;
// crew_count?: number;
// filled_positions?: number;
// employment_type?: string; // e.g., "Full-time", "Part-time", "Contract"
// salary_range?: string; // e.g., "$50k - $70k", "Competitive"
// Other relevant fields for job discovery.
// If not, they need to be added or this component needs to be adapted.
// The component currently provides fallbacks for missing optional fields.
