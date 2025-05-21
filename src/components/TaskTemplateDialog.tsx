import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Clock, Calendar, PlusCircle, Edit, Trash2 } from 'lucide-react';
import type { TaskTemplate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface TaskTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: TaskTemplate[];
  onAddTemplate: (template: {
    name: string;
    description?: string;
    priority: 'high' | 'medium' | 'low';
    estimatedHours?: number;
    isGlobal: boolean;
  }) => Promise<TaskTemplate | null>;
  onUseTemplate: (templateId: string) => void;
  isLoadingTemplates: boolean;
}

export function TaskTemplateDialog({
  open,
  onOpenChange,
  templates,
  onAddTemplate,
  onUseTemplate,
  isLoadingTemplates,
}: TaskTemplateDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const handleAddTemplate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const template = await onAddTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        isGlobal,
      });
      
      if (template) {
        // Reset form
        setName('');
        setDescription('');
        setPriority('medium');
        setEstimatedHours('');
        setIsGlobal(false);
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Task Templates</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {showAddForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Bug Fix, QA Review"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description</Label>
                <Textarea
                  id="templateDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Template description (optional)"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templatePriority">Priority</Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as 'high' | 'medium' | 'low')}>
                    <SelectTrigger id="templatePriority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="templateEstimatedHours">Estimated Hours</Label>
                  <Input
                    id="templateEstimatedHours"
                    type="number"
                    step="0.25"
                    min="0"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="e.g., 4.5"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="templateIsGlobal"
                  checked={isGlobal}
                  onCheckedChange={setIsGlobal}
                />
                <Label htmlFor="templateIsGlobal">Make available to all users</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setName('');
                    setDescription('');
                    setPriority('medium');
                    setEstimatedHours('');
                    setIsGlobal(false);
                    setShowAddForm(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddTemplate} disabled={isSubmitting || !name.trim()}>
                  {isSubmitting ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Button onClick={() => setShowAddForm(true)} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New Template
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                {isLoadingTemplates ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="mb-2">No templates found</div>
                    <div className="text-sm">Create a template to quickly add common tasks</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div key={template.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {template.description || 'No description'}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <div className="flex items-center text-xs">
                                <div
                                  className={`h-2 w-2 mr-1 rounded-full ${
                                    template.priority === 'high'
                                      ? 'bg-red-500'
                                      : template.priority === 'medium'
                                      ? 'bg-amber-500'
                                      : 'bg-green-500'
                                  }`}
                                />
                                {template.priority} priority
                              </div>
                              
                              {template.estimated_hours && (
                                <div className="flex items-center text-xs">
                                  <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                                  {template.estimated_hours} hours
                                </div>
                              )}
                              
                              {template.is_global && (
                                <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                  Global
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => onUseTemplate(template.id)}
                            size="sm"
                            variant="secondary"
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
        
        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}