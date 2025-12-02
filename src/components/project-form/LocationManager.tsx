import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MapPin, Plus, Trash2, GripVertical, Star, Edit2, Phone, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { LocationDialog } from './LocationDialog';
import { cn } from '@/lib/utils';

interface ProjectLocation {
  id: string;
  project_id: string;
  address: string;
  venue_name?: string;
  city?: string;
  state?: string;
  date: string;
  end_date?: string;
  is_primary: boolean;
  notes?: string;
  parking_info?: string;
  contact_person?: string;
  contact_phone?: string;
  display_order: number;
}

interface LocationManagerProps {
  projectId?: string;
  onChange?: (locations: ProjectLocation[]) => void;
}

export function LocationManager({ projectId, onChange }: LocationManagerProps) {
  const [locations, setLocations] = useState<ProjectLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ProjectLocation | null>(null);
  const { toast } = useToast();

  // Load locations from database if projectId exists
  useEffect(() => {
    if (projectId) {
      loadLocations();
    }
  }, [projectId]);

  const loadLocations = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_locations')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order');

      if (error) throw error;

      setLocations(data || []);
      onChange?.(data || []);
    } catch (error) {
      logger.error('Error loading locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load locations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    setDialogOpen(true);
  };

  const handleEditLocation = (location: ProjectLocation) => {
    setEditingLocation(location);
    setDialogOpen(true);
  };

  const handleSaveLocation = async (locationData: Omit<ProjectLocation, 'id' | 'project_id' | 'display_order'>) => {
    try {
      if (editingLocation) {
        // Update existing location
        const { error } = await supabase
          .from('project_locations')
          .update({
            ...locationData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingLocation.id);

        if (error) throw error;

        toast({
          title: 'Location Updated',
          description: 'Location has been updated successfully.',
        });
      } else {
        // Create new location
        if (!projectId) {
          toast({
            title: 'Error',
            description: 'Project ID is required to add locations',
            variant: 'destructive',
          });
          return;
        }

        const maxOrder = Math.max(0, ...locations.map(l => l.display_order));

        const { error } = await supabase
          .from('project_locations')
          .insert({
            project_id: projectId,
            ...locationData,
            display_order: maxOrder + 1,
          });

        if (error) throw error;

        toast({
          title: 'Location Added',
          description: 'Location has been added successfully.',
        });
      }

      await loadLocations();
      setDialogOpen(false);
    } catch (error) {
      logger.error('Error saving location:', error);
      toast({
        title: 'Error',
        description: 'Failed to save location',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const { error } = await supabase
        .from('project_locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      toast({
        title: 'Location Deleted',
        description: 'Location has been removed.',
      });

      await loadLocations();
    } catch (error) {
      logger.error('Error deleting location:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete location',
        variant: 'destructive',
      });
    }
  };

  const handleSetPrimary = async (locationId: string) => {
    try {
      // First, unset all primary flags
      await supabase
        .from('project_locations')
        .update({ is_primary: false })
        .eq('project_id', projectId);

      // Then set the selected location as primary
      const { error } = await supabase
        .from('project_locations')
        .update({ is_primary: true })
        .eq('id', locationId);

      if (error) throw error;

      toast({
        title: 'Primary Location Set',
        description: 'This location is now the primary location.',
      });

      await loadLocations();
    } catch (error) {
      logger.error('Error setting primary location:', error);
      toast({
        title: 'Error',
        description: 'Failed to set primary location',
        variant: 'destructive',
      });
    }
  };

  if (!projectId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Save the project first to manage locations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Project Locations
            </h3>
            <p className="text-xs text-gray-500">
              {locations.length} location{locations.length !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>
        <Button
          onClick={handleAddLocation}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2">Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed border-purple-200 dark:border-purple-800">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-purple-300 dark:text-purple-700" />
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
            No Locations Yet
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Add your first location to get started
          </p>
          <Button
            onClick={handleAddLocation}
            variant="outline"
            className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {locations.map((location) => (
            <Card
              key={location.id}
              className={cn(
                "p-4 border-l-4 transition-all hover:shadow-md",
                location.is_primary
                  ? "border-l-purple-600 bg-purple-50/50 dark:bg-purple-950/20"
                  : "border-l-gray-300 dark:border-l-gray-700"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center mt-1 cursor-move opacity-40 hover:opacity-100">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div>
                        {location.venue_name && (
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {location.venue_name}
                          </h4>
                        )}
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {location.address}
                        </p>
                        {(location.city || location.state) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {[location.city, location.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {location.is_primary && (
                        <Badge className="bg-purple-600 text-white">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Primary
                        </Badge>
                      )}
                      {!location.is_primary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetPrimary(location.id)}
                          className="h-7 text-xs"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Set Primary
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">From:</span>
                      {format(new Date(location.date), 'MMM d, yyyy')}
                    </span>
                    {location.end_date && (
                      <>
                        <span>→</span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">To:</span>
                          {format(new Date(location.end_date), 'MMM d, yyyy')}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                    {location.parking_info && (
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3 text-purple-600" />
                        <span>{location.parking_info}</span>
                      </div>
                    )}
                    {location.contact_person && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-purple-600" />
                        <span>
                          {location.contact_person}
                          {location.contact_phone && ` • ${location.contact_phone}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {location.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {location.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditLocation(location)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteLocation(location.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveLocation}
        existingLocation={editingLocation}
      />
    </div>
  );
}
