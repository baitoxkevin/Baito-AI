import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Briefcase, FileText, AlertCircle, UserPlus, Edit, Mail, Phone, Sparkles, Settings, Brain, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProfileUpload } from '@/components/ui/profile-upload'
import { extractCandidateInfo, createCandidate, CandidateInfo } from '@/lib/candidate-import-service'
import { extractWithAI, aiResultToCandidateInfo, AIExtractionResult, getConfidenceColor, getConfidenceBadge } from '@/lib/ai-candidate-extractor'
import { AIExtractionSettings } from '@/components/AIExtractionSettings'
import { Switch } from '@/components/ui/switch'

interface CandidateTextImportToolProps {
  onOpenNewCandidateDialog?: (candidateData: any) => void;
}

export function CandidateTextImportTool({ onOpenNewCandidateDialog }: CandidateTextImportToolProps = {}) {
  const [inputText, setInputText] = useState('');
  const [extractedData, setExtractedData] = useState<CandidateInfo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('input');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [fullBodyPhoto, setFullBodyPhoto] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // AI extraction state - enabled by default if API key is available
  const hasApiKey = Boolean(import.meta.env.VITE_OPENROUTER_API_KEY);
  const [useAI, setUseAI] = useState(hasApiKey); // Enable by default
  const [aiModel, setAiModel] = useState('google/gemini-2.5-flash-preview-09-2025'); // Gemini - same as chatbot
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiResult, setAiResult] = useState<AIExtractionResult | null>(null);

  // Show info if API key is missing
  useEffect(() => {
    if (!hasApiKey && useAI) {
      toast({
        title: 'API Key Required',
        description: 'Add VITE_OPENROUTER_API_KEY to your .env file to use AI extraction',
        variant: 'destructive'
      });
      setUseAI(false);
    }
  }, [hasApiKey, useAI, toast]);
  
  // Function to handle profile photo change
  const handleProfilePhotoChange = (photo: string, type: string) => {
    if (type === 'face') {
      setProfilePhoto(photo);
      if (extractedData) {
        setExtractedData({
          ...extractedData,
          profile_photo: photo
        });
      }
    } else {
      setFullBodyPhoto(photo);
      if (extractedData) {
        setExtractedData({
          ...extractedData,
          full_body_photo: photo
        });
      }
    }
  };
  
  // Function to handle full body photo change
  const handleFullBodyPhotoChange = (photo: string) => {
    setFullBodyPhoto(photo);
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        full_body_photo: photo
      });
    }
  };

  // Function to extract candidate information from the text
  const analyzeText = async () => {
    if (!inputText.trim()) {
      setError('Please paste some text to analyze');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAiResult(null);

    try {
      if (useAI && hasApiKey) {
        // Use AI extraction with free DeepSeek model
        const result = await extractWithAI(
          inputText,
          undefined, // Will use env variable
          aiModel // Free DeepSeek model
        );

        setAiResult(result);
        const candidateInfo = aiResultToCandidateInfo(result, inputText);
        setExtractedData(candidateInfo);

        toast({
          title: "AI Extraction Complete",
          description: `Extracted with ${result.overallConfidence}% confidence using ${aiModel}`,
        });
      } else {
        // Use regex extraction
        const candidateInfo = extractCandidateInfo(inputText);
        setExtractedData(candidateInfo);
      }

      setActiveTab('preview');

    } catch (err) {
      console.error('Error analyzing text:', err);
      setError(`Failed to analyze text: ${err instanceof Error ? err.message : 'Unknown error'}`);

      toast({
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : "Could not extract candidate information",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (error) setError(null);
  };
  
  const clearForm = () => {
    setInputText('');
    setExtractedData(null);
    setProfilePhoto(null);
    setFullBodyPhoto(null);
    setActiveTab('input');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const [creating, setCreating] = useState(false);
  
  const handleCreateCandidate = async () => {
    if (!extractedData) return;
    
    setCreating(true);
    
    try {
      // Use the service to create the candidate
      const result = await createCandidate(extractedData);
      
      if (result.success) {
        toast({
          title: "Candidate Created",
          description: `${extractedData.name} has been added to your candidates.`,
        });

        // Clear the form
        clearForm();
      } else {
        // Handle specific error cases
        const error = result.error as any;
        let errorMessage = "Failed to create candidate. Please try again.";
        let errorTitle = "Error";

        if (error?.code === '23505') {
          // Duplicate constraint violation
          errorTitle = "Duplicate Candidate";
          if (error.message?.includes('ic_number')) {
            errorMessage = "A candidate with this IC number already exists in the system.";
          } else if (error.message?.includes('email')) {
            errorMessage = "A candidate with this email address already exists.";
          } else if (error.message?.includes('unique_id')) {
            errorMessage = "A candidate with this unique ID already exists.";
          } else {
            errorMessage = "This candidate already exists in the system.";
          }
        } else if (error?.code === '23502') {
          // Not null constraint violation
          const fieldName = error.message?.match(/column "(.+?)"/)?.[1] || 'unknown field';
          errorTitle = "Missing Required Information";
          errorMessage = `Required field is missing: ${fieldName.replace(/_/g, ' ')}`;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error creating candidate:', err);

      toast({
        title: "Error",
        description: "Failed to create candidate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };
  
  // Function to open the NewCandidateDialog with extracted data
  const handleOpenInDialog = () => {
    if (!extractedData || !onOpenNewCandidateDialog) return;
    
    // Generate a unique ID for the candidate
    const uniqueId = `C${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    
    // Convert the extracted data to the format expected by the dialog
    const dialogData = {
      legal_name: extractedData.name, // Use name directly, without I/C prefix
      registration_id: extractedData.ic_number || '',
      phone_number: extractedData.phone || '',
      email: extractedData.email || '',
      unique_id: uniqueId,
      
      // Address from location
      street_business: extractedData.location || '',
      
      // Additional fields
      age: extractedData.age || '',
      race: extractedData.race || '',
      tshirt_size: extractedData.tshirt_size || '',
      transportation: extractedData.transportation || '',
      spoken_languages: extractedData.spoken_languages || '',
      height: extractedData.height || '',
      typhoid: extractedData.typhoid?.toLowerCase().includes('yes') ? 'yes' : 'no',
      work_experience: extractedData.experience.join('\n\n') || '',
      
      // Date of birth extracted from IC
      date_of_birth: extractedData.date_of_birth || '',
      
      // Emergency contact information
      emergency_contact_name: extractedData.emergency_contact_name || '',
      emergency_contact_number: extractedData.emergency_contact_number || '',
      
      // Photos
      profile_photo: profilePhoto || extractedData.profile_photo || '',
      full_body_photo: fullBodyPhoto || extractedData.full_body_photo || '',
    };
    
    // Pass the data to the parent component
    onOpenNewCandidateDialog(dialogData);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
              {useAI ? (
                <Brain className="h-5 w-5 text-purple-500" />
              ) : (
                <Sparkles className="h-5 w-5 text-blue-500" />
              )}
              {useAI ? 'AI-Powered' : 'Smart'} Candidate Profile Generator
            </CardTitle>
            <CardDescription className="mt-1.5 text-slate-500 dark:text-slate-400">
              {useAI
                ? 'Using AI reasoning to intelligently extract and map candidate information'
                : 'Paste resume text to automatically extract candidate information'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* AI Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="ai-mode" className="text-sm cursor-pointer flex items-center gap-1.5">
                {useAI ? (
                  <>
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-purple-600">AI Mode</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Enable AI</span>
                )}
              </Label>
              <Switch
                id="ai-mode"
                checked={useAI}
                onCheckedChange={(checked) => {
                  if (checked && !hasApiKey) {
                    toast({
                      title: 'API Key Required',
                      description: 'Add VITE_OPENROUTER_API_KEY to your .env file to use AI extraction',
                      variant: 'destructive'
                    });
                  } else {
                    setUseAI(checked);
                  }
                }}
              />
            </div>
            {/* Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* AI Settings Dialog */}
      <AIExtractionSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSave={(model) => {
          setAiModel(model);
          localStorage.setItem('ai_extraction_model', model);
          toast({
            title: 'Model Updated',
            description: `Now using ${model} for AI extraction`
          });
        }}
        currentModel={aiModel}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mx-6 my-4 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-full">
          <TabsTrigger value="input" className="flex items-center rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
            <FileText className="w-4 h-4 mr-2" />
            Input Resume Text
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400" disabled={!extractedData}>
            <User className="w-4 h-4 mr-2" />
            Preview Profile
          </TabsTrigger>
        </TabsList>
        
        <CardContent>
          <TabsContent value="input" className="mt-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resume-text" className="text-sm font-medium flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Resume Text
                  </Label>
                </div>
                <Textarea
                  ref={textareaRef}
                  id="resume-text"
                  placeholder="Paste resume text here to extract candidate profile information..."
                  className="min-h-[400px] font-mono text-sm rounded-xl border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                  value={inputText}
                  onChange={handleTextChange}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0">
            {extractedData && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
                {/* Header with background banner and profile picture */}
                <div className="relative flex justify-center">
                  <div className="h-32 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                  <div className="absolute -bottom-12">
                    <ProfileUpload 
                      seedValue={extractedData.name || 'placeholder'}
                      value={profilePhoto || extractedData.profile_photo}
                      fullBodyPhoto={fullBodyPhoto || extractedData.full_body_photo}
                      onChange={handleProfilePhotoChange}
                      onFullBodyPhotoChange={handleFullBodyPhotoChange}
                      showFullBody={true}
                    />
                  </div>
                </div>
                
                {/* Candidate Name and Core Info */}
                <div className="pt-16 pb-4 px-6 text-center">
                  <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold">{extractedData.name || 'Unnamed Candidate'}</h2>
                    {extractedData.ic_number && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        NRIC: {extractedData.ic_number}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 justify-center">
                    {extractedData.location && (
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <FileText className="w-4 h-4 mr-1.5" />
                        <span>{extractedData.location}</span>
                      </div>
                    )}
                    {extractedData.email && (
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="w-4 h-4 mr-1.5" />
                        <span>{extractedData.email}</span>
                      </div>
                    )}
                    {extractedData.phone && (
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="w-4 h-4 mr-1.5" />
                        <span>{extractedData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 pt-0">
                  {/* Left Column - Basic Info and Crew Details */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Core Details Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Core Details</h3>
                      <div className="space-y-2">
                        {extractedData.ic_number && (
                          <div>
                            <Label className="text-xs font-medium">IC Number</Label>
                            <p className="text-sm">{extractedData.ic_number}</p>
                          </div>
                        )}
                        {extractedData.date_of_birth && (
                          <div>
                            <Label className="text-xs font-medium">Date of Birth</Label>
                            <p className="text-sm">{new Date(extractedData.date_of_birth).toLocaleDateString()}</p>
                          </div>
                        )}
                        {extractedData.age && (
                          <div>
                            <Label className="text-xs font-medium">Age</Label>
                            <p className="text-sm">{extractedData.age}</p>
                          </div>
                        )}
                        {extractedData.race && (
                          <div>
                            <Label className="text-xs font-medium">Race</Label>
                            <p className="text-sm">{extractedData.race}</p>
                          </div>
                        )}
                        {extractedData.spoken_languages && (
                          <div>
                            <Label className="text-xs font-medium">Languages</Label>
                            <p className="text-sm">{extractedData.spoken_languages}</p>
                          </div>
                        )}
                        {extractedData.emergency_contact_name && (
                          <div>
                            <Label className="text-xs font-medium">Emergency Contact</Label>
                            <p className="text-sm">{extractedData.emergency_contact_name}</p>
                          </div>
                        )}
                        {extractedData.emergency_contact_number && (
                          <div>
                            <Label className="text-xs font-medium">Emergency Contact Number</Label>
                            <p className="text-sm">{extractedData.emergency_contact_number}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Crew Details Card */}
                    {(extractedData.tshirt_size || extractedData.transportation || 
                      extractedData.height || extractedData.typhoid) && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Crew Details</h3>
                        <div className="space-y-2">
                          {extractedData.tshirt_size && (
                            <div>
                              <Label className="text-xs font-medium">T-Shirt Size</Label>
                              <p className="text-sm">{extractedData.tshirt_size}</p>
                            </div>
                          )}
                          {extractedData.transportation && (
                            <div>
                              <Label className="text-xs font-medium">Transportation</Label>
                              <p className="text-sm">{extractedData.transportation}</p>
                            </div>
                          )}
                          {extractedData.height && (
                            <div>
                              <Label className="text-xs font-medium">Height</Label>
                              <p className="text-sm">{extractedData.height}</p>
                            </div>
                          )}
                          {extractedData.typhoid && (
                            <div>
                              <Label className="text-xs font-medium">Typhoid</Label>
                              <p className="text-sm">{extractedData.typhoid}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Languages Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Languages</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedData.skills.length > 0 ? (
                          extractedData.skills.map((language, index) => (
                            <Badge key={index} variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                              {language}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400 italic">No languages detected</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Experience and Education */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Experience Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Work Experience</h3>
                      {extractedData.experience.length > 0 ? (
                        <div className="space-y-4">
                          {extractedData.experience.map((exp, index) => (
                            <div key={index} className="relative pl-5 border-l-2 border-blue-200 dark:border-blue-900">
                              <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-blue-500"></div>
                              <p className="text-sm">{exp}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No experience detected</p>
                      )}
                    </div>
                    
                    {/* Education Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Education</h3>
                      {extractedData.education.length > 0 ? (
                        <div className="space-y-4">
                          {extractedData.education.map((edu, index) => (
                            <div key={index} className="relative pl-5 border-l-2 border-indigo-200 dark:border-indigo-900">
                              <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-indigo-500"></div>
                              <p className="text-sm">{edu}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No education detected</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="py-5 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <Button 
          variant="outline" 
          onClick={clearForm}
          className="text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Clear
        </Button>
        
        {activeTab === 'input' ? (
          <Button 
            onClick={analyzeText} 
            disabled={analyzing || !inputText.trim()}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-sm"
          >
            {analyzing ? (
              <>
                <LoadingSpinner className="mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Extract Profile
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-3">
            {onOpenNewCandidateDialog && (
              <Button 
                variant="outline" 
                onClick={handleOpenInDialog} 
                disabled={!extractedData}
                className="border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center gap-1.5"
              >
                <Edit className="h-4 w-4" />
                Edit in Dialog
              </Button>
            )}
            <Button 
              onClick={handleCreateCandidate} 
              disabled={!extractedData || creating}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-sm flex items-center gap-1.5"
            >
              {creating ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Candidate
                </>
              )}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}