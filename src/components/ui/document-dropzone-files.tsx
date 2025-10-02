import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DropzoneFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

interface DocumentDropzoneFilesProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

export function DocumentDropzoneFiles({
  value = [],
  onChange,
  maxFiles = 5,
  accept = "image/*,.pdf,.doc,.docx",
  className,
  disabled = false
}: DocumentDropzoneFilesProps) {
  const [files, setFiles] = useState<DropzoneFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [disabled]);

  const handleFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`);
      return;
    }

    const mappedFiles: DropzoneFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'uploading'
    }));

    setFiles(prev => [...prev, ...mappedFiles]);

    // Simulate upload progress
    mappedFiles.forEach((mappedFile, index) => {
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === mappedFile.id 
            ? { ...f, progress: 100, status: 'success' }
            : f
        ));
      }, (index + 1) * 1000);
    });

    // Update parent with actual File objects
    if (onChange) {
      const allFiles = [...value, ...newFiles];
      onChange(allFiles);
    }
  };

  const removeFile = (id: string) => {
    const fileIndex = files.findIndex(f => f.id === id);
    if (fileIndex !== -1) {
      const fileToRemove = files[fileIndex];
      // Clean up preview URL
      if (fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      
      setFiles(prev => prev.filter(f => f.id !== id));
      
      if (onChange && value) {
        // Remove the corresponding file from the value array
        const newValue = value.filter((_, index) => index !== fileIndex);
        onChange(newValue);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Clean up previews on unmount
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className={cn("space-y-4 h-full flex flex-col", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer overflow-hidden flex-1",
          isDragging 
            ? "border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 scale-[1.02]" 
            : "border-purple-300/50 dark:border-purple-700/50 hover:border-purple-400 dark:hover:border-purple-600 bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-900/20 dark:to-slate-900/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-blue-400 to-pink-400 rounded-full blur-3xl" />
        </div>
        
        <div className="relative p-8 text-center h-full flex flex-col items-center justify-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-4"
          >
            <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl">
              <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </motion.div>
          
          <p className="text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
            Drop your files here
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            or click to browse • Max {maxFiles} files
          </p>
          
          <input
            type="file"
            multiple
            accept={accept}
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={disabled}
          />
        </div>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-3 border border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-r from-gray-50/50 to-slate-50/50 dark:from-gray-900/30 dark:to-slate-900/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                          {file.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === 'uploading' && (
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <motion.div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}
                      {file.status === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}