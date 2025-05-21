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

interface DocumentDropzoneProps {
  value?: string[];
  onChange?: (files: string[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

export function DocumentDropzone({
  value = [],
  onChange,
  maxFiles = 5,
  accept = "image/*,.pdf,.doc,.docx",
  className,
  disabled = false
}: DocumentDropzoneProps) {
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

    // Simulate upload
    mappedFiles.forEach((mappedFile, index) => {
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === mappedFile.id 
            ? { ...f, progress: 100, status: 'success' }
            : f
        ));
      }, (index + 1) * 1000);
    });

    // Update parent with file URLs
    if (onChange) {
      const urls = [...value, ...mappedFiles.map(f => URL.createObjectURL(f.file))];
      onChange(urls);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (onChange && value) {
      onChange(value.filter((_, index) => index !== files.findIndex(f => f.id === id)));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

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
            disabled={disabled}
            className="hidden"
            id="dropzone-file-input"
          />
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg"
              onClick={() => document.getElementById('dropzone-file-input')?.click()}
              disabled={disabled}
            >
              <Upload className="w-4 h-4 mr-2" />
              Select Files
            </Button>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <div className="space-y-2 flex-shrink-0">
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
                className="group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-200/50 dark:border-purple-800/50 transition-all duration-300 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700">
                  <div className="relative">
                    {file.preview ? (
                      <div className="relative">
                        <img src={file.preview} alt={file.file.name} className="w-12 h-12 object-cover rounded-lg shadow-md" />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg" />
                      </div>
                    ) : (
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg">
                        <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                      {file.file.name}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div
                          className="h-full relative overflow-hidden"
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500" />
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-50 blur-sm" />
                        </motion.div>
                      </div>
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                        {file.progress}%
                      </span>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {file.status === 'success' ? (
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </motion.button>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}