import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, AlertCircle, Info, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

import { 
  getProjectChangeHistory, 
  saveProjectChangeContext,
  generateAIInsightsForChanges,
  saveAIInsights,
  ProjectChange,
  ProjectAIContext
} from '@/lib/project-change-service';

interface ProjectChangeLogProps {
  projectId: string;
  refreshTrigger?: number; // Increment this to refresh the log
}

export default function ProjectChangeLog({ projectId, refreshTrigger = 0 }: ProjectChangeLogProps) {
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<ProjectChange[]>([]);
  const [context, setContext] = useState<ProjectAIContext[]>([]);
  const [newContext, setNewContext] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const { toast } = useToast();

  // Fetch project change history
  useEffect(() => {
    const fetchChangeHistory = async () => {
      if (!projectId) return;
      
      setLoading(true);
      try {
        const history = await getProjectChangeHistory(projectId);
        setChanges(history.changes);
        setContext(history.context);
      } catch (error) {
        console.error('Error fetching project change history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project change history',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChangeHistory();
  }, [projectId, refreshTrigger, toast]);

  // Submit new context
  const handleSubmitContext = async () => {
    if (!newContext.trim() || !projectId) return;
    
    setSubmitting(true);
    try {
      // Get all recent change IDs without context
      const recentChangeIds = changes
        .filter(change => !context.some(ctx => ctx.related_change_id === change.id))
        .map(change => change.id);
      
      if (recentChangeIds.length === 0) return;
      
      // Save user context
      const success = await saveProjectChangeContext(
        projectId,
        recentChangeIds,
        newContext
      );
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Your context has been saved',
        });
        
        // Refresh changes and context
        const history = await getProjectChangeHistory(projectId);
        setChanges(history.changes);
        setContext(history.context);
        setNewContext('');
        
        // Generate AI insights based on the changes and new context
        await generateAndSaveInsights();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save your context',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting context:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Generate and save AI insights
  const generateAndSaveInsights = async () => {
    setLoadingInsights(true);
    try {
      // Generate insights (this would use Claude API in production)
      const insights = await generateAIInsightsForChanges(projectId, changes, context);
      
      if (insights) {
        // Save insights
        await saveAIInsights(projectId, insights);
        
        // Refresh changes and context
        const history = await getProjectChangeHistory(projectId);
        setContext(history.context);
        
        toast({
          title: 'AI Insights Generated',
          description: 'New insights are available based on project changes',
        });
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Group changes by date
  const groupedChanges = changes.reduce((groups, change) => {
    const date = change.created_at.split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(change);
    return groups;
  }, {} as Record<string, ProjectChange[]>);

  // Prepare dates in reverse chronological order
  const dates = Object.keys(groupedChanges).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Get AI insights from context
  const insights = context.filter(ctx => ctx.context_type === 'insight' && ctx.source === 'ai_generated');
  
  // Get user-provided context
  const userContext = context.filter(ctx => ctx.source === 'user_input');

  // Check if there are changes needing context
  const hasChangesNeedingContext = changes.some(change => 
    !context.some(ctx => ctx.related_change_id === change.id) &&
    ['crew_count', 'supervisors_required', 'start_date', 'end_date', 'status', 'venue_address'].includes(change.field_name)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading project history...</span>
      </div>
    );
  }

  return (
    <Tabs defaultValue="changes" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="changes">Changes</TabsTrigger>
        <TabsTrigger value="insights">AI Insights</TabsTrigger>
      </TabsList>
      
      <TabsContent value="changes">
        {hasChangesNeedingContext && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardHeader className="py-3">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <CardTitle className="text-base text-amber-800 dark:text-amber-300">Project Changes Detected</CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-400">
                    Please provide context for recent changes to help with project planning
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Why were these changes made? This helps our AI provide better recommendations."
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
                className="min-h-[80px]"
              />
            </CardContent>
            <CardFooter className="flex justify-end py-3">
              <Button 
                onClick={handleSubmitContext}
                disabled={submitting || !newContext.trim()}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Context
              </Button>
            </CardFooter>
          </Card>
        )}

        {dates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No changes have been recorded for this project yet.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] rounded-md border">
            <div className="p-4">
              {dates.map(date => (
                <div key={date} className="mb-6">
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </h3>
                  
                  <div className="space-y-3">
                    {groupedChanges[date].map(change => {
                      // Find any context associated with this change
                      const changeContext = context.find(ctx => ctx.related_change_id === change.id);
                      
                      return (
                        <Card key={change.id} className="overflow-hidden">
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Badge variant="outline" className="mr-2">
                                  {change.display_name || change.field_name}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(change.created_at), 'h:mm a')}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="py-2">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mr-2">
                                <span className="text-red-500 text-sm font-medium">-</span>
                              </div>
                              <div className="text-sm line-through text-muted-foreground">
                                {change.old_value || '[empty]'}
                              </div>
                            </div>
                            
                            <div className="flex items-center mt-2">
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                                <span className="text-green-500 text-sm font-medium">+</span>
                              </div>
                              <div className="text-sm font-medium">
                                {change.new_value || '[empty]'}
                              </div>
                            </div>
                            
                            {changeContext && (
                              <div className="mt-3 pl-10 border-l-2 border-primary/30">
                                <div className="flex items-start">
                                  <MessageSquare className="h-4 w-4 text-primary mr-2 mt-0.5" />
                                  <div className="text-sm">
                                    {changeContext.content}
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </TabsContent>
      
      <TabsContent value="insights">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-5 w-5 text-primary mr-2" />
              AI Insights & Recommendations
            </CardTitle>
            <CardDescription>
              Based on project changes and context
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInsights ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Generating insights...</p>
              </div>
            ) : insights.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No insights available yet.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={generateAndSaveInsights}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Insights
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {insights.map(insight => (
                    <div key={insight.id} className="p-4 border rounded-lg bg-primary/5">
                      <div className="flex">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src="/ai-assistant.png" />
                          <AvatarFallback className="bg-primary/20 text-primary">AI</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm mb-1 font-medium">AI Assistant</p>
                          <p className="text-sm">{insight.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(insight.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={generateAndSaveInsights}
              disabled={loadingInsights}
            >
              {loadingInsights ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Refresh Insights
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}