import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from '../lib/logger';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  HoverCardPortal,
} from "@/components/ui/hover-card";

// Create a fresh client to avoid any caching issues
const freshSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
import { formatDate, cn } from '@/lib/utils';
import { DocumentTextPreview } from '@/components/DocumentTextPreview';
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileArchive,
  File,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  Plus,
  Loader2,
  X,
  Search,
  FolderOpen,
  Folder,
  Lock,
  EyeIcon,
  Globe,
  FolderPlus,
  Tag,
  FileIcon,
  ClipboardList,
  Shield,
  Map,
  AlignLeft,
  Receipt,
  ExternalLink
} from 'lucide-react';

interface Document {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  file_path?: string;
  file_url?: string;
  file_size?: number;
  is_link?: boolean;
  is_video?: boolean;
  external_url?: string;
  is_external?: boolean;
  external_type?: 'google_docs' | 'google_sheets' | 'google_slides' | 'google_drive' | 'other';
  description?: string;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  // Custom fields for UI display
  category?: string;
  visibility?: 'public' | 'view_only' | 'download_allowed';
}

interface ProjectDocumentsManagerProps {
  projectId: string;
  projectTitle: string;
}

const categories = {
  all: 'All Categories',
  contract: 'Contracts',
  invoice: 'Invoices',
  report: 'Reports',
  permit: 'Permits',
  plan: 'Plans',
  other: 'Other'
};

const getFileIcon = (fileType: string, isExternal = false, externalType?: string) => {
  if (isExternal) {
    if (externalType === 'google_docs') return { icon: FileText, color: 'text-blue-600' };
    if (externalType === 'google_sheets') return { icon: FileSpreadsheet, color: 'text-green-600' };
    if (externalType === 'google_slides') return { icon: FileText, color: 'text-orange-600' };
    return { icon: ExternalLink, color: 'text-blue-600' };
  }
  
  const type = fileType.toLowerCase();
  if (type.includes('image')) return { icon: FileImage, color: 'text-green-600' };
  if (type.includes('pdf')) return { icon: FileText, color: 'text-red-600' };
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('sheet')) return { icon: FileSpreadsheet, color: 'text-blue-600' };
  if (type.includes('word') || type.includes('document')) return { icon: FileText, color: 'text-blue-600' };
  if (type.includes('video')) return { icon: FileVideo, color: 'text-purple-600' };
  if (type.includes('zip') || type.includes('archive')) return { icon: FileArchive, color: 'text-yellow-600' };
  return { icon: File, color: 'text-gray-600' };
};

const getCategoryFromFileName = (fileName: string, fileType: string): string => {
  const name = fileName.toLowerCase();
  const type = fileType.toLowerCase();
  
  // Check by filename patterns
  if (name.includes('contract') || name.includes('agreement')) return 'contract';
  if (name.includes('invoice') || name.includes('bill')) return 'invoice';
  if (name.includes('report')) return 'report';
  if (name.includes('permit') || name.includes('license')) return 'permit';
  if (name.includes('plan') || name.includes('schedule') || name.includes('layout')) return 'plan';
  
  // Check by file type
  if (type.includes('pdf')) {
    if (name.includes('contract')) return 'contract';
    if (name.includes('invoice')) return 'invoice';
    return 'report';
  }
  if (type.includes('spreadsheet') || type.includes('excel')) return 'report';
  if (type.includes('image')) return 'plan';
  
  return 'other';
};

export function ProjectDocumentsManager({ projectId, projectTitle }: ProjectDocumentsManagerProps) {
  // Remove console log to stop spam
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  
  // Upload dialog states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadType, setUploadType] = useState('file'); // 'file' or 'link'
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [googleDriveUrlError, setGoogleDriveUrlError] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchDocuments();
    }
  }, [projectId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await freshSupabase
        .from('project_docs_new')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add categories to documents based on file names/types
      const documentsWithCategories = (data || []).map(doc => ({
        ...doc,
        category: getCategoryFromFileName(doc.file_name, doc.file_type),
        visibility: 'download_allowed' as const // Default visibility
      }));
      
      setDocuments(documentsWithCategories);
    } catch (error) {
      logger.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateGoogleDriveUrl = (url: string): boolean => {
    // Reset error message
    setGoogleDriveUrlError('');
    
    // Basic URL validation
    if (!url) {
      setGoogleDriveUrlError('Please enter a Google Drive URL');
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      // Check if it's a Google Drive URL
      const isGoogleDrive = [
        'drive.google.com',
        'docs.google.com',
        'sheets.google.com',
        'slides.google.com'
      ].some(domain => urlObj.hostname.includes(domain));
      
      if (!isGoogleDrive) {
        setGoogleDriveUrlError('Please enter a valid Google Drive URL');
        return false;
      }
      
      return true;
    } catch (error) {
      setGoogleDriveUrlError('Please enter a valid URL');
      return false;
    }
  };
  
  // Function to detect Google document type from URL
  const getGoogleDocumentType = (url: string): 'google_docs' | 'google_sheets' | 'google_slides' | 'google_drive' => {
    if (url.includes('docs.google.com')) return 'google_docs';
    if (url.includes('sheets.google.com')) return 'google_sheets';
    if (url.includes('slides.google.com')) return 'google_slides';
    return 'google_drive';
  };

  const handleFileUpload = async () => {
    // Check if we're uploading a file or a link
    if (uploadType === 'file' && !uploadFile) return;
    if (uploadType === 'link' && !validateGoogleDriveUrl(googleDriveUrl)) return;
    
    setUploading(true);
    setUploadProgress(0);

    try {
      // Get current user from Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // For debugging - allow null user
      const userId = user?.id || null;

      let documentData;
      
      if (uploadType === 'file') {
        // Upload file to storage
        const fileExt = uploadFile!.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}_${uploadFile!.name}`;
        
        logger.debug('Uploading file to storage bucket: public-docs');
        logger.debug('File name:', { data: fileName });
        
        const { data: uploadData, error: uploadError } = await freshSupabase.storage
          .from('public-docs')
          .upload(fileName, uploadFile!);

        if (uploadError) {
          logger.error('Storage upload error:', uploadError);
          if (uploadError.message === 'Bucket not found') {
            throw new Error('Storage bucket not configured. Please contact your administrator to set up the project documents storage.');
          }
          throw new Error(`Storage error: ${uploadError.message}`);
        }
        
        logger.debug('File uploaded successfully to storage');

        // Get public URL
        const { data: { publicUrl } } = freshSupabase.storage
          .from('public-docs')
          .getPublicUrl(fileName);
          
        // Create document metadata for file upload
        documentData = {
          project_id: projectId,
          file_name: uploadFile!.name,
          file_type: uploadFile!.type,
          file_path: fileName,
          file_url: publicUrl,
          file_size: uploadFile!.size,
          description: uploadDescription,
          uploaded_by: userId,
          is_link: false,
          is_video: uploadFile!.type.includes('video')
        };
      } else {
        // Handle Google Drive link
        // Extract filename from URL or use a default
        let fileName = 'Google Drive Document';
        try {
          const url = new URL(googleDriveUrl);
          const pathParts = url.pathname.split('/');
          if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart && lastPart !== '') fileName = lastPart;
          }
        } catch (error) {
          // Use default name if URL parsing fails
        }
        
        // Determine Google document type
        const externalType = getGoogleDocumentType(googleDriveUrl);
        
        // Create document metadata for external link
        documentData = {
          project_id: projectId,
          file_name: fileName,
          file_type: externalType === 'google_docs' ? 'application/vnd.google-apps.document' : 
                     externalType === 'google_sheets' ? 'application/vnd.google-apps.spreadsheet' : 
                     externalType === 'google_slides' ? 'application/vnd.google-apps.presentation' : 
                     'application/vnd.google-apps.drive-sdk',
          description: uploadDescription,
          uploaded_by: userId,
          is_link: true,
          external_url: googleDriveUrl,
          is_external: true,
          external_type: externalType,
          file_size: 0 // No file size for links
        };
      }

      // Save document metadata - documentData is now defined above
      
      // Use RPC function to bypass all RLS
      logger.debug('Using direct insert function');
      logger.debug('Document data:', { data: documentData });
      
      try {
        const { data: insertedDoc, error: insertError } = await freshSupabase
          .rpc('direct_insert_document', {
            p_project_id: documentData.project_id,
            p_file_name: documentData.file_name,
            p_file_type: documentData.file_type,
            p_file_path: documentData.file_path,
            p_file_url: documentData.file_url,
            p_file_size: documentData.file_size,
            p_description: documentData.description,
            p_uploaded_by: documentData.uploaded_by
          });
          
        if (insertError) {
          logger.error('RPC error:', insertError);
          throw insertError;
        }
        
        logger.debug('Document inserted successfully via RPC:', { data: insertedDoc });
      } catch (rpcError) {
        logger.error('RPC call failed:', rpcError);
        throw rpcError;
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully"
      });

      // Reset dialog and refresh documents
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadCategory('other');
      setUploadDescription('');
      setGoogleDriveUrl('');
      setUploadType('file');
      fetchDocuments();
    } catch (error: unknown) {
      logger.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      const doc = documents.find(d => d.id === documentToDelete);
      if (!doc) return;

      // First check if current user can delete this document
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Delete from storage
      if (doc.file_path) {
        // Use the same bucket name as used for uploads (public-docs)
        const { error: storageError } = await supabase.storage
          .from('public-docs')
          .remove([doc.file_path]);
        
        if (storageError) {
          logger.error('Storage delete error:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete metadata
      const { error } = await freshSupabase
        .from('project_docs_new')
        .delete()
        .eq('id', documentToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully"
      });

      // Update the UI without fetching
      setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete));
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    } catch (error: unknown) {
      logger.error('Delete error:', error);
      toast({
        title: "Delete Error",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
      
      // Refresh documents to ensure UI is in sync with database
      fetchDocuments();
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Folder className="h-5 w-5 text-indigo-500" />
          Documents
          <Badge variant="outline" className="ml-2">
            {documents.length}
          </Badge>
        </h4>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="gap-2"
            onClick={() => fetchDocuments()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
              </svg>
            )}
            Refresh
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
            onClick={() => setShowUploadDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categories).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <motion.div 
          className="text-center p-8 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No documents found</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Upload your first document to get started'}
          </p>
        </motion.div>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto max-h-[360px]">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="h-8 bg-slate-50 dark:bg-slate-900">
                  <TableHead className="text-xs py-1 font-bold">Name</TableHead>
                  <TableHead className="text-xs py-1 font-bold text-center">Category</TableHead>
                  <TableHead className="text-xs py-1 font-bold text-center">Type</TableHead>
                  <TableHead className="text-xs py-1 font-bold text-center">Size</TableHead>
                  <TableHead className="text-xs py-1 font-bold text-center">Uploaded</TableHead>
                  <TableHead className="text-xs py-1 font-bold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredDocuments.map((doc) => {
                const fileIcon = getFileIcon(doc.file_type, doc.is_external, doc.external_type);
                const FileIcon = fileIcon.icon;
                
                return (
                  <TableRow key={doc.id} className="h-10">
                    <TableCell className="py-1 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <FileIcon className={cn("h-4 w-4", fileIcon.color)} />
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className="truncate max-w-[200px] cursor-pointer hover:underline">
                              {doc.file_name}
                            </span>
                            {doc.is_external && (
                              <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {doc.external_type === 'google_docs' ? 'Google Doc' :
                                 doc.external_type === 'google_sheets' ? 'Google Sheet' :
                                 doc.external_type === 'google_slides' ? 'Google Slide' : 'Google Drive'}
                              </Badge>
                            )}
                          </HoverCardTrigger>
                          <HoverCardPortal>
                            <HoverCardContent 
                              className="w-[600px] max-h-[500px]"
                              align="center"
                              side="top"
                              sideOffset={5}
                              avoidCollisions={true}>
                              <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center gap-2 pb-3 border-b">
                                  <FileIcon className={cn("h-6 w-6", fileIcon.color)} />
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-sm truncate">{doc.file_name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(doc.file_size || 0)} • {doc.created_at ? formatDate(doc.created_at) : 'Unknown'}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Content Preview */}
                                <div className="flex-1 overflow-auto mt-3">
                                  {/* Image Preview */}
                                  {(doc.file_type.includes('image') || doc.file_type.includes('png') || 
                                    doc.file_type.includes('jpg') || doc.file_type.includes('jpeg') || 
                                    doc.file_type.includes('gif') || doc.file_type.includes('webp')) && doc.file_url ? (
                                    <img 
                                      src={doc.file_url} 
                                      alt={doc.file_name}
                                      className="w-full h-full object-contain rounded"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<div class="text-center text-muted-foreground p-12">Unable to load image</div>';
                                      }}
                                    />
                                  ) : doc.file_type.includes('pdf') && doc.file_url ? (
                                    /* PDF Preview - with fallback */
                                    <div className="w-full h-[400px] relative">
                                      <object
                                        data={doc.file_url}
                                        type="application/pdf"
                                        className="w-full h-full rounded"
                                      >
                                        <div className="flex items-center justify-center h-full bg-muted rounded">
                                          <div className="text-center">
                                            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">PDF Preview</p>
                                            <a 
                                              href={doc.file_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                                            >
                                              Open in new tab
                                            </a>
                                          </div>
                                        </div>
                                      </object>
                                    </div>
                                  ) : (doc.file_type.includes('text') || doc.file_type.includes('txt') || 
                                         doc.file_type.includes('json') || doc.file_type.includes('xml') ||
                                         doc.file_type.includes('csv') || doc.file_type.includes('log')) && doc.file_url ? (
                                    /* Text File Preview */
                                    <div className="h-[400px] overflow-auto">
                                      <DocumentTextPreview url={doc.file_url} />
                                    </div>
                                  ) : doc.file_type.includes('video') && doc.file_url ? (
                                    /* Video Preview */
                                    <video
                                      src={doc.file_url}
                                      controls
                                      className="w-full h-[400px] rounded"
                                      preload="metadata"
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  ) : (doc.file_type.includes('xls') || doc.file_type.includes('xlsx') || 
                                         doc.file_type.includes('sheet')) ? (
                                    /* Spreadsheet Preview */
                                    <div className="flex items-center justify-center h-[400px] bg-muted rounded">
                                      <div className="text-center">
                                        <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Excel/Spreadsheet Preview</p>
                                        <p className="text-xs text-muted-foreground mt-1">Click to download and view</p>
                                      </div>
                                    </div>
                                  ) : (doc.file_type.includes('doc') || doc.file_type.includes('docx')) ? (
                                    /* Word Document Preview */
                                    <div className="flex items-center justify-center h-[400px] bg-muted rounded">
                                      <div className="text-center">
                                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Word Document Preview</p>
                                        <p className="text-xs text-muted-foreground mt-1">Click to download and view</p>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Default Preview */
                                    <div className="flex items-center justify-center h-[400px] bg-muted rounded">
                                      <div className="text-center">
                                        <File className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Preview not available</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {(() => {
                                            const type = doc.file_type;
                                            if (type.includes('zip')) return 'ZIP Archive';
                                            if (type.includes('rar')) return 'RAR Archive';
                                            return 'Document';
                                          })()}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCardPortal>
                        </HoverCard>
                      </div>
                    </TableCell>
                    <TableCell className="py-1 text-center">
                      <Badge variant="outline" className="text-xs">
                        {categories[doc.category as keyof typeof categories] || 'Other'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1 text-sm text-center">
                      {(() => {
                        const type = doc.file_type;
                        if (type.includes('pdf')) return 'PDF';
                        if (type.includes('image')) return 'Image';
                        if (type.includes('sheet')) return 'Excel';
                        if (type.includes('word') || type.includes('document')) return 'Word';
                        if (type.includes('video')) return 'Video';
                        if (type.includes('zip')) return 'ZIP';
                        return 'File';
                      })()}
                    </TableCell>
                    <TableCell className="py-1 text-sm text-center">
                      {formatFileSize(doc.file_size || 0)}
                    </TableCell>
                    <TableCell className="py-1 text-sm text-center">
                      {doc.created_at ? formatDate(doc.created_at) : '-'}
                    </TableCell>
                    <TableCell className="py-1">
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          {doc.is_external ? (
                            <DropdownMenuItem
                              onClick={() => window.open(doc.external_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open in Google Drive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => window.open(doc.file_url, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                {doc.visibility === 'public' ? (
                                  <Globe className="h-4 w-4 mr-2" />
                                ) : doc.visibility === 'view_only' ? (
                                  <EyeIcon className="h-4 w-4 mr-2" />
                                ) : (
                                  <Lock className="h-4 w-4 mr-2" />
                                )}
                                Visibility
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setDocuments(prev => prev.map(d => 
                                      d.id === doc.id ? { ...d, visibility: 'public' } : d
                                    ));
                                    toast({
                                      title: "Visibility updated",
                                      description: "Document is now public"
                                    });
                                  }}
                                >
                                  <Globe className="h-4 w-4 mr-2" />
                                  Public
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setDocuments(prev => prev.map(d => 
                                      d.id === doc.id ? { ...d, visibility: 'view_only' } : d
                                    ));
                                    toast({
                                      title: "Visibility updated",
                                      description: "Document is now view-only"
                                    });
                                  }}
                                >
                                  <EyeIcon className="h-4 w-4 mr-2" />
                                  View Only
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setDocuments(prev => prev.map(d => 
                                      d.id === doc.id ? { ...d, visibility: 'download_allowed' } : d
                                    ));
                                    toast({
                                      title: "Visibility updated",
                                      description: "Document can be downloaded"
                                    });
                                  }}
                                >
                                  <Lock className="h-4 w-4 mr-2" />
                                  Download Allowed
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setDocumentToDelete(doc.id);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent 
          className="max-w-3xl bg-transparent border-0 shadow-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="relative bg-white/95 dark:bg-gray-950/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-200 via-purple-100 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/10 opacity-60"
              animate={{
                background: [
                  "linear-gradient(to bottom right, #e0eaff, #f3e7ff)",
                  "linear-gradient(to bottom right, #f3e7ff, #ffe0f0)",
                  "linear-gradient(to bottom right, #ffe0f0, #e0eaff)",
                ]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="relative z-10 p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg blur-md opacity-60" />
                    <div className="relative p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-lg">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Upload Document
                  </span>
                  <FolderPlus className="w-5 h-5 text-purple-400 animate-pulse" />
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Add a new document to {projectTitle}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-6">
                {/* Document Upload/Link Options */}
                <div>
                  <Tabs defaultValue="file" value={uploadType} onValueChange={setUploadType} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="file" className="gap-2">
                        <Upload className="h-4 w-4" />
                        File Upload
                      </TabsTrigger>
                      <TabsTrigger value="link" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Google Drive Link
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="file" className="w-full">
                      <Label 
                        htmlFor="file" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2"
                      >
                        <FileIcon className="w-4 h-4 text-blue-500" />
                        Select File
                      </Label>
                      <div className="mt-2">
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="file"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 border-gray-300 dark:border-gray-700 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-900 transition-all duration-200"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {uploadFile ? (
                                <>
                                  <File className="w-10 h-10 mb-3 text-green-600" />
                                  <p className="mb-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    {uploadFile.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatFileSize(uploadFile.size)}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (MAX. 10MB)
                                  </p>
                                </>
                              )}
                            </div>
                            <Input
                              id="file"
                              type="file"
                              className="hidden"
                              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                              disabled={uploading}
                            />
                          </label>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="link" className="w-full">
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                          <Label htmlFor="google-drive-url" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-blue-500" />
                            Google Drive Link
                          </Label>
                          <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                            <Input
                              id="google-drive-url"
                              placeholder="https://drive.google.com/file/d/..."
                              value={googleDriveUrl}
                              onChange={(e) => setGoogleDriveUrl(e.target.value)}
                              className="pl-10 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                              disabled={uploading}
                            />
                          </div>
                          {googleDriveUrlError && (
                            <p className="text-xs text-red-500 mt-1">{googleDriveUrlError}</p>
                          )}
                          <div className="mt-2">
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-100 dark:border-blue-800/50">
                              <p className="text-xs text-blue-600 dark:text-blue-300 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1.5">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                                Supported Google Drive links: Google Docs, Sheets, Slides, and regular files.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-500" />
                    Category
                  </Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger className="mt-2 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categories).filter(([key]) => key !== 'all').map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            {value === 'contract' && <FileText className="w-4 h-4 text-blue-500" />}
                            {value === 'invoice' && <Receipt className="w-4 h-4 text-green-500" />}
                            {value === 'report' && <ClipboardList className="w-4 h-4 text-orange-500" />}
                            {value === 'permit' && <Shield className="w-4 h-4 text-red-500" />}
                            {value === 'plan' && <Map className="w-4 h-4 text-purple-500" />}
                            {value === 'other' && <File className="w-4 h-4 text-gray-500" />}
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-green-500" />
                    Description (Optional)
                  </Label>
                  <Textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Add a brief description of the document..."
                    rows={3}
                    className="mt-2 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                  />
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Uploading...</span>
                      <span className="text-gray-600 dark:text-gray-400">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </motion.div>
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadDialog(false);
                    setUploadFile(null);
                    setUploadCategory('other');
                    setUploadDescription('');
                    setGoogleDriveUrl('');
                    setUploadType('file');
                  }}
                  disabled={uploading}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleFileUpload}
                    disabled={(uploadType === 'file' && !uploadFile) || (uploadType === 'link' && !googleDriveUrl) || uploading}
                    className={cn(
                      "relative overflow-hidden transition-all duration-300",
                      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                      "text-white border-0 shadow-lg hover:shadow-xl"
                    )}
                  >
                    <div className="relative z-10 flex items-center justify-center">
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : uploadType === 'file' ? (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Add Google Drive Link
                        </>
                      )}
                    </div>
                  </Button>
                </motion.div>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}