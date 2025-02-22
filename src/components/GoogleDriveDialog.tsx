import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { authenticateGoogleDrive, initializeGoogleDrive } from '@/lib/google-drive';

interface GoogleDriveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function GoogleDriveDialog({
  open,
  onOpenChange,
  onSuccess,
}: GoogleDriveDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await initializeGoogleDrive();
      await authenticateGoogleDrive();
      
      toast({
        title: 'Success',
        description: 'Connected to Google Drive successfully',
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      toast({
        title: 'Error connecting to Google Drive',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Google Drive</DialogTitle>
          <DialogDescription>
            Connect your Google Drive account to sync and manage your files.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            By connecting your Google Drive, you'll be able to:
            <br />• Upload files directly to Google Drive
            <br />• Access your Google Drive files
            <br />• Share files with others
          </p>

          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full max-w-sm"
          >
            {isLoading && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Connect Google Drive
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
