import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Receipt } from '@/lib/receipt-service';
import {
  AlertCircle,
  FileCheck,
  ScanLine,
  CreditCard,
  Check,
  ArrowRight,
  Upload,
  FileImage,
  CheckCircle2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import ReceiptOCRTool, { ReceiptData } from './ReceiptOCRTool';
import { format } from 'date-fns';

interface ReceiptValidatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReceiptValidated: (receipt: Receipt) => void;
  userId: string;
  initialFile?: File | null;
}

// Claim types
const CLAIM_TYPES = [
  { id: 'meal', label: 'Meal Expense' },
  { id: 'transport', label: 'Transportation' },
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'office_supplies', label: 'Office Supplies' },
  { id: 'client_meeting', label: 'Client Meeting' },
  { id: 'other', label: 'Other Expense' }
];

export function ReceiptValidator({
  open,
  onOpenChange,
  onReceiptValidated,
  userId,
  initialFile = null
}: ReceiptValidatorProps) {
  // Step tracking for wizard flow
  const [currentStep, setCurrentStep] = useState(initialFile ? 2 : 1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(initialFile);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [claimType, setClaimType] = useState<string>('');
  const [scannedReceipt, setScannedReceipt] = useState<Receipt | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showOCRTool, setShowOCRTool] = useState(false);

  const { toast } = useToast();

  // Process initial file when provided and dialog opens
  useEffect(() => {
    if (open && initialFile && !previewUrl) {
      // Create preview URL for initial file
      const objectUrl = URL.createObjectURL(initialFile);
      setPreviewUrl(objectUrl);
      setUploadedFile(initialFile);

      // Start at step 2 (claim type selection)
      setCurrentStep(2);

      // Clean up URL when component unmounts or dialog closes
      return () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }
  }, [open, initialFile, previewUrl]);

  // Reset all state when dialog is opened/closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset all state
      setCurrentStep(1);
      setUploadedFile(null);
      setPreviewUrl(null);
      setClaimType('');
      setScannedReceipt(null);
      setConfirmed(false);
      setShowOCRTool(false);
    }
    onOpenChange(open);
  };

  // Validate that the file is an image and not a document
  const validateFileType = (file: File): boolean => {
    const acceptedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic'
    ];

    const isDocument = file.type === 'application/pdf' ||
                      file.type === 'application/msword' ||
                      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                      file.type === 'text/plain';

    if (isDocument) {
      toast({
        title: "Document files not supported",
        description: "Please upload an image of your receipt instead of a document file.",
        variant: "destructive",
      });
      return false;
    }

    const isAcceptedImage = acceptedImageTypes.includes(file.type);
    if (!isAcceptedImage) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a JPG, PNG, GIF, WebP, or HEIC image.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Helper to check if file is too large
  const validateFileSize = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!validateFileType(file) || !validateFileSize(file)) {
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadedFile(file);

    // Move to next step
    setCurrentStep(2);
  };

  // Handle claim type selection
  const handleClaimTypeChange = (value: string) => {
    setClaimType(value);
    // Move to next step
    setCurrentStep(3);
  };

  // Handler for when a receipt is successfully scanned with OCR via our OCR Tool
  const handleOCRScanned = (data: ReceiptData) => {
    // Convert OCR data to Receipt format
    const receiptData: Receipt = {
      id: data.id || Math.random().toString(36).substring(2, 15),
      amount: data.amount,
      date: data.date,
      vendor: data.vendor,
      category: CLAIM_TYPES.find(type => type.id === claimType)?.label || claimType,
      description: data.description || `${CLAIM_TYPES.find(type => type.id === claimType)?.label || 'Expense'} receipt`,
      image_url: data.image_url || previewUrl || '',
      user_id: userId
    };

    setScannedReceipt(receiptData);
    setShowOCRTool(false);
    
    // Move to next step
    setCurrentStep(4);
  };

  // Confirm the receipt and save
  const handleConfirm = () => {
    if (scannedReceipt) {
      setConfirmed(true);
      // Move to final step
      setCurrentStep(5);
    }
  };

  // Finalize and save
  const handleSave = () => {
    if (scannedReceipt) {
      onReceiptValidated(scannedReceipt);
      handleOpenChange(false);
      toast({
        title: "Receipt added successfully",
        description: "The receipt has been validated and added to your available receipts.",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  // Render different steps
  const renderStep = () => {
    switch (currentStep) {
      case 1: // Upload
        return (
          <div className="p-6 border rounded-lg text-center flex flex-col items-center">
            <FileImage className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Receipt</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Upload a clear photo of your receipt to continue. We'll extract the details automatically.
            </p>
            <label htmlFor="receipt-upload" className="cursor-pointer">
              <div className="flex gap-2">
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Receipt Image</span>
                </Button>
              </div>
              <input
                id="receipt-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        );

      case 2: // Select claim type
        return (
          <div className="space-y-6">
            {previewUrl && (
              <div className="aspect-square max-h-64 mx-auto overflow-hidden rounded-md bg-muted">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="claim-type">Select Claim Type</Label>
              <Select value={claimType} onValueChange={handleClaimTypeChange}>
                <SelectTrigger id="claim-type">
                  <SelectValue placeholder="Select a claim type" />
                </SelectTrigger>
                <SelectContent>
                  {CLAIM_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button disabled={!claimType} onClick={() => setCurrentStep(3)}>
                Continue
              </Button>
            </div>
          </div>
        );

      case 3: // OCR Scanning
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {CLAIM_TYPES.find(type => type.id === claimType)?.label || 'Expense'}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <ScanLine className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Scanning Receipt</span>
            </div>

            {!showOCRTool ? (
              <div className="border rounded-lg p-4">
                <div className="text-center mb-4">
                  <ScanLine className="h-12 w-12 mx-auto text-blue-500 mb-2 animate-pulse" />
                  <h3 className="font-medium">Process with OCR</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to start OCR processing of your receipt
                  </p>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => setShowOCRTool(true)}
                >
                  <ScanLine className="h-4 w-4 mr-2" />
                  Start OCR Processing
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                {uploadedFile && (
                  <ReceiptOCRTool
                    onReceiptScanned={handleOCRScanned}
                    userId={userId}
                  />
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
            </div>
          </div>
        );

      case 4: // Verify and confirm
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">OCR Results - Please Verify</span>
            </div>

            {scannedReceipt && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="ocr-amount">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5">RM</span>
                      <Input
                        id="ocr-amount"
                        className="pl-9"
                        value={scannedReceipt.amount.toString()}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setScannedReceipt({
                            ...scannedReceipt,
                            amount: value
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ocr-date">Date</Label>
                    <Input
                      id="ocr-date"
                      type="date"
                      value={scannedReceipt.date}
                      onChange={(e) => {
                        setScannedReceipt({
                          ...scannedReceipt,
                          date: e.target.value
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="ocr-vendor">Vendor/Merchant</Label>
                    <Input
                      id="ocr-vendor"
                      value={scannedReceipt.vendor}
                      onChange={(e) => {
                        setScannedReceipt({
                          ...scannedReceipt,
                          vendor: e.target.value
                        });
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ocr-category">Category</Label>
                    <Input
                      id="ocr-category"
                      value={scannedReceipt.category || ''}
                      onChange={(e) => {
                        setScannedReceipt({
                          ...scannedReceipt,
                          category: e.target.value
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="ocr-description">Description</Label>
              <Input
                id="ocr-description"
                value={scannedReceipt?.description || ''}
                onChange={(e) => {
                  if (scannedReceipt) {
                    setScannedReceipt({
                      ...scannedReceipt,
                      description: e.target.value
                    });
                  }
                }}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button onClick={handleConfirm}>
                Confirm Details
              </Button>
            </div>
          </div>
        );

      case 5: // Final confirmation and save
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800">Receipt Verified Successfully</h4>
                  <p className="text-sm text-green-700 mt-1">
                    The receipt has been processed and is ready to be added to your claim.
                  </p>
                </div>
              </div>
            </div>

            {scannedReceipt && (
              <div className="rounded-lg border p-4">
                <div className="grid gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{scannedReceipt.vendor}</h3>
                    <Badge>{scannedReceipt.category}</Badge>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Date:</p>
                      <p>{format(new Date(scannedReceipt.date), 'PP')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount:</p>
                      <p className="font-bold">{formatCurrency(scannedReceipt.amount)}</p>
                    </div>
                  </div>

                  {scannedReceipt.description && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-muted-foreground text-sm">Description:</p>
                        <p className="text-sm">{scannedReceipt.description}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(4)}>
                Edit Details
              </Button>
              <Button onClick={handleSave}>
                Add to Available Receipts
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Step 1: Upload Receipt";
      case 2: return "Step 2: Select Claim Type";
      case 3: return "Step 3: Scan With OCR";
      case 4: return "Step 4: Verify Details";
      case 5: return "Step 5: Save Receipt";
      default: return "Receipt Validator";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {currentStep < 5
              ? `Step ${currentStep} of 5: ${
                  currentStep === 1 ? 'Upload your receipt image' :
                  currentStep === 2 ? 'Select the type of expense' :
                  currentStep === 3 ? 'Processing receipt with OCR' :
                  'Verify the extracted information'
                }`
              : 'Review your receipt information before saving'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step progress indicators */}
          <div className="flex mb-6">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    step < currentStep
                      ? 'bg-green-100 text-green-800 border-2 border-green-500' :
                    step === currentStep
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-500' :
                    'bg-gray-100 text-gray-500 border border-gray-300'
                  }`}
                >
                  {step < currentStep ? <Check className="h-3 w-3" /> : step}
                </div>
                {step < 5 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}