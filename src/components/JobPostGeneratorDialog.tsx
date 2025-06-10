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
      console.error('Error loading job posts:', error);
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
      console.error('Error saving job post:', error);
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
      console.error('Error deleting job post:', error);
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
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Job Post Generator - {project.title}
          </DialogTitle>
          <DialogDescription>
            Generate and manage job post advertisements for this project
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate" className="flex-1">
          <TabsList>
            <TabsTrigger value="generate">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="saved">
              <FileText className="h-4 w-4 mr-2" />
              Saved Posts ({savedPosts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Left side - Template Builder */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Template Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Template Type</Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                        <SelectTrigger>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input 
                          value={templateData.date || ''}
                          onChange={(e) => setTemplateData(prev => ({ ...prev, date: e.target.value }))}
                          placeholder="e.g., 7th June 2025"
                        />
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input 
                          value={templateData.time || ''}
                          onChange={(e) => setTemplateData(prev => ({ ...prev, time: e.target.value }))}
                          placeholder="e.g., 9am-6pm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Location</Label>
                      <Input 
                        value={templateData.location || ''}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Venue address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Payment</Label>
                        <Input 
                          value={templateData.payment || ''}
                          onChange={(e) => setTemplateData(prev => ({ ...prev, payment: e.target.value }))}
                          placeholder="e.g., RM100/day"
                        />
                      </div>
                      <div>
                        <Label>Pax Count</Label>
                        <Input 
                          type="number"
                          value={templateData.paxCount || ''}
                          onChange={(e) => setTemplateData(prev => ({ ...prev, paxCount: parseInt(e.target.value) }))}
                          placeholder="Number needed"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Attire</Label>
                      <Input 
                        value={templateData.attire || ''}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, attire: e.target.value }))}
                        placeholder="e.g., Black t-shirt, black pants"
                      />
                    </div>

                    <div>
                      <Label>Job Scope</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={newJobScope}
                            onChange={(e) => setNewJobScope(e.target.value)}
                            placeholder="Add job scope item"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addJobScope())}
                          />
                          <Button onClick={addJobScope} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {templateData.jobScope?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                            <span className="text-sm">• {item}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeJobScope(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Requirements</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={newRequirement}
                            onChange={(e) => setNewRequirement(e.target.value)}
                            placeholder="Add requirement"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                          />
                          <Button onClick={addRequirement} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {templateData.requirements?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                            <span className="text-sm">• {item}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeRequirement(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Contact Info</Label>
                      <Input 
                        value={templateData.contactInfo || ''}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, contactInfo: e.target.value }))}
                        placeholder="e.g., Kindly WhatsApp to..."
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          checked={templateData.urgency}
                          onCheckedChange={(checked) => 
                            setTemplateData(prev => ({ ...prev, urgency: checked as boolean }))
                          }
                        />
                        <Label className="text-sm">Urgent</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          checked={templateData.publicHoliday}
                          onCheckedChange={(checked) => 
                            setTemplateData(prev => ({ ...prev, publicHoliday: checked as boolean }))
                          }
                        />
                        <Label className="text-sm">Public Holiday</Label>
                      </div>
                    </div>

                    <Button onClick={generatePost} className="w-full">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Job Post
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right side - Preview */}
              <div className="space-y-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      Preview
                      {content && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handleCopy}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            {editingPost ? 'Update' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Job post title"
                        />
                      </div>
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Job post content will appear here..."
                          className="min-h-[400px] font-mono text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : savedPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved job posts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedPosts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{post.title}</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadPostForEditing(post)}
                            >
                              <Edit2 className="h-4 w-4" />
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
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleDelete(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created {format(new Date(post.created_at), 'dd MMM yyyy, h:mm a')}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}