import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CheckCircle, Plus, Users, Filter, Search } from "lucide-react";
import { TeamProject, ScheduledEvent } from "@/lib/team-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { NewTeamProjectDialog } from "@/components/NewTeamProjectDialog";
import { NewScheduledEventDialog } from "@/components/NewScheduledEventDialog";

export default function TeamManagementPage() {
  // Dialog state
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompletedProjects, setShowCompletedProjects] = useState(true);
  const [showCompletedEvents, setShowCompletedEvents] = useState(true);
  
  // Sample data based on the WhatsApp image
  const [members] = useState<string[]>(["Laili", "Winnie"]);
  
  const [projects, setProjects] = useState<TeamProject[]>([
    { id: "1", title: "Redoxon School", assignedTo: "Laili", status: "upcoming" },
    { id: "2", title: "SpritzerxPokemon Instore (recruiting first 2week)", assignedTo: "Laili", status: "upcoming" },
    { id: "3", title: "Mr DIY @ Mytown & melawati setup & dismantle crew", assignedTo: "Laili", status: "upcoming" },
    { id: "4", title: "Redoxon Car Arrangement", assignedTo: "Laili", status: "upcoming" },
    { id: "5", title: "So Tinge Speed20 SV", assignedTo: "Laili", status: "upcoming" },
    { id: "6", title: "MrToy Mytown", assignedTo: "Laili", status: "upcoming" },
    { id: "7", title: "Mr Diy Karnival Penang", assignedTo: "Laili", status: "upcoming" },
    { id: "8", title: "Spritzer Air Cuti Cuti Tourism", assignedTo: "Laili", status: "upcoming" },
    { id: "9", title: "Colgate Velocity", assignedTo: "Winnie", status: "upcoming" },
    { id: "10", title: "Greenvivo May (Ava-Alvin)", assignedTo: "Winnie", status: "upcoming" },
  ]);
  
  const [events, setEvents] = useState<ScheduledEvent[]>([
    { id: "1", title: "Pokemon", dateRange: "25/4 - 20/7", status: "checked" },
    { id: "2", title: "Speed 2o Sotinge (SV Only)", dateRange: "1/5 - 4/5", status: "checked" },
    { id: "3", title: "Sotinge Contest & Roving", dateRange: "10/5 - 5/6", status: "checked" },
    { id: "4", title: "Sparkling Zara Meet & Greet", dateRange: "24/5", status: "upcoming" },
    { id: "5", title: "Sparkling Lemon", dateRange: "30/5 - 29/6", status: "checked" },
    { id: "6", title: "Spritzer Tourism Roving & RNR", dateRange: "29/5 - 19/7", status: "checked" },
    { id: "7", title: "JomHeboh Sotinge / Darlie (Satelite)", dateRange: "30/5 - 1/6", status: "upcoming" },
    { id: "8", title: "GutC Roadshow", dateRange: "1/6", status: "upcoming" },
    { id: "9", title: "Jujutsu Kaisen Night Run", dateRange: "14/6", status: "upcoming" }
  ]);

  // Toggle check status for events
  const toggleEventStatus = (id: string) => {
    setEvents(events.map(event => 
      event.id === id 
        ? { ...event, status: event.status === 'checked' ? 'upcoming' : 'checked' } 
        : event
    ));
  };

  // Toggle check status for projects
  const toggleProjectStatus = (id: string) => {
    setProjects(projects.map(project => 
      project.id === id 
        ? { ...project, status: project.status === 'checked' ? 'upcoming' : 'checked' } 
        : project
    ));
  };
  
  // Add new project
  const addNewProject = (values: { title: string; assignedTo: string }) => {
    const newProject: TeamProject = {
      id: `${projects.length + 1}`,
      title: values.title,
      assignedTo: values.assignedTo,
      status: 'upcoming'
    };
    setProjects([...projects, newProject]);
  };
  
  // Add new event
  const addNewEvent = (values: { title: string; dateRange: string }) => {
    const newEvent: ScheduledEvent = {
      id: `${events.length + 1}`,
      title: values.title,
      dateRange: values.dateRange,
      status: 'upcoming'
    };
    setEvents([...events, newEvent]);
  };

  // Filter projects based on search term and completed status
  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Completed filter
    const matchesCompleted = showCompletedProjects || project.status !== 'checked';
    
    return matchesSearch && matchesCompleted;
  });

  // Filter events based on search term and completed status
  const filteredEvents = events.filter(event => {
    // Search filter
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.dateRange.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Completed filter
    const matchesCompleted = showCompletedEvents || event.status !== 'checked';
    
    return matchesSearch && matchesCompleted;
  });

  return (
    <div className="flex flex-col flex-1 p-2 sm:p-4 lg:p-6 rounded-none md:rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h1 className="text-xl font-semibold">Team Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search projects & events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 w-full sm:w-[240px] text-sm"
            />
          </div>
          
          <div className="flex space-x-2">
            {/* Project Dialog Button */}
            <Button variant="outline" size="sm" className="h-9" onClick={() => setShowProjectDialog(true)}>
              <Plus className="h-4 w-4 mr-2 sm:mr-1.5" />
              <span className="hidden sm:inline">Add</span> Project
            </Button>
            
            {/* Event Dialog Button */}
            <Button variant="outline" size="sm" className="h-9" onClick={() => setShowEventDialog(true)}>
              <CalendarIcon className="h-4 w-4 mr-2 sm:mr-1.5" />
              <span className="hidden sm:inline">Add</span> Event
            </Button>
          </div>
        </div>
      </div>
      
      {/* Project Dialog */}
      <NewTeamProjectDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        teamMembers={members}
        onSubmit={addNewProject}
      />
      
      {/* Event Dialog */}
      <NewScheduledEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        onSubmit={addNewEvent}
      />

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-5">
          <TabsTrigger value="projects" className="rounded-md font-medium">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Team Projects</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-md font-medium">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              <span>Schedule</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Managing {filteredProjects.length} projects
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => setShowCompletedProjects(!showCompletedProjects)}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {showCompletedProjects ? "Hide" : "Show"} Completed
            </Button>
          </div>
          
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {members.map((member) => {
              // Get filtered projects for this member
              const memberProjects = filteredProjects.filter(p => p.assignedTo === member);
              
              // Skip rendering this card if there are no projects for this member
              if (memberProjects.length === 0) return null;
              
              return (
                <Card key={member} className="overflow-hidden border-l-4 h-full flex flex-col" style={{ borderLeftColor: member === "Laili" ? "#93C5FD" : "#F9A8D4" }}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                      <CardTitle className="text-base sm:text-lg font-bold flex items-center">
                        <Badge className="mr-2 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 h-6">
                          {memberProjects.length}
                        </Badge>
                        {member}
                      </CardTitle>
                      <Badge className={`${member === "Laili" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" : "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300"}`}>
                        {memberProjects.filter(p => p.status !== 'checked').length} active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-1 flex-grow">
                    <ul className="space-y-1.5">
                      {memberProjects.map((project, index) => (
                        <li 
                          key={project.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer transition-colors"
                          onClick={() => toggleProjectStatus(project.id)}
                        >
                          <span className="flex items-start sm:items-center">
                            <span className="font-mono text-xs text-gray-500 mr-2 flex-shrink-0 mt-0.5 sm:mt-0">{index + 1}.</span>
                            <span className={`text-sm sm:text-base ${project.status === 'checked' ? "line-through text-gray-500" : ""}`}>
                              {project.title}
                            </span>
                          </span>
                          <div className="flex-shrink-0 ml-2">
                            {project.status === 'checked' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="schedule">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredEvents.length} scheduled events
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => setShowCompletedEvents(!showCompletedEvents)}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {showCompletedEvents ? "Hide" : "Show"} Completed
            </Button>
          </div>
          
          <Card className="overflow-hidden border-l-4 h-full flex flex-col" style={{ borderLeftColor: "#FCA5A5" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
                  Upcoming Events
                </CardTitle>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                  {filteredEvents.filter(e => e.status !== 'checked').length} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4 flex-grow">
              <ul className="space-y-3">
                {filteredEvents.map((event) => (
                  <li 
                    key={event.id}
                    className="flex items-start sm:items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer transition-colors"
                    onClick={() => toggleEventStatus(event.id)}
                  >
                    <div className="flex items-start flex-grow overflow-hidden">
                      <div className="flex items-center flex-shrink-0 mr-2">
                        <Badge variant="outline" className="flex px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          {event.dateRange}
                        </Badge>
                      </div>
                      <span className={`text-sm sm:text-base truncate ${event.status === 'checked' ? "line-through text-gray-500" : ""}`}>
                        {event.title}
                      </span>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {event.status === 'checked' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}