import { useState } from 'react';
import { Plus, Trash2, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface DateRange {
  id: string;
  startDate: Date;
  endDate: Date;
  locationId?: string;
}

interface DateRangeManagerProps {
  dateRanges: DateRange[];
  onChange: (dateRanges: DateRange[]) => void;
  className?: string;
}

export function DateRangeManager({
  dateRanges,
  onChange,
  className
}: DateRangeManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addDateRange = () => {
    const newRange: DateRange = {
      id: `range-${Date.now()}`,
      startDate: new Date(),
      endDate: new Date(),
    };
    onChange([...dateRanges, newRange]);
    setEditingId(newRange.id);
  };

  const updateDateRange = (id: string, updates: Partial<DateRange>) => {
    onChange(
      dateRanges.map(range =>
        range.id === id ? { ...range, ...updates } : range
      )
    );
  };

  const removeDateRange = (id: string) => {
    onChange(dateRanges.filter(range => range.id !== id));
  };

  const totalDays = dateRanges.reduce((sum, range) => {
    const days = Math.ceil(
      (range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    return sum + days;
  }, 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Date Ranges</Label>
          <p className="text-sm text-gray-500">
            Add multiple date ranges for your project
            {totalDays > 0 && ` • Total: ${totalDays} day${totalDays !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addDateRange}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Date Range
        </Button>
      </div>

      {/* Date Ranges List */}
      {dateRanges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No date ranges yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add your first date range to get started
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={addDateRange}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Date Range
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {dateRanges.map((range, index) => {
            const days = Math.ceil(
              (range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;

            return (
              <Card key={range.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Range Number */}
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-1">
                      {index + 1}
                    </div>

                    {/* Date Pickers */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Start Date */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !range.startDate && "text-gray-400"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {range.startDate ? (
                                format(range.startDate, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={range.startDate}
                              onSelect={(date) =>
                                date && updateDateRange(range.id, { startDate: date })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* End Date */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !range.endDate && "text-gray-400"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {range.endDate ? (
                                format(range.endDate, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={range.endDate}
                              onSelect={(date) =>
                                date && updateDateRange(range.id, { endDate: date })
                              }
                              disabled={(date) =>
                                date < range.startDate
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Info & Actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDateRange(range.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="text-xs text-gray-500 text-right">
                        {days} day{days !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Validation Error */}
                  {range.startDate > range.endDate && (
                    <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                      End date must be after start date
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {dateRanges.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
          <span className="font-medium">
            {dateRanges.length} date range{dateRanges.length !== 1 ? 's' : ''} • {totalDays} total day{totalDays !== 1 ? 's' : ''}
          </span>
          <span className="text-xs">
            RM 150/day × {totalDays} days = RM {(150 * totalDays).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
