import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Link2, AlertCircle } from 'lucide-react';
import { fetchMultipleBrandLogos } from '@/lib/logo-service';
import { cn } from '@/lib/utils';

interface BrandLogoSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandName: string;
  onSelectLogo: (logoUrl: string) => void;
}

export function BrandLogoSelector({ 
  open, 
  onOpenChange, 
  brandName, 
  onSelectLogo 
}: BrandLogoSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoOptions, setLogoOptions] = useState<Array<{ url: string; source: string }>>([]);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && brandName) {
      fetchLogos();
    }
  }, [open, brandName]);

  const fetchLogos = async () => {
    if (!brandName) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const logos = await fetchMultipleBrandLogos(brandName);
      setLogoOptions(logos);
      if (logos.length === 0) {
        setError('No logos found. Try entering a custom URL below.');
      }
    } catch (err) {
      console.error('Error fetching logos:', err);
      setError('Failed to fetch logos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLogo = () => {
    if (selectedLogo) {
      onSelectLogo(selectedLogo);
      onOpenChange(false);
      // Reset state
      setSelectedLogo(null);
      setCustomUrl('');
      setLogoOptions([]);
    }
  };

  const handleCustomUrl = () => {
    if (customUrl && isValidUrl(customUrl)) {
      onSelectLogo(customUrl);
      onOpenChange(false);
      // Reset state
      setSelectedLogo(null);
      setCustomUrl('');
      setLogoOptions([]);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Logo for {brandName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Searching for logos...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mb-3" />
              <p className="text-gray-600">{error}</p>
            </div>
          ) : (
            <>
              {logoOptions.length > 0 && (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Click on a logo to select it, then click "Use Selected Logo"
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {logoOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedLogo(option.url)}
                        className={cn(
                          "relative p-4 border-2 rounded-lg transition-all duration-200",
                          "hover:shadow-md bg-white dark:bg-gray-800",
                          selectedLogo === option.url
                            ? "border-blue-500 shadow-lg scale-105"
                            : "border-gray-200 dark:border-gray-700"
                        )}
                      >
                        <div className="aspect-square relative mb-2">
                          <img
                            src={option.url}
                            alt={`${brandName} logo option ${index + 1}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Create a simple placeholder SVG
                              const svg = `data:image/svg+xml;base64,${btoa(`
                                <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="100" height="100" fill="#f3f4f6" rx="8"/>
                                  <text x="50" y="55" font-size="40" fill="#9ca3af" text-anchor="middle" font-family="Arial">?</text>
                                </svg>
                              `)}`;
                              (e.target as HTMLImageElement).src = svg;
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 capitalize">
                          {option.source}
                        </span>
                        {selectedLogo === option.url && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
              
              {/* Custom URL Section */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Or enter a custom logo URL</h3>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-800"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customUrl) {
                        handleCustomUrl();
                      }
                    }}
                  />
                  <Button
                    onClick={handleCustomUrl}
                    disabled={!customUrl || !isValidUrl(customUrl)}
                    variant="outline"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Use URL
                  </Button>
                </div>
                {customUrl && !isValidUrl(customUrl) && (
                  <p className="text-sm text-red-500 mt-1">Please enter a valid URL</p>
                )}
              </div>
              
              {/* Search Google Images */}
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                      brandName + ' logo transparent png'
                    )}&tbm=isch`;
                    window.open(searchUrl, '_blank');
                  }}
                  className="text-sm"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Google Images
                </Button>
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedLogo(null);
              setCustomUrl('');
              setLogoOptions([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelectLogo}
            disabled={!selectedLogo}
          >
            Use Selected Logo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}