import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeModalWebProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    icNumber: string;
  };
}

export default function QRCodeModalWeb({ open, onOpenChange, profileData }: QRCodeModalWebProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate QR code data
  const qrData = JSON.stringify({
    id: profileData.id,
    name: profileData.fullName,
    phone: profileData.phone,
    email: profileData.email,
    ic: profileData.icNumber,
    type: 'candidate_profile',
  });

  // Generate QR code when modal opens
  useEffect(() => {
    if (open && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrData,
        {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) {
            console.error('QR Code generation error:', error);
            toast({
              title: 'Error',
              description: 'Failed to generate QR code',
              variant: 'destructive',
            });
          }
        }
      );
    }
  }, [open, qrData, toast]);

  const handleShare = async () => {
    const shareText = `My Baito Profile\n\nName: ${profileData.fullName}\nPhone: ${profileData.phone}\nEmail: ${profileData.email}\n\nScan my QR code to view my full profile!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Baito Profile',
          text: shareText,
        });
        toast({
          title: 'Success',
          description: 'Profile shared successfully!',
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      await handleCopy(shareText);
    }
  };

  const handleCopy = async (text?: string) => {
    try {
      const textToCopy = text || shareText;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Profile information copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profileData.fullName.replace(/\s+/g, '_')}_QR.png`;
      link.click();
      toast({
        title: 'Success',
        description: 'QR code downloaded successfully!',
      });
    }
  };

  const shareText = `My Baito Profile\n\nName: ${profileData.fullName}\nPhone: ${profileData.phone}\nEmail: ${profileData.email}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Profile QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
            <canvas ref={canvasRef} className="rounded-md shadow-sm" />
          </div>

          {/* Profile Info */}
          <div className="space-y-3 text-center">
            <h3 className="text-lg font-semibold text-gray-900">{profileData.fullName}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <span className="font-medium">Phone:</span> {profileData.phone}
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="font-medium">Email:</span> {profileData.email}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy()}
              className="gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Info
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              size="sm"
              onClick={handleShare}
              className="gap-2 bg-black hover:bg-gray-800"
            >
              <Share2 className="h-4 w-4" />
              Share Profile
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
