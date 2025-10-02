"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Trash2, AlertCircle } from "lucide-react";
import { ConflictAlert } from "@/components/ui/conflict-alert";

export interface WorkingDateWithSalary {
  date: Date;
  basicSalary: number | string;
  claims: number | string;
  commission: number | string;
}

interface ScheduleConflict {
  date: Date;
  projectId: string;
  projectTitle: string;
}

interface WorkingDatePickerProps {
  projectStartDate: Date;
  projectEndDate: Date;
  selectedDates: WorkingDateWithSalary[];
  onDatesChange: (dates: WorkingDateWithSalary[]) => void;
  conflicts?: ScheduleConflict[];
}

export function WorkingDatePicker({
  projectStartDate,
  projectEndDate,
  selectedDates,
  onDatesChange,
  conflicts = []
}: WorkingDatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [tempBasicSalary, setTempBasicSalary] = useState("0");
  const [tempClaims, setTempClaims] = useState("0");
  const [tempCommission, setTempCommission] = useState("0");
  const [isEditing, setIsEditing] = useState(false);

  // Handle calendar date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Check if date already selected - handle both Date objects and string dates
    const existingIndex = selectedDates.findIndex(d => {
      const dateToCompare = d.date instanceof Date ? d.date : new Date(d.date);
      return isSameDay(dateToCompare, date);
    });

    if (existingIndex >= 0) {
      // Provide option to either edit or remove the date
      const shouldEdit = window.confirm(`${format(date, 'PPP')} is already selected. Would you like to edit it? Select 'OK' to edit or 'Cancel' to remove this date.`);

      if (shouldEdit) {
        // Edit the existing date
        setEditingDate(date);
        const existing = selectedDates[existingIndex];
        setTempBasicSalary(existing.basicSalary.toString());
        setTempClaims(existing.claims.toString());
        setTempCommission(existing.commission.toString());
        setIsEditing(true);
      } else {
        // Remove the date - user chose to unselect it
        removeDate(date);
      }
    } else {
      // Add new date with default values
      setEditingDate(date);
      setTempBasicSalary("0");
      setTempClaims("0");
      setTempCommission("0");
      setIsEditing(true);
    }
  };

  // Add or update a working date with salary information
  const saveWorkingDate = () => {
    if (!editingDate) return;

    const basicSalary = parseFloat(tempBasicSalary) || 0;
    const claims = parseFloat(tempClaims) || 0;
    const commission = parseFloat(tempCommission) || 0;
    
    const existingIndex = selectedDates.findIndex(d => isSameDay(d.date, editingDate));
    
    if (existingIndex >= 0) {
      // Update existing date
      const updatedDates = [...selectedDates];
      updatedDates[existingIndex] = {
        date: editingDate,
        basicSalary,
        claims,
        commission
      };
      onDatesChange(updatedDates);
    } else {
      // Add new date
      onDatesChange([
        ...selectedDates,
        {
          date: editingDate,
          basicSalary,
          claims,
          commission
        }
      ]);
    }
    
    setIsEditing(false);
    setEditingDate(null);
  };

  // Remove a date from the selected dates
  const removeDate = (dateToRemove: Date) => {
    onDatesChange(selectedDates.filter(d => {
      const dateToCompare = d.date instanceof Date ? d.date : new Date(d.date);
      return !isSameDay(dateToCompare, dateToRemove);
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Working Dates</h3>
          <p className="text-xs text-muted-foreground">Select dates when this staff member will work</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsCalendarOpen(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Select Dates
        </Button>
      </div>

      {/* Calendar Modal */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Working Dates</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDateSelect}
              disabled={(date) => {
                // Only restrict dates outside the project period
                // Normalize all dates to day-only comparison (removing time component)
                const normalizeDate = (d: Date) => {
                  const normalized = new Date(d);
                  normalized.setHours(0, 0, 0, 0);
                  return normalized.getTime();
                };

                const normalizedDate = normalizeDate(date);
                const normalizedStartDate = normalizeDate(new Date(projectStartDate));
                const normalizedEndDate = normalizeDate(new Date(projectEndDate));

                // Allow exact start date and end date, and anything in between
                return normalizedDate < normalizedStartDate || normalizedDate > normalizedEndDate;
              }}
              initialFocus
              modifiers={{
                // Mark selected dates with a special style
                selected: selectedDates.map(dateEntry => {
                  // Handle both Date objects and string dates
                  return dateEntry.date instanceof Date ? dateEntry.date : new Date(dateEntry.date);
                })
              }}
              modifiersClassNames={{
                selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
              }}
            />
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Click on a date to add it. Click on a highlighted date to edit or remove it.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalendarOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Editing Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => {
        if (!open) setIsEditing(false);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingDate ? `Working Date: ${format(editingDate, 'PPP')}` : 'Add Working Date'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="basicSalary">Basic Salary</Label>
              <Input
                id="basicSalary"
                type="number"
                min="0"
                step="0.01"
                value={tempBasicSalary}
                onChange={(e) => setTempBasicSalary(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="claims">Claims</Label>
              <Input
                id="claims"
                type="number"
                min="0"
                step="0.01"
                value={tempClaims}
                onChange={(e) => setTempClaims(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="commission">Commission</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                step="0.01"
                value={tempCommission}
                onChange={(e) => setTempCommission(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={saveWorkingDate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show scheduling conflicts warning if any */}
      {conflicts.length > 0 && (
        <ConflictAlert
          conflicts={conflicts}
          className="mb-4"
        />
      )}

      {/* Display selected dates */}
      {selectedDates.length > 0 && (
        <div className="border rounded-md p-4">
          <h4 className="text-sm font-medium mb-2">Selected Working Dates ({selectedDates.length})</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead className="text-right">Claims</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedDates
                .sort((a, b) => {
                  // Ensure we have Date objects before calling getTime()
                  const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                  const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                  return dateA.getTime() - dateB.getTime();
                })
                .map((dateEntry) => {
                  // Check if this date has a conflict
                  const dateEntryDate = dateEntry.date instanceof Date ? dateEntry.date : new Date(dateEntry.date);
                  const hasConflict = conflicts.some(conflict =>
                    isSameDay(new Date(conflict.date), dateEntryDate)
                  );

                  const dateForDisplay = dateEntry.date instanceof Date ? dateEntry.date : new Date(dateEntry.date);
                  const uniqueKey = dateForDisplay.toISOString();
                  
                  return (
                    <TableRow
                      key={uniqueKey}
                      className={hasConflict ? "bg-destructive/10" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {hasConflict && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                          {format(dateForDisplay, 'PPP')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {(typeof dateEntry.basicSalary === 'number' ? dateEntry.basicSalary : parseFloat(dateEntry.basicSalary || '0')).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(typeof dateEntry.claims === 'number' ? dateEntry.claims : parseFloat(dateEntry.claims || '0')).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(typeof dateEntry.commission === 'number' ? dateEntry.commission : parseFloat(dateEntry.commission || '0')).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // Convert to Date object if it's a string
                            const dateForEditing = dateEntry.date instanceof Date ? dateEntry.date : new Date(dateEntry.date);
                            setEditingDate(dateForEditing);
                            setTempBasicSalary(dateEntry.basicSalary.toString());
                            setTempClaims(dateEntry.claims.toString());
                            setTempCommission(dateEntry.commission.toString());
                            setIsEditing(true);
                          }}
                          className="h-8 w-8"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // Convert to Date object if it's a string
                            const dateForRemoval = dateEntry.date instanceof Date ? dateEntry.date : new Date(dateEntry.date);
                            removeDate(dateForRemoval);
                          }}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}