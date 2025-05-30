import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarPicker } from '@/components/ui/calendar-picker';
import { format } from 'date-fns';

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskAdded: (task: unknown) => void;
  statuses: Array<{ id: string; name: string; color: string }>;
  users: Array<{ id: string; name: string; avatar: string; role: string }>;
  currentUser: { id: string; name: string; avatar: string; role: string };
}

export default function NewTaskDialog({
  open,
  onOpenChange,
  onTaskAdded,
  statuses,
  users,
  currentUser,
}: NewTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: statuses[0].id,
    assignee: users[0].id,
    priority: 'medium',
    endAt: format(new Date(), 'yyyy-MM-dd'),
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Reset form data when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        status: statuses[0].id,
        assignee: users[0].id, 
        priority: 'medium',
        endAt: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [open, statuses, users]);

  // Function to extract mentions from description
  const extractMentions = (description: string) => {
    const mentionRegex = /@([a-zA-Z\s]+)/g;
    const matches = description.match(mentionRegex) || [];
    
    return matches.map(match => {
      const name = match.substring(1); // Remove @ symbol
      const user = users.find(u => u.name === name);
      return user || null;
    }).filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const selectedStatus = statuses.find(s => s.id === formData.status);
      const selectedAssignee = users.find(u => u.id === formData.assignee);
      const mentions = extractMentions(formData.description);

      if (!selectedStatus || !selectedAssignee) {
        throw new Error('Invalid status or assignee');
      }

      const newTask = {
        id: crypto.randomUUID(),
        name: formData.name,
        description: formData.description,
        startAt: new Date(),
        endAt: new Date(formData.endAt),
        status: selectedStatus,
        assignee: formData.assignee, // Just pass the ID, processed in parent
        mentions, // Pass the extracted mentions
        priority: formData.priority,
      };

      onTaskAdded(newTask);
      onOpenChange(false);
      
      // Notify about task creation
      toast({
        title: 'Task added',
        description: 'The task has been successfully added.' + 
          (mentions.length > 0 ? ` ${mentions.length} users mentioned.` : ''),
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'Error',
        description: 'Failed to add task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task with details and assignments
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Task Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <div className="grid gap-1">
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Use @username to mention and assign users (e.g., @Ava Johnson)
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assignee}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignee: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endAt">Due Date</Label>
              <div className="relative">
                <button
                  type="button"
                  id="endAt"
                  className="flex w-full items-center gap-2 h-10 pl-3 pr-3 py-2 text-sm border rounded-md bg-background hover:bg-accent/50 transition-colors"
                  onClick={() => setCalendarOpen(prev => !prev)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  <span>
                    {formData.endAt ? format(new Date(formData.endAt), 'MMMM d, yyyy') : 'Select date'}
                  </span>
                </button>
                
                {calendarOpen && (
                  <div className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-lg shadow-md overflow-hidden">
                    <div className="w-fit p-1 bg-background">
                      <div className="flex justify-between items-center px-3 py-2 border-b">
                        <div className="font-medium">Select Due Date</div>
                        <button 
                          type="button" 
                          className="text-muted-foreground hover:text-foreground" 
                          onClick={() => setCalendarOpen(false)}
                        >
                          ✕
                        </button>
                      </div>
                      <CalendarPicker
                        selected={formData.endAt ? new Date(formData.endAt) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormData(prev => ({ ...prev, endAt: format(date, 'yyyy-MM-dd') }));
                            setCalendarOpen(false);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}