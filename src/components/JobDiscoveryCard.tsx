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
    <Card className="w-full h-[530px] flex flex-col shadow-2xl rounded-2xl overflow-hidden bg-white border-0"> {/* Increased height slightly, enhanced shadow */}
      {/* Image/Logo section with gradient overlay */}
      {project.brand_logo_url ? (
        <div className="h-48 relative bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent z-10" />
          <img src={project.brand_logo_url} alt={`${project.company_name || 'Company'} logo`} className="object-contain h-full w-full p-4 relative z-0" />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 flex items-center justify-center">
           <div className="w-24 h-24 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
             <Briefcase className="w-12 h-12 text-purple-600" />
           </div>
        </div>
      )}

      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2" title={project.title}>
          {project.title || 'Untitled Project'}
        </CardTitle>
        <CardDescription className="flex items-center text-sm text-gray-600 pt-1">
          <Building2 className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
          <span className="font-medium">{project.company_name || 'N/A Company'}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-3 overflow-y-auto text-sm px-4 pb-4">
        <div className="flex items-start text-gray-700">
          <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-rose-500" />
          <span className="line-clamp-2">{project.venue_address || 'Location not specified'}</span>
        </div>

        {project.start_date && (
          <div className="flex items-center text-gray-700">
            <CalendarDays className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
            <span className="font-medium">
              {format(new Date(project.start_date), 'dd MMM yyyy')}
              {project.end_date && ` - ${format(new Date(project.end_date), 'dd MMM yyyy')}`}
            </span>
          </div>
        )}

        {project.working_hours_start && project.working_hours_end && (
          <div className="flex items-center text-gray-700">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
            <span className="font-medium">{project.working_hours_start} - {project.working_hours_end}</span>
          </div>
        )}

        {typeof project.crew_count === 'number' && typeof project.filled_positions === 'number' && (project.crew_count - project.filled_positions > 0) && (
           <div className="flex items-center text-gray-700">
             <Users className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
             <span className="font-medium text-green-700">{project.crew_count - project.filled_positions} open spot{(project.crew_count - project.filled_positions) !== 1 ? 's' : ''}</span>
           </div>
        )}

        <p className="text-gray-600 leading-relaxed pt-2 line-clamp-3">
          {shortDescription}
        </p>

        <div className="pt-2 flex flex-wrap gap-2">
          {project.event_type && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
              {project.event_type}
            </Badge>
          )}
          {project.priority && (
            <Badge 
              variant={project.priority === 'high' ? 'destructive' : 'outline'}
              className={project.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' : ''}
            >
              {project.priority === 'high' ? '🔥 ' : ''}{project.priority}
            </Badge>
          )}
          {project.salary_range && (
            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
              <DollarSign className="h-3 w-3 mr-1" />
              {project.salary_range}
            </Badge>
          )}
          {project.status === 'active' && (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              ⚡ Active Now
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
        <p className="text-xs text-purple-700 text-center w-full font-medium">
          ← Swipe left to pass • Swipe right to apply →
        </p>
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