import React, { useState, useCallback, useEffect } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Building,
  FileText,
  BarChart3,
  Users,
  ClipboardList,
  Info,
  Tool,
  DollarSign,
  Receipt,
  BadgeDollarSign,
  Banknote,
  Plus
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PayrollManager } from '@/components/payroll-manager';
// import { SpotlightCardDialog } from '@/components/ui/spotlight-card-dialog';
import { supabase } from '@/lib/supabase';

export function SpotlightCommand() {
  const [open, setOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectStaff, setProjectStaff] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();

  // Load projects for payroll selection
  useEffect(() => {
    const loadProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setProjects(data);
      } else {
        setProjects([]);
      }
    };
    
    if (open) {
      loadProjects();
    }
  }, [open]);

  // Keyboard shortcut to open command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleCommand = useCallback((command: string) => {
    switch (command) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'projects':
        navigate('/projects');
        break;
      case 'calendar':
        navigate('/calendar');
        break;
      case 'candidates':
        navigate('/candidates');
        break;
      case 'companies':
        navigate('/companies');
        break;
      case 'invites':
        navigate('/invites');
        break;
      case 'tools':
        navigate('/tools');
        break;
      case 'receipt-scanner':
        navigate('/tools');
        sessionStorage.setItem('activeToolComponent', 'ReceiptScanner');
        break;
      case 'expense-claims':
        navigate('/tools');
        sessionStorage.setItem('activeToolComponent', 'ExpenseClaims');
        break;
      case 'payroll':
        setPayrollOpen(true);
        break;
      case 'payroll-new':
        navigate('/projects');
        // You could potentially set a flag to open the new project dialog
        sessionStorage.setItem('openNewProjectDialog', 'true');
        break;
      case 'payroll-staff':
        navigate('/tools');
        sessionStorage.setItem('activeToolComponent', 'PayrollManager');
        break;
      case 'payroll-reports':
        navigate('/tools');
        sessionStorage.setItem('activeToolComponent', 'PayrollReports');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        // Handle logout
        navigate('/login');
        break;
    }
    setOpen(false);
  }, [navigate]);

  const handleProjectPayroll = async (projectId: string) => {
    // Load the project and its staff
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (project) {
      setSelectedProject(project);
      
      // Load project staff
      const { data: staff } = await supabase
        .from('project_staff')
        .select('*')
        .eq('project_id', projectId);
      
      if (staff) {
        setProjectStaff(staff);
      }
      
      setPayrollOpen(true);
    }
    setOpen(false);
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleCommand('dashboard')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('projects')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Projects</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('calendar')}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('candidates')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Candidates</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('companies')}>
              <Building className="mr-2 h-4 w-4" />
              <span>Companies</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('invites')}>
              <ClipboardList className="mr-2 h-4 w-4" />
              <span>Invites</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Tools">
            <CommandItem onSelect={() => handleCommand('receipt-scanner')}>
              <Receipt className="mr-2 h-4 w-4" />
              <span>Receipt Scanner</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('expense-claims')}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Expense Claims</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('payroll-staff')}>
              <DollarSign className="mr-2 h-4 w-4" />
              <span>Staff Payroll Manager</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Payroll Management">
            <CommandItem onSelect={() => handleCommand('payroll')}>
              <DollarSign className="mr-2 h-4 w-4" />
              <span>Quick Payroll Overview</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('payroll-new')}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Payroll</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('payroll-staff')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Staff Payroll Summary</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('payroll-reports')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Payroll Reports</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Project Payroll">
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <CommandItem 
                  key={project.id} 
                  onSelect={() => handleProjectPayroll(project.id)}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  <span>Payroll: {project.title}</span>
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled>
                <Banknote className="mr-2 h-4 w-4" />
                <span className="text-gray-500">No projects available</span>
              </CommandItem>
            )}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="System">
            <CommandItem onSelect={() => handleCommand('settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand('logout')}>
              <User className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Payroll Dialog */}
      <Dialog open={payrollOpen} onOpenChange={setPayrollOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedProject ? (
            <PayrollManager
              confirmedStaff={projectStaff}
              setConfirmedStaff={setProjectStaff}
              projectStartDate={new Date(selectedProject.start_date)}
              projectEndDate={new Date(selectedProject.end_date)}
              projectId={selectedProject.id}
              onSave={async (payrollData) => {
                console.log('Saving payroll data:', payrollData);
                // You can implement custom save logic here
                // or use the default save behavior
              }}
            />
          ) : (
            <div className="p-8 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Project</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a project from the command palette to manage its payroll
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}