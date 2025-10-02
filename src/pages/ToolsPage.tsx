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
import { Calculator, Calendar as CalendarIcon, Clock, FileSpreadsheet, FileText, MessageSquare, Upload, Download, Loader2, Database, Receipt, DollarSign, BarChart3, Bell, Sparkles, Zap, Lock, ArrowRight, Star, TrendingUp, Activity, Shield, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
    icon: <Database className="h-5 w-5" />,
    title: 'Data Extraction Tool',
    description: 'Extract data from various file formats including WhatsApp chats',
    component: 'extraction',
    status: 'active',
  },
  {
    icon: <Receipt className="h-5 w-5" />,
    title: 'Receipt OCR Scanner',
    description: 'Scan receipts to automatically extract amount and details',
    component: 'receipt',
    status: 'active',
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'Resume Analyzer',
    description: 'Import candidate profiles from text resumes or applications',
    component: 'resume',
    status: 'active',
  },
  {
    icon: <Upload className="h-5 w-5" />,
    title: 'Google Slides Scraper',
    description: 'Extract candidate information from Google Slides',
    component: 'slides',
    status: 'active',
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: 'WhatsApp Chat Scraper',
    description: 'Extract candidate information from WhatsApp chat exports',
    component: 'whatsapp',
    status: 'active',
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'Data Viewer',
    description: 'View and edit extracted candidate information',
    component: 'data',
    status: 'active',
  },
  {
    icon: <Download className="h-5 w-5" />,
    title: 'Export Options',
    description: 'Export data to various formats',
    component: 'export',
    status: 'active',
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: 'Salary Calculator',
    description: 'Calculate salaries, overtime, and deductions',
    status: 'coming-soon',
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: 'Time Tracker',
    description: 'Track working hours and breaks',
    status: 'coming-soon',
  },
  {
    icon: <FileSpreadsheet className="h-5 w-5" />,
    title: 'Report Generator',
    description: 'Generate custom reports and analytics',
    status: 'coming-soon',
  },
  {
    icon: <CalendarIcon className="h-5 w-5" />,
    title: 'Schedule Planner',
    description: 'Plan and organize work schedules',
    status: 'coming-soon',
  },
  {
    icon: <DollarSign className="h-5 w-5" />,
    title: 'Payroll Manager',
    description: 'Manage project payroll and staff payments',
    component: 'payroll',
    status: 'active',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Payroll Reports',
    description: 'Generate payroll reports and analytics',
    component: 'payroll-reports',
    status: 'active',
  },
  {
    icon: <DollarSign className="h-5 w-5" />,
    title: 'Expense Claims Debug',
    description: 'Test expense claims approval (Admin Mode)',
    component: 'expense-debug',
    status: 'coming-soon',
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: 'Toast Notifications Demo',
    description: 'Preview and test beautiful toast notifications',
    component: 'toast-demo',
    status: 'active',
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
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);
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

  const handleToolClick = (tool: any) => {
    if (tool.component && tool.status === 'active') {
      setActiveComponent(tool.component);
    } else {
      toast({
        title: '🚀 Coming Soon',
        description: `${tool.title} is currently under development. Stay tuned!`,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-[1400px] mx-auto">
          {activeComponent ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {activeComponent === 'payroll-detail' && selectedProject 
                    ? `Payroll: ${selectedProject.title}`
                    : tools.find(t => t.component === activeComponent)?.title || 'Tools'
                  }
                </h1>
                <Button 
                  variant="ghost" 
                  className="text-slate-600 hover:text-slate-800 hover:bg-white/70 backdrop-blur-sm"
                  onClick={() => {
                    if (activeComponent === 'payroll-detail') {
                      setActiveComponent('payroll');
                    } else {
                      setActiveComponent(null);
                    }
                  }}
                >
                  {activeComponent === 'payroll-detail' ? '← Back to Projects' : '← Back to Tools'}
                </Button>
              </div>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8">
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
                    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-2">
                      <ToastDemo />
                    </div>
                  )}
                {activeComponent === 'resume' && (
                  <CandidateTextImportTool />
                )}
                  {(activeComponent === 'payroll' || activeComponent === 'PayrollManager') && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-6">Select a Project for Payroll</h3>
                      {projects.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <Database className="h-8 w-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 text-lg">No projects available</p>
                        </div>
                      ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {projects.map((project, index) => (
                            <motion.div
                              key={project.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <Card
                                className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-105"
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
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                <CardHeader className="relative">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <CardTitle className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                                        {project.title}
                                      </CardTitle>
                                      <CardDescription className="text-slate-600 flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4" />
                                        {project.start_date} - {project.end_date}
                                      </CardDescription>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                                  </div>
                                </CardHeader>
                                
                                {/* Shine effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                </div>
                              </Card>
                            </motion.div>
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
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-6">Payroll Reports</h3>
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <BarChart3 className="h-10 w-10 text-blue-600" />
                        </div>
                        <p className="text-slate-600 text-lg mb-6">
                          Comprehensive payroll reporting features are coming soon!
                        </p>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 max-w-md mx-auto">
                          <h4 className="font-semibold text-slate-800 mb-4">Upcoming Features:</h4>
                          <ul className="space-y-3 text-left text-slate-600">
                            <li className="flex items-center gap-3">
                              <Star className="h-4 w-4 text-blue-500" />
                              Monthly payroll summaries
                            </li>
                            <li className="flex items-center gap-3">
                              <Star className="h-4 w-4 text-blue-500" />
                              Staff payment history
                            </li>
                            <li className="flex items-center gap-3">
                              <Star className="h-4 w-4 text-blue-500" />
                              Project cost breakdowns
                            </li>
                            <li className="flex items-center gap-3">
                              <Star className="h-4 w-4 text-blue-500" />
                              Tax and compliance reports
                            </li>
                            <li className="flex items-center gap-3">
                              <Star className="h-4 w-4 text-blue-500" />
                              Export to various formats
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  </CardContent>
                </Card>
            </motion.div>
          ) : (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mb-8"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div className="mb-6 lg:mb-0">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                      Productivity Tools
                    </h1>
                    <p className="text-slate-600 text-lg">Access powerful tools designed to streamline your workflow and boost productivity</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="flex items-center gap-3 px-4 py-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border-0"
                    >
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Active Tools</p>
                        <p className="text-lg font-bold text-slate-800">{tools.filter(t => t.status === 'active').length}</p>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="flex items-center gap-3 px-4 py-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border-0"
                    >
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                        <Layers className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Total Tools</p>
                        <p className="text-lg font-bold text-slate-800">{tools.length}</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Quick Stats Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
                >
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border-0 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-700">Data Processing</p>
                        <p className="text-lg font-bold text-slate-800">5 Tools</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-0 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700">Security & Admin</p>
                        <p className="text-lg font-bold text-slate-800">3 Tools</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-xl border-0 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-violet-700">Automation</p>
                        <p className="text-lg font-bold text-slate-800">6 Tools</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools.map((tool, index) => {
                  const isActive = tool.status === 'active';
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                    >
                      <Card 
                        className={cn(
                          "group relative overflow-hidden cursor-pointer transition-all duration-500 border-0 shadow-lg hover:shadow-2xl",
                          isActive 
                            ? "bg-white/80 backdrop-blur-sm hover:bg-white/90 hover:scale-[1.02]" 
                            : "bg-slate-100/60 backdrop-blur-sm opacity-75 hover:opacity-90"
                        )}
                        onClick={() => handleToolClick(tool)}
                      >
                        {/* Enhanced Gradient Background Effect */}
                        <div className={cn(
                          "absolute inset-0 opacity-0 transition-opacity duration-500",
                          isActive && "group-hover:opacity-100"
                        )}>
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-indigo-500/8 to-purple-500/8" />
                          <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
                        </div>
                        
                        {/* Enhanced Status Badge */}
                        <div className="absolute top-4 right-4 z-10">
                          {tool.status === 'coming-soon' ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/90 backdrop-blur-sm shadow-sm border border-slate-300/50">
                              <Clock className="h-3 w-3 text-slate-600" />
                              <span className="text-xs font-semibold text-slate-600">Soon</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100/90 backdrop-blur-sm shadow-sm border border-emerald-200/50">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xs font-semibold text-emerald-700">Active</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Tool Category Indicator */}
                        <div className="absolute top-4 left-4 z-10">
                          <div className={cn(
                            "w-1 h-8 rounded-full",
                            isActive 
                              ? "bg-gradient-to-b from-blue-500 to-indigo-500" 
                              : "bg-slate-300"
                          )} />
                        </div>
                        
                        <CardHeader className="pb-4 relative pt-6">
                          <div className="flex items-start gap-4 ml-4">
                            <div className={cn(
                              "p-3 rounded-xl transition-all duration-500 shadow-lg",
                              isActive 
                                ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-3" 
                                : "bg-slate-300 text-slate-500"
                            )}>
                              {tool.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className={cn(
                                "text-lg font-bold mb-2 transition-colors duration-300",
                                isActive ? "text-slate-800 group-hover:text-blue-700" : "text-slate-600"
                              )}>
                                {tool.title}
                              </CardTitle>
                              {isActive && (
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                  <span className="text-xs font-medium text-green-600">Ready to use</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="relative">
                          <CardDescription className={cn(
                            "mb-6 text-sm leading-relaxed transition-colors duration-300",
                            isActive ? "text-slate-600" : "text-slate-500"
                          )}>
                            {tool.description}
                          </CardDescription>
                          
                          {/* Feature highlights for active tools */}
                          {isActive && (
                            <div className="mb-4 flex flex-wrap gap-2">
                              <div className="px-2 py-1 text-xs bg-blue-100/70 text-blue-700 rounded-md font-medium">
                                Professional
                              </div>
                              <div className="px-2 py-1 text-xs bg-green-100/70 text-green-700 rounded-md font-medium">
                                Secure
                              </div>
                            </div>
                          )}
                          
                          <Button 
                            className={cn(
                              "w-full font-semibold transition-all duration-500 relative overflow-hidden",
                              isActive
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl border-0 group-hover:scale-105"
                                : "bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300 border-0"
                            )}
                            size="sm"
                            disabled={tool.status === 'coming-soon'}
                          >
                            {isActive ? (
                              <span className="flex items-center gap-2 relative z-10">
                                <Sparkles className="h-4 w-4" />
                                Launch Tool
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Coming Soon
                              </span>
                            )}
                            
                            {/* Button shine effect */}
                            {isActive && (
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                              </div>
                            )}
                          </Button>
                        </CardContent>
                        
                        {/* Enhanced shine effect on hover for active tools */}
                        {isActive && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          </div>
                        )}
                        
                        {/* Bottom gradient accent */}
                        <div className={cn(
                          "absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                          isActive && "bg-gradient-to-r from-blue-500 to-indigo-500"
                        )} />
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}