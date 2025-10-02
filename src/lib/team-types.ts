export interface TeamMember {
  id: string;
  name: string;
  role: string;
  projects: string[];
}

export interface TeamProject {
  id: string;
  title: string;
  assignedTo: string; // TeamMember name
  status: 'upcoming' | 'in-progress' | 'completed' | 'checked';
}

export interface ScheduledEvent {
  id: string;
  title: string;
  dateRange: string; // e.g., "25/4 - 20/7"
  status: 'upcoming' | 'in-progress' | 'completed' | 'checked';
}