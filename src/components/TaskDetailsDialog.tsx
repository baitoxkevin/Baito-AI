import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Clock, Calendar, FileText, AlertCircle, Tag, Paperclip, MessageSquare, Trash2, Edit, ChevronDown, User as UserIcon, Download, Upload } from 'lucide-react';
import type { Task, TaskComment, TaskAttachment, User } from '@/lib/types';
// Removed useKanban hook
import { useToast } from '@/hooks/use-toast';
import { createDialogHandler } from '@/lib/utils';

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  projectId: string;
  onTaskUpdate: (updatedTask: Task) => void;
  onTaskDelete: () => void;
  users?: User[];
}

// Removed kanban functionality from TaskDetailsDialog
export function TaskDetailsDialog({
  open,
  onOpenChange,
  task,
  projectId,
  onTaskUpdate,
  onTaskDelete,
  users = [],
}: TaskDetailsDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    taskComments,
    isLoadingComments,
    loadTaskComments,
    addTaskComment,
    editTaskComment,
    removeTaskComment,
    taskAttachments,
    isLoadingAttachments,
    loadTaskAttachments,
    uploadAttachment,
    removeTaskAttachment,
    editTask,
  } = useKanban(projectId);
  
  const { toast } = useToast();

  // Reset form state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.due_date || '');
      setAssignedTo(task.assigned_to || '');
      setEstimatedHours(task.estimated_hours?.toString() || '');
      setLabels(task.labels || []);
      setIsEditing(false);
      
      // Load comments and attachments when the dialog opens
      if (open) {
        loadTaskComments(task.id);
        loadTaskAttachments(task.id);
      }
    }
  }, [task, open, loadTaskComments, loadTaskAttachments]);

  const handleSave = async () => {
    if (!task) return;
    
    try {
      const updatedTask = await editTask(task.id, {
        title,
        description: description || undefined,
        priority,
        due_date: dueDate || undefined,
        assigned_to: assignedTo || undefined,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        labels: labels.length > 0 ? labels : undefined,
      });
      
      if (updatedTask) {
        onTaskUpdate(updatedTask);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;
    
    const comment = await addTaskComment(task.id, newComment.trim());
    if (comment) {
      setNewComment('');
    }
  };

  const handleEditComment = async () => {
    if (!task || !editingCommentId || !editingCommentContent.trim()) return;
    
    const comment = await editTaskComment(editingCommentId, task.id, editingCommentContent.trim());
    if (comment) {
      setEditingCommentId(null);
      setEditingCommentContent('');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;
    
    if (confirm('Are you sure you want to delete this comment?')) {
      await removeTaskComment(commentId, task.id);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    await uploadAttachment(task.id, file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return;
    
    if (confirm('Are you sure you want to delete this file?')) {
      await removeTaskAttachment(attachmentId, task.id);
    }
  };

  const handleAddLabel = () => {
    if (!newLabel.trim()) return;
    
    const trimmedLabel = newLabel.trim();
    if (!labels.includes(trimmedLabel)) {
      setLabels([...labels, trimmedLabel]);
    }
    setNewLabel('');
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAssignedUser = () => {
    if (!task?.assigned_to) return null;
    return users.find(user => user.id === task.assigned_to) || null;
  };

  const assignedUser = getAssignedUser();

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={createDialogHandler(onOpenChange)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start">
            {isEditing ? (
              <div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold"
                  placeholder="Task title"
                  debounceTime={300}
                  onBlur={() => {/* No auto-save on blur */}}
                />
              </div>
            ) : (
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
            )}
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onTaskDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              Comments
              {taskComments[task.id]?.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {taskComments[task.id]?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments
              {taskAttachments[task.id]?.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {taskAttachments[task.id]?.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="flex-1 overflow-y-auto pb-4">
            <div className="space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Task description"
                    rows={5}
                  />
                ) : (
                  <div className="bg-muted p-3 rounded-md min-h-[80px] whitespace-pre-wrap">
                    {description || <span className="text-muted-foreground">No description provided</span>}
                  </div>
                )}
              </div>
              
              {/* Due Date & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      {dueDate ? (
                        format(new Date(dueDate), 'PP')
                      ) : (
                        <span className="text-muted-foreground">No due date</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Priority</Label>
                  {isEditing ? (
                    <Select value={priority} onValueChange={(value) => setPriority(value as 'high' | 'medium' | 'low')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="outline"
                      className={
                        priority === 'high'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                          : priority === 'medium'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                      }
                    >
                      {priority}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Assignee & Estimated Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  {isEditing ? (
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center">
                      {assignedUser ? (
                        <>
                          <Avatar className="w-6 h-6 mr-2">
                            <AvatarImage src={assignedUser.avatar_url} alt={assignedUser.full_name} />
                            <AvatarFallback>{getInitials(assignedUser.full_name)}</AvatarFallback>
                          </Avatar>
                          {assignedUser.full_name}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Estimated Hours</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      placeholder="e.g. 4.5"
                    />
                  ) : (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      {estimatedHours ? (
                        `${estimatedHours} hours`
                      ) : (
                        <span className="text-muted-foreground">Not estimated</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Labels */}
              <div className="space-y-2">
                <Label>Labels</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Add a label"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddLabel();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddLabel} size="sm">
                        Add
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {labels.map((label) => (
                        <Badge key={label} variant="secondary" className="flex items-center gap-1">
                          {label}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 rounded-full"
                            onClick={() => handleRemoveLabel(label)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {labels.length > 0 ? (
                      labels.map((label) => (
                        <Badge key={label} variant="secondary">
                          <Tag className="w-3 h-3 mr-1" />
                          {label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No labels</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Created/Updated Info */}
              <div className="text-xs text-muted-foreground pt-2">
                <div>Created: {format(new Date(task.created_at), 'PPpp')}</div>
                <div>Last updated: {format(new Date(task.updated_at), 'PPpp')}</div>
                {task.completed_at && (
                  <div>Completed: {format(new Date(task.completed_at), 'PPpp')}</div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Comments Tab */}
          <TabsContent value="comments" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto pb-4">
              {isLoadingComments ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : taskComments[task.id]?.length ? (
                <div className="space-y-4">
                  {taskComments[task.id].map((comment) => (
                    <div key={comment.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Avatar className="w-6 h-6 mr-2">
                            <AvatarImage src={comment.user?.avatar_url} alt={comment.user?.full_name} />
                            <AvatarFallback>{comment.user ? getInitials(comment.user.full_name) : 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{comment.user?.full_name || 'Unknown User'}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'PPp')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentContent(comment.content);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            value={editingCommentContent}
                            onChange={(e) => setEditingCommentContent(e.target.value)}
                            rows={3}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingCommentContent('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleEditComment}>
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 whitespace-pre-wrap">{comment.content}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <div>No comments yet</div>
                </div>
              )}
            </div>
            
            <Separator className="my-2" />
            
            <div className="space-y-2 pt-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
              />
              <Button 
                onClick={handleAddComment} 
                disabled={!newComment.trim()}
                className="w-full"
              >
                Add Comment
              </Button>
            </div>
          </TabsContent>
          
          {/* Attachments Tab */}
          <TabsContent value="attachments" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto pb-4">
              {isLoadingAttachments ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : taskAttachments[task.id]?.length ? (
                <div className="space-y-2">
                  {taskAttachments[task.id].map((attachment) => (
                    <div key={attachment.id} className="border rounded-md p-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-muted rounded-md p-2 mr-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium truncate max-w-[200px]">{attachment.filename}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <span>{formatFileSize(attachment.file_size)}</span>
                            <span className="mx-1">•</span>
                            <span>{format(new Date(attachment.created_at), 'PP')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a href={attachment.file_path} target="_blank" rel="noopener noreferrer" download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Paperclip className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <div>No attachments yet</div>
                </div>
              )}
            </div>
            
            <Separator className="my-2" />
            
            <div className="pt-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" /> Upload File
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}