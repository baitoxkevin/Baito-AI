import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ListFilter, ArrowDown, Plus as PlusIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarPicker } from '@/components/ui/calendar-picker';
import { cn } from "@/lib/utils";
// Removed kanban imports
// Removed DragEndEvent import
import { format, compareAsc, compareDesc, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useId } from 'react';
import NewTaskDialog from '@/components/NewTaskDialog';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Use local storage fallback for database issues
import { useTasks } from '@/hooks/use-tasks';
import { todoStatuses, users, initialTasks } from '@/lib/todo-mock-data';
import { getAvatarUrl } from '@/lib/avatar-service';

// Create a consistent avatar component to use throughout the app
interface TaskUserProps {
  user: { 
    id: string;
    name: string;
    avatar?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

function TaskUserAvatar({ user, size = 'md', className = '' }: TaskUserProps) {
  // Map size to dimensions
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  
  // Use our consistent getAvatarUrl function
  const avatarUrl = user.avatar || getAvatarUrl(user.id);
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={avatarUrl} />
      <AvatarFallback>{user.name?.slice(0, 2) || '??'}</AvatarFallback>
    </Avatar>
  );
}

// Define external file interface
interface FileComment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
}

interface ExternalFile {
  id: string;
  name: string;
  type: "drive" | "sheet" | "doc" | "other" | "figma";
  url: string;
  lastModified: string;
  comments?: FileComment[];
}

interface CardComment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
}

const priorityColors = {
  high: 'bg-red-500/10 text-red-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  low: 'bg-green-500/10 text-green-500',
};

export default function TodoPage() {
  // Reference for task description textareas
  const taskDescriptionRefs = useRef<Record<string, HTMLTextAreaElement>>({});
  
  // State for user tagging dropdown
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchText, setTagSearchText] = useState("");
  const [tagDropdownPosition, setTagDropdownPosition] = useState({ top: 0, left: 0 });
  const [activeTextareaId, setActiveTextareaId] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Function to create a new task directly in the Backlog column
  const handleCreateInBacklog = async () => {
    try {
      let result;
      
      try {
        // Try database first
        result = await addDbTask({
          task_name: "New Task",
          status: "backlog"
        });
        
        if (result.success) {
          console.log('Task created in database:', result.data);
        }
      } catch (error) {
        console.log("Database task creation failed, using local storage instead");
        
        // Fallback to local storage if database fails
        const newTask = {
          id: crypto.randomUUID(),
          task_name: "New Task",
          status: "backlog",
          created_at: new Date().toISOString()
        };
        
        setLocalTasks(prev => [newTask, ...prev]);
        
        result = { 
          success: true, 
          data: newTask 
        };
      }
      
      if (!result || !result.success) {
        console.error('Failed to create task:', result?.error);
        toast({
          title: 'Error creating task',
          description: 'Could not create new task. Please try again.',
          variant: 'destructive'
        });
        return;
      }
      
      console.log('Task created successfully:', result.data);
      
      // Create minimal UI task with the required fields
      const newTask = {
        id: result.data.id,
        name: result.data.title || "New Task",
        startAt: new Date(),
        endAt: new Date(),
        description: result.data.description || "",
        status: todoStatuses[0], // Backlog
        assignees: [],
        assignmentStatus: "accepted",
        creator: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        mentions: [],
        priority: "medium",
        externalFiles: [],
        checklist: []
      };
      
      // Add to UI
      setTasks(prev => [newTask, ...prev]);
      
      // Set as expanded so user can edit in place
      setExpandedTaskId(result.data.id);
      
      // Show feedback to user
      toast({
        title: 'Task created',
        description: 'New task added to Backlog',
      });
    } catch (error) {
      console.error('Error in handleCreateInBacklog:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while creating the task',
        variant: 'destructive'
      });
    }
  };
  // Helper function to extract mentions from text
  const extractMentions = (text: string): { id: string; name: string }[] => {
    if (!text) return [];
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex) || [];
    
    return matches.map(match => {
      const username = match.substring(1); // Remove the @ symbol
      const user = users.find(u => u.name.toLowerCase() === username.toLowerCase());
      return {
        id: user?.id || crypto.randomUUID(),
        name: user?.name || username
      };
    });
  };
  
  // Function to handle selecting a user from the tag dropdown
  const handleSelectTagUser = (user: any) => {
    if (!activeTextareaId) return;
    
    const task = tasks.find(t => t.id === activeTextareaId);
    if (!task) return;
    
    const textarea = taskDescriptionRefs.current[activeTextareaId];
    if (!textarea) return;
    
    // Get current text and cursor position
    const text = task.description || "";
    const caretPos = cursorPosition;
    
    // This is the key fix - we know the @ is at position caretPos-1
    // So we need to replace it and then add our own properly formatted @username
    // This ensures we control the exact format regardless of what triggered the dropdown
    const textBefore = text.substring(0, caretPos-1); // Everything before the @
    const textAfter = text.substring(caretPos); // Everything after the @
    
    // We want to completely replace the @ that triggered this dropdown
    // Insert @username with a space after it
    const newText = textBefore + "@" + user.name + " " + textAfter;
    
    // Update the task description
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === activeTextareaId ? { ...t, description: newText } : t
    ));
    
    // Hide the dropdown
    setShowTagDropdown(false);
    
    // Focus back on the textarea and set cursor position after the inserted @username
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        // Position after the username and space
        const newCursorPos = (caretPos - 1) + user.name.length + 2; // -1 for removed @, +1 for new @, +1 for space
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // Current user (would normally come from auth context)
  const [currentUser, setCurrentUser] = useState(users[0]); // Default to admin user (Sammy)
  const { toast } = useToast();
  
  // Initialize local tasks state
  const [localTasks, setLocalTasks] = useState(() => {
    const storedTasks = localStorage.getItem('kanban_tasks');
    try {
      // Try to get tasks from localStorage
      if (storedTasks) {
        return JSON.parse(storedTasks);
      }
    } catch (error) {
      console.error('Failed to parse tasks from localStorage:', error);
    }
    // Default to initial mock data if nothing in localStorage
    return [];
  });
  
  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kanban_tasks', JSON.stringify(localTasks));
  }, [localTasks]);

  // Try to use database tasks, but fall back to local tasks
  const { tasks: dbTasks, loading, updateTask: updateDbTask, addTask: addDbTask } = useTasks();
  
  // Convert DB tasks to UI tasks format, or use local tasks as fallback
  const uiTasks = useMemo(() => {
    // If we have database tasks, use them
    const tasksToUse = dbTasks.length > 0 ? dbTasks : localTasks;
    
    // If we still have no tasks, initialize with empty array
    if (!tasksToUse || tasksToUse.length === 0) {
      return [];
    }
    
    return tasksToUse.map(dbTask => {
      // Get task name from title or task_name field
      const taskName = dbTask.title || dbTask.task_name || "Unnamed Task";
      
      // Get task status with fallback
      const taskStatus = dbTask.status || 'backlog';
      
      // Find the status object that matches the task's status
      const statusObject = todoStatuses.find(s => 
        s.name.toLowerCase() === taskStatus.toLowerCase() ||
        (s.name === "To Do" && taskStatus === "todo") ||
        (s.name === "In Progress" && taskStatus === "doing")
      ) || todoStatuses[0];

      // Find the assignee in our users list if assigned_to exists
      const assigneeUser = dbTask.assigned_to
        ? users.find(u => u.id === dbTask.assigned_to) || {
            id: dbTask.assigned_to || "",
            name: "Unknown User",
            avatar: '', // Using initials instead of generated avatars,
          }
        : null;

      // Determine assignees array
      const assignees = assigneeUser ? [
        {
          id: assigneeUser.id,
          name: assigneeUser.name,
          avatar: assigneeUser.avatar,
        }
      ] : [];

      // Determine creator (default to current user for now)
      const creator = dbTask.assigned_by
        ? users.find(u => u.id === dbTask.assigned_by) || currentUser
        : currentUser;

      // Extract mentions from description
      const mentions = extractMentions(dbTask.description || "");

      return {
        id: dbTask.id,
        name: taskName,
        startAt: new Date(dbTask.created_at || new Date()),
        endAt: dbTask.due_date ? parseISO(dbTask.due_date) : new Date(dbTask.created_at || new Date()),
        description: dbTask.description || "",
        status: statusObject,
        assignees,
        assignmentStatus: "accepted", // Default for now
        creator: {
          id: creator.id,
          name: creator.name,
          avatar: creator.avatar
        },
        mentions,
        priority: dbTask.priority || "medium",
        externalFiles: [],
        checklist: [
          { id: crypto.randomUUID(), text: "Review requirements", completed: false },
          { id: crypto.randomUUID(), text: "Create wireframes", completed: true },
          { id: crypto.randomUUID(), text: "Get feedback", completed: false },
        ]
      };
    });
  }, [dbTasks, currentUser]);
  
  // Use the converted tasks for our UI
  const [tasks, setTasks] = useState<any[]>([]);
  
  // Update local tasks when database tasks change, but preserve local deletions
  useEffect(() => {
    if (uiTasks.length > 0) {
      // Get IDs of tasks that were permanently deleted
      const deletedTaskIds = new Set(JSON.parse(localStorage.getItem('deleted_task_ids') || '[]'));
      
      // Instead of blindly replacing tasks, merge them while preserving any local deletions
      setTasks(prevTasks => {
        // Get IDs of tasks that are currently in the UI
        const prevTaskIds = new Set(prevTasks.map(task => task.id));
        
        // Filter out any tasks from uiTasks that were manually deleted
        const filteredUiTasks = uiTasks.filter(task => {
          // Skip this task if it's in our deleted tasks list
          if (deletedTaskIds.has(task.id)) {
            return false;
          }
          
          // We want to keep this task if:
          // 1. It's a new task that wasn't in prevTasks, or
          // 2. It was in prevTasks and wasn't deleted
          const isNewTask = !prevTaskIds.has(task.id) && !prevTasks.some(t => t.id === task.id);
          const wasNotDeleted = prevTaskIds.has(task.id);
          
          return isNewTask || wasNotDeleted;
        });
        
        return filteredUiTasks;
      });
    }
  }, [uiTasks]);
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [dueDatePopoverTaskId, setDueDatePopoverTaskId] = useState<string | null>(null);
  const [detailsDueDatePickerOpen, setDetailsDueDatePickerOpen] = useState(false);
  const [sectionSorting, setSectionSorting] = useState<Record<string, 'priority' | 'date'>>({
    Backlog: 'priority',
    'To Do': 'priority',
    'In Progress': 'priority',
    Done: 'priority'
  });
  const id = useId();
  
  // Add click outside handler to close calendar pickers and user tag dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close the date picker popover when clicking outside
      if (dueDatePopoverTaskId !== null || detailsDueDatePickerOpen) {
        const isCalendarClick = target.closest('.rdp') !== null;
        const isButtonClick = target.closest('button') !== null && 
                              target.closest('button')?.closest('.rdp') === null;
        
        if (!isCalendarClick && isButtonClick) {
          setDueDatePopoverTaskId(null);
          setDetailsDueDatePickerOpen(false);
        } else if (!isCalendarClick && !isButtonClick) {
          setDueDatePopoverTaskId(null);
          setDetailsDueDatePickerOpen(false);
        }
      }
      
      // Close tag dropdown when clicking outside
      if (showTagDropdown) {
        const isTagDropdownClick = target.closest('[data-tag-dropdown]') !== null;
        const isTextareaClick = target.tagName === 'TEXTAREA';
        
        if (!isTagDropdownClick && !isTextareaClick) {
          setShowTagDropdown(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dueDatePopoverTaskId, detailsDueDatePickerOpen, showTagDropdown]);

  const handleSort = (sectionName: string) => {
    // Toggle between priority and date sorting
    setSectionSorting(current => ({
      ...current,
      [sectionName]: current[sectionName] === 'priority' ? 'date' : 'priority'
    }));
  };

  // Note: We already defined extractMentions at the top of the component
  
  // Extract hyperlinks and @mentions from text and convert them to clickable links
  const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    
    // First, split by URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    // Process each part for URLs and then for @mentions
    return parts.map((part, index) => {
      // If the part matches our URL regex, render it as a link
      if (part.match(urlRegex)) {
        return (
          <a 
            key={`url-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      
      // Process the non-URL part for @mentions
      const mentionRegex = /@(\w+)/g;
      const mentionParts = part.split(mentionRegex);
      
      if (mentionParts.length === 1) {
        // No @mentions in this part, just return the text
        return part;
      }
      
      // Process @mentions and regular text alternately
      return mentionParts.map((mPart, mIndex) => {
        if (mIndex % 2 === 1) {
          // This is a username (without the @ symbol) - odd indexes in the array
          const user = users.find(u => u.name.toLowerCase() === mPart.toLowerCase());
          return (
            <span 
              key={`mention-${index}-${mIndex}`}
              className="text-blue-600 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              @{mPart}
            </span>
          );
        } else {
          // This is regular text
          return mPart;
        }
      });
    });
  };
  
  // Function to get file type icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case "drive": return "🗄️";
      case "sheet": return "📊";
      case "doc": return "📝";
      case "figma": return "🎨";
      default: return "📄";
    }
  };
  
  // Filter tasks based on view mode
  const getFilteredTasks = () => {
    if (viewMode === 'mine') {
      return tasks.filter(task => 
        task.assignees.some(assignee => assignee.id === currentUser.id) ||
        task.creator.id === currentUser.id
      );
    }
    return tasks;
  };

  const getSortedTasks = (statusName: string) => {
    // First filter by view mode
    const filteredTasks = getFilteredTasks();
    
    // Then filter by status
    const statusTasks = filteredTasks.filter(task => task.status.name === statusName);
    const currentSortingState = sectionSorting[statusName];
    
    if (!currentSortingState) return statusTasks;
    
    return [...statusTasks].sort((a, b) => {
      if (currentSortingState === 'priority') {
        // Sort by priority (High to Low)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - 
               priorityOrder[a.priority as keyof typeof priorityOrder];
      } else {
        // Sort by due date (Earliest to Latest)
        return compareAsc(a.endAt, b.endAt);
      }
    });
  };

  const handleAddTask = async (newTask: any) => {
    // Extract mentions from description
    const mentions = extractMentions(newTask.description);
    
    // Determine assignee based on mentions or selection
    let assigneeId = null;
    if (mentions.length > 0) {
      assigneeId = mentions[0].id;
    } else if (newTask.assignee) {
      assigneeId = newTask.assignee;
    }
    
    // Create task in database
    try {
      const result = await addDbTask({
        title: newTask.name,
        description: newTask.description,
        status: newTask.status?.name.toLowerCase() || 'backlog',
        priority: newTask.priority || 'medium',
        due_date: newTask.endAt ? format(newTask.endAt, 'yyyy-MM-dd') : null,
        assigned_to: assigneeId,
        labels: newTask.labels || []
      });
      
      if (!result.success) {
        console.error('Failed to add task to database');
        return;
      }
      
      // Create the UI version of the task
      const statusObject = todoStatuses.find(s => s.name.toLowerCase() === newTask.status?.name.toLowerCase()) || todoStatuses[0];
      
      // Determine assignees based on mentions or selection
      let assignees = [];
      if (assigneeId) {
        const selectedUser = users.find(u => u.id === assigneeId);
        if (selectedUser) {
          assignees = [{ 
            id: selectedUser.id,
            name: selectedUser.name,
            avatar: selectedUser.avatar,
          }];
        }
      }
      
      // Our task will be available from the database on the next fetch
      // but we'll add it to the UI immediately for better UX
      const formattedTask = {
        ...result.data,
        id: result.data.id,
        name: result.data.title,
        startAt: new Date(result.data.created_at),
        endAt: result.data.due_date ? parseISO(result.data.due_date) : new Date(),
        description: result.data.description || "",
        status: statusObject,
        assignees,
        mentions,
        creator: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        assignmentStatus: assigneeId === currentUser.id ? 'accepted' : 'pending',
        priority: result.data.priority,
        externalFiles: [],
        checklist: [
          { id: crypto.randomUUID(), text: "Review requirements", completed: false },
          { id: crypto.randomUUID(), text: "Create wireframes", completed: false },
          { id: crypto.randomUUID(), text: "Get feedback", completed: false },
        ]
      };
      
      setTasks(prev => [...prev, formattedTask]);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };
  
  // Handle single click to expand card
  const handleCardClick = (task: any) => {
    if (expandedTaskId === task.id) {
      setExpandedTaskId(null); // Collapse if already expanded
    } else {
      setExpandedTaskId(task.id); // Expand the clicked card
      
      // After expanding, ensure the textarea is properly sized
      setTimeout(() => {
        if (taskDescriptionRefs.current[task.id]) {
          const textarea = taskDescriptionRefs.current[task.id];
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
      }, 100);
    }
  };
  
  // Task detail is now opened from expanded view instead of double click
  // Removed handleCardDoubleClick function
  
  // Handle checklist item toggle - will also trigger sort
  const handleChecklistToggle = (taskId: string, itemId: string) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId && task.checklist) {
        // Create a new array for checklist with the toggled item
        const updatedChecklist = task.checklist.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        
        // Sort the checklist to move completed items to the bottom
        const sortedChecklist = [...updatedChecklist].sort((a, b) => {
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;
          return 0;
        });
        
        return {
          ...task,
          checklist: sortedChecklist
        };
      }
      return task;
    }));
  };
  
  // Handle adding new checklist item
  const handleAddChecklistItem = (taskId: string, text: string) => {
    if (!text.trim()) return;
    
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        const newChecklist = [
          ...(task.checklist || []),
          { id: crypto.randomUUID(), text, completed: false }
        ];
        
        return { ...task, checklist: newChecklist };
      }
      return task;
    }));
    
    setNewChecklistItem("");
  };
  
  // Handle editing checklist item
  const handleEditChecklistItem = (taskId: string, itemId: string, newText: string) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId && task.checklist) {
        return {
          ...task,
          checklist: task.checklist.map(item => 
            item.id === itemId ? { ...item, text: newText } : item
          )
        };
      }
      return task;
    }));
  };
  
  // Handle adding a new external file
  const handleAddExternalFile = (taskId: string, newFile: ExternalFile) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          externalFiles: [...(task.externalFiles || []), newFile]
        };
      }
      return task;
    }));
    
    // Update selected task if it's the one being modified
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => ({
        ...prev,
        externalFiles: [...(prev.externalFiles || []), newFile]
      }));
    }
  };
  
  // For tracking which file is being edited
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  
  // No longer tracking file comments - removed that state
  
  // Add state for card comments
  const [cardComments, setCardComments] = useState<Record<string, CardComment[]>>({});
  // Sections visibility state - all collapsed by default
  const [showCardComments, setShowCardComments] = useState<Record<string, boolean>>({});
  
  // For tracking drag and drop of files
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFileId, setDragOverFileId] = useState<string | null>(null);
  
  // State for editing comment text
  const [editedCommentTextMap, setEditedCommentTextMap] = useState<Record<string, string>>({});
    
  // Handle editing an external file
  const handleEditExternalFile = (taskId: string, fileId: string, updatedFile: Partial<ExternalFile>) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId && task.externalFiles) {
        return {
          ...task,
          externalFiles: task.externalFiles.map(file => 
            file.id === fileId ? { ...file, ...updatedFile } : file
          )
        };
      }
      return task;
    }));
    
    // Update selected task if it's the one being modified
    if (selectedTask && selectedTask.id === taskId && selectedTask.externalFiles) {
      setSelectedTask(prev => ({
        ...prev,
        externalFiles: prev.externalFiles?.map(file => 
          file.id === fileId ? { ...file, ...updatedFile } : file
        )
      }));
    }
  };
  
  // Handle adding a comment to a file
  const handleAddFileComment = (taskId: string, fileId: string, commentText: string) => {
    if (!commentText.trim()) return;
    
    const newComment: FileComment = {
      id: crypto.randomUUID(),
      user: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      text: commentText,
      timestamp: "Just now"
    };
    
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId && task.externalFiles) {
        return {
          ...task,
          externalFiles: task.externalFiles.map(file => {
            if (file.id === fileId) {
              return {
                ...file,
                comments: [...(file.comments || []), newComment]
              };
            }
            return file;
          })
        };
      }
      return task;
    }));
    
    // Update selected task if it's the one being modified
    if (selectedTask && selectedTask.id === taskId && selectedTask.externalFiles) {
      setSelectedTask(prev => ({
        ...prev,
        externalFiles: prev.externalFiles?.map(file => {
          if (file.id === fileId) {
            return {
              ...file,
              comments: [...(file.comments || []), newComment]
            };
          }
          return file;
        })
      }));
    }
  };
  
  // Handle adding a comment to the card
  const handleAddCardComment = (taskId: string, commentText: string) => {
    if (!commentText.trim()) return;
    
    const newComment: CardComment = {
      id: crypto.randomUUID(),
      user: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      text: commentText,
      timestamp: "Just now"
    };
    
    // Create a new comments array or append to existing one
    setCardComments(prev => {
      const updatedComments = {
        ...prev,
        [taskId]: [...(prev[taskId] || []), newComment]
      };
      
      // Make sure comments section is expanded when adding a comment
      setShowCardComments(prevState => ({
        ...prevState,
        [`comments_${taskId}`]: true
      }));
      
      return updatedComments;
    });
  };
  
  // Handle reordering files with drag and drop
  const handleFileReorder = (taskId: string, sourceIndex: number, destinationIndex: number) => {
    if (sourceIndex === destinationIndex) return;
    
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId && task.externalFiles) {
        const newFiles = [...task.externalFiles];
        const [removed] = newFiles.splice(sourceIndex, 1);
        newFiles.splice(destinationIndex, 0, removed);
        
        return {
          ...task,
          externalFiles: newFiles
        };
      }
      return task;
    }));
    
    // Update selected task if it's the one being modified
    if (selectedTask && selectedTask.id === taskId && selectedTask.externalFiles) {
      setSelectedTask(prev => {
        if (!prev.externalFiles) return prev;
        
        const newFiles = [...prev.externalFiles];
        const [removed] = newFiles.splice(sourceIndex, 1);
        newFiles.splice(destinationIndex, 0, removed);
        
        return {
          ...prev,
          externalFiles: newFiles
        };
      });
    }
  };
  
  // Handle clicking outside a file container to close edit mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingFileId !== null) {
        const target = event.target as HTMLElement;
        const fileContainer = target.closest('.file-container');
        
        // If click is outside any file container
        if (!fileContainer || fileContainer.getAttribute('data-file-id') !== editingFileId) {
          setEditingFileId(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingFileId]);
  
  // Handle deleting an external file
  const handleDeleteExternalFile = (taskId: string, fileId: string) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId && task.externalFiles) {
        return {
          ...task,
          externalFiles: task.externalFiles.filter(file => file.id !== fileId)
        };
      }
      return task;
    }));
    
    // Update selected task if it's the one being modified
    if (selectedTask && selectedTask.id === taskId && selectedTask.externalFiles) {
      setSelectedTask(prev => ({
        ...prev,
        externalFiles: prev.externalFiles?.filter(file => file.id !== fileId)
      }));
    }
  };
  
  // Handle deleting checklist item
  const handleDeleteChecklistItem = (taskId: string, itemId: string) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId && task.checklist) {
        return {
          ...task,
          checklist: task.checklist.filter(item => item.id !== itemId)
        };
      }
      return task;
    }));
  };
  
  // Cycle through priority levels
  const handlePriorityChange = async (taskId: string) => {
    const priorityOrder = ['high', 'medium', 'low'] as const;
    
    // Find current task and determine next priority
    const currentTask = tasks.find(task => task.id === taskId);
    if (!currentTask) return;
    
    const currentIndex = priorityOrder.indexOf(currentTask.priority as any);
    const nextIndex = (currentIndex + 1) % priorityOrder.length;
    const newPriority = priorityOrder[nextIndex];
    
    try {
      // Update in database
      const result = await updateDbTask(taskId, {
        priority: newPriority
      });
      
      if (!result.success) {
        console.error('Failed to update task priority in database');
        return;
      }
      
      // Update in UI
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
          return { ...task, priority: newPriority };
        }
        return task;
      }));
    } catch (error) {
      console.error('Error updating task priority:', error);
    }
  };
  
  // Handle description edit
  const handleDescriptionEdit = async (taskId: string, newDescription: string) => {
    try {
      // Check if the taskId is valid
      if (!taskId) {
        console.error('Invalid task ID for description update');
        return;
      }
      
      // Ensure we have the task in state before attempting to update
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found for description update');
        return;
      }
      
      // Update the task in the database with the correct field name
      const result = await updateDbTask(taskId, {
        task_description: newDescription
      });
      
      if (!result.success) {
        console.error('Failed to update task description in database');
        return;
      }
      
      // Update the UI state as well, to make sure they're in sync
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, description: newDescription } : t
      ));
      
      console.log('Description successfully saved for task:', taskId);
      return true;
    } catch (error) {
      console.error('Error updating task description:', error);
      return false;
    }
  };
  
  // Handle name edit
  const handleNameEdit = async (taskId: string, newName: string) => {
    try {
      // Update the task in the database using the correct field name
      const result = await updateDbTask(taskId, {
        task_name: newName
      });
      
      if (!result.success) {
        console.error('Failed to update task name in database');
        return;
      }
      
      // Update in the UI
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, name: newName } : task
      ));
    } catch (error) {
      console.error('Error updating task name:', error);
    }
  };
  
  // Handle due date edit
  const handleDueDateEdit = async (taskId: string, dateString: string) => {
    try {
      // Create a proper date object that respects timezone
      const [year, month, day] = dateString.split('-').map(Number);
      const newDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
      
      // Update the task in the database
      const result = await updateDbTask(taskId, {
        due_date: format(newDate, 'yyyy-MM-dd')
      });
      
      if (!result.success) {
        console.error('Failed to update due date in database');
        return;
      }
      
      // Update in the UI
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
          return { 
            ...task, 
            endAt: newDate 
          };
        }
        return task;
      }));
    } catch (error) {
      console.error('Error updating due date:', error);
    }
  };
  
  // Handle assignment status change
  const handleAssignmentStatusChange = (taskId: string, status: 'accepted' | 'rejected') => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, assignmentStatus: status } 
          : task
      )
    );
    
    // Update the selected task if it's the one being updated
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => ({ ...prev, assignmentStatus: status }));
    }
  };
  
  // Handle updating a task
  const handleTaskUpdate = async (updatedTask: any) => {
    try {
      // Update in database
      const result = await updateDbTask(updatedTask.id, {
        title: updatedTask.name,
        description: updatedTask.description,
        status: updatedTask.status.name.toLowerCase(),
        priority: updatedTask.priority,
        due_date: updatedTask.endAt ? format(new Date(updatedTask.endAt), 'yyyy-MM-dd') : null,
        assigned_to: updatedTask.assignees?.[0]?.id || null
      });
      
      if (!result.success) {
        console.error('Failed to update task in database');
        return;
      }
      
      // Update in UI
      setTasks(prev => 
        prev.map(task => 
          task.id === updatedTask.id 
            ? updatedTask
            : task
        )
      );
      setSelectedTask(updatedTask);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // handleDragEnd removed - no longer using drag and drop

  return (
    <div className="flex flex-col flex-1 p-2 sm:p-4 rounded-none md:rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <h1 className="text-xl font-semibold">To-Do-List Board</h1>
          
          {/* Current user selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <TaskUserAvatar user={currentUser} size="md" />
                <span className="text-sm hidden sm:inline">
                  {currentUser.name} ({currentUser.role})
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0">
              <div className="p-2 font-medium border-b">Switch User</div>
              <div className="py-2">
                {users.map(user => (
                  <div 
                    key={user.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted transition-colors",
                      currentUser.id === user.id && "bg-muted"
                    )}
                    onClick={() => setCurrentUser(user)}
                  >
                    <TaskUserAvatar user={user} size="sm" />
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-md p-0.5">
            <Button 
              size="sm" 
              variant={viewMode === 'all' ? 'default' : 'ghost'}
              onClick={() => setViewMode('all')}
              className="h-8"
            >
              All Tasks
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'mine' ? 'default' : 'ghost'}
              onClick={() => setViewMode('mine')}
              className="h-8"
            >
              My Tasks
            </Button>
          </div>

          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Filters">
                <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-3">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Filters</div>
                <form className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox id={`${id}-1`} />
                    <Label htmlFor={`${id}-1`} className="font-normal">
                      High Priority
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id={`${id}-2`} />
                    <Label htmlFor={`${id}-2`} className="font-normal">
                      Medium Priority
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id={`${id}-3`} />
                    <Label htmlFor={`${id}-3`} className="font-normal">
                      Low Priority
                    </Label>
                  </div>
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    className="-mx-3 my-1 h-px bg-border"
                  ></div>
                  <div className="flex justify-between gap-2">
                    <Button size="sm" variant="outline" className="h-7 px-2">
                      Clear
                    </Button>
                    <Button size="sm" className="h-7 px-2">
                      Apply
                    </Button>
                  </div>
                </form>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* New task button */}
          <Button 
            variant="outline" 
            size="icon" 
            aria-label="Add new task"
            onClick={() => handleCreateInBacklog()}
          >
            <PlusIcon size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </div>
      
      {/* User tag dropdown */}
      {showTagDropdown && (
        <div 
          data-tag-dropdown="true"
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 w-60 max-h-60 overflow-y-auto"
          style={{ 
            top: tagDropdownPosition.top, 
            left: tagDropdownPosition.left 
          }}
        >
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Tag a user
            </div>
          </div>
          <div className="p-1">
            {users.map(user => (
              <div 
                key={user.id}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                onClick={() => handleSelectTagUser(user)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4">
          {todoStatuses.map((status) => (
            <div key={status.name} className="flex-1 min-w-[300px]">
              <div 
                className="rounded-lg border p-2 mb-2"
                style={{ backgroundColor: status.color + '20', borderColor: status.color }}
              >
                <div className="flex items-center justify-between w-full">
                  <h3 className="font-semibold text-sm">{status.name}</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleSort(status.name)}
                        >
                          {sectionSorting[status.name] === 'priority' ? (
                            <ArrowDownWideNarrow className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="end" className="text-xs">
                        <p className="font-medium">
                          {sectionSorting[status.name] === 'priority' ? 'Sorted by Priority' : 'Sorted by Due Date'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="space-y-2">
                {getSortedTasks(status.name)
                  .map((task, index) => (
                    <div
                      key={task.id}
                      className="bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCardClick(task)}
                    >
                      <div 
                        className="flex flex-col cursor-pointer"
                      >
                        {/* Status indicator for pending tasks - full width red bar */}
                        {task.assignmentStatus === 'pending' && (
                          <div className="w-full bg-red-600 text-white text-[0.65rem] py-0.5 font-medium text-center cursor-move">
                            Action Required
                          </div>
                        )}
                        
                        {/* Status indicator for self-added tasks - orange "My Task" bar */}
                        {task.creator?.id === currentUser.id && task.assignmentStatus !== 'pending' && (
                          <div className="w-full bg-orange-500 text-white text-[0.65rem] py-0.5 font-medium text-center cursor-move">
                            My Task
                          </div>
                        )}
                        
                        {/* Fallback for cards without a status bar */}
                        {!(task.assignmentStatus === 'pending' || task.creator?.id === currentUser.id) && (
                          <div className="w-full h-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 cursor-move" />
                        )}
                        
                        <div className="p-2">
                          <div className="flex items-start justify-between group/card">
                          <div className="flex flex-col gap-1 flex-1">
                            {expandedTaskId === task.id ? (
                              <input
                                type="text"
                                value={task.name}
                                onChange={(e) => handleNameEdit(task.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="m-0 pl-1 font-medium text-left min-h-[2rem] leading-tight w-full text-[clamp(0.84rem,0.84vw,1.05rem)] border-none bg-transparent py-0 focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              <p className="m-0 pl-1 font-medium text-left min-h-[2rem] leading-tight line-clamp-2 text-[clamp(0.84rem,0.84vw,1.05rem)] group-hover/card:text-[clamp(0.95rem,0.95vw,1.2rem)] transition-all duration-200">
                                {task.name}
                              </p>
                            )}
                          </div>
                          <div className="flex -space-x-1">
                            {task.assignees && task.assignees.length > 0 ? (
                              <>
                                {/* Show only first 3 avatars */}
                                {task.assignees.slice(0, 3).map((assignee, index) => (
                                  <TooltipProvider key={index}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <TaskUserAvatar 
                                          user={assignee} 
                                          size={expandedTaskId === task.id ? 'sm' : 'xs'} 
                                          className="border border-background transition-all" 
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="end" className="p-2 text-xs">
                                        {assignee.name}
                                        <div className="text-muted-foreground">
                                          {task.creator?.id === assignee.id ? 'Creator' : 'Assignee'}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                                
                                {/* Show +N indicator if there are more than 3 assignees */}
                                {task.assignees.length > 3 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Avatar className={`border border-background ${expandedTaskId === task.id ? 'h-6 w-6' : 'h-4 w-4'} transition-all bg-primary text-primary-foreground`}>
                                          <AvatarFallback className="text-[0.6rem]">
                                            +{task.assignees.length - 3}
                                          </AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="end" className="p-2 text-xs">
                                        {task.assignees.slice(3).map(assignee => assignee.name).join(', ')}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                
                                {/* Join collaboration button - only show if current user isn't assigned and card is expanded */}
                                {expandedTaskId === task.id && 
                                !task.assignees.some(assignee => assignee.id === currentUser.id) && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Avatar 
                                          className="border border-background h-6 w-6 bg-muted hover:bg-primary/20 cursor-pointer transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Add current user to assignees
                                            setTasks(prevTasks => prevTasks.map(t => {
                                              if (t.id === task.id) {
                                                return {
                                                  ...t,
                                                  assignees: [...t.assignees, {
                                                    id: currentUser.id,
                                                    name: currentUser.name,
                                                    avatar: currentUser.avatar
                                                  }],
                                                  assignmentStatus: 'accepted'
                                                };
                                              }
                                              return t;
                                            }));
                                          }}
                                        >
                                          <AvatarFallback>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M12 5v14M5 12h14"/>
                                            </svg>
                                          </AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="end" className="p-2 text-xs">
                                        Join collaboration
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </>
                            ) : (
                              <Avatar className={`border border-background ${expandedTaskId === task.id ? 'h-6 w-6' : 'h-4 w-4'} transition-all`}>
                                <AvatarFallback>??</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                          
                          {/* Description section - editable when expanded */}
                          {expandedTaskId === task.id ? (
                            <div className="px-1 py-1 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 rounded-md m-1" onClick={(e) => e.stopPropagation()}>
                              <div className="text-[0.65rem] text-muted-foreground mb-1 px-1 flex justify-between items-center">
                                <span>Description:</span>
                                <button 
                                  type="button"
                                  className="h-5 text-[0.65rem] px-2 py-0 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium"
                                  onClick={(e) => {
                                    // Stop propagation first
                                    e.stopPropagation();
                                    e.preventDefault();
                                    
                                    console.log("Saving task description:", task.id, task.description);
                                    
                                    // Use simpler, more direct approach with plain Supabase
                                    supabase
                                      .from('gig_tasks')
                                      .update({ task_description: task.description || "" })
                                      .eq('id', task.id)
                                      .then(response => {
                                        console.log("Supabase response:", response);
                                        
                                        if (!response.error) {
                                          // Show success message
                                          toast({
                                            title: "Description saved",
                                            description: "Your changes have been saved",
                                            duration: 2000
                                          });
                                          
                                          // Collapse the card by clearing the expandedTaskId
                                          setExpandedTaskId(null);
                                        } else {
                                          // Show error message
                                          console.error("Supabase error:", response.error);
                                          toast({
                                            title: "Error saving",
                                            description: response.error.message || "Database error",
                                            variant: "destructive",
                                            duration: 2000
                                          });
                                        }
                                      })
                                      .catch(err => {
                                        console.error("Fatal error:", err);
                                        toast({
                                          title: "Error saving",
                                          description: "There was a problem saving your changes",
                                          variant: "destructive",
                                          duration: 2000
                                        });
                                      });
                                  }}
                                >
                                  Save
                                </button>
                              </div>
                              <textarea
                                ref={el => {
                                  if (el) taskDescriptionRefs.current[task.id] = el;
                                }}
                                value={task.description || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Only update local state, not the database
                                  setTasks(prevTasks => prevTasks.map(t => 
                                    t.id === task.id ? { ...t, description: value } : t
                                  ));
                                  
                                  // Auto-resize the textarea
                                  if (taskDescriptionRefs.current[task.id]) {
                                    const textarea = taskDescriptionRefs.current[task.id];
                                    textarea.style.height = 'auto';
                                    textarea.style.height = `${textarea.scrollHeight}px`;
                                  }
                                }}
                                onKeyDown={(e) => {
                                  // Prevent event bubbling for ALL key events
                                  e.stopPropagation();
                                  
                                  // Handle @ for tagging
                                  if (e.key === '@') {
                                    const textarea = e.target as HTMLTextAreaElement;
                                    const rect = textarea.getBoundingClientRect();
                                    
                                    // This is critical - we need to capture the EXACT cursor position when @ is typed
                                    // This will ensure we know exactly where to replace the text later
                                    const cursorPos = textarea.selectionStart + 1; // +1 because @ is being added
                                    setCursorPosition(cursorPos);
                                    
                                    // Find cursor position coordinates
                                    const textBeforeCursor = textarea.value.substring(0, cursorPos-1) + '@';
                                    const dummySpan = document.createElement('span');
                                    dummySpan.textContent = textBeforeCursor;
                                    dummySpan.style.font = window.getComputedStyle(textarea).font;
                                    dummySpan.style.whiteSpace = 'pre-wrap';
                                    dummySpan.style.wordBreak = 'break-word';
                                    dummySpan.style.position = 'absolute';
                                    dummySpan.style.visibility = 'hidden';
                                    dummySpan.style.width = `${textarea.clientWidth}px`;
                                    document.body.appendChild(dummySpan);
                                    
                                    const spanRect = dummySpan.getBoundingClientRect();
                                    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
                                    document.body.removeChild(dummySpan);
                                    
                                    // Calculate lines
                                    const textareaLineHeight = lineHeight || 18; // fallback
                                    const lines = textBeforeCursor.split('\n').length;
                                    
                                    // Calculate position
                                    setTagDropdownPosition({
                                      top: rect.top + (lines * textareaLineHeight) + 20,
                                      left: rect.left + 20
                                    });
                                    
                                    setActiveTextareaId(task.id);
                                    setTagSearchText("");
                                    setShowTagDropdown(true);
                                  }
                                  
                                  // Close dropdown on escape
                                  if (e.key === 'Escape' && showTagDropdown) {
                                    e.preventDefault();
                                    setShowTagDropdown(false);
                                  }
                                  
                                  // Handle Enter key to submit with Shift+Enter
                                  if (e.key === 'Enter' && e.shiftKey) {
                                    e.preventDefault();
                                    handleDescriptionEdit(task.id, task.description || "");
                                    toast({
                                      title: "Description saved",
                                      description: "Your changes have been saved",
                                      duration: 2000
                                    });
                                  }
                                }}
                                className="w-full text-xs mb-1 py-1 px-2 bg-white dark:bg-slate-900 
                                  focus-visible:ring-1 focus-visible:ring-primary min-h-[80px] 
                                  rounded-md border border-input resize-none"
                                placeholder="Add description..."
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="text-[0.6rem] text-muted-foreground px-1">
                                <span>Use @ to mention users</span>
                              </div>
                            </div>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="px-1">
                                    <p className="text-[0.65rem] text-muted-foreground text-left w-full overflow-hidden line-clamp-1">
                                      {renderTextWithLinks(task.description)}
                                    </p>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="start" className="max-w-md">
                                  <p className="text-sm">{renderTextWithLinks(task.description)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {/* Priority indicator - only clickable when expanded */}
                          <div className="flex justify-center w-full mt-1 group-hover/card:mt-2">
                            {expandedTaskId === task.id ? (
                              <div className="relative w-full">
                                <button 
                                  className={`w-full text-center py-1 rounded text-[clamp(0.625rem,0.6vw,0.75rem)] ${priorityColors[task.priority as keyof typeof priorityColors]} cursor-pointer group/priority relative`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePriorityChange(task.id);
                                  }}
                                >
                                  <span>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</span>
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/priority:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 20V4"/>
                                      <path d="M5 11l7-7 7 7"/>
                                    </svg>
                                  </div>
                                </button>
                                <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-muted-foreground opacity-0 group-hover/priority:opacity-100 pointer-events-none transition-opacity">
                                  Click to change priority
                                </div>
                              </div>
                            ) : (
                              <div className={`w-full text-center py-1 rounded text-[clamp(0.625rem,0.6vw,0.75rem)] ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 px-1 flex items-center justify-between text-[clamp(0.625rem,0.6vw,0.75rem)] text-muted-foreground text-left group-hover/card:text-[clamp(0.75rem,0.75vw,0.9rem)]">
                            {expandedTaskId === task.id ? (
                              <div className="relative group/date flex items-center">
                                <button
                                  type="button"
                                  className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-md hover:bg-muted/60 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDueDatePopoverTaskId(dueDatePopoverTaskId === task.id ? null : task.id);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                    <line x1="16" x2="16" y1="2" y2="6" />
                                    <line x1="8" x2="8" y1="2" y2="6" />
                                    <line x1="3" x2="21" y1="10" y2="10" />
                                  </svg>
                                  <span>{format(task.endAt, 'MMM d, yyyy')}</span>
                                </button>
                                
                                {dueDatePopoverTaskId === task.id && (
                                  <div 
                                    className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-lg shadow-md overflow-hidden"
                                    onClick={(e) => e.stopPropagation()} // Prevent clicks from closing the card
                                  >
                                    <div className="w-fit p-1 bg-background">
                                      <div className="flex justify-between items-center px-3 py-2 border-b">
                                        <div className="font-medium">Select Due Date</div>
                                        <button 
                                          type="button" 
                                          className="text-muted-foreground hover:text-foreground" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDueDatePopoverTaskId(null);
                                          }}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                      <CalendarPicker
                                        selected={task.endAt}
                                        onSelect={(date) => {
                                          if (date) {
                                            handleDueDateEdit(task.id, format(date, 'yyyy-MM-dd'));
                                            // Keep the popover open until explicitly closed by the user
                                            // setDueDatePopoverTaskId(null); - removed to prevent card collapse on month change
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                  <line x1="16" x2="16" y1="2" y2="6" />
                                  <line x1="8" x2="8" y1="2" y2="6" />
                                  <line x1="3" x2="21" y1="10" y2="10" />
                                </svg>
                                <span className="text-[clamp(0.625rem,0.6vw,0.75rem)]">Due {format(task.endAt, 'MMM d')}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              <span>{task.creator?.name || 'Unknown'}</span>
                            </div>
                          </div>
                          
                          {/* Expanded content - only shown when card is expanded */}
                          <div 
                            className={cn(
                              "overflow-hidden transition-all duration-300 mt-2 border-t pt-2 relative",
                              expandedTaskId === task.id ? "max-h-[450px]" : "max-h-0"
                            )}
                            onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking inside expanded content
                          >
                            {/* Remove button - only visible when expanded */}
                            {expandedTaskId === task.id && (
                              <button
                                className="absolute bottom-0 right-0 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded-tl-md transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Delete the task
                                  setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
                                  // Remove from local storage too if present
                                  setLocalTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
                                  
                                  // Also track this task ID as permanently deleted to prevent it from reappearing
                                  const deletedTaskIds = JSON.parse(localStorage.getItem('deleted_task_ids') || '[]');
                                  deletedTaskIds.push(task.id);
                                  localStorage.setItem('deleted_task_ids', JSON.stringify(deletedTaskIds));
                                  // Collapse the card
                                  setExpandedTaskId(null);
                                  
                                  // Show notification
                                  toast({
                                    title: "Task removed",
                                    description: "The task has been successfully removed",
                                  });
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                              </button>
                            )}
                            
                            {/* External Files Section */}
                            <div className="mb-3">
                              <div 
                                className="flex items-center justify-between mb-1 px-2 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Toggle the visibility of files
                                  const fileDisplayState = {...showCardComments};
                                  fileDisplayState[`files_${task.id}`] = !fileDisplayState[`files_${task.id}`];
                                  setShowCardComments(fileDisplayState);
                                }}
                              >
                                <div className="text-[clamp(0.625rem,0.6vw,0.75rem)] font-medium flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                  Linked Files
                                  {task.externalFiles && task.externalFiles.length > 0 && (
                                    <div className="text-[clamp(0.625rem,0.6vw,0.75rem)] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full px-1.5 ml-1">
                                      {task.externalFiles.length}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Add a new file with default values
                                      handleAddExternalFile(task.id, {
                                        id: crypto.randomUUID(),
                                        name: "New Document",
                                        type: "doc",
                                        url: "https://docs.google.com/",
                                        lastModified: "Just now"
                                      });
                                      // Ensure files section is expanded when adding a new file
                                      const fileDisplayState = {...showCardComments};
                                      fileDisplayState[`files_${task.id}`] = true;
                                      setShowCardComments(fileDisplayState);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                      <line x1="12" y1="5" x2="12" y2="19"></line>
                                      <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    <span className="sr-only">Add file</span>
                                  </Button>
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="10" 
                                    height="10" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    className={`transition-transform ${showCardComments[`files_${task.id}`] ? 'rotate-180' : ''}`}
                                  >
                                    <path d="m6 9 6 6 6-6"/>
                                  </svg>
                                </div>
                              </div>
                              
                              {/* Files content - conditionally visible */}
                              {showCardComments[`files_${task.id}`] === true && (
                                <div className="space-y-1.5 max-h-28 overflow-y-auto px-2">
                                  {task.externalFiles && task.externalFiles.length > 0 ? (
                                    task.externalFiles.map((file) => (
                                    <div 
                                      key={file.id}
                                      data-file-id={file.id}
                                      className={`p-1.5 rounded ${editingFileId === file.id ? 'bg-muted' : 'bg-muted/30 hover:bg-muted/50'} border ${dragOverFileId === file.id ? 'border-primary' : 'border-transparent'} transition-colors group relative file-container`}
                                      onClick={() => setEditingFileId(file.id)}
                                      draggable={true}
                                      onDragStart={(e) => {
                                        setIsDraggingFile(true);
                                        setDraggedFileId(file.id);
                                        // Required for Firefox
                                        e.dataTransfer.setData('text/plain', file.id);
                                        // Add a drag ghost image
                                        const dragGhost = document.createElement('div');
                                        dragGhost.classList.add('bg-background', 'border', 'rounded', 'p-1', 'text-xs', 'shadow-md');
                                        dragGhost.textContent = file.name;
                                        dragGhost.style.position = 'absolute';
                                        dragGhost.style.top = '-1000px';
                                        document.body.appendChild(dragGhost);
                                        e.dataTransfer.setDragImage(dragGhost, 0, 0);
                                        setTimeout(() => document.body.removeChild(dragGhost), 0);
                                      }}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        if (draggedFileId !== file.id) {
                                          setDragOverFileId(file.id);
                                        }
                                      }}
                                      onDragLeave={() => {
                                        setDragOverFileId(null);
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedFileId && draggedFileId !== file.id) {
                                          // Find the indices to reorder
                                          const fileIndex = task.externalFiles?.findIndex(f => f.id === draggedFileId) ?? -1;
                                          const targetIndex = task.externalFiles?.findIndex(f => f.id === file.id) ?? -1;
                                          if (fileIndex !== -1 && targetIndex !== -1) {
                                            handleFileReorder(task.id, fileIndex, targetIndex);
                                          }
                                        }
                                        setIsDraggingFile(false);
                                        setDraggedFileId(null);
                                        setDragOverFileId(null);
                                      }}
                                    >
                                      {/* Drag handle */}
                                      <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 hover:opacity-100 p-0.5 cursor-grab">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <circle cx="9" cy="5" r="1"/>
                                          <circle cx="9" cy="12" r="1"/>
                                          <circle cx="9" cy="19" r="1"/>
                                          <circle cx="15" cy="5" r="1"/>
                                          <circle cx="15" cy="12" r="1"/>
                                          <circle cx="15" cy="19" r="1"/>
                                        </svg>
                                      </div>
                                      
                                      {/* Non-edit mode view */}
                                      {editingFileId !== file.id ? (
                                        <div>
                                          <div className="flex items-center justify-between ml-4">
                                            <div className="text-[clamp(0.625rem,0.6vw,0.75rem)] font-medium truncate flex-1">{file.name}</div>
                                            <div className="flex items-center gap-1">
                                              {/* Link button */}
                                              <a 
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-4 w-4 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                  <polyline points="15 3 21 3 21 9" />
                                                  <line x1="10" y1="14" x2="21" y2="3" />
                                                </svg>
                                              </a>
                                            </div>
                                          </div>
                                          
                                        </div>
                                      ) : (
                                        /* Edit mode view */
                                        <div className="ml-4">
                                          <div className="flex items-center justify-between mb-1">
                                            <input
                                              type="text"
                                              value={file.name}
                                              onChange={(e) => {
                                                handleEditExternalFile(task.id, file.id, { name: e.target.value });
                                              }}
                                              className="flex-1 text-[clamp(0.625rem,0.6vw,0.75rem)] font-medium border-none bg-transparent py-0 h-4 focus:ring-1 focus:ring-primary"
                                              onClick={(e) => e.stopPropagation()}
                                              autoFocus
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-4 w-4 p-0 text-destructive"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteExternalFile(task.id, file.id);
                                              }}
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                                <path d="M18 6L6 18M6 6l12 12"/>
                                              </svg>
                                              <span className="sr-only">Delete</span>
                                            </Button>
                                          </div>
                                          <input
                                            type="text"
                                            value={file.url}
                                            placeholder="https://"
                                            onChange={(e) => {
                                              handleEditExternalFile(task.id, file.id, { url: e.target.value });
                                            }}
                                            className="w-full text-[0.6rem] text-muted-foreground border rounded px-1 py-0.5 h-5 focus:ring-1 focus:ring-primary"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ))
                                  ) : (
                                    <div className="text-[clamp(0.625rem,0.6vw,0.75rem)] text-muted-foreground p-1.5 text-center">
                                      No linked files yet. Click + to add one.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Checklist Section */}
                            <div className="mb-2">
                              <div 
                                className="flex items-center justify-between mb-1 px-2 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Toggle the visibility of checklist
                                  const checklistDisplayState = {...showCardComments};
                                  checklistDisplayState[`checklist_${task.id}`] = !checklistDisplayState[`checklist_${task.id}`];
                                  setShowCardComments(checklistDisplayState);
                                }}
                              >
                                <div className="text-[clamp(0.625rem,0.6vw,0.75rem)] font-medium flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                  </svg>
                                  Checklist
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-[clamp(0.625rem,0.6vw,0.75rem)] text-muted-foreground">
                                    {task.checklist?.filter(item => item.completed).length || 0}/{task.checklist?.length || 0}
                                  </div>
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="10" 
                                    height="10" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    className={`transition-transform ${showCardComments[`checklist_${task.id}`] ? 'rotate-180' : ''}`}
                                  >
                                    <path d="m6 9 6 6 6-6"/>
                                  </svg>
                                </div>
                              </div>
                              
                              {/* Checklist content - conditionally visible */}
                              {showCardComments[`checklist_${task.id}`] === true && (
                                <>
                                  {/* Checklist items - auto-sort completed items to bottom */}
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto mb-2 px-2">
                                    {task.checklist?.sort((a, b) => {
                                      // Sort completed items to the bottom
                                      if (a.completed && !b.completed) return 1;
                                      if (!a.completed && b.completed) return -1;
                                      return 0;
                                    }).map((item) => (
                                      <div key={item.id} className="flex items-start gap-2 group text-xs">
                                        <div className="flex-shrink-0 self-start mt-[2px]">
                                          <Checkbox 
                                            id={`checklist-${task.id}-${item.id}`}
                                            checked={item.completed}
                                            onCheckedChange={() => handleChecklistToggle(task.id, item.id)}
                                            className="rounded-full data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <textarea
                                            id={`checklist-textarea-${task.id}-${item.id}`}
                                            value={item.text}
                                            onChange={(e) => handleEditChecklistItem(task.id, item.id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onFocus={(e) => e.stopPropagation()}
                                            className={cn(
                                              "w-full text-[0.7rem] border-none bg-transparent pt-[2px] leading-normal focus:ring-0 focus:outline-none resize-none overflow-hidden",
                                              item.completed && "line-through text-muted-foreground"
                                            )}
                                            style={{ height: 'auto' }}
                                            onInput={(e) => {
                                              const target = e.target as HTMLTextAreaElement;
                                              target.style.height = 'auto';
                                              target.style.height = `${target.scrollHeight}px`;
                                            }}
                                            rows={1}
                                          />
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-start mt-[2px]"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteChecklistItem(task.id, item.id);
                                          }}
                                        >
                                          <span className="sr-only">Delete</span>
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                            <path d="M18 6L6 18M6 6l12 12"/>
                                          </svg>
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Add new checklist item */}
                                  <div className="flex items-center gap-2 px-2">
                                      <input
                                          type="text"
                                          placeholder="Add new item..."
                                          value={newChecklistItem}
                                          onChange={(e) => setNewChecklistItem(e.target.value)}
                                          className="w-full text-[clamp(0.625rem,0.6vw,0.75rem)] bg-muted/50 border-none rounded h-6 py-1 px-2 focus:ring-1 focus:ring-primary"
                                          onClick={(e) => e.stopPropagation()}
                                          onFocus={(e) => e.stopPropagation()}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.stopPropagation();
                                              handleAddChecklistItem(task.id, newChecklistItem);
                                            }
                                          }}
                                      />
                                      <Button
                                          type="button"
                                          size="sm"
                                          className="h-6 px-2 text-[clamp(0.625rem,0.6vw,0.75rem)]"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddChecklistItem(task.id, newChecklistItem);
                                          }}
                                      >
                                          Add
                                      </Button>
                                  </div>
                                </>
                              )}
                            </div>
                            {/* Comments Section - Moved to bottom */}
                            <div className="mt-2 mb-2 px-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCardComments({
                                    ...showCardComments,
                                    [`comments_${task.id}`]: !showCardComments[`comments_${task.id}`]
                                  });
                                }}
                                className="w-full flex items-center justify-between text-[0.65rem] p-1 bg-blue-50 hover:bg-blue-100 rounded-sm border border-blue-200 transition-colors mb-1"
                              >
                                <div className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                  </svg>
                                  <span>Comments</span>
                                  {cardComments[task.id]?.length > 0 && (
                                    <span className="bg-blue-500 text-white text-[0.6rem] w-4 h-4 flex items-center justify-center rounded-full">
                                      {cardComments[task.id]?.length}
                                    </span>
                                  )}
                                </div>
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="10" 
                                  height="10" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                  className={`transition-transform ${showCardComments[`comments_${task.id}`] ? 'rotate-180' : ''}`}
                                >
                                  <path d="m6 9 6 6 6-6"/>
                                </svg>
                              </button>
                              
                              {showCardComments[`comments_${task.id}`] === true && (
                                <div className="mt-1 space-y-2 max-h-32 overflow-y-auto pb-2">
                                  {cardComments[task.id]?.length > 0 ? (
                                    cardComments[task.id].map(comment => {
                                      // State for edit mode
                                      const isEditingComment = editingFileId === `comment_${comment.id}`;
                                      const commentKey = `${task.id}_${comment.id}`;
                                      // Initialize the edit text if needed
                                      if (isEditingComment && !editedCommentTextMap[commentKey]) {
                                        setEditedCommentTextMap(prev => ({
                                          ...prev,
                                          [commentKey]: comment.text
                                        }));
                                      }
                                      const editedCommentText = editedCommentTextMap[commentKey] || comment.text;
                                      
                                      return (
                                        <div key={comment.id} className="w-full p-1.5 text-[0.65rem] bg-blue-50/50 rounded-sm border border-blue-100">
                                          <div className="flex items-start gap-1.5">
                                            <Avatar className="h-4 w-4 flex-shrink-0 mt-0.5">
                                              <AvatarImage src={comment.user.avatar} />
                                              <AvatarFallback>{comment.user.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                              <div className="font-medium flex items-center justify-between">
                                                <span>{comment.user.name}</span>
                                                <div className="flex items-center gap-1">
                                                  <span className="text-[0.6rem] text-muted-foreground">{comment.timestamp}</span>
                                                  {comment.user.id === currentUser.id && (
                                                    <>
                                                      {/* Edit button */}
                                                      <button
                                                        type="button"
                                                        className="h-4 w-4 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setEditingFileId(isEditingComment ? null : `comment_${comment.id}`);
                                                          setEditedCommentTextMap(prev => ({
                                                          ...prev,
                                                          [commentKey]: comment.text
                                                        }));
                                                        }}
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                      </button>
                                                      
                                                      {/* Delete button */}
                                                      <button
                                                        type="button"
                                                        className="h-4 w-4 inline-flex items-center justify-center text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          // Remove comment
                                                          setCardComments(prev => ({
                                                            ...prev,
                                                            [task.id]: prev[task.id]?.filter(c => c.id !== comment.id) || []
                                                          }));
                                                        }}
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                          <path d="M3 6h18" />
                                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                      </button>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                              
                                              {isEditingComment ? (
                                                <div className="mt-1 w-full">
                                                  <div className="flex w-full">
                                                    <input
                                                      type="text"
                                                      value={editedCommentText}
                                                      onChange={(e) => setEditedCommentTextMap(prev => ({
                                                        ...prev,
                                                        [commentKey]: e.target.value
                                                      }))}
                                                      className="flex-1 h-5 text-[0.65rem] border rounded-l-md px-1 py-0"
                                                      onClick={(e) => e.stopPropagation()}
                                                      autoFocus
                                                      onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                          e.stopPropagation();
                                                          // Update comment
                                                          setCardComments(prev => ({
                                                            ...prev,
                                                            [task.id]: prev[task.id]?.map(c => 
                                                              c.id === comment.id 
                                                                ? {...c, text: editedCommentText} 
                                                                : c
                                                            ) || []
                                                          }));
                                                          setEditingFileId(null);
                                                        }
                                                        if (e.key === 'Escape') {
                                                          setEditingFileId(null);
                                                        }
                                                      }}
                                                    />
                                                    <button
                                                      type="button"
                                                      className="bg-primary text-primary-foreground h-5 px-1 text-[0.6rem] rounded-r-md"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Update comment
                                                        setCardComments(prev => ({
                                                          ...prev,
                                                          [task.id]: prev[task.id]?.map(c => 
                                                            c.id === comment.id 
                                                              ? {...c, text: editedCommentText} 
                                                              : c
                                                          ) || []
                                                        }));
                                                        setEditingFileId(null);
                                                      }}
                                                    >
                                                      Save
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="mt-0.5 text-left">{comment.text}</div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })
                                  ) : (
                                    <div className="text-center text-[0.65rem] text-muted-foreground py-2">
                                      No comments yet. Add one below.
                                    </div>
                                  )}
                                  
                                  <div className="w-full mt-1">
                                    <div className="flex w-full">
                                      <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        className="flex-1 h-6 text-[0.65rem] border rounded-l-md px-2 py-0"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const target = e.target as HTMLInputElement;
                                            handleAddCardComment(task.id, target.value);
                                            target.value = '';
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className="bg-primary text-primary-foreground h-6 px-2 text-[0.65rem] rounded-r-md"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const input = e.currentTarget.previousSibling as HTMLInputElement;
                                          handleAddCardComment(task.id, input.value);
                                          input.value = '';
                                        }}
                                      >
                                        Post
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Badges at bottom of card */}
                            {task.externalFiles && task.externalFiles.length > 0 && (
                              <div className="mt-2 pt-2 border-t px-2 flex flex-wrap gap-1">
                                <div className="text-[0.6rem] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full px-1.5 flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-2 w-2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                  </svg>
                                  Comments {cardComments[task.id]?.length > 0 && `(${cardComments[task.id]?.length})`}
                                </div>
                                
                                <div className="text-[0.6rem] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full px-1.5 flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-2 w-2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                  </svg>
                                  {task.assignees.length} editors
                                </div>
                                
                                <div className="text-[0.6rem] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full px-1.5 flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-2 w-2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="3" y1="9" x2="21" y2="9"></line>
                                    <line x1="9" y1="21" x2="9" y2="9"></line>
                                  </svg>
                                  {task.externalFiles.length} file{task.externalFiles.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <NewTaskDialog
        open={newTaskDialogOpen}
        onOpenChange={setNewTaskDialogOpen}
        onTaskAdded={handleAddTask}
        statuses={todoStatuses}
        users={users}
        currentUser={currentUser}
      />
      
      {/* Task Detail Dialog */}
      {selectedTask && (
        <Dialog open={taskDetailOpen} onOpenChange={setTaskDetailOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>{isEditMode ? 'Edit Task' : selectedTask.name}</DialogTitle>
              {!isEditMode && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditMode(true)}
                  className="ml-auto"
                >
                  Edit
                </Button>
              )}
            </DialogHeader>
            
            {isEditMode ? (
              // Edit Mode View
              <div className="py-4">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleTaskUpdate(selectedTask);
                  }}
                >
                  <div className="space-y-6">
                    {/* Title and Priority Section */}
                    <div className="grid grid-cols-[2fr_1fr] gap-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          Task Name
                        </Label>
                        <Input 
                          id="name" 
                          value={selectedTask.name} 
                          onChange={(e) => setSelectedTask({...selectedTask, name: e.target.value})}
                          required
                          className="h-9"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="priority" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          Priority
                        </Label>
                        <div className="flex items-center gap-2">
                          {['low', 'medium', 'high'].map((priority) => (
                            <Button
                              key={priority}
                              type="button"
                              size="sm"
                              variant={selectedTask.priority === priority ? 'default' : 'outline'}
                              className={cn(
                                "flex-1 capitalize",
                                selectedTask.priority === priority && 
                                priorityColors[priority as keyof typeof priorityColors].replace('bg-', 'bg-')
                              )}
                              onClick={() => setSelectedTask({...selectedTask, priority})}
                            >
                              {priority}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Description
                      </Label>
                      <div className="grid gap-1">
                        <textarea
                          id="description"
                          value={selectedTask.description}
                          onChange={(e) => setSelectedTask({...selectedTask, description: e.target.value})}
                          placeholder="Enter task description"
                          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Tip: Use @username to mention and assign users (e.g., @Ava Johnson)
                        </p>
                      </div>
                    </div>
                    
                    {/* Status and Due Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          Status
                        </Label>
                        <div className="flex gap-2 flex-wrap">
                          {todoStatuses.map((status) => (
                            <Button
                              key={status.id}
                              type="button"
                              size="sm"
                              variant={selectedTask.status.id === status.id ? 'default' : 'outline'}
                              className="text-xs px-2 py-1 h-8"
                              style={{
                                backgroundColor: selectedTask.status.id === status.id ? status.color + '33' : undefined,
                                borderColor: selectedTask.status.id === status.id ? status.color : undefined
                              }}
                              onClick={() => setSelectedTask({...selectedTask, status})}
                            >
                              <div className="flex items-center gap-1.5">
                                <div 
                                  className="h-2 w-2 rounded-full" 
                                  style={{ backgroundColor: status.color }}
                                />
                                {status.name}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="endAt" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          Due Date
                        </Label>
                        <div className="relative">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 h-10 pl-3 pr-3 py-2 text-sm border rounded-md bg-background hover:bg-accent/50 transition-colors"
                            onClick={() => setDetailsDueDatePickerOpen(prev => !prev)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                              <line x1="16" x2="16" y1="2" y2="6" />
                              <line x1="8" x2="8" y1="2" y2="6" />
                              <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                            <span>{format(new Date(selectedTask.endAt), 'MMMM d, yyyy')}</span>
                          </button>
                          
                          {detailsDueDatePickerOpen && (
                            <div className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-lg shadow-md overflow-hidden">
                              <div className="w-fit p-1 bg-background">
                                <div className="flex justify-between items-center px-3 py-2 border-b">
                                  <div className="font-medium">Select Due Date</div>
                                  <button 
                                    type="button" 
                                    className="text-muted-foreground hover:text-foreground" 
                                    onClick={() => setDetailsDueDatePickerOpen(false)}
                                  >
                                    ✕
                                  </button>
                                </div>
                                <CalendarPicker
                                  selected={new Date(selectedTask.endAt)}
                                  onSelect={(date) => {
                                    if (date) {
                                      setSelectedTask({
                                        ...selectedTask,
                                        endAt: date
                                      });
                                      setDetailsDueDatePickerOpen(false);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Assignees Section */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Current Assignees
                        </Label>
                      </div>
                      <div className="flex flex-wrap gap-1.5 p-2 border rounded-md min-h-12 bg-muted/30">
                        {selectedTask.assignees && selectedTask.assignees.length > 0 ? (
                          selectedTask.assignees.map((assignee, index) => (
                            <div key={index} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md text-sm">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={assignee.avatar} />
                                <AvatarFallback>{assignee.name?.slice(0, 2) || '??'}</AvatarFallback>
                              </Avatar>
                              <span>{assignee.name || 'Unknown'}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground p-1.5">
                            No assignees. @mention users in the description to assign them.
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <DialogFooter className="pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                  </div>
                </form>
              </div>
            ) : (
              // View Mode
              <div className="grid gap-4 py-4">
                {/* Task metadata */}
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
                  <div className="text-sm font-medium text-muted-foreground">Status:</div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2.5 w-2.5 rounded-full" 
                      style={{ backgroundColor: selectedTask.status.color }}
                    />
                    <span>{selectedTask.status.name}</span>
                  </div>
                  
                  <div className="text-sm font-medium text-muted-foreground">Priority:</div>
                  <div className={`w-fit px-2 py-0.5 rounded text-xs ${priorityColors[selectedTask.priority as keyof typeof priorityColors]}`}>
                    {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                  </div>
                  
                  <div className="text-sm font-medium text-muted-foreground">Created by:</div>
                  <div className="flex items-center gap-2">
                    {selectedTask.creator ? (
                      <>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={selectedTask.creator.avatar} />
                          <AvatarFallback>{selectedTask.creator.name?.slice(0, 2) || '??'}</AvatarFallback>
                        </Avatar>
                        <span>{selectedTask.creator.name || 'Unknown'}</span>
                      </>
                    ) : (
                      <span>Unknown</span>
                    )}
                  </div>
                  
                  <div className="text-sm font-medium text-muted-foreground">Assignees:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTask.assignees && selectedTask.assignees.map((assignee, index) => (
                      <div key={index} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md text-sm">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={assignee.avatar} />
                          <AvatarFallback>{assignee.name?.slice(0, 2) || '??'}</AvatarFallback>
                        </Avatar>
                        <span>{assignee.name || 'Unknown'}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-sm font-medium text-muted-foreground">Due date:</div>
                  <div>{format(new Date(selectedTask.endAt), 'MMM d, yyyy')}</div>
                </div>
                
                {/* Assignment status section */}
                {selectedTask.assignees && 
                selectedTask.assignees.some(a => a.id === currentUser.id) && 
                selectedTask.creator?.id !== currentUser.id && 
                selectedTask.assignmentStatus === 'pending' && (
                  <div className="mt-2 border p-3 rounded-md bg-amber-50 dark:bg-amber-900/20">
                    <div className="font-medium mb-2">Assignment Status</div>
                    <p className="text-sm text-muted-foreground mb-3">
                      You have been assigned to this task. Do you want to accept or reject it?
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAssignmentStatusChange(selectedTask.id, 'rejected')}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleAssignmentStatusChange(selectedTask.id, 'accepted')}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Description */}
                <div>
                  <div className="font-medium mb-2">Description</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-2 rounded-md">
                    {renderTextWithLinks(selectedTask.description)}
                  </div>
                </div>
                
                {/* External Files */}
                <div className="mt-4">
                  <div className="font-medium mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Linked Files 
                      {selectedTask.externalFiles && selectedTask.externalFiles.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full px-2 py-0.5">{selectedTask.externalFiles.length}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        // Add a new file with default values
                        handleAddExternalFile(selectedTask.id, {
                          id: crypto.randomUUID(),
                          name: "New Document",
                          type: "doc",
                          url: "https://docs.google.com/",
                          lastModified: "Just now"
                        });
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add File
                    </Button>
                  </div>
                  
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedTask.externalFiles && selectedTask.externalFiles.length > 0 ? (
                      selectedTask.externalFiles.map((file) => (
                        <div 
                          key={file.id}
                          data-file-id={file.id}
                          className={`p-2 rounded ${editingFileId === file.id ? 'bg-muted' : 'bg-muted/30 hover:bg-muted/50'} border border-transparent transition-colors group relative file-container`}
                          onClick={() => setEditingFileId(file.id)}
                        >
                          {/* Non-edit mode view */}
                          {editingFileId !== file.id ? (
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm truncate flex-1">{file.name}</div>
                              <a 
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-5 w-5 ml-1 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </a>
                            </div>
                          ) : (
                            /* Edit mode view */
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <input
                                  type="text"
                                  value={file.name}
                                  onChange={(e) => {
                                    handleEditExternalFile(selectedTask.id, file.id, { name: e.target.value });
                                  }}
                                  className="flex-1 font-medium text-sm border-none bg-transparent py-0 h-6 focus:ring-1 focus:ring-primary"
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteExternalFile(selectedTask.id, file.id);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                  </svg>
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                              <input
                                type="text"
                                value={file.url}
                                placeholder="https://"
                                onChange={(e) => {
                                  handleEditExternalFile(selectedTask.id, file.id, { url: e.target.value });
                                }}
                                className="w-full text-xs text-muted-foreground border rounded px-2 py-1 h-7 focus:ring-1 focus:ring-primary"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground p-4 text-center bg-muted/30 rounded-md">
                        No linked files yet. Click "Add File" to create one.
                      </div>
                    )}
                  </div>
                  
                  {selectedTask.externalFiles && selectedTask.externalFiles.length > 0 && (
                    <div className="mt-2 border-t pt-2">
                      <div className="text-sm font-medium">Recent activity</div>
                      <div className="space-y-1 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <div className="h-4 w-4 rounded-full bg-green-100 flex-shrink-0 mt-0.5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-2 w-2 text-green-600">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <div>
                            <span className="font-medium">{selectedTask.creator.name}</span> edited <span className="font-medium">{selectedTask.externalFiles[0].name}</span>
                            <p>Recently</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <div className="h-4 w-4 rounded-full bg-blue-100 flex-shrink-0 mt-0.5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-2 w-2 text-blue-600">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                          </div>
                          <div>
                            <span className="font-medium">{selectedTask.assignees[0]?.name || "Unknown"}</span> shared <span className="font-medium">{selectedTask.externalFiles.length > 1 ? selectedTask.externalFiles[1].name : selectedTask.externalFiles[0].name}</span> with the team
                            <p>Recently</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Collaborative badges at the bottom */}
                      {selectedTask.externalFiles && selectedTask.externalFiles.length > 0 && (
                        <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                          <div className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-md px-2 py-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            Comments {cardComments[selectedTask.id]?.length > 0 ? `(${cardComments[selectedTask.id]?.length})` : ''}
                          </div>
                          
                          <div className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-md px-2 py-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            {selectedTask.assignees.length} collaborators
                          </div>
                          
                          <div className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-md px-2 py-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="3" y1="9" x2="21" y2="9"></line>
                              <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                            {selectedTask.externalFiles.length} file{selectedTask.externalFiles.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Mentions */}
                {selectedTask.mentions && selectedTask.mentions.length > 0 && (
                  <div>
                    <div className="font-medium mb-2">Mentioned</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedTask.mentions.map((mention, index) => (
                        <div key={index} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md text-sm">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={mention.avatar} />
                            <AvatarFallback>{mention.name?.slice(0, 2) || '??'}</AvatarFallback>
                          </Avatar>
                          <span>{mention.name || 'Unknown'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button onClick={() => setTaskDetailOpen(false)}>Close</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}