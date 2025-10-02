import React from 'react';
import { Button } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/enhanced-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/enhanced-card';
import { AlertCircle, CheckCircle2, Lock, RefreshCw, UserCog, Fingerprint, Key, Shield, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

interface VerificationStatus {
  isValid: boolean;
  isVerified: boolean;
  message: string;
}

interface VerificationFormProps {
  icNumber: string; 
  setIcNumber: (value: string) => void;
  handleVerification: () => void;
  verifying: boolean;
  validationStatus: VerificationStatus;
}

export function VerificationForm({
  icNumber,
  setIcNumber,
  handleVerification,
  verifying,
  validationStatus
}: VerificationFormProps) {
  // Helper function to get alert styling based on status
  const getAlertStyling = () => {
    if (validationStatus.isValid) {
      return {
        borderColor: "border-green-200",
        bgColor: "bg-green-50",
        textColor: "text-green-800",
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
      };
    } else if (
      validationStatus.message.toLowerCase().includes("error") || 
      validationStatus.message.toLowerCase().includes("failed") || 
      validationStatus.message.toLowerCase().includes("invalid") ||
      validationStatus.message.toLowerCase().includes("not found")
    ) {
      return {
        borderColor: "border-red-200",
        bgColor: "bg-red-50",
        textColor: "text-red-800",
        icon: <AlertCircle className="h-4 w-4 text-red-600" />
      };
    } else {
      return {
        borderColor: "border-blue-200",
        bgColor: "bg-blue-50",
        textColor: "text-blue-800",
        icon: <Shield className="h-4 w-4 text-blue-600" />
      };
    }
  };

  const alertStyle = getAlertStyling();
  
  // Handle clear button
  const handleClear = () => {
    setIcNumber('');
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerification();
  };

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in-0 duration-500">
      <Card className="overflow-hidden border-t-4 border-t-blue-500 transition-all duration-200 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-50 z-0"></div>
        
        <CardHeader className="relative z-10 pb-2 text-center">
          <div className="flex justify-center mb-3">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-sm border border-blue-200">
              <Fingerprint className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-blue-800 flex items-center justify-center gap-2">
            Identity Verification
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Please verify your identity to update your profile
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10 px-5 sm:px-6">
          {validationStatus.message && (
            <Alert 
              className={`mb-5 ${alertStyle.borderColor} ${alertStyle.bgColor} ${alertStyle.textColor}`}
            >
              {alertStyle.icon}
              <AlertDescription className="text-sm font-medium">
                {validationStatus.message}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label 
                htmlFor="ic-number" 
                className="text-center w-full block text-sm font-medium relative py-1"
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <Key className="h-4 w-4 text-blue-600" />
                  <span className="bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent font-semibold">
                    IC Number
                  </span>
                  <span className="text-red-500">*</span>
                </div>
              </Label>
              
              <div className="relative max-w-xs mx-auto">
                <Input
                  id="ic-number"
                  type="text"
                  placeholder="950101-12-3456"
                  value={icNumber}
                  onChange={(e) => setIcNumber(e.target.value)}
                  disabled={verifying}
                  className="h-12 pl-4 pr-10 text-lg font-medium text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white rounded-lg shadow-sm text-center"
                  autoComplete="off"
                  inputMode="numeric"
                />
                
                {icNumber && (
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    onClick={handleClear}
                  >
                    <span className="sr-only">Clear</span>
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-1 text-center">
                Enter the 12 digits without dashes. Only the first 4 and last 4 digits will be checked.
              </p>
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit"
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg transition-all transform active:scale-[0.98] shadow-md hover:shadow-lg"
                disabled={!icNumber || verifying}
              >
                {verifying ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Verify Identity
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 pt-5 border-t border-gray-200">
            <div className="flex items-center px-4 py-3 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-100">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
              <p className="text-xs leading-relaxed">
                For security reasons, you'll need to verify your identity using your IC number. 
                This session will expire after 5 minutes of inactivity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}