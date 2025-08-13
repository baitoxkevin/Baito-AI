import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  generateJobPostContent, 
  saveJobPost, 
  getProjectJobPosts,
  updateJobPost,
  deleteJobPost,
  jobPostTemplates,
  JobPostTemplate 
} from '@/lib/job-post-service';
import { Project } from '@/lib/types';
import { format } from 'date-fns';
import { 
  Copy, 
  Save, 
  Trash2, 
  Edit2, 
  FileText, 
  Megaphone,
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Shirt,
  ClipboardList,
  AlertCircle,
  Sparkles,
  Send,
  Loader2,
  Plus,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface JobPostGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function JobPostGeneratorDialog({
  open,
  onOpenChange,
  project
}: JobPostGeneratorDialogProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Template form state
  const [templateData, setTemplateData] = useState<Partial<JobPostTemplate>>({
    projectTitle: project.title,
    date: '',
    time: '',
    location: project.venue_address,
    payment: '',
    attire: '',
    jobScope: [],
    requirements: [],
    contactInfo: 'Kindly WhatsApp profile to [Name] wa.me/60XXXXXXXXX',
    urgency: false,
    publicHoliday: false
  });
  
  // Job scope and requirements input
  const [newJobScope, setNewJobScope] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  useEffect(() => {
    if (open) {
      loadSavedPosts();
      initializeTemplate();
    }
  }, [open, project]);

  const initializeTemplate = () => {
    const startDate = new Date(project.start_date);
    const endDate = project.end_date ? new Date(project.end_date) : null;
    
    // Format date
    let dateStr = format(startDate, 'do MMMM yyyy');
    if (endDate && endDate.getTime() !== startDate.getTime()) {
      dateStr = `${format(startDate, 'do')} - ${format(endDate, 'do MMMM yyyy')}`;
    }
    
    // Format time
    const timeStr = `${project.working_hours_start || '9:00am'} - ${project.working_hours_end || '6:00pm'}`;
    
    setTemplateData({
      projectTitle: project.title,
      date: dateStr,
      time: timeStr,
      location: project.venue_address,
      payment: project.supervisors_required > 0 ? 'RM150/day' : 'RM100/day',
      attire: '',
      jobScope: [],
      requirements: [],
      contactInfo: 'Kindly WhatsApp profile to [Name] wa.me/60XXXXXXXXX',
      urgency: false,
      publicHoliday: false,
      paxCount: project.crew_count
    });
    
    // Set default title
    setTitle(`${project.title} - ${project.event_type || 'Crew'} Needed`);
  };

  const loadSavedPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getProjectJobPosts(project.id);
      if (error) throw error;
      setSavedPosts(data || []);
    } catch (error) {
      // console.error('Error loading job posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved job posts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    
    if (template !== 'custom' && jobPostTemplates[template as keyof typeof jobPostTemplates]) {
      const templateConfig = jobPostTemplates[template as keyof typeof jobPostTemplates];
      setTemplateData(prev => ({
        ...prev,
        ...templateConfig
      }));
    }
  };

  const addJobScope = () => {
    if (newJobScope.trim()) {
      setTemplateData(prev => ({
        ...prev,
        jobScope: [...(prev.jobScope || []), newJobScope.trim()]
      }));
      setNewJobScope('');
    }
  };

  const removeJobScope = (index: number) => {
    setTemplateData(prev => ({
      ...prev,
      jobScope: prev.jobScope?.filter((_, i) => i !== index) || []
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setTemplateData(prev => ({
        ...prev,
        requirements: [...(prev.requirements || []), newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setTemplateData(prev => ({
      ...prev,
      requirements: prev.requirements?.filter((_, i) => i !== index) || []
    }));
  };

  const generatePost = () => {
    const generatedContent = generateJobPostContent(project, templateData);
    setContent(generatedContent);
    setContactInfo(templateData.contactInfo || '');
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Please generate content first',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingPost) {
        const { error } = await updateJobPost(editingPost, {
          title,
          content,
          contact_info: contactInfo
        });
        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Job post updated successfully'
        });
      } else {
        const { error } = await saveJobPost({
          project_id: project.id,
          title,
          content,
          contact_info: contactInfo
        });
        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Job post saved successfully'
        });
      }
      
      loadSavedPosts();
      setEditingPost(null);
    } catch (error) {
      // console.error('Error saving job post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save job post',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Job post content copied to clipboard'
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteJobPost(id);
      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Job post deleted successfully'
      });
      loadSavedPosts();
    } catch (error) {
      // console.error('Error deleting job post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job post',
        variant: 'destructive'
      });
    }
  };

  const loadPostForEditing = (post: any) => {
    setEditingPost(post.id);
    setTitle(post.title);
    setContent(post.content);
    setContactInfo(post.contact_info || '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4" />
            Job Post Generator
          </DialogTitle>
          <DialogDescription className="text-sm">
            Create job advertisements for {project.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate" className="flex-1">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="generate" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-xs">
              <FileText className="h-3 w-3 mr-1.5" />
              Saved ({savedPosts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-3">
            <div className="grid grid-cols-5 gap-3 h-[calc(85vh-180px)]">
              {/* Left side - Template Builder */}
              <div className="col-span-3 overflow-y-auto pr-2">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Template Builder</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div>
                      <Label className="text-xs">Template Type</Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="promoter">Promoter</SelectItem>
                          <SelectItem value="eventCrew">Event Crew</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="umpire">Umpire/Referee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input 
                          className="h-8 text-sm"
                          value={templateData.date || ''}
                          onChange={(e) => setTemplateData(prev => ({ ...prev, date: e.target.value }))}
                          placeholder="e.g., 7th June 2025"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Time</Label>
                        <Input 
                          className="h-8 text-sm"
                          value={templateData.time || ''}
                          onChange={(e) => setTemplateData(prev => ({ ...prev, time: e.target.value }))}
                          placeholder="e.g., 9am-6pm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Location</Label>
                      <Input 
                        className="h-8 text-sm"
                        value={templateData.location || ''}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Venue address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Payment</Label>
                        <Input 
                          className="h-8 text-sm"
                          value={templateData.payment || ''}
                          onChange={(e) => setTemplateData(prev => ({ ...prev, payment: e.target.value }))}
                          placeholder="e.g., RM100/day"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Pax Count</Label>
                        <Input 
                          className="h-8 text-sm"
                          type="number"
                          value={templateData.paxCount || ''}
                          onChange={(e) => setTemplateData(prev => ({ ...prev, paxCount: parseInt(e.target.value) }))}
                          placeholder="Number"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Attire</Label>
                      <Input 
                        className="h-8 text-sm"
                        value={templateData.attire || ''}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, attire: e.target.value }))}
                        placeholder="e.g., Black t-shirt, black pants"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Job Scope</Label>
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <Input
                            className="h-7 text-sm"
                            value={newJobScope}
                            onChange={(e) => setNewJobScope(e.target.value)}
                            placeholder="Add job scope item"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addJobScope())}
                          />
                          <Button onClick={addJobScope} size="sm" className="h-7 w-7 p-0">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {templateData.jobScope?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-1.5 rounded text-xs">
                            <span>• {item}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={() => removeJobScope(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Requirements</Label>
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <Input
                            className="h-7 text-sm"
                            value={newRequirement}
                            onChange={(e) => setNewRequirement(e.target.value)}
                            placeholder="Add requirement"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                          />
                          <Button onClick={addRequirement} size="sm" className="h-7 w-7 p-0">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {templateData.requirements?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-1.5 rounded text-xs">
                            <span>• {item}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={() => removeRequirement(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Contact Info</Label>
                      <Input 
                        className="h-8 text-sm"
                        value={templateData.contactInfo || ''}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, contactInfo: e.target.value }))}
                        placeholder="e.g., Kindly WhatsApp to..."
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="urgency"
                          checked={templateData.urgency}
                          onCheckedChange={(checked) => 
                            setTemplateData(prev => ({ ...prev, urgency: checked as boolean }))
                          }
                          className="h-3 w-3"
                        />
                        <Label htmlFor="urgency" className="text-xs cursor-pointer">Urgent</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="holiday"
                          checked={templateData.publicHoliday}
                          onCheckedChange={(checked) => 
                            setTemplateData(prev => ({ ...prev, publicHoliday: checked as boolean }))
                          }
                          className="h-3 w-3"
                        />
                        <Label htmlFor="holiday" className="text-xs cursor-pointer">Public Holiday</Label>
                      </div>
                    </div>

                    <Button onClick={generatePost} className="w-full h-8 text-sm">
                      <Sparkles className="h-3 w-3 mr-1.5" />
                      Generate Job Post
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right side - Preview */}
              <div className="col-span-2 h-full">
                <Card className="h-full flex flex-col">
                  <CardHeader className="py-3 flex-shrink-0">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Preview</span>
                      {content && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs">
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs">
                            {isSaving ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            {editingPost ? 'Update' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-0">
                    <div className="space-y-2 flex-1 flex flex-col">
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input
                          className="h-8 text-sm"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Job post title"
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <Label className="text-xs mb-1">Content</Label>
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Job post content will appear here..."
                          className="flex-1 font-mono text-xs resize-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-3">
            <ScrollArea className="h-[calc(85vh-180px)]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : savedPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No saved job posts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPosts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{post.title}</CardTitle>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadPostForEditing(post)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(post.content);
                                toast({
                                  title: 'Copied!',
                                  description: 'Job post copied to clipboard'
                                });
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive h-7 w-7 p-0"
                              onClick={() => handleDelete(post.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created {format(new Date(post.created_at), 'dd MMM yyyy, h:mm a')}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <pre className="whitespace-pre-wrap text-xs font-mono bg-muted p-3 rounded">
                          {post.content}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}