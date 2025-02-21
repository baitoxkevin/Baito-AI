import { useState, useEffect } from 'react';
import { FiPlus, FiTrash, FiUserPlus, FiEdit2, FiList, FiGrid } from 'react-icons/fi';
import { MentionInput } from './MentionInput';
import { supabase } from '../lib/supabase';
import { createNotification } from '../lib/notifications';
import { updateTask } from '../lib/tasks';
import { FaFire } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { getTasks, createTask, updateTaskStatus, deleteTask, assignTask } from '../lib/tasks';
import type { Task, UserRole, User } from '../lib/types';
import AssignTaskDialog from './AssignTaskDialog';
import EditTaskDialog from './EditTaskDialog';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";

export default function TodoPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  return (
    <div className="h-[calc(100vh-7rem)] w-full">
      <div className="mb-4 flex justify-end">
        <div className="space-x-2">
          <Button
            variant={view === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('kanban')}
          >
            <FiGrid className="mr-2 h-4 w-4" />
            Kanban
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <FiList className="mr-2 h-4 w-4" />
            List View
          </Button>
        </div>
      </div>
      {view === 'kanban' ? <Board /> : <CompletedTasksList />}
    </div>
  );
}

const CompletedTasksList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      const tasks = await getTasks();
      // Sort completed tasks by completion date (updated_at) in descending order
      const completedTasks = tasks
        .filter(task => task.status === 'done')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setTasks(completedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error loading tasks',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Completed On</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-muted-foreground">
                      {task.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {task.assigned_to ? (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>{(task.assigned_to as User).full_name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getPriorityColor(task.priority)}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(task.updated_at), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTask(task);
                    setEditDialogOpen(true);
                  }}
                >
                  <FiEdit2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <div className="text-muted-foreground">
                  No completed tasks found
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {selectedTask && (
        <EditTaskDialog
          task={selectedTask}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onTaskUpdated={loadTasks}
        />
      )}
    </div>
  );
};

const Board = () => {
  const [cards, setCards] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      const tasks = await getTasks();
      setCards(tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error loading tasks',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAssignTask = async (taskId: string, userId: string, _role: UserRole) => {
    try {
      await assignTask(taskId, userId, userId); // TODO: Get current user ID
      await loadTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: 'Error assigning task',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-full w-full gap-3 overflow-scroll p-6">
      <Column
        title="Backlog"
        column="backlog"
        headingColor="text-neutral-500"
        cards={cards}
        setCards={setCards}
        onAssign={(task) => {
          setSelectedTask(task);
          setAssignDialogOpen(true);
        }}
        onEdit={(task) => {
          setSelectedTask(task);
          setEditDialogOpen(true);
        }}
      />
      <Column
        title="TODO"
        column="todo"
        headingColor="text-yellow-200"
        cards={cards}
        setCards={setCards}
        onAssign={(task) => {
          setSelectedTask(task);
          setAssignDialogOpen(true);
        }}
        onEdit={(task) => {
          setSelectedTask(task);
          setEditDialogOpen(true);
        }}
      />
      <Column
        title="In progress"
        column="doing"
        headingColor="text-blue-200"
        cards={cards}
        setCards={setCards}
        onAssign={(task) => {
          setSelectedTask(task);
          setAssignDialogOpen(true);
        }}
        onEdit={(task) => {
          setSelectedTask(task);
          setEditDialogOpen(true);
        }}
      />
      <Column
        title="Complete"
        column="done"
        headingColor="text-emerald-200"
        cards={cards}
        setCards={setCards}
        onAssign={(task) => {
          setSelectedTask(task);
          setAssignDialogOpen(true);
        }}
        onEdit={(task) => {
          setSelectedTask(task);
          setEditDialogOpen(true);
        }}
      />
      <BurnBarrel onDelete={async (taskId) => {
        try {
          await deleteTask(taskId);
          setCards(cards.filter(c => c.id !== taskId));
        } catch (error) {
          console.error('Error deleting task:', error);
          toast({
            title: 'Error deleting task',
            description: error instanceof Error ? error.message : 'An unexpected error occurred',
            variant: 'destructive',
          });
        }
      }} />

      {selectedTask && (
        <>
          <AssignTaskDialog
            task={selectedTask}
            open={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            onAssign={async (userId, role) => {
              await handleAssignTask(selectedTask.id, userId, role);
            }}
          />
          <EditTaskDialog
            task={selectedTask}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onTaskUpdated={loadTasks}
          />
        </>
      )}
    </div>
  );
};

const Column = ({ 
  title, 
  headingColor, 
  cards, 
  column, 
  setCards,
  onAssign,
  onEdit,
}: {
  title: string;
  headingColor: string;
  cards: Task[];
  column: string;
  setCards: (cards: Task[]) => void;
  onAssign: (task: Task) => void;
  onEdit: (task: Task) => void;
}) => {
  const [active, setActive] = useState(false);
  const { toast } = useToast();

  const handleDragStart = (e: React.DragEvent<Element>, card: Task) => {
    e.dataTransfer.setData('taskId', card.id);
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData('taskId');

    setActive(false);
    clearHighlights();

    try {
      await updateTaskStatus(taskId, column as Task['status']);
      const updatedTask = cards.find(c => c.id === taskId);
      if (updatedTask) {
        setCards(cards.map(c => 
          c.id === taskId ? { ...c, status: column as Task['status'] } : c
        ));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error updating task',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();

    indicators.forEach((i) => {
      i.style.opacity = '0';
    });
  };

  // Removed unused functions

  const getIndicators = () => {
    return Array.from(document.querySelectorAll(`[data-column="${column}"]`)) as HTMLElement[];
  };

  const filteredCards = cards.filter((c) => c.status === column);

  return (
    <div className="w-72 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded text-sm text-muted-foreground">
          {filteredCards.length}
        </span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={(e) => {
          e.preventDefault();
          setActive(true);
        }}
        onDragLeave={() => setActive(false)}
        className={`h-full w-full rounded-lg transition-colors ${
          active ? 'bg-muted/50' : 'bg-muted/0'
        }`}
      >
        {filteredCards.map((card) => (
          <Card 
            key={card.id} 
            task={card} 
            handleDragStart={handleDragStart}
            onAssign={() => onAssign(card)}
            onEdit={() => onEdit(card)}
          />
        ))}
        <AddCard 
          onAdd={async (title) => {
            try {
              const newTask = await createTask({
                title,
                status: column as Task['status'],
                priority: 'medium',
              });
              setCards([...cards, newTask]);
            } catch (error) {
              console.error('Error creating task:', error);
              toast({
                title: 'Error creating task',
                description: error instanceof Error ? error.message : 'An unexpected error occurred',
                variant: 'destructive',
              });
            }
          }} 
        />
      </div>
    </div>
  );
};

const Card = ({ 
  task,
  handleDragStart,
  onAssign,
  onEdit,
}: { 
  task: Task;
  handleDragStart: (e: React.DragEvent<Element>, task: Task) => void;
  onAssign: () => void;
  onEdit: () => void;
}) => {
  const { toast } = useToast();
  return (
    <motion.div
      layout
      layoutId={task.id}
      draggable="true"
      onDragStart={(e: React.DragEvent<Element>) => handleDragStart(e, task)}
      className="mb-2 cursor-grab rounded-lg border bg-card p-3 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm">{task.title}</p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onEdit}
          >
            <FiEdit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onAssign}
          >
            <FiUserPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {task.assigned_to && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">
            Assigned to {(task.assigned_to as User).full_name}
          </span>
        </div>
      )}
      {task.description && (
        <p className="mt-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}
      <div className="mt-2">
        <MentionInput
          value={task.description || ''}
          onChange={async (newValue) => {
            try {
              await updateTask(task.id, { description: newValue });
              window.location.reload(); // Temporary solution until we implement proper state management
            } catch (error) {
              console.error('Error updating task:', error);
              toast({
                title: 'Error updating task',
                description: error instanceof Error ? error.message : 'An unexpected error occurred',
                variant: 'destructive',
              });
            }
          }}
          onMention={async (userId) => {
            try {
              const { data: user } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', userId)
                .single();

              if (user) {
                await createNotification({
                  user_id: userId,
                  type: 'mention',
                  task_id: task.id,
                  title: 'You were mentioned in a task',
                  message: `${user.full_name} mentioned you in task: ${task.title}`,
                });
              }
            } catch (error) {
              console.error('Error creating notification:', error);
            }
          }}
        />
      </div>
      {task.priority !== 'medium' && (
        <div className="mt-2">
          <span className={`text-xs ${
            task.priority === 'high' 
              ? 'text-red-500' 
              : 'text-green-500'
          }`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
          </span>
        </div>
      )}
    </motion.div>
  );
};

const BurnBarrel = ({ onDelete }: { onDelete: (taskId: string) => Promise<void> }) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData('taskId');
    await onDelete(taskId);
    setActive(false);
  };

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded border text-3xl ${
        active
          ? 'border-red-800 bg-red-800/20 text-red-500'
          : 'border-neutral-500 bg-neutral-500/20 text-neutral-500'
      }`}
    >
      {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

const AddCard = ({ 
  onAdd 
}: { 
  onAdd: (title: string) => Promise<void>;
}) => {
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim().length) return;

    await onAdd(text.trim());
    setAdding(false);
    setText('');
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit}>
          <textarea
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded border border-primary bg-primary/10 p-3 text-sm placeholder-primary focus:outline-0"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
            >
              Close
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300"
            >
              <span>Add</span>
              <FiPlus />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
        >
          <span>Add card</span>
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};
