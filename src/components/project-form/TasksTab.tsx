import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarDays, ClipboardCheck, Plus, X, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'backlog' | 'todo' | 'doing' | 'done';
  due_date?: Date;
}

interface TasksTabProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const TasksTab = ({ tasks, setTasks }: TasksTabProps) => {
  const [newTask, setNewTask] = React.useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
  });
  const [showAddForm, setShowAddForm] = React.useState(false);

  const handleAddTask = () => {
    if (!newTask.title) return;
    
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority as 'high' | 'medium' | 'low',
      status: newTask.status as 'backlog' | 'todo' | 'doing' | 'done',
      due_date: newTask.due_date,
    };
    
    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
    });
    setShowAddForm(false);
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'backlog':
        return 'bg-gray-100 text-gray-800';
      case 'todo':
        return 'bg-blue-100 text-blue-800';
      case 'doing':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full space-y-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Project Tasks ({tasks.length})</h3>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? "outline" : "default"}
        >
          {showAddForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </>
          )}
        </Button>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center p-6 border rounded-lg">
          <ClipboardCheck className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No tasks added yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border rounded-lg flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{task.title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTask(task.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              {task.description && (
                <p className="text-sm text-gray-500">{task.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={getStatusBadgeStyle(task.status)}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </Badge>
                <Badge className={getPriorityBadgeStyle(task.priority)}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
                {task.due_date && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(task.due_date, 'MMM d, yyyy')}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Form */}
      {showAddForm && (
        <div className="border p-4 rounded-lg mt-4">
          <h4 className="font-medium mb-4">Add New Task</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Title</Label>
              <Input
                id="taskTitle"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea
                id="taskDescription"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taskStatus">Status</Label>
                <Select
                  value={newTask.status}
                  onValueChange={(value) => setNewTask({ ...newTask, status: value as any })}
                >
                  <SelectTrigger id="taskStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="doing">Doing</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taskPriority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value as any })}
                >
                  <SelectTrigger id="taskPriority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taskDueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                      id="taskDueDate"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {newTask.due_date ? (
                        format(newTask.due_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTask.due_date}
                      onSelect={(date) => setNewTask({ ...newTask, due_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksTab;