import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { ProjectLocation } from '@/lib/types';

interface ProjectLocationManagerProps {
  locations: Partial<ProjectLocation>[];
  onChange: (locations: Partial<ProjectLocation>[]) => void;
  projectDates?: { start: Date; end?: Date };
}

export function ProjectLocationManager({ 
  locations = [], 
  onChange,
  projectDates 
}: ProjectLocationManagerProps) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [newLocation, setNewLocation] = React.useState<Partial<ProjectLocation>>({
    address: '',
    date: new Date().toISOString(),
    is_primary: locations.length === 0,
    notes: ''
  });

  const handleAddLocation = () => {
    if (!newLocation.address || !newLocation.date) return;
    
    const updatedLocations = [...locations, newLocation];
    // If this is the first location or marked as primary, unset other primary flags
    if (newLocation.is_primary) {
      updatedLocations.forEach((loc, idx) => {
        if (idx !== updatedLocations.length - 1) {
          loc.is_primary = false;
        }
      });
    }
    
    onChange(updatedLocations);
    setNewLocation({
      address: '',
      date: new Date().toISOString(),
      is_primary: false,
      notes: ''
    });
  };

  const handleRemoveLocation = (index: number) => {
    const updatedLocations = locations.filter((_, i) => i !== index);
    
    // If removed location was primary and there are still locations, make first one primary
    if (locations[index].is_primary && updatedLocations.length > 0) {
      updatedLocations[0].is_primary = true;
    }
    
    onChange(updatedLocations);
  };

  const handleUpdateLocation = (index: number, updatedLocation: Partial<ProjectLocation>) => {
    const updatedLocations = [...locations];
    updatedLocations[index] = updatedLocation;
    
    // If marked as primary, unset other primary flags
    if (updatedLocation.is_primary) {
      updatedLocations.forEach((loc, idx) => {
        if (idx !== index) {
          loc.is_primary = false;
        }
      });
    }
    
    onChange(updatedLocations);
    setEditingIndex(null);
  };

  const handleTogglePrimary = (index: number) => {
    const updatedLocations = [...locations];
    const wasPrimary = updatedLocations[index].is_primary;
    
    // Unset all primary flags
    updatedLocations.forEach(loc => {
      loc.is_primary = false;
    });
    
    // Set the clicked one as primary (unless it was already primary)
    if (!wasPrimary) {
      updatedLocations[index].is_primary = true;
    } else if (updatedLocations.length > 0) {
      // If unchecking primary, make the first location primary
      updatedLocations[0].is_primary = true;
    }
    
    onChange(updatedLocations);
  };

  return (
    <div className="space-y-4">
      {/* Existing Locations */}
      {locations.length > 0 && (
        <div className="space-y-2">
          <Label>Event Locations</Label>
          <div className="space-y-2">
            {locations.map((location, index) => (
              <Card key={index} className={cn(
                "relative",
                location.is_primary && "ring-2 ring-primary"
              )}>
                {editingIndex === index ? (
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`edit-address-${index}`}>Address</Label>
                        <Input
                          id={`edit-address-${index}`}
                          value={location.address}
                          onChange={(e) => {
                            const updated = [...locations];
                            updated[index] = { ...location, address: e.target.value };
                            onChange(updated);
                          }}
                          placeholder="Enter venue address"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`edit-date-${index}`}>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id={`edit-date-${index}`}
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !location.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {location.date ? format(new Date(location.date), "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={location.date ? new Date(location.date) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const updated = [...locations];
                                  updated[index] = { ...location, date: date.toISOString() };
                                  onChange(updated);
                                }
                              }}
                              disabled={(date) => {
                                if (projectDates?.start && date < projectDates.start) return true;
                                if (projectDates?.end && date > projectDates.end) return true;
                                return false;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <Label htmlFor={`edit-notes-${index}`}>Notes (Optional)</Label>
                        <Textarea
                          id={`edit-notes-${index}`}
                          value={location.notes || ''}
                          onChange={(e) => {
                            const updated = [...locations];
                            updated[index] = { ...location, notes: e.target.value };
                            onChange(updated);
                          }}
                          placeholder="Additional notes about this location"
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`edit-primary-${index}`}
                            checked={location.is_primary || false}
                            onCheckedChange={(checked) => {
                              const updated = [...locations];
                              updated[index] = { ...location, is_primary: checked };
                              onChange(updated);
                            }}
                          />
                          <Label htmlFor={`edit-primary-${index}`}>Primary Location</Label>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingIndex(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateLocation(index, location)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-base">{location.address}</CardTitle>
                          {location.is_primary && (
                            <Badge variant="default" className="ml-2">Primary</Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {location.date && format(new Date(location.date), "PPP")}
                        </CardDescription>
                        {location.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{location.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingIndex(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveLocation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add New Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Location</CardTitle>
          <CardDescription>
            Add multiple locations for events happening at different venues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-address">Address</Label>
            <Input
              id="new-address"
              value={newLocation.address}
              onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
              placeholder="Enter venue address"
            />
          </div>
          
          <div>
            <Label htmlFor="new-date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="new-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newLocation.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newLocation.date ? format(new Date(newLocation.date), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newLocation.date ? new Date(newLocation.date) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setNewLocation({ ...newLocation, date: date.toISOString() });
                    }
                  }}
                  disabled={(date) => {
                    if (projectDates?.start && date < projectDates.start) return true;
                    if (projectDates?.end && date > projectDates.end) return true;
                    return false;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label htmlFor="new-notes">Notes (Optional)</Label>
            <Textarea
              id="new-notes"
              value={newLocation.notes || ''}
              onChange={(e) => setNewLocation({ ...newLocation, notes: e.target.value })}
              placeholder="Additional notes about this location"
              rows={2}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="new-primary"
                checked={newLocation.is_primary || false}
                onCheckedChange={(checked) => setNewLocation({ ...newLocation, is_primary: checked })}
              />
              <Label htmlFor="new-primary">Set as Primary Location</Label>
            </div>
            
            <Button
              onClick={handleAddLocation}
              disabled={!newLocation.address || !newLocation.date}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}