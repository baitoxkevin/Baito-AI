# ProjectsPage Redesign Options

## Option 1: Calendar-Inspired Dashboard Layout

![Calendar-Inspired Dashboard Layout](https://placehold.co/600x400/e7f6ff/333?text=Calendar-Inspired+Layout)

### Key Features

- **Visual Calendar Header**: Replace month tabs with an interactive mini-calendar that shows project density per day
- **Card Grid Layout**: Refined grid layout with responsive masonry or equal height options
- **Filterable Categories**: Quick filters for project status, priority, and team members
- **Contextual Actions**: Right-click context menu for project actions
- **Smart Search**: Fuzzy search that filters projects as you type
- **Time-Based Sections**: Group projects by upcoming, this week, this month, and past

### Implementation Highlights

```tsx
<div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
  {/* Header with calendar view */}
  <div className="p-6 border-b bg-white dark:bg-slate-800 sticky top-0 z-10">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
          Create Project
        </Button>
      </div>
      
      {/* Mini-calendar picker */}
      <div className="relative rounded-xl bg-white dark:bg-slate-800 border shadow-sm p-4">
        <MiniCalendar 
          onDateChange={handleDateChange}
          projectDensity={projectDensity}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  </div>
  
  {/* Filters and search */}
  <div className="p-4 sticky top-[130px] bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 z-10 border-b">
    <div className="max-w-7xl mx-auto flex flex-wrap gap-2 items-center">
      <div className="relative grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search projects..."
          className="pl-8 bg-white dark:bg-slate-900"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <FilterPopover 
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
      <ViewSelector 
        view={view}
        onViewChange={setView}
        options={["grid", "list", "kanban"]}
      />
    </div>
  </div>
  
  {/* Project content */}
  <div className="flex-1 overflow-auto p-6">
    <div className="max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {view === "grid" && (
            <ProjectsGrid 
              projects={filteredProjects}
              onProjectUpdated={handleProjectsUpdated}
            />
          )}
          
          {view === "list" && (
            <ProjectsList 
              projects={filteredProjects}
              onProjectUpdated={handleProjectsUpdated}
            />
          )}
          
          {view === "kanban" && (
            <ProjectsKanban 
              projects={filteredProjects}
              onProjectUpdated={handleProjectsUpdated}
            />
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
            <FolderSearch className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {searchQuery ? `No projects match "${searchQuery}"` : "You don't have any projects for this period."}
          </p>
          <Button onClick={() => setNewProjectDialogOpen(true)}>
            Create New Project
          </Button>
        </div>
      )}
    </div>
  </div>
</div>
```

## Option 2: Multi-View Project Management Hub

![Multi-View Project Management Hub](https://placehold.co/600x400/fff0e7/333?text=Multi-View+Hub)

### Key Features

- **Toggle Between Views**: List, Kanban, Calendar, and Grid views
- **Command Menu**: Press `Cmd+K` to open a command palette for project actions
- **Swimlanes**: Group projects by status or priority in the list view
- **Sidebar Filters**: Collapsible sidebar with advanced filter options
- **Timeline View**: Visual timeline representation of projects
- **Data Tables**: Sortable columns for detailed analysis

### Implementation Highlights

```tsx
<div className="flex h-full overflow-hidden bg-white dark:bg-slate-900">
  {/* Filter sidebar */}
  <AnimatePresence>
    {isFilterOpen && (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 280, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="border-r h-full bg-white dark:bg-slate-900 overflow-hidden"
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Filters</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-auto">
            <FilterSection 
              title="Status"
              options={statusOptions}
              selected={filters.status}
              onChange={status => setFilters({...filters, status})}
            />
            
            <FilterSection 
              title="Priority"
              options={priorityOptions}
              selected={filters.priority}
              onChange={priority => setFilters({...filters, priority})}
            />
            
            <FilterSection 
              title="Team Members"
              options={teamMembers}
              selected={filters.team}
              onChange={team => setFilters({...filters, team})}
              renderOption={member => (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span>{member.name}</span>
                </div>
              )}
            />
            
            <FilterSection 
              title="Date Range"
              customContent={
                <DateRangePicker 
                  from={filters.dateRange.from}
                  to={filters.dateRange.to}
                  onSelect={range => setFilters({...filters, dateRange: range})}
                />
              }
            />
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setFilters(defaultFilters)}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  
  {/* Main content */}
  <div className="flex-1 flex flex-col h-full overflow-hidden">
    <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="mr-2"
        >
          <Filter className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Projects</h1>
        <Badge variant="outline" className="ml-2">
          {filteredProjects.length} projects
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <ViewToggle 
          view={currentView}
          onViewChange={setCurrentView}
          views={[
            { id: 'list', icon: <List className="h-4 w-4" />, label: 'List' },
            { id: 'grid', icon: <Grid className="h-4 w-4" />, label: 'Grid' },
            { id: 'kanban', icon: <Kanban className="h-4 w-4" />, label: 'Kanban' },
            { id: 'calendar', icon: <Calendar className="h-4 w-4" />, label: 'Calendar' },
            { id: 'timeline', icon: <GitBranch className="h-4 w-4" />, label: 'Timeline' }
          ]}
        />
        
        <Button onClick={() => setNewProjectDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>
    </div>
    
    <div className="flex-1 overflow-auto">
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </div>
  
  {/* Command menu (K) */}
  <CommandMenu
    open={isCommandMenuOpen}
    onOpenChange={setIsCommandMenuOpen}
    projects={projects}
    onProjectSelect={handleProjectSelect}
    onCreateProject={() => setNewProjectDialogOpen(true)}
  />
</div>
```

## Option 3: Interactive Project Gallery

![Interactive Project Gallery](https://placehold.co/600x400/e7fff0/333?text=Interactive+Gallery)

### Key Features

- **Spotlight Projects**: Featured projects at the top with visual banners
- **Interactive Cards**: Cards with micro-interactions, animated stats
- **3D Effects**: Subtle parallax and depth effects on hover
- **Contextual Grouping**: Group projects by client, status, or theme
- **Activity Feed**: Recent updates and activity in projects
- **Analytics Overview**: Visual stats of project progress
- **Smart Categorization**: Auto-tags and categorizes projects

### Implementation Highlights

```tsx
<div className="flex flex-col h-full bg-gradient-to-br from-[#f8fafc] to-[#eef2ff] dark:from-slate-950 dark:to-indigo-950">
  {/* Hero header */}
  <div className="relative overflow-hidden">
    <div 
      className="absolute inset-0 z-0" 
      style={{ 
        backgroundImage: 'url("https://ui.shadcn.com/examples/music-app.png")', 
        backgroundSize: 'cover',
        opacity: 0.05 
      }} 
    />
    <div className="relative z-10 px-6 py-12 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-slate-700 dark:from-white dark:to-slate-300">
        Your Projects
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 max-w-2xl">
        Manage and track all your projects in one place. Create, organize, and collaborate seamlessly.
      </p>
      
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all"
          onClick={() => setNewProjectDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Create Project
        </Button>
        
        <Button variant="outline" className="bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
        
        <div className="ml-auto">
          <Tabs defaultValue="all" className="w-[400px]">
            <TabsList className="bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 border">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  </div>

  {/* Project metrics */}
  <div className="px-6 -mt-6 relative z-10">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
      <MetricCard
        title="Active Projects"
        value={activeProjects.length}
        icon={<Activity className="h-5 w-5 text-blue-500" />}
        trend="+5% from last month"
        trendUp={true}
      />
      <MetricCard
        title="Completed"
        value={completedProjects.length}
        icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        trend="On track"
      />
      <MetricCard
        title="Delayed"
        value={delayedProjects.length}
        icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
        trend="+2 this week"
        trendUp={false}
      />
      <MetricCard
        title="Team Utilization"
        value="76%"
        icon={<Users className="h-5 w-5 text-indigo-500" />}
        trend="+12% from last month"
        trendUp={true}
      />
    </div>
  </div>
  
  {/* Project content */}
  <div className="flex-1 overflow-auto px-6 py-8">
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Spotlight project */}
      {featuredProject && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
            Featured Project
          </h2>
          
          <SpotlightCard 
            project={featuredProject}
            onProjectUpdated={handleProjectsUpdated}
          />
        </div>
      )}
      
      {/* Project sections */}
      {Object.entries(groupedProjects).map(([groupName, projects]) => (
        <div key={groupName} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            {renderGroupIcon(groupName)}
            {formatGroupName(groupName)}
            <Badge className="ml-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              {projects.length}
            </Badge>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProjectCard3D
                    project={project}
                    onProjectUpdated={handleProjectsUpdated}
                    onProjectDelete={handleProjectDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
      
      {/* Empty state */}
      {totalProjects === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-blue-500 opacity-20 blur-3xl -z-10 rounded-full" />
            <FolderPlus className="h-20 w-20 text-slate-300 dark:text-slate-700 mb-4" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No projects yet</h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
            Create your first project to get started. You can add details, assign team members, and track progress.
          </p>
          <Button 
            size="lg"
            onClick={() => setNewProjectDialogOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            <Plus className="mr-2 h-5 w-5" /> Create Your First Project
          </Button>
        </div>
      )}
    </div>
  </div>
  
  {/* Footer with pagination */}
  <div className="border-t bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 p-4">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <p className="text-sm text-slate-500">
        Showing {filteredProjects.length} of {totalProjects} projects
      </p>
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</div>
```

## Key UI Components for Integration

### MetricCard Component

```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

function MetricCard({ title, value, icon, trend, trendUp }: MetricCardProps) {
  return (
    <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm hover:shadow-md transition-all border overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            
            {trend && (
              <p className={cn(
                "text-xs flex items-center mt-2",
                trendUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {trend}
              </p>
            )}
          </div>
          
          <div className="rounded-lg p-2 bg-slate-100 dark:bg-slate-800">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### ProjectCard3D Component

```tsx
function ProjectCard3D({ project, onProjectUpdated, onProjectDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Status badge color
  const statusColor = {
    'new': 'bg-blue-100 text-blue-800 border-blue-200',
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in-progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200',
  }[project.status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardHeader className="p-6 relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-transparent dark:from-blue-900/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-md border bg-white flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src={project.logo_url || 'https://placehold.co/40x40/EEE/999?text=Logo'}
                  alt={`${project.title} logo`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/EEE/999?text=Logo';
                  }}
                />
              </div>
              
              <div>
                <CardTitle className="text-xl">{project.title}</CardTitle>
                {project.client && (
                  <div className="text-sm text-slate-500 flex items-center mt-1">
                    <Building className="h-3.5 w-3.5 mr-1 opacity-70" />
                    <span>{project.client.name || project.client.company_name}</span>
                  </div>
                )}
              </div>
            </div>
            
            <Badge className={cn("font-normal", statusColor)}>
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-4 relative">
          <div className="space-y-5">
            <motion.div 
              className="space-y-2"
              animate={{ 
                scale: isHovered ? 1.02 : 1,
                transition: { duration: 0.2 }
              }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Crew filled</span>
                <span className="font-medium">{project.filled_positions}/{project.crew_count}</span>
              </div>
              <Progress 
                value={Math.round((project.filled_positions / project.crew_count) * 100)} 
                className="h-2"
              />
            </motion.div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Date</p>
                  <p className="font-medium">{formatDate(project.start_date)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Time</p>
                  <p className="font-medium">{project.working_hours_start} - {project.working_hours_end}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <div className="px-6 pb-6">
          <div className="w-full h-px bg-slate-200 dark:bg-slate-700 mb-4"></div>
          
          <div className="flex items-center justify-between">
            <AvatarGroup limit={4}>
              {project.contributors?.map((contributor, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar>
                        <AvatarImage
                          src={contributor.image || contributor.avatar}
                          alt={contributor.name}
                        />
                        <AvatarFallback>
                          {contributor.name && contributor.name[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{contributor.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </AvatarGroup>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
```

### ViewToggle Component

```tsx
interface ViewOption {
  id: string;
  icon: React.ReactNode;
  label: string;
}

interface ViewToggleProps {
  view: string;
  onViewChange: (view: string) => void;
  views: ViewOption[];
}

function ViewToggle({ view, onViewChange, views }: ViewToggleProps) {
  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      {views.map((option) => (
        <Button
          key={option.id}
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-1 px-3 rounded",
            view === option.id ? 
              "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" : 
              "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          )}
          onClick={() => onViewChange(option.id)}
        >
          {option.icon}
          <span className="sr-only md:not-sr-only md:inline-block">
            {option.label}
          </span>
        </Button>
      ))}
    </div>
  );
}
```