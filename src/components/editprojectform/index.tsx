import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogTrigger,
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/ui/amount-input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { User, Calendar, Clock, MapPin, DollarSign, FileText, Users, History, ListTodo, X as XIcon, Minimize2, Info } from 'lucide-react';
import './styles.css';

// Define proper interfaces
interface Project {
  id: string;
  title: string;
  client?: string;
  start_date: string;
  end_date?: string;
  venue_address?: string;
  project_type?: string;
  color?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  description?: string;
  status?: string;
  budget?: number;
}

interface EditProjectFormProps {
  project?: Project;
  onClose?: () => void;
  onSave?: (data: Project) => void;
}

// Enhanced Tab component based on SpotlightCard
const EnhancedTab = ({ id, label, icon, isActive, onClick }) => {
  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      onClick={() => onClick(id)}
    >
      {icon}
      <span>{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
        />
      )}
    </button>
  );
};

// Enhanced StatCard based on SpotlightCard
const StatCard = ({ icon, label, value, color = "indigo" }) => {
  const gradientClasses = {
    indigo: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200",
    purple: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200",
    pink: "from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200",
    emerald: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200"
  };

  return (
    <div className={`bg-gradient-to-br ${gradientClasses[color]} p-3 rounded-lg border shadow-sm`}>
      <div className="flex flex-col items-center text-center">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</p>
        <div className="flex items-center gap-1">
          {icon}
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  );
};

const EditProjectForm: React.FC<EditProjectFormProps> = ({ 
  project = {
    id: "1",
    title: "New Project",
    start_date: new Date().toISOString(),
    color: "#6366F1"
  },
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState<Project>(project);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSetBasicDialogOpen, setIsSetBasicDialogOpen] = useState(false);
  const [tempBasicValue, setTempBasicValue] = useState("");
  const [selectedStaffForBasic, setSelectedStaffForBasic] = useState<string[]>([]);
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSave = () => {
    if (onSave) onSave(formData);
  };

  // Placeholder data
  const tabsData = [
    { id: 'details', label: 'Details', icon: <User className="w-4 h-4" /> },
    { id: 'overview', label: 'Overview', icon: <Calendar className="w-4 h-4" /> },
    { id: 'schedule', label: 'Schedule', icon: <Clock className="w-4 h-4" /> },
    { id: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
    { id: 'staffing', label: 'Staffing', icon: <Users className="w-4 h-4" /> },
    { id: 'expenses', label: 'Expenses', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> }
  ];

  // For minimized view
  const MinimizedView = () => (
    <motion.div 
      className="fixed bottom-4 right-4 bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden cursor-pointer border border-slate-200 dark:border-slate-700 w-72"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.3 }}
      onClick={() => setIsMinimized(false)}
    >
      <div className="p-4 relative">
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ 
            background: `radial-gradient(circle at 50% 50%, ${formData.color || '#6366F1'}, transparent 70%)` 
          }} 
        />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
            {formData.title?.charAt(0) || "P"}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {formData.title || "New Project"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {formData.client || "No Client"} • {formData.venue_address || "No Location"}
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  if (isMinimized) {
    return <MinimizedView />;
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => onClose && onClose()}
      >
        <motion.div
          className="w-full max-w-7xl h-[90vh] max-h-[900px] relative"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <NeonGradientCard
            className="bg-gray-50 dark:bg-slate-900 shadow-2xl overflow-hidden h-full"
            borderRadius={12}
            borderSize={2}
            neonColors={{ firstColor: "#A07CFE", secondColor: "#FE8FB5" }}
          >
            {/* Header with buttons */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                  {formData.title?.charAt(0) || "P"}
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {formData.title || "New Project"}
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => onClose && onClose()}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex h-[calc(100%-72px)]">
              {/* Left Sidebar */}
              <div className="w-[280px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-6">
                <div className="flex flex-col items-center gap-4">
                  {/* Project Logo/Avatar */}
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-white dark:border-slate-800 shadow-lg">
                      <AvatarImage src={formData.client ? `https://ui-avatars.com/api/?name=${formData.client}&background=${formData.color?.replace('#', '') || '6366F1'}&color=fff` : ''} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xl font-bold">
                        {formData.title?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Project Type Badges */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {formData.project_type || "Project"}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300">
                      Event
                    </Badge>
                  </div>
                  
                  {/* Project Title */}
                  <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white">
                    {formData.title || "New Project"}
                  </h3>
                </div>
                
                {/* Project Stats Cards */}
                <div className="space-y-4">
                  <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-800/30">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {new Date(formData.start_date).toLocaleDateString()} 
                          {formData.end_date ? ` - ${new Date(formData.end_date).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {formData.working_hours_start || '09:00'} - {formData.working_hours_end || '17:00'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-800/30">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {formData.venue_address || 'No Location Set'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Summary Stats */}
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tasks</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">0</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Staff</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">0</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {formData.budget ? `$${formData.budget}` : '$0'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {tabsData.map(tab => (
                      <EnhancedTab
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        icon={tab.icon}
                        isActive={activeTab === tab.id}
                        onClick={setActiveTab}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto p-6">
                  {activeTab === 'details' && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                      <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="title">Project Title</Label>
                            <Input 
                              id="title" 
                              value={formData.title} 
                              onChange={(e) => handleInputChange('title', e.target.value)}
                              placeholder="Enter project title"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="client">Client</Label>
                            <Input 
                              id="client" 
                              value={formData.client || ''} 
                              onChange={(e) => handleInputChange('client', e.target.value)}
                              placeholder="Enter client name"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="project_type">Project Type</Label>
                            <Select 
                              value={formData.project_type || 'Event'} 
                              onValueChange={(value) => handleInputChange('project_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select project type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Event">Event</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Recruitment">Recruitment</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input 
                              id="start_date" 
                              type="date" 
                              value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 10) : ''} 
                              onChange={(e) => handleInputChange('start_date', e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="end_date">End Date</Label>
                            <Input 
                              id="end_date" 
                              type="date" 
                              value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 10) : ''} 
                              onChange={(e) => handleInputChange('end_date', e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="venue_address">Venue Address</Label>
                            <Input 
                              id="venue_address" 
                              value={formData.venue_address || ''} 
                              onChange={(e) => handleInputChange('venue_address', e.target.value)}
                              placeholder="Enter venue address"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description || ''}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Enter project description"
                          rows={4}
                        />
                      </div>
                      
                      <div className="mt-6 flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => onClose && onClose()}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSave}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                        >
                          Save Project
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'overview' && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                      <h3 className="text-lg font-semibold mb-4">Project Overview</h3>
                      <p className="text-gray-500 dark:text-gray-400">Overview content would go here</p>
                    </div>
                  )}

                  {activeTab === 'schedule' && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                      <h3 className="text-lg font-semibold mb-4">Project Schedule</h3>
                      <p className="text-gray-500 dark:text-gray-400">Schedule content would go here</p>
                    </div>
                  )}

                  {activeTab === 'location' && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                      <h3 className="text-lg font-semibold mb-4">Project Location</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="venue_address_full">Venue Address</Label>
                          <Input 
                            id="venue_address_full" 
                            value={formData.venue_address || ''} 
                            onChange={(e) => handleInputChange('venue_address', e.target.value)}
                            placeholder="Enter full venue address"
                          />
                        </div>
                        
                        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500 dark:text-gray-400">
                            Map view would be displayed here
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'staffing' && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Users className="h-5 w-5 text-indigo-600" />
                          Staff Management
                        </h3>
                        <Dialog open={isSetBasicDialogOpen} onOpenChange={setIsSetBasicDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Set Basic Salary
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                Set Basic Salary
                              </DialogTitle>
                              <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                Select staff members and set their basic salary for all working dates.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                              {/* Staff Selection */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Select Staff Members
                                </Label>
                                <div className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                  <div className="flex items-center mb-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedStaffForBasic(selectedStaffForBasic.length > 0 ? [] : ['1', '2', '3']);
                                      }}
                                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                      {selectedStaffForBasic.length > 0 ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <span className="ml-2 text-sm text-slate-500">
                                      ({selectedStaffForBasic.length}/3 selected)
                                    </span>
                                  </div>
                                  
                                  {/* Demo staff members */}
                                  {[
                                    { id: '1', name: 'Sarah Johnson', position: 'Event Coordinator' },
                                    { id: '2', name: 'Mike Chen', position: 'Sound Engineer' },
                                    { id: '3', name: 'Emily Wong', position: 'Lighting Designer' }
                                  ].map((staff) => (
                                    <label key={staff.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-md">
                                      <input
                                        type="checkbox"
                                        checked={selectedStaffForBasic.includes(staff.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedStaffForBasic([...selectedStaffForBasic, staff.id]);
                                          } else {
                                            setSelectedStaffForBasic(selectedStaffForBasic.filter(id => id !== staff.id));
                                          }
                                        }}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                      />
                                      <div className="flex items-center space-x-2 flex-1">
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                                            {staff.name.split(' ').map(n => n[0]).join('')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{staff.name}</p>
                                          <p className="text-xs text-slate-600 dark:text-slate-400">{staff.position}</p>
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Basic Salary Input */}
                              <div className="space-y-2 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <Label htmlFor="basicAmount" className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                  Basic Salary Amount
                                </Label>
                                <AmountInput
                                  id="basicAmount"
                                  value={tempBasicValue}
                                  onChange={setTempBasicValue}
                                  placeholder="0.00"
                                  currency="RM"
                                  preventSelectAll={true}
                                  formatOnBlur={true}
                                  minValue={0}
                                  className="h-12 text-lg font-medium border-2 border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition-all duration-200"
                                />
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                  Enter the daily rate for selected staff members
                                </p>
                              </div>
                              
                              {selectedStaffForBasic.length > 0 && (
                                <div className="flex items-start space-x-2 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                    This will apply to all working dates for {selectedStaffForBasic.length} selected staff member(s).
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setIsSetBasicDialogOpen(false);
                                  setSelectedStaffForBasic([]);
                                  setTempBasicValue("");
                                }}
                                className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => {
                                  setIsSetBasicDialogOpen(false);
                                  
                                  // Show a demo success message
                                  alert(`Basic salary of $${tempBasicValue} set for ${selectedStaffForBasic.length} staff member(s)`);
                                  
                                  setSelectedStaffForBasic([]);
                                  setTempBasicValue("");
                                }}
                                disabled={selectedStaffForBasic.length === 0 || !tempBasicValue}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                Apply to Selected
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        <StatCard icon={<Users className="h-4 w-4 text-indigo-600" />} label="Total Staff" value="0" color="indigo" />
                        <StatCard icon={<DollarSign className="h-4 w-4 text-purple-600" />} label="Total Basic" value="$0" color="purple" />
                        <StatCard icon={<DollarSign className="h-4 w-4 text-pink-600" />} label="Claims" value="$0" color="pink" />
                        <StatCard icon={<DollarSign className="h-4 w-4 text-amber-600" />} label="Commission" value="$0" color="indigo" />
                        <StatCard icon={<DollarSign className="h-4 w-4 text-emerald-600" />} label="Total Amount" value="$0" color="emerald" />
                      </div>
                      
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                              <TableHead className="font-medium">Staff</TableHead>
                              <TableHead className="text-center font-medium">Position</TableHead>
                              <TableHead className="text-center font-medium">Days</TableHead>
                              <TableHead className="text-center font-medium">Per Day</TableHead>
                              <TableHead className="text-center font-medium">Total Amount</TableHead>
                              <TableHead className="text-center font-medium">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                No staff members have been added yet
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'expenses' && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Expense Claims</h3>
                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Add Claim
                        </Button>
                      </div>
                      
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                              <TableHead className="font-semibold">Description</TableHead>
                              <TableHead className="text-center font-semibold">Date</TableHead>
                              <TableHead className="text-center font-semibold">Category</TableHead>
                              <TableHead className="text-center font-semibold">Submitter</TableHead>
                              <TableHead className="text-center font-semibold">Amount</TableHead>
                              <TableHead className="text-center font-semibold">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                No expense claims have been added yet
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                      <h3 className="text-lg font-semibold mb-4">Project Documents</h3>
                      <p className="text-gray-500 dark:text-gray-400">Documents content would go here</p>
                    </div>
                  )}

                  {activeTab === 'tasks' && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                      <h3 className="text-lg font-semibold mb-4">Project Tasks</h3>
                      <p className="text-gray-500 dark:text-gray-400">Tasks content would go here</p>
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                      <h3 className="text-lg font-semibold mb-4">Project History</h3>
                      <p className="text-gray-500 dark:text-gray-400">History content would go here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </NeonGradientCard>
        </motion.div>
      </motion.div>
      
    </AnimatePresence>
  );
};

export default EditProjectForm;