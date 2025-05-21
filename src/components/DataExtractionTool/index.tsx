import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { extractDataFromSpreadsheet, processScheduleData, extractSpreadsheetId } from './utils';
import { getGoogleMapsLink, getWazeLink } from '@/lib/utils';
import { Loader2, FileSpreadsheet, Link, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface LocationData {
  date: string;
  location: string;
  time?: string;
  staff?: string;
  region?: string;
  state?: string;
  notes?: string;
  isPrimary: boolean;
}

export interface DataExtractionToolProps {
  onDataExtracted: (data: LocationData[]) => void;
  projectId?: string;
}

export default function DataExtractionTool({ onDataExtracted, projectId }: DataExtractionToolProps) {
  const [activeTab, setActiveTab] = useState<string>('link');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [extractedData, setExtractedData] = useState<LocationData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<{
    valid: number;
    invalid: number;
    total: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExtractFromUrl = async () => {
    if (!spreadsheetUrl) {
      setError('Please enter a valid Google Sheets URL');
      return;
    }

    setIsProcessing(true);
    setProcessProgress(10);
    setError(null);
    
    try {
      // Extract the spreadsheet ID from the URL
      const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
      setProcessProgress(30);
      
      // Simulate API call to fetch data for demo
      setTimeout(() => {
        // This would actually call a backend API in production
        const demoData = generateDemoData();
        setProcessProgress(70);
        
        // Process the data
        const { locations, validation } = processScheduleData(demoData);
        setExtractedData(locations);
        setValidationSummary({
          valid: validation.validCount,
          invalid: validation.invalidCount,
          total: validation.results.length
        });
        
        setProcessProgress(100);
        
        toast({
          title: "Data extracted successfully",
          description: `Found ${locations.length} location entries from the spreadsheet.`,
        });
        
        setTimeout(() => {
          setIsProcessing(false);
        }, 500);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract data from the URL');
      setIsProcessing(false);
      
      toast({
        title: "Extraction failed",
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessProgress(10);
    setError(null);
    
    try {
      setProcessProgress(40);
      
      // Extract data from the file
      const data = await extractDataFromSpreadsheet(file);
      setProcessProgress(80);
      
      // Process the extracted data
      const { locations, validation } = processScheduleData(data);
      setExtractedData(locations);
      setValidationSummary({
        valid: validation.validCount,
        invalid: validation.invalidCount,
        total: validation.results.length
      });
      
      setProcessProgress(100);
      
      toast({
        title: "File processed successfully",
        description: `Found ${locations.length} location entries in the spreadsheet.`,
      });
      
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process the uploaded file');
      setIsProcessing(false);
      
      toast({
        title: "Processing failed",
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  };

  const applyExtractedData = () => {
    if (extractedData && extractedData.length > 0) {
      onDataExtracted(extractedData);
      
      toast({
        title: "Data applied to project",
        description: `${extractedData.length} locations have been added to your project.`,
      });
      
      // Reset the component state
      setExtractedData(null);
      setValidationSummary(null);
      setSpreadsheetUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Demo data generator (for demonstration purposes)
  function generateDemoData() {
    return [
      ['Week', 'Date', 'Day', 'No', 'Region', 'State', 'Location', 'Time', 'Manpower', 'Concuction', 'Type of Location'],
      ['1', '4-Mar-2025', 'Tues', '1', 'Central', 'PJ', 'USJ Mydin', '1PM-10PM', '1+3', 'Yes', 'Bazaar'],
      ['', '5-Mar-2025', 'Wed', '2', 'Central', 'PJ', 'Bazaar Ramadhan Section 14', '3PM-8PM', '1+3', 'No', 'Bazaar'],
      ['', '6-Mar-2025', 'Thurs', '3', 'Central', 'PJ', 'Bazaar Ramadhan Kelana Jaya', '3PM-8PM', '1+3', 'No', 'Bazaar'],
      ['', '7-Mar-2025', 'Fri', '4', 'Central', 'PJ', 'Bazaar Ramadhan Damansara', '3PM-8PM', '1+3', 'No', 'Bazaar'],
      ['', '8-Mar-2025', 'Sat', '5', 'Central', 'PJ', 'Bazaar Ramadhan Subang', '3PM-8PM', '1+3', 'No', 'Bazaar'],
      ['', '9-Mar-2025', 'Sun', '6', 'Central', 'PJ', 'Bazaar Ramadhan Taman Tasik Permaisuri', '3PM-8PM', '1+3', 'No', 'Bazaar'],
      ['2', '10-Mar-2025', 'Mon', '7', 'Central', 'PJ', 'Bazaar Ramadhan Taman Melawati', '3PM-8PM', '1+3', 'No', 'Bazaar'],
      ['', '11-Mar-2025', 'Tues', '8', 'Central', 'PJ', 'Bazaar Ramadhan TTDI', '3PM-8PM', '1+3', 'No', 'Bazaar'],
      ['', '12-Mar-2025', 'Wed', '9', 'Central', 'PJ', 'Bazaar Ramdhan PKNS Shah Alam', '3PM-8PM', '1+3', 'No', 'Bazaar'],
      ['', '13-Mar-2025', 'Thurs', '10', 'Central', 'PJ', 'Bazaar Ramadan Kampung Baru KL', '3PM-8PM', '1+3', 'No', 'Bazaar'],
      ['', '14-Mar-2025', 'Fri', '11', 'Central', 'PJ', 'Bazaar Stadium Shah Alam', '3PM-8PM', '1+3', 'Yes', 'Bazaar'],
      ['', '15-Mar-2025', 'Sat', '12', 'Central', 'PJ', 'Bazaar Stadium Shah Alam', '3PM-8PM', '1+3', 'Yes', 'Bazaar'],
      ['', '16-Mar-2025', 'Sun', '13', 'Central', 'PJ', 'Bazaar Stadium Shah Alam', '3PM-8PM', '1+3', 'Yes', 'Bazaar'],
      ['3', '17-Mar-2025', 'Mon', '14', 'Central', 'PJ', 'Bazaar Stadium Shah Alam', '3PM-8PM', '1+3', 'Yes', 'Bazaar'],
      ['', '18-Mar-2025', 'Tues', '15', 'Central', 'PJ', 'Bazaar Stadium Shah Alam', '3PM-8PM', '1+3', 'Yes', 'Bazaar'],
      ['', '19-Mar-2025', 'Wed', '16', 'Central', 'PJ', 'Bazaar Stadium Shah Alam', '3PM-8PM', '1+3', 'Yes', 'Bazaar'],
      ['', '20-Mar-2025', 'Thurs', '17', 'Central', 'PJ', 'Bazaar Stadium Shah Alam', '3PM-8PM', '1+3', 'Yes', 'Bazaar'],
      ['', '21-Mar-2025', 'Fri', '18', 'Central', 'PJ', 'Bazaar Stadium Shah Alam', '3PM-8PM', '1+3', 'Yes', 'Bazaar'],
      ['', '22-Mar-2025', 'Sat', '19', 'Central', 'PJ', 'Bazaar Stadium Shah Alam', '3PM-8PM', '1+3', 'Yes', 'Bazaar'],
      ['', '23-Mar-2025', 'Sun', '20', 'Central', 'PJ', 'Bazaar Stadium Shah Alam', '3PM-8PM', '1+3', 'Yes', 'Bazaar']
    ];
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Data Extraction Tool</CardTitle>
        <CardDescription>
          Extract location data from Google Sheets or spreadsheet files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" disabled={isProcessing}>
              <Link className="w-4 h-4 mr-2" />
              Google Sheet Link
            </TabsTrigger>
            <TabsTrigger value="file" disabled={isProcessing}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Enter the URL of your Google Sheet containing the schedule data
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  disabled={isProcessing}
                />
                <Button 
                  onClick={handleExtractFromUrl} 
                  disabled={isProcessing || !spreadsheetUrl}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    'Extract Data'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Upload an Excel or CSV file containing the schedule data
              </p>
              <div className="grid gap-2">
                <div className="border border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to select a file</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports Excel (.xlsx, .xls) and CSV (.csv) files
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx,.xls,.csv"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {isProcessing && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing your data...
            </p>
            <Progress value={processProgress} className="h-2" />
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-start">
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {extractedData && extractedData.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" />
              <h3 className="font-medium">Data Extracted Successfully</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-2xl font-bold">{extractedData.length}</p>
                <p className="text-xs text-muted-foreground">Total Locations</p>
              </div>
              {validationSummary && (
                <>
                  <div className="p-3 bg-green-500/10 text-green-700 rounded-md">
                    <p className="text-2xl font-bold">{validationSummary.valid}</p>
                    <p className="text-xs text-green-700/70">Valid Entries</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-700 rounded-md">
                    <p className="text-2xl font-bold">{validationSummary.invalid}</p>
                    <p className="text-xs text-amber-700/70">Warnings</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <div className="p-3 bg-muted font-medium text-sm">
                Preview (showing first 10 entries)
              </div>
              <div className="divide-y max-h-60 overflow-y-auto">
                {/* Preview shows first 10 entries, but all entries are processed */}
                {extractedData.slice(0, 10).map((item, index) => (
                  <div key={index} className="p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.date}</span>
                      <Badge variant={item.isPrimary ? "default" : "outline"}>
                        {item.isPrimary ? 'Primary' : 'Secondary'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {item.location} • {item.time || 'No time specified'}
                    </div>
                    {item.staff && (
                      <div className="mt-0.5 text-xs">
                        Staff: {item.staff}
                      </div>
                    )}
                    <div className="mt-1 flex gap-2">
                      <a 
                        href={getGoogleMapsLink(item.location)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 inline-flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3 h-3 mr-1" fill="currentColor">
                          <path d="M19.527 4.799c1.212 2.608.937 5.678-.405 8.173-1.101 2.047-2.744 3.74-4.098 5.614-.619.858-1.244 1.75-1.669 2.727-.141.325-.263.658-.383.992-.121.333-.224.673-.34 1.008-.109.314-.236.684-.627.687h-.007c-.466-.001-.579-.53-.695-.887-.284-.874-.581-1.713-1.019-2.525-.51-.944-1.145-1.817-1.79-2.671L19.527 4.799zM8.545 7.705l-3.959 4.707c.724 1.54 1.821 2.863 2.871 4.18.247.31.494.622.737.936l4.984-5.925-.029.01c-1.741.601-3.691-.291-4.392-1.987a3.377 3.377 0 0 1-.209-.716c-.063-.437-.077-.761-.004-1.198l.001-.007zM5.492 3.149l-.003.004c-1.947 2.466-2.281 5.88-1.117 8.77l4.785-5.689-.058-.05-3.607-3.035zM14.661.436l-3.838 4.563a.295.295 0 0 1 .027-.01c1.6-.551 3.403.15 4.22 1.626.176.319.323.683.377 1.045.068.446.085.773.012 1.22l-.003.016 3.836-4.561A8.382 8.382 0 0 0 14.67.439l-.009-.003z" />
                        </svg>
                        Maps
                      </a>
                      <a 
                        href={getWazeLink(item.location)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 inline-flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg viewBox="0 0 24 24" className="w-3 h-3 mr-1" fill="currentColor">
                          <path d="M20.54 6.63c0-2.35-1.21-4.57-3.21-5.96C15.34-0.7 12.66-0.7 10.67.67c-2 1.39-3.21 3.61-3.21 5.96 0 3.83 4.15 8.87 6.53 11.74l.14.18c.14.17.35.27.57.27.23 0 .44-.1.58-.27l.14-.18c2.39-2.87 6.53-7.91 6.53-11.74zm-4.86 0c0 1.3-1.06 2.36-2.36 2.36S10.97 7.93 10.97 6.63s1.06-2.36 2.36-2.36 2.35 1.06 2.35 2.36z" />
                        </svg>
                        Waze
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {extractedData.length > 10 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/50">
                  +{extractedData.length - 10} more locations not shown in preview, but all will be processed
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4 pt-6">
        <p className="text-xs text-muted-foreground">
          <AlertCircle className="inline-block w-3 h-3 mr-1" />
          Data will be formatted as locations in your project
        </p>
        <Button
          onClick={applyExtractedData}
          disabled={!extractedData || extractedData.length === 0 || isProcessing}
          variant="default"
        >
          Apply to Project
        </Button>
      </CardFooter>
    </Card>
  );
}