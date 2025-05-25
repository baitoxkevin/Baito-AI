import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { ToastAction } from '@/components/ui/enhanced-toast';
import { Calculator, Calendar as CalendarIcon, Clock, FileSpreadsheet, FileText, MessageSquare, Upload, Download, Loader2, Database, Receipt, DollarSign, BarChart3, Bell } from 'lucide-react';
import DataExtractionTool from '@/components/DataExtractionTool';
import ReceiptOCRTool, { ReceiptData } from '@/components/ReceiptOCRTool';
import { CandidateTextImportTool } from '@/components/CandidateTextImportTool';
import { PayrollManager } from '@/components/payroll-manager';
import { supabase } from '@/lib/supabase';
// import { ExpenseClaimsDebug } from '@/components/ExpenseClaimsDebug';

interface ScrapedData {
  outletName: string;
  fullName: string;
  icNumber: string;
  phoneNumber: string;
  workingDate: string;
  deliveryInfo: string;
  uniformSize: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    contactNumber: string;
  };
  bankDetails: {
    holderName: string;
    bankName: string;
    accountNumber: string;
  };
}

const tools = [
  {
    icon: <Database className="h-6 w-6" />,
    title: 'Data Extraction Tool',
    description: 'Extract data from various file formats including WhatsApp chats',
    component: 'extraction',
  },
  {
    icon: <Receipt className="h-6 w-6" />,
    title: 'Receipt OCR Scanner',
    description: 'Scan receipts to automatically extract amount and details',
    component: 'receipt',
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Resume Analyzer',
    description: 'Import candidate profiles from text resumes or applications',
    component: 'resume',
  },
  {
    icon: <Upload className="h-6 w-6" />,
    title: 'Google Slides Scraper',
    description: 'Extract candidate information from Google Slides',
    component: 'slides',
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'WhatsApp Chat Scraper',
    description: 'Extract candidate information from WhatsApp chat exports',
    component: 'whatsapp',
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Data Viewer',
    description: 'View and edit extracted candidate information',
    component: 'data',
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: 'Export Options',
    description: 'Export data to various formats',
    component: 'export',
  },
  {
    icon: <Calculator className="h-6 w-6" />,
    title: 'Salary Calculator',
    description: 'Calculate salaries, overtime, and deductions',
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'Time Tracker',
    description: 'Track working hours and breaks',
  },
  {
    icon: <FileSpreadsheet className="h-6 w-6" />,
    title: 'Report Generator',
    description: 'Generate custom reports and analytics',
  },
  {
    icon: <CalendarIcon className="h-6 w-6" />,
    title: 'Schedule Planner',
    description: 'Plan and organize work schedules',
  },
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: 'Payroll Manager',
    description: 'Manage project payroll and staff payments',
    component: 'payroll',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Payroll Reports',
    description: 'Generate payroll reports and analytics',
    component: 'payroll-reports',
  },
  {
    icon: <DollarSign className="h-6 w-6 text-red-600" />,
    title: 'Expense Claims Debug',
    description: 'Test expense claims approval (Admin Mode)',
    component: 'expense-debug',
  },
  {
    icon: <Bell className="h-6 w-6 text-purple-600" />,
    title: 'Toast Notifications Demo',
    description: 'Preview and test beautiful toast notifications',
    component: 'toast-demo',
  },
];

function ToastDemo() {
  const enhancedToast = useEnhancedToast();
  
  const showSuccessToast = () => {
    enhancedToast.success({
      title: "Success! 🎉",
      description: "Your changes have been saved successfully.",
      action: (
        <ToastAction altText="Undo action" onClick={() => console.log("Undo clicked")}>
          Undo
        </ToastAction>
      ),
    });
  };

  const showErrorToast = () => {
    enhancedToast.error({
      title: "Error occurred",
      description: "Something went wrong. Please try again later.",
      duration: 7000,
    });
  };

  const showWarningToast = () => {
    enhancedToast.warning({
      title: "Warning ⚠️",
      description: "This action cannot be undone. Please proceed with caution.",
      pauseOnHover: true,
    });
  };

  const showInfoToast = () => {
    enhancedToast.info({
      title: "New feature available",
      description: "Check out our new dashboard analytics!",
      action: (
        <ToastAction altText="Learn more about the feature" onClick={() => console.log("Learn more clicked")}>
          Learn More
        </ToastAction>
      ),
    });
  };

  const showLoadingToast = () => {
    const toastId = enhancedToast.loading({
      title: "Processing...",
      description: "Please wait while we process your request.",
    });

    // Simulate async operation
    setTimeout(() => {
      toastId.update({
        variant: "success",
        title: "Process completed!",
        description: "Your request has been processed successfully.",
      });
    }, 3000);
  };

  const showPromiseToast = async () => {
    const myPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ name: "Project Alpha" }), 2000);
    });

    await enhancedToast.promise(myPromise, {
      loading: {
        title: "Creating project...",
        description: "Setting up your new project",
      },
      success: (data: any) => ({
        title: `Project "${data.name}" created!`,
        description: "You can now start adding team members.",
      }),
      error: (err: any) => ({
        title: "Failed to create project",
        description: err?.message || "Please check your connection and try again.",
      }),
    });
  };

  const showMultipleToasts = () => {
    enhancedToast.success({ title: "First notification", description: "This is toast #1" });
    setTimeout(() => {
      enhancedToast.info({ title: "Second notification", description: "This is toast #2" });
    }, 500);
    setTimeout(() => {
      enhancedToast.warning({ title: "Third notification", description: "This is toast #3" });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Beautiful Toast Notifications</h3>
        <p className="text-muted-foreground mb-6">
          Our enhanced toast system features smooth animations, gradient backgrounds, 
          progress indicators, and interactive actions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Success Toast</CardTitle>
            <CardDescription>Shows a success message with action</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showSuccessToast} className="w-full" variant="outline">
              Show Success
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Error Toast</CardTitle>
            <CardDescription>Displays error with longer duration</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showErrorToast} className="w-full" variant="outline">
              Show Error
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Warning Toast</CardTitle>
            <CardDescription>Warning that pauses on hover</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showWarningToast} className="w-full" variant="outline">
              Show Warning
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Info Toast</CardTitle>
            <CardDescription>Informational with action button</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showInfoToast} className="w-full" variant="outline">
              Show Info
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loading Toast</CardTitle>
            <CardDescription>Updates from loading to success</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showLoadingToast} className="w-full" variant="outline">
              Show Loading
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Promise Toast</CardTitle>
            <CardDescription>Handles async operations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showPromiseToast} className="w-full" variant="outline">
              Show Promise
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Multiple Toasts</CardTitle>
            <CardDescription>Stack multiple notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showMultipleToasts} className="w-full" variant="outline">
              Show Multiple
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dismiss All</CardTitle>
            <CardDescription>Clear all active toasts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => enhancedToast.dismissAll()} 
              className="w-full" 
              variant="outline"
            >
              Dismiss All
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Toast Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✨ Beautiful gradient backgrounds with glassmorphism effect</p>
          <p>🎯 Icon animations with scale and rotation effects</p>
          <p>📊 Progress bar showing auto-dismiss countdown</p>
          <p>🖱️ Pause on hover functionality</p>
          <p>🎬 Smooth entrance and exit animations</p>
          <p>📚 Stack support for multiple notifications</p>
          <p>🔄 Update toast content dynamically</p>
          <p>⚡ Promise-based toasts for async operations</p>
        </CardContent>
      </Card>
    </div>
  );
}

function GoogleSlidesScraper({ onDataExtracted }: { onDataExtracted: (data: ScrapedData[]) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [slideUrl, setSlideUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [credentials, setCredentials] = useState({ clientId: '', apiKey: '' });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const exampleData: ScrapedData[] = [
        {
          outletName: "Downtown Branch",
          fullName: "John Smith",
          icNumber: "A12345678",
          phoneNumber: "+1234567890",
          workingDate: "2024-03-01",
          deliveryInfo: "Standard delivery",
          uniformSize: "M",
          address: "123 Main St, Anytown",
          emergencyContact: {
            name: "Jane Smith",
            relationship: "Spouse",
            contactNumber: "+1234567891"
          },
          bankDetails: {
            holderName: "John Smith",
            bankName: "National Bank",
            accountNumber: "1234567890"
          }
        }
      ];

      onDataExtracted(exampleData);
      toast({
        title: 'Data extracted successfully',
        description: `Found ${exampleData.length} records`,
      });
    } catch (error) {
      console.error('Error extracting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Google Slides URL</Label>
        <Input
          value={slideUrl}
          onChange={(e) => setSlideUrl(e.target.value)}
          placeholder="https://docs.google.com/presentation/d/..."
        />
      </div>
      <div className="space-y-2">
        <Label>Or upload presentation file</Label>
        <Input
          type="file"
          accept=".pptx,.ppt,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>
      <div className="space-y-2">
        <Label>Google API Client ID</Label>
        <Input
          value={credentials.clientId}
          onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
          placeholder="Your Google API Client ID"
        />
      </div>
      <div className="space-y-2">
        <Label>Google API Key</Label>
        <Input
          value={credentials.apiKey}
          onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
          placeholder="Your Google API Key"
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Extracting...
          </>
        ) : (
          'Extract Data'
        )}
      </Button>
    </form>
  );
}

function WhatsAppScraper({ onDataExtracted }: { onDataExtracted: (data: ScrapedData[]) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulated file processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const exampleData: ScrapedData[] = [
        {
          outletName: "East Side Branch",
          fullName: "Michael Lee",
          icNumber: "C98765432",
          phoneNumber: "+1456789012",
          workingDate: "2024-03-15",
          deliveryInfo: "Priority delivery",
          uniformSize: "L",
          address: "789 Pine St, Somewhere",
          emergencyContact: {
            name: "David Lee",
            relationship: "Father",
            contactNumber: "+1456789013"
          },
          bankDetails: {
            holderName: "Michael Lee",
            bankName: "Global Bank",
            accountNumber: "5678901234"
          }
        }
      ];

      onDataExtracted(exampleData);
      toast({
        title: 'Data extracted successfully',
        description: `Found ${exampleData.length} records`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error',
        description: 'Failed to process file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>WhatsApp Chat Export (.txt)</Label>
        <Input
          type="file"
          accept=".txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <p className="text-sm text-muted-foreground">
          Export your WhatsApp chat: Chat options → More → Export chat → Without media
        </p>
      </div>
      <Button type="submit" disabled={isLoading || !file}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Process File'
        )}
      </Button>
    </form>
  );
}

function DataViewer({ data }: { data: ScrapedData[] }) {
  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No data available. Use the scrapers to extract candidate information.
        </p>
      ) : (
        data.map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{item.fullName}</CardTitle>
              <CardDescription>{item.outletName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Personal Information</h4>
                  <dl className="space-y-1">
                    <div>
                      <dt className="text-sm text-muted-foreground">IC Number</dt>
                      <dd>{item.icNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Phone</dt>
                      <dd>{item.phoneNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Address</dt>
                      <dd>{item.address}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Work Details</h4>
                  <dl className="space-y-1">
                    <div>
                      <dt className="text-sm text-muted-foreground">Working Date</dt>
                      <dd>{item.workingDate}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Uniform Size</dt>
                      <dd>{item.uniformSize}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Delivery Info</dt>
                      <dd>{item.deliveryInfo}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function ExportOptions({ data }: { data: ScrapedData[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: string) => {
    if (data.length === 0) {
      toast({
        title: 'Error',
        description: 'No data to export',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulated export process
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'candidate_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: 'Export successful',
        description: `Data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>JSON Export</CardTitle>
            <CardDescription>Export data as JSON file</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleExport('json')}
              disabled={isLoading || data.length === 0}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                'Export as JSON'
              )}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Google Sheets Export</CardTitle>
            <CardDescription>Export data to Google Sheets</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleExport('sheets')}
              disabled={isLoading || data.length === 0}
              className="w-full"
            >
              Export to Sheets
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ToolsPage() {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<ScrapedData[]>([]);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectStaff, setProjectStaff] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const { toast } = useToast();

  // Check if we have a saved active tool component from navigation
  useEffect(() => {
    const savedTool = sessionStorage.getItem('activeToolComponent');
    if (savedTool) {
      setActiveComponent(savedTool);
      // Clear after use to avoid unexpected reactivation
      sessionStorage.removeItem('activeToolComponent');
    }
  }, []);

  // Load projects when payroll component is active
  useEffect(() => {
    if (activeComponent === 'payroll' || activeComponent === 'PayrollManager') {
      loadProjects();
    }
  }, [activeComponent]);

  const loadProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setProjects(data);
    }
  };

  const handleToolClick = (component: string | undefined) => {
    if (component) {
      setActiveComponent(component);
    } else {
      toast({
        title: 'Coming Soon',
        description: 'This tool is not yet available',
      });
    }
  };

  const handleDataExtracted = (newData: ScrapedData[]) => {
    setScrapedData(prev => [...prev, ...newData]);
    setActiveComponent('data');
  };

  const handleReceiptScanned = (data: ReceiptData) => {
    // Ensure user_id is set properly with a valid UUID
    const receiptWithUserId = {
      ...data,
      user_id: data.user_id || '00000000-0000-0000-0000-000000000000' // Use a valid UUID format for Postgres
    };
    
    setReceiptData(receiptWithUserId);
    toast({
      title: 'Receipt Processed',
      description: `Amount $${data.amount.toFixed(2)} successfully extracted from receipt.`,
    });
    
    // For demo purposes, store in localStorage
    localStorage.setItem('lastScannedReceipt', JSON.stringify(receiptWithUserId));
    
    // Display a message to apply the migration if needed
    toast({
      title: 'Need to apply migration?',
      description: 'If you get RLS errors, use the apply-receipts-migration.html page to fix the permissions.',
      duration: 5000
    });
  };

  return (
    <div className="flex-1 p-4 md:p-6 bg-background overflow-auto">
      <div className="max-w-[1400px] mx-auto">
        {activeComponent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">
                {activeComponent === 'payroll-detail' && selectedProject 
                  ? `Payroll: ${selectedProject.title}`
                  : tools.find(t => t.component === activeComponent)?.title || 'Tools'
                }
              </h1>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (activeComponent === 'payroll-detail') {
                    setActiveComponent('payroll');
                  } else {
                    setActiveComponent(null);
                  }
                }}
              >
                {activeComponent === 'payroll-detail' ? 'Back to Projects' : 'Back to Tools'}
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                {activeComponent === 'slides' && (
                  <GoogleSlidesScraper onDataExtracted={handleDataExtracted} />
                )}
                {activeComponent === 'whatsapp' && (
                  <WhatsAppScraper onDataExtracted={handleDataExtracted} />
                )}
                {activeComponent === 'data' && (
                  <DataViewer data={scrapedData} />
                )}
                {activeComponent === 'export' && (
                  <ExportOptions data={scrapedData} />
                )}
                {activeComponent === 'extraction' && (
                  <DataExtractionTool 
                    onDataExtracted={(locationData) => {
                      toast({
                        title: 'Location Data Extracted',
                        description: `${locationData.length} locations extracted and ready to use in Multiple Locations feature.`,
                      });
                      
                      // Store the location data in localStorage for demo purposes
                      // In a real app, this would be connected to your project creation flow
                      localStorage.setItem('extractedLocations', JSON.stringify(locationData));
                    }}
                  />
                )}
                {activeComponent === 'receipt' && (
                  <ReceiptOCRTool 
                    onReceiptScanned={handleReceiptScanned}
                    userId="00000000-0000-0000-0000-000000000000" // Demo UUID for testing
                  />
                )}
                {activeComponent === 'expense-debug' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-600">Expense Claims Debug component is not yet implemented</p>
                  </div>
                )}
                {activeComponent === 'toast-demo' && (
                  <ToastDemo />
                )}
                {activeComponent === 'resume' && (
                  <CandidateTextImportTool />
                )}
                {(activeComponent === 'payroll' || activeComponent === 'PayrollManager') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Select a Project for Payroll</h3>
                    {projects.length === 0 ? (
                      <p className="text-muted-foreground">No projects available</p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {projects.map((project) => (
                          <Card
                            key={project.id}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={async () => {
                              setSelectedProject(project);
                              // Load project staff
                              const { data: staff } = await supabase
                                .from('project_staff')
                                .select('*')
                                .eq('project_id', project.id);
                              
                              if (staff) {
                                setProjectStaff(staff);
                              }
                              setActiveComponent('payroll-detail');
                            }}
                          >
                            <CardHeader>
                              <CardTitle>{project.title}</CardTitle>
                              <CardDescription>
                                {project.start_date} - {project.end_date}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeComponent === 'payroll-detail' && selectedProject && (
                  <PayrollManager
                    confirmedStaff={projectStaff}
                    setConfirmedStaff={setProjectStaff}
                    projectStartDate={new Date(selectedProject.start_date)}
                    projectEndDate={new Date(selectedProject.end_date)}
                    projectId={selectedProject.id}
                    onSave={async (payrollData) => {
                      console.log('Saving payroll data:', payrollData);
                      toast({
                        title: 'Payroll Saved',
                        description: 'Payroll data has been saved successfully',
                      });
                    }}
                  />
                )}
                {activeComponent === 'payroll-reports' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Payroll Reports</h3>
                    <p className="text-muted-foreground">
                      Payroll reports functionality coming soon. This will include:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Monthly payroll summaries</li>
                      <li>Staff payment history</li>
                      <li>Project cost breakdowns</li>
                      <li>Tax and compliance reports</li>
                      <li>Export to various formats</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">Tools</h1>
              <p className="text-muted-foreground">Access and manage your productivity tools</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tools.map((tool, index) => (
                <Card 
                  key={index} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleToolClick(tool.component)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {tool.icon}
                      </div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{tool.description}</CardDescription>
                    <Button className="w-full mt-4" variant="outline">
                      Open Tool
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}