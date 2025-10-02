import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Search, Filter, X, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import type { TaskStatus, User } from '@/lib/types';

interface TaskFilterBarProps {
  onFilter: (filters: {
    status?: TaskStatus | TaskStatus[];
    priority?: ('high' | 'medium' | 'low')[];
    assignedTo?: string | string[];
    dueDate?: { from?: string; to?: string };
    searchTerm?: string;
    labels?: string[];
  }) => void;
  users?: User[];
  availableLabels?: string[];
  isFiltering: boolean;
}

export function TaskFilterBar({
  onFilter,
  users = [],
  availableLabels = [],
  isFiltering,
}: TaskFilterBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<('high' | 'medium' | 'low')[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [dueDateFrom, setDueDateFrom] = useState<Date | undefined>(undefined);
  const [dueDateTo, setDueDateTo] = useState<Date | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState(0);
  
  // Update filter count
  useEffect(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter.length > 0) count++;
    if (priorityFilter.length > 0) count++;
    if (assigneeFilter.length > 0) count++;
    if (labelFilter.length > 0) count++;
    if (dueDateFrom || dueDateTo) count++;
    setActiveFilters(count);
  }, [searchTerm, statusFilter, priorityFilter, assigneeFilter, labelFilter, dueDateFrom, dueDateTo]);

  const handleSearch = () => {
    onFilter({
      searchTerm: searchTerm || undefined,
      status: statusFilter.length > 0 ? statusFilter : undefined,
      priority: priorityFilter.length > 0 ? priorityFilter : undefined,
      assignedTo: assigneeFilter.length > 0 ? assigneeFilter : undefined,
      labels: labelFilter.length > 0 ? labelFilter : undefined,
      dueDate: dueDateFrom || dueDateTo
        ? {
            from: dueDateFrom ? format(dueDateFrom, 'yyyy-MM-dd') : undefined,
            to: dueDateTo ? format(dueDateTo, 'yyyy-MM-dd') : undefined,
          }
        : undefined,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter([]);
    setPriorityFilter([]);
    setAssigneeFilter([]);
    setLabelFilter([]);
    setDueDateFrom(undefined);
    setDueDateTo(undefined);
    
    onFilter({});
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilters}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-8 px-2 text-xs">
                Clear all
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-1">
                {['backlog', 'todo', 'doing', 'done'].map((status) => (
                  <Badge
                    key={status}
                    variant={statusFilter.includes(status as TaskStatus) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setStatusFilter((prev) =>
                        prev.includes(status as TaskStatus)
                          ? prev.filter((s) => s !== status)
                          : [...prev, status as TaskStatus]
                      );
                    }}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: 'High', value: 'high', color: 'bg-red-100 text-red-700' },
                  { label: 'Medium', value: 'medium', color: 'bg-amber-100 text-amber-700' },
                  { label: 'Low', value: 'low', color: 'bg-green-100 text-green-700' },
                ].map(({ label, value, color }) => (
                  <Badge
                    key={value}
                    variant={priorityFilter.includes(value as 'high' | 'medium' | 'low') ? 'default' : 'outline'}
                    className={`cursor-pointer ${priorityFilter.includes(value as 'high' | 'medium' | 'low') ? '' : color}`}
                    onClick={() => {
                      setPriorityFilter((prev) =>
                        prev.includes(value as 'high' | 'medium' | 'low')
                          ? prev.filter((p) => p !== value)
                          : [...prev, value as 'high' | 'medium' | 'low']
                      );
                    }}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {users.length > 0 && (
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={assigneeFilter.length === 1 ? assigneeFilter[0] : ''}
                  onValueChange={(value) => {
                    if (value === "unassigned") {
                      setAssigneeFilter(["unassigned"]);
                    } else if (value === "") {
                      setAssigneeFilter([]);
                    } else {
                      setAssigneeFilter([value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any assignee</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {availableLabels.length > 0 && (
              <div className="space-y-2">
                <Label>Labels</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {labelFilter.length > 0 ? `${labelFilter.length} selected` : 'Select labels'}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search labels..." />
                      <CommandList>
                        <CommandEmpty>No labels found.</CommandEmpty>
                        <CommandGroup>
                          {availableLabels.map((label) => (
                            <CommandItem
                              key={label}
                              onSelect={() => {
                                setLabelFilter((prev) =>
                                  prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
                                );
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox checked={labelFilter.includes(label)} />
                                <span>{label}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <Label>Due Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDateFrom ? format(dueDateFrom, 'PPP') : 'From date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDateFrom}
                      onSelect={setDueDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDateTo ? format(dueDateTo, 'PPP') : 'To date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDateTo}
                      onSelect={setDueDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Button size="sm" onClick={handleSearch} disabled={isFiltering}>
                {isFiltering ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Filtering...
                  </div>
                ) : (
                  <>
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters
                  </>
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button onClick={handleSearch} disabled={isFiltering}>
        {isFiltering ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}