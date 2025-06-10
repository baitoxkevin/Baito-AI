import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { generateCandidateUpdateLink } from '@/lib/candidate-token-service';
import { Copy, CheckCircle, Link, AlertCircle, Mail, Shield } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

import { logger } from '../lib/logger';
interface GenerateCandidateUpdateLinkProps {
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  onLinkGenerated?: (url: string) => void;
  buttonVariant?: 'default' | 'secondary' | 'outline' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg';
  buttonText?: string;
  className?: string;
}

export function GenerateCandidateUpdateLink({
  candidateId,
  candidateName,
  candidateEmail,
  onLinkGenerated,
  buttonVariant = 'secondary',
  buttonSize = 'sm',
  buttonText = 'Generate Update Link',
  className
}: GenerateCandidateUpdateLinkProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [updateLink, setUpdateLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  
  const handleGenerateLink = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await generateCandidateUpdateLink(candidateId);
      
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Failed to generate update link');
      }
      
      setUpdateLink(result.url);
      setShowModal(true);
      
      if (onLinkGenerated) {
        onLinkGenerated(result.url);
      }
      
      toast({
        title: 'Update link generated',
        description: 'The secure update link has been created successfully.',
      });
    } catch (error) {
      logger.error('Error generating update link:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate update link');
      toast({
        title: 'Error',
        description: 'Could not generate update link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(updateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: 'Link copied',
        description: 'Update link has been copied to clipboard.',
      });
    } catch (error) {
      logger.error('Error copying to clipboard:', error);
      toast({
        title: 'Error',
        description: 'Could not copy to clipboard. Please copy manually.',
        variant: 'destructive',
      });
    }
  };
  
  const handleEmailLink = () => {
    if (!candidateEmail) {
      toast({
        title: 'No email address',
        description: 'Candidate does not have an email address on file.',
        variant: 'destructive',
      });
      return;
    }
    
    const subject = encodeURIComponent('Update Your Profile Information');
    const body = encodeURIComponent(
      `Dear ${candidateName},\n\n` +
      `Please use the following secure link to update your profile information:\n\n` +
      `${updateLink}\n\n` +
      `You will need to verify your identity using your IC number when accessing this link.\n\n` +
      `This link is valid for 1 hour and can only be used once for security reasons.\n\n` +
      `If you have any questions, please don't hesitate to contact us.\n\n` +
      `Best regards`
    );
    
    window.location.href = `mailto:${candidateEmail}?subject=${subject}&body=${body}`;
    
    toast({
      title: 'Email client opened',
      description: 'Complete sending the email in your email client.',
    });
  };
  
  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleGenerateLink}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4" />
            Generating...
          </>
        ) : (
          <>
            <Link className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>
      
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Secure Update Link Generated
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label>Candidate</Label>
              <p className="text-sm text-muted-foreground">{candidateName}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Update Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={updateLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Security Information:</p>
                <ul className="text-xs space-y-1">
                  <li>• This link is valid for 1 hour</li>
                  <li>• Can only be used once</li>
                  <li>• Requires IC number verification</li>
                  <li>• All updates are logged for security</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            {candidateEmail && (
              <Button
                onClick={handleEmailLink}
                className="w-full sm:w-auto"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email to Candidate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}