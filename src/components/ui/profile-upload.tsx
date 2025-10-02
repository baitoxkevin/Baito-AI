import React, { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Camera, UserCircle, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileUploadProps {
  value?: string;
  onChange?: (value: string, type: string) => void;
  fullBodyPhoto?: string;
  onFullBodyPhotoChange?: (value: string) => void;
  name?: string;
  previewMode?: boolean;
  seedValue?: string;
  showFullBody?: boolean;
}

export function ProfileUpload({ 
  value, 
  onChange, 
  fullBodyPhoto,
  onFullBodyPhotoChange,
  name = "profile", 
  previewMode = false,
  seedValue = "user",
  showFullBody = true
}: ProfileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFace, setPreviewFace] = useState<string | null>(value || null);
  const [previewFullBody, setPreviewFullBody] = useState<string | null>(fullBodyPhoto || null);
  const [photoType, setPhotoType] = useState<string>("face");
  const faceInputRef = useRef<HTMLInputElement>(null);
  const fullBodyInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileChange = (file: File, type: string) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === "face") {
          setPreviewFace(result);
          onChange?.(result, "face");
        } else {
          setPreviewFullBody(result);
          onFullBodyPhotoChange?.(result);
          onChange?.(result, "fullBody");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !previewMode) {
      handleFileChange(e.dataTransfer.files[0], type);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0], type);
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return '';

    // Split name into parts and get first two parts
    const parts = name.split(' ').filter(part => part.trim() !== '');

    if (parts.length === 0) return '';

    // If only one name part, return the first two letters of that name
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    // Otherwise return first letter of first name and first letter of second name
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  if (!showFullBody) {
    // Just show the profile photo without tabs if full body not needed
    return (
      <div
        className={`relative flex flex-col items-center justify-center ${previewMode ? '' : 'cursor-pointer'} ${
          isDragging ? 'bg-primary/5' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, "face")}
        onClick={() => !previewMode && faceInputRef.current?.click()}
      >
        <input
          type="file"
          ref={faceInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleInputChange(e, "face")}
          disabled={previewMode}
        />
        
        <div className="relative">
          <Avatar className="w-24 h-24 border-2 border-primary/20">
            {previewFace ? (
              <AvatarImage src={previewFace} alt={name} className="object-cover" />
            ) : (
              <AvatarFallback>{getInitials(seedValue)}</AvatarFallback>
            )}
          </Avatar>
          
          {!previewMode && (
            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 shadow-md">
              <Camera className="h-4 w-4" />
            </div>
          )}
        </div>
        
        {!previewMode && (
          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground">Drag photo or click to upload</p>
          </div>
        )}
      </div>
    );
  }

  // Show tabs for both photo types
  return (
    <div className="w-full max-w-[240px]">
      <Tabs defaultValue="face" value={photoType} onValueChange={setPhotoType} className="w-full">
        <TabsList className="grid grid-cols-2 mb-2">
          <TabsTrigger value="face" className="flex items-center gap-1.5 text-xs">
            <UserCircle className="h-3 w-3" />
            <span>Profile Photo</span>
          </TabsTrigger>
          <TabsTrigger value="fullBody" className="flex items-center gap-1.5 text-xs">
            <Upload className="h-3 w-3" />
            <span>Full Body</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Photo Tab */}
        <TabsContent value="face" className="min-h-[220px] flex items-center justify-center">
          <div
            className={`relative flex flex-col items-center justify-center ${previewMode ? '' : 'cursor-pointer'} ${
              isDragging ? 'bg-primary/5' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "face")}
            onClick={() => !previewMode && faceInputRef.current?.click()}
          >
            <input
              type="file"
              ref={faceInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleInputChange(e, "face")}
              disabled={previewMode}
            />
            
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary/20">
                {previewFace ? (
                  <AvatarImage src={previewFace} alt={name} className="object-cover" />
                ) : (
                  <AvatarFallback>{getInitials(seedValue)}</AvatarFallback>
                )}
              </Avatar>
              
              {!previewMode && (
                <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 shadow-md">
                  <Camera className="h-4 w-4" />
                </div>
              )}
            </div>
            
            {!previewMode && (
              <div className="mt-2 text-center">
                <p className="text-xs text-muted-foreground">Drag or click to upload</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Full Body Photo Tab */}
        <TabsContent value="fullBody" className="min-h-[220px] flex items-center justify-center">
          <div
            className={`relative flex flex-col items-center justify-center ${previewMode ? '' : 'cursor-pointer'} ${
              isDragging ? 'bg-primary/5 rounded-md' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "fullBody")}
            onClick={() => !previewMode && fullBodyInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fullBodyInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleInputChange(e, "fullBody")}
              disabled={previewMode}
            />
            
            {previewFullBody ? (
              <div className="relative w-[180px] h-[180px] border-2 border-primary/20 rounded-md overflow-hidden">
                <img 
                  src={previewFullBody} 
                  alt={`${name} full body`} 
                  className="w-full h-full object-cover" 
                />
                {!previewMode && (
                  <div className="absolute bottom-2 right-2 bg-primary text-white rounded-full p-1 shadow-md">
                    <Camera className="h-4 w-4" />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md w-[180px] h-[180px] flex flex-col items-center justify-center text-center p-4">
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                {!previewMode && (
                  <>
                    <p className="text-sm font-medium">Full Body Photo</p>
                    <p className="text-xs text-muted-foreground mt-1">Drag or click to upload</p>
                  </>
                )}
                {previewMode && (
                  <p className="text-sm text-muted-foreground">No photo available</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}