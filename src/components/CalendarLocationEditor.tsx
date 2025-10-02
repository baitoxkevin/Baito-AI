import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MapPin, Plus, Edit2, Trash2, Check, X, Calendar } from 'lucide-react';
import type { ProjectLocation } from '@/lib/types';

interface CalendarLocationEditorProps {
  date: Date;
  locations: Partial<ProjectLocation>[];
  onChange: (locations: Partial<ProjectLocation>[]) => void;
  projectId?: string;
}

export function CalendarLocationEditor({
  date,
  locations = [],
  onChange,
  projectId
}: CalendarLocationEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newLocation, setNewLocation] = useState<Partial<ProjectLocation>>({
    address: '',
    date: date.toISOString(),
    is_primary: locations.length === 0,
    notes: ''
  });

  // Get locations for this specific date
  const dateLocations = locations.filter(loc => {
    const locDate = new Date(loc.date);
    return locDate.toDateString() === date.toDateString();
  });

  const primaryLocation = dateLocations.find(loc => loc.is_primary) || dateLocations[0];

  const handleAddLocation = () => {
    if (!newLocation.address) return;

    const updatedLocations = [...locations, { ...newLocation, date: date.toISOString() }];
    
    // If this is the first location for this date, make it primary
    if (dateLocations.length === 0) {
      updatedLocations[updatedLocations.length - 1].is_primary = true;
    }

    onChange(updatedLocations);
    setNewLocation({
      address: '',
      date: date.toISOString(),
      is_primary: false,
      notes: ''
    });
  };

  const handleRemoveLocation = (locationToRemove: Partial<ProjectLocation>) => {
    const updatedLocations = locations.filter(loc => 
      !(loc.address === locationToRemove.address && 
        new Date(loc.date).toDateString() === new Date(locationToRemove.date).toDateString())
    );
    onChange(updatedLocations);
  };

  const handleUpdateLocation = (oldLocation: Partial<ProjectLocation>, newData: Partial<ProjectLocation>) => {
    const updatedLocations = locations.map(loc => {
      if (loc.address === oldLocation.address && 
          new Date(loc.date).toDateString() === new Date(oldLocation.date).toDateString()) {
        return { ...loc, ...newData };
      }
      return loc;
    });
    onChange(updatedLocations);
    setEditingIndex(null);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer w-full">
          {dateLocations.length === 0 ? (
            <div className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1 py-1">
              <Plus className="h-3 w-3" />
              Add location
            </div>
          ) : (
            <div className="space-y-1 py-1">
              <div className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3 text-red-500" />
                <span className="truncate">{primaryLocation?.address}</span>
              </div>
              {dateLocations.length > 1 && (
                <Badge variant="secondary" className="h-4 text-[10px] px-1">
                  +{dateLocations.length - 1} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(date, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
            <CardDescription>Manage locations for this date</CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0">
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-3">
                {/* Existing Locations */}
                {dateLocations.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Current Locations</Label>
                    {dateLocations.map((location, index) => (
                      <Card key={index} className="p-3">
                        {editingIndex === index ? (
                          <div className="space-y-3">
                            <Input
                              value={location.address}
                              onChange={(e) => {
                                const updated = [...dateLocations];
                                updated[index] = { ...location, address: e.target.value };
                                onChange(locations.map(loc => {
                                  const match = dateLocations.find(dl => 
                                    dl.address === loc.address && 
                                    new Date(dl.date).toDateString() === new Date(loc.date).toDateString()
                                  );
                                  return match ? updated[dateLocations.indexOf(match)] : loc;
                                }));
                              }}
                              placeholder="Location address"
                              className="h-8"
                            />
                            <Textarea
                              value={location.notes || ''}
                              onChange={(e) => {
                                const updated = [...dateLocations];
                                updated[index] = { ...location, notes: e.target.value };
                                onChange(locations.map(loc => {
                                  const match = dateLocations.find(dl => 
                                    dl.address === loc.address && 
                                    new Date(dl.date).toDateString() === new Date(loc.date).toDateString()
                                  );
                                  return match ? updated[dateLocations.indexOf(match)] : loc;
                                }));
                              }}
                              placeholder="Notes (optional)"
                              rows={2}
                              className="text-xs"
                            />
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`primary-${index}`}
                                  checked={location.is_primary || false}
                                  onCheckedChange={(checked) => {
                                    const updated = [...dateLocations];
                                    if (checked) {
                                      // Unset other primary flags for this date
                                      updated.forEach((loc, i) => {
                                        loc.is_primary = i === index;
                                      });
                                    } else {
                                      updated[index].is_primary = false;
                                    }
                                    onChange(locations.map(loc => {
                                      const match = dateLocations.find(dl => 
                                        dl.address === loc.address && 
                                        new Date(dl.date).toDateString() === new Date(loc.date).toDateString()
                                      );
                                      return match ? updated[dateLocations.indexOf(match)] : loc;
                                    }));
                                  }}
                                />
                                <Label htmlFor={`primary-${index}`} className="text-xs">Primary</Label>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditingIndex(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleUpdateLocation(location, location)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-red-500 mt-0.5" />
                                <span className="text-sm font-medium">{location.address}</span>
                                {location.is_primary && (
                                  <Badge variant="default" className="h-4 text-[10px] px-1">Primary</Badge>
                                )}
                              </div>
                              {location.notes && (
                                <p className="text-xs text-muted-foreground mt-1 ml-5">{location.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => setEditingIndex(index)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleRemoveLocation(location)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add New Location */}
                <div className="space-y-3 border-t pt-3">
                  <Label className="text-xs font-medium">Add New Location</Label>
                  <Input
                    value={newLocation.address}
                    onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                    placeholder="Enter location address"
                    className="h-8"
                  />
                  <Textarea
                    value={newLocation.notes || ''}
                    onChange={(e) => setNewLocation({ ...newLocation, notes: e.target.value })}
                    placeholder="Notes (optional)"
                    rows={2}
                    className="text-xs"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="new-primary"
                        checked={newLocation.is_primary || false}
                        onCheckedChange={(checked) => setNewLocation({ ...newLocation, is_primary: checked })}
                      />
                      <Label htmlFor="new-primary" className="text-xs">Set as primary</Label>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAddLocation}
                      disabled={!newLocation.address}
                      className="h-7"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}