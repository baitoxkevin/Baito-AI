import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, MapPin, User, Calendar } from 'lucide-react';
import { formatTimeString } from '@/lib/utils';
import type { Project } from '@/lib/types';

interface EventHoverCardProps {
  project: Project;
  onViewDetails?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  position?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  showActions?: boolean;
}

export const EventHoverCard: React.FC<EventHoverCardProps> = ({
  project,
  onViewDetails,
  onEdit,
  position = 'auto',
  showActions = true,
}) => {
  // Format dates
  const startDate = new Date(project.start_date);
  const endDate = project.end_date ? new Date(project.end_date) : startDate;
  const isSingleDay = startDate.toDateString() === endDate.toDateString();

  // Status color mapping
  const statusColors: Record<string, string> = {
    'Active': 'bg-green-100 text-green-800 border-green-200',
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Completed': 'bg-blue-100 text-blue-800 border-blue-200',
    'Cancelled': 'bg-red-100 text-red-800 border-red-200',
  };

  // Priority color mapping
  const priorityColors: Record<string, string> = {
    'High': 'bg-red-100 text-red-800 border-red-200',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Low': 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <Card className="w-80 shadow-lg border-2 animate-in fade-in-0 zoom-in-95 duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-base leading-tight flex-1">{project.title}</h4>
          <div
            className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
            style={{ backgroundColor: project.color || '#3B82F6' }}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge
            variant="outline"
            className={statusColors[project.status] || 'bg-gray-100 text-gray-800 border-gray-200'}
          >
            {project.status}
          </Badge>
          <Badge
            variant="outline"
            className={priorityColors[project.priority] || 'bg-gray-100 text-gray-800 border-gray-200'}
          >
            {project.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-2.5">
        {/* Date and Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700">
              {isSingleDay
                ? format(startDate, 'EEEE, MMMM d, yyyy')
                : `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
              }
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700">
              {formatTimeString(project.working_hours_start)} - {formatTimeString(project.working_hours_end)}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <span className="text-gray-700 line-clamp-2 flex-1">
            {project.venue_address}
          </span>
        </div>

        {/* Crew Info */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-700">
            <span className="font-semibold">{project.filled_positions}</span>
            <span className="text-gray-500"> / </span>
            <span>{project.crew_count}</span>
            <span className="text-gray-500"> crew members</span>
          </span>
        </div>

        {/* Client */}
        {project.client?.full_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700">
              {project.client.full_name}
            </span>
          </div>
        )}

        {/* Description if available */}
        {project.description && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 line-clamp-3">
              {project.description}
            </p>
          </div>
        )}
      </CardContent>

      {showActions && (onViewDetails || onEdit) && (
        <CardFooter className="pt-0 flex gap-2">
          {onViewDetails && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onViewDetails(project)}
            >
              View Details
            </Button>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={() => onEdit(project)}
            >
              Edit
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default EventHoverCard;
