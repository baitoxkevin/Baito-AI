import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Clock, ExternalLink, FileText, Layers, Share2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: "Owner" | "Collaborator" | "Viewer";
  mentionStatus?: "Pending" | "Viewed" | "Acknowledged";
  mentionContext?: string[];
}

interface FileComment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
}

interface ExternalFile {
  id: string;
  name: string;
  type: "drive" | "sheet" | "doc" | "other";
  url: string;
  lastModified: string;
  comments?: FileComment[];
}

interface CardComment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  mentionedUsers?: User[];
}

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: "Low" | "Medium" | "High";
  dueDate?: string;
  mentionedUsers: User[];
  collaborators: User[];
  externalFiles?: ExternalFile[];
  checklist?: ChecklistItem[];
  currentUserId: string;
}

export function TaskCard({
  id,
  title,
  description,
  status,
  priority,
  dueDate,
  mentionedUsers,
  collaborators,
  externalFiles = [],
  checklist = [],
  currentUserId,
}: TaskCardProps) {
  const [localMentionedUsers, setLocalMentionedUsers] = useState<User[]>(mentionedUsers);
  const [localCollaborators, setLocalCollaborators] = useState<User[]>(collaborators);
  
  const currentUserMentioned = localMentionedUsers.some(user => user.id === currentUserId);
  const currentUserAcknowledged = localMentionedUsers.find(user => user.id === currentUserId)?.mentionStatus === "Acknowledged";
  
  const handleAcknowledge = () => {
    setLocalMentionedUsers(prev => 
      prev.map(user => 
        user.id === currentUserId 
          ? { ...user, mentionStatus: "Acknowledged" } 
          : user
      )
    );
  };
  
  const handleJoinCollaboration = () => {
    // First acknowledge the mention
    handleAcknowledge();
    
    // Add current user to collaborators if not already there
    if (!localCollaborators.some(user => user.id === currentUserId)) {
      const currentUser = localMentionedUsers.find(user => user.id === currentUserId);
      if (currentUser) {
        setLocalCollaborators(prev => [
          ...prev, 
          { ...currentUser, role: "Collaborator" }
        ]);
      }
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-orange-100 text-orange-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };
  
  const getFileIcon = (type: string) => {
    switch (type) {
      case "drive": return "🗄️";
      case "sheet": return "📊";
      case "doc": return "📝";
      default: return "📄";
    }
  };

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className={getPriorityColor(priority)}>
                {priority}
              </Badge>
              {dueDate && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {dueDate}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex -space-x-2">
            {localCollaborators.slice(0, 3).map(user => (
              <TooltipProvider key={user.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{user.name} ({user.role})</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {localCollaborators.length > 3 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="h-8 w-8 border-2 border-white bg-slate-300 hover:bg-slate-400 cursor-pointer">
                    <AvatarFallback>+{localCollaborators.length - 3}</AvatarFallback>
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <h4 className="font-semibold mb-2">All Collaborators</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {localCollaborators.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-100">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{user.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        
        {/* Action Required / Collaboration Mode Bar */}
        {currentUserMentioned && (
          <div className={`mt-3 p-2 rounded-md text-white flex justify-between items-center ${currentUserAcknowledged ? 'bg-green-600' : 'bg-red-600'}`}>
            <div className="flex items-center gap-2">
              {currentUserAcknowledged ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Collaboration Mode</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Action Required</span>
                </>
              )}
            </div>
            {!currentUserAcknowledged && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-white text-red-600 hover:bg-red-50" onClick={handleAcknowledge}>
                  Acknowledge
                </Button>
                <Button size="sm" variant="outline" className="bg-white text-red-600 hover:bg-red-50" onClick={handleJoinCollaboration}>
                  Join Collaboration
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-slate-600 mb-3">{description}</p>
        
        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2 flex items-center gap-1">
              <Layers className="h-4 w-4" /> Checklist
            </h4>
            <div className="space-y-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-start gap-2">
                  <Checkbox id={`item-${item.id}`} checked={item.completed} />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`item-${item.id}`}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${item.completed ? 'line-through text-slate-400' : ''}`}
                    >
                      {item.text}
                    </label>
                    {item.mentionedUsers && item.mentionedUsers.length > 0 && (
                      <div className="flex -space-x-2 mt-1">
                        {item.mentionedUsers.map(user => (
                          <TooltipProvider key={user.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-5 w-5 border-2 border-white">
                                  <AvatarImage src={user.avatar} alt={user.name} />
                                  <AvatarFallback>{user.name.substring(0, 1)}</AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-semibold">{user.name}</p>
                                  <p>Status: {user.mentionStatus}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* External Files */}
        {externalFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2 flex items-center gap-1">
              <FileText className="h-4 w-4" /> 
              Linked Files <Badge variant="secondary" className="ml-1">{externalFiles.length}</Badge>
            </h4>
            <div className="space-y-2">
              {externalFiles.map(file => (
                <a 
                  key={file.id} 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-md border border-slate-200 hover:bg-slate-50 group"
                >
                  <div className="flex items-center gap-2">
                    <span>{getFileIcon(file.type)}</span>
                    <div>
                      <p className="font-medium text-sm group-hover:text-blue-600">{file.name}</p>
                      <p className="text-xs text-slate-500">Modified {file.lastModified}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4">
        <Tabs defaultValue="mentioned" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All Users</TabsTrigger>
            <TabsTrigger value="mentioned" className="flex-1">
              Mentioned Users
              {localMentionedUsers.length > 0 && (
                <Badge className="ml-2 bg-blue-100 text-blue-800">{localMentionedUsers.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-2">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[...localCollaborators, ...localMentionedUsers.filter(
                mentionedUser => !localCollaborators.some(collab => collab.id === mentionedUser.id)
              )].map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role && <Badge variant="outline">{user.role}</Badge>}
                    {user.mentionStatus && (
                      <Badge variant={user.mentionStatus === "Pending" ? "destructive" : user.mentionStatus === "Viewed" ? "outline" : "secondary"}>
                        {user.mentionStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="mentioned" className="mt-2">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {localMentionedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium">{user.name}</span>
                      {user.mentionContext && user.mentionContext.length > 0 && (
                        <p className="text-xs text-slate-500">
                          Mentioned in: {user.mentionContext.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      user.mentionStatus === "Pending" ? "destructive" : 
                      user.mentionStatus === "Viewed" ? "outline" : 
                      "secondary"
                    }>
                      {user.mentionStatus}
                    </Badge>
                    {user.id === currentUserId && user.mentionStatus === "Pending" && (
                      <Button size="sm" variant="outline" onClick={handleAcknowledge}>
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {localMentionedUsers.length === 0 && (
                <p className="text-center text-slate-500 py-4">No mentioned users</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardFooter>
    </Card>
  );
}