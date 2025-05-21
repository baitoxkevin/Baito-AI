import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useToast } from "@/hooks/use-toast";
import { deleteDocument } from "@/lib/document-service";
import { SimpleCandidateAvatar } from "@/components/ui/simple-candidate-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverPreview } from "@/components/ui/hover-preview";
import { DocumentTextPreview } from "@/components/DocumentTextPreview";
import { cn } from "@/lib/utils";
import {
  FileText,
  Download,
  Trash2,
  List,
  Grid3X3,
  Upload,
  Loader2,
  AlertTriangle,
  User,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileArchive,
  File,
  ExternalLink,
  Link as LinkIcon
} from "lucide-react";
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

interface SpotlightCardDocumentsProps {
  documents: any[];
  documentsView: 'table' | 'grid';
  setDocumentsView: (view: 'table' | 'grid') => void;
  onShowUploadDialog: () => void;
  onDocumentDelete?: (docId: string) => void;
}

// Helper function to determine file type and return appropriate icon
const getFileIcon = (fileType: string, doc?: any) => {
  // Check if this is an external link (Google Drive)
  if (doc?.is_external || doc?.external_type) {
    // Handle Google Drive document types
    if (doc.external_type === 'google_docs') {
      return { icon: FileText, color: 'text-blue-600' };
    }
    if (doc.external_type === 'google_sheets') {
      return { icon: FileSpreadsheet, color: 'text-green-600' };
    }
    if (doc.external_type === 'google_slides') {
      return { icon: FileText, color: 'text-orange-600' };
    }
    // Default Google Drive icon
    return { icon: ExternalLink, color: 'text-blue-600' };
  }
  
  // Regular file type detection
  const type = (fileType || '').toLowerCase();
  if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) {
    return { icon: FileImage, color: 'text-green-600' };
  }
  if (type.includes('pdf')) {
    return { icon: FileText, color: 'text-red-600' };
  }
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('sheet') || type.includes('xls')) {
    return { icon: FileSpreadsheet, color: 'text-blue-600' };
  }
  if (type.includes('word') || type.includes('document') || type.includes('doc')) {
    return { icon: FileText, color: 'text-blue-600' };
  }
  if (type.includes('video')) {
    return { icon: FileVideo, color: 'text-purple-600' };
  }
  if (type.includes('zip') || type.includes('archive')) {
    return { icon: FileArchive, color: 'text-yellow-600' };
  }
  
  // Handle generic links
  if (type.includes('link') || doc?.is_link) {
    return { icon: LinkIcon, color: 'text-blue-600' };
  }
  
  return { icon: File, color: 'text-gray-600' };
};

// Component to render file icon
const renderFileIcon = (doc: any) => {
  const fileType = doc.metadata?.type || doc.type || doc.file_type;
  const { icon: Icon, color } = getFileIcon(fileType, doc);
  return <Icon className={cn("h-6 w-6", color)} />;
};

// Helper function to render appropriate preview based on file type
const renderPreview = (doc: any) => {
  const fileType = doc.metadata?.type || doc.type || doc.file_type;
  const fileUrl = doc.file_url;
  const isExternalLink = doc.is_external || doc.external_type;
  const externalUrl = doc.external_url;
  
  // Handle Google Drive and external links
  if (isExternalLink && externalUrl) {
    const externalType = doc.external_type || 'google_drive';
    return (
      <div className="flex items-center justify-center h-[300px] bg-slate-100 dark:bg-slate-800 rounded">
        <div className="text-center">
          {(() => {
            if (externalType === 'google_docs') return <FileText className="w-16 h-16 mx-auto mb-4 text-blue-600" />;
            if (externalType === 'google_sheets') return <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-green-600" />;
            if (externalType === 'google_slides') return <FileText className="w-16 h-16 mx-auto mb-4 text-orange-600" />;
            return <ExternalLink className="w-16 h-16 mx-auto mb-4 text-blue-600" />;
          })()}
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{doc.file_name || 'External Document'}</p>
          <p className="text-xs text-slate-500 mt-1">
            {(() => {
              if (externalType === 'google_docs') return 'Google Document';
              if (externalType === 'google_sheets') return 'Google Spreadsheet';
              if (externalType === 'google_slides') return 'Google Presentation';
              return 'Google Drive Link';
            })()}
          </p>
          <div className="mt-4">
            <a 
              href={externalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm px-4 py-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50 inline-flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Google Drive
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-slate-100 dark:bg-slate-800 rounded">
        <div className="text-center">
          <File className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <p className="text-sm text-slate-500">Preview not available</p>
        </div>
      </div>
    );
  }
  
  // Handle image files
  if (fileType?.includes('image') || fileType?.includes('png') || 
      fileType?.includes('jpg') || fileType?.includes('jpeg') || 
      fileType?.includes('gif') || fileType?.includes('webp')) {
    return (
      <img 
        src={fileUrl} 
        alt={doc.file_name || 'Image'}
        className="w-full h-auto max-h-[300px] object-contain rounded"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement!.innerHTML = '<div class="text-center text-slate-500 p-12">Unable to load image</div>';
        }}
      />
    );
  }
  
  // Handle PDF files
  if (fileType?.includes('pdf')) {
    return (
      <div className="w-full h-[300px] relative">
        <object
          data={fileUrl}
          type="application/pdf"
          className="w-full h-full rounded"
        >
          <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800 rounded">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-sm text-slate-500">PDF Preview</p>
              <a 
                href={fileUrl} 
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
    );
  }
  
  // Handle text files
  if (fileType?.includes('text') || fileType?.includes('txt') || 
      fileType?.includes('json') || fileType?.includes('xml') ||
      fileType?.includes('csv') || fileType?.includes('log')) {
    return (
      <div className="h-[300px] overflow-auto">
        <DocumentTextPreview url={fileUrl} fileName={doc.file_name} />
      </div>
    );
  }
  
  // Handle video files
  if (fileType?.includes('video') || doc.is_video) {
    return (
      <video
        src={fileUrl}
        controls
        className="w-full h-[300px] rounded"
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    );
  }
  
  // Default preview for other file types
  return (
    <div className="flex items-center justify-center h-[300px] bg-slate-100 dark:bg-slate-800 rounded">
      <div className="text-center">
        {renderFileIcon(doc)}
        <p className="text-sm text-slate-500 mt-2">Preview not available</p>
        <p className="text-xs text-slate-400 mt-1">
          {(() => {
            const type = fileType || '';
            if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xls')) return 'Excel Spreadsheet';
            if (type.includes('word') || type.includes('doc')) return 'Word Document';
            if (type.includes('zip')) return 'ZIP Archive';
            if (type.includes('rar')) return 'RAR Archive';
            return 'Document';
          })()}
        </p>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline mt-2 inline-block"
        >
          Download to view
        </a>
      </div>
    </div>
  );
};

export function SpotlightCardDocuments({
  documents,
  documentsView,
  setDocumentsView,
  onShowUploadDialog,
  onDocumentDelete
}: SpotlightCardDocumentsProps) {
  const { toast } = useToast();
  const [deletingDocument, setDeletingDocument] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Handle document download or opening link
  const handleDownload = (doc: any) => {
    // For Google Drive links, just open the URL in a new tab
    if (doc.is_external && doc.external_url) {
      window.open(doc.external_url, '_blank');
      return;
    }
    
    if (!doc.file_url) {
      toast({
        title: "Download Error",
        description: "This document doesn't have a downloadable file.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = doc.file_url;
    link.target = '_blank'; // Open in new tab
    link.download = doc.file_name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle document deletion
  const handleDelete = async () => {
    if (!deletingDocument) return;
    
    setIsDeleting(true);
    
    try {
      // Call the document service to delete the document
      await deleteDocument(deletingDocument);
      
      // Call the callback to update parent component's state
      if (onDocumentDelete) {
        onDocumentDelete(deletingDocument);
      }
      
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
        variant: "default"
      });
      
      // Close the dialog
      setDeletingDocument(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the document.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">Documents</h3>
          <Badge variant="secondary">{documents.length}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <ShimmerButton
            variant="outline"
            onClick={() => setDocumentsView(documentsView === 'grid' ? 'table' : 'grid')}
          >
            {documentsView === 'grid' ? (
              <>
                <List className="h-4 w-4 inline mr-2" />
                Table View
              </>
            ) : (
              <>
                <Grid3X3 className="h-4 w-4 inline mr-2" />
                Grid View
              </>
            )}
          </ShimmerButton>
          
          <ShimmerButton
            onClick={onShowUploadDialog}
          >
            <>
              <Upload className="h-4 w-4 inline mr-2" />
              Upload Document
            </>
          </ShimmerButton>
        </div>
      </div>
      
      {documentsView === 'table' ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Name</TableHead>
              <TableHead className="text-center">Type</TableHead>
              <TableHead className="text-center">Size</TableHead>
              <TableHead className="text-center">Uploaded</TableHead>
              <TableHead className="text-center">Submitted By</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <HoverPreview
                    previewType="document"
                    data={doc}
                    align="start"
                    side="right"
                    onAction={(type, id) => {
                      if (type === 'download') handleDownload(doc);
                      if (type === 'view') console.log('View document details', id);
                    }}
                  >
                    <span className="hover:text-blue-600 hover:underline truncate inline-block max-w-[200px]">
                      {doc.metadata?.name || doc.file_name || 'Unknown'}
                    </span>
                  </HoverPreview>
                </TableCell>
                <TableCell className="text-center">
                  {doc.is_external ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {doc.external_type === 'google_docs' ? 'Google Doc' :
                       doc.external_type === 'google_sheets' ? 'Google Sheet' :
                       doc.external_type === 'google_slides' ? 'Google Slide' : 'Google Drive'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {doc.metadata?.type || doc.type || 'file'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {doc.metadata?.size || doc.size ? 
                    `${((doc.metadata?.size || doc.size) / 1024 / 1024).toFixed(2)} MB` : 
                    'Unknown'
                  }
                </TableCell>
                <TableCell className="text-center">
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="h-7 w-7">
                            {doc.avatar_url ? (
                              <AvatarImage src={doc.avatar_url} alt={doc.uploaded_by_name || 'User'} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                                {doc.uploaded_by_name ? doc.uploaded_by_name.substring(0, 2).toUpperCase() : <User className="h-3 w-3" />}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          {doc.uploaded_by_name || doc.submitter || 'Unknown User'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      {doc.is_external ? (
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center gap-3">
                {doc.is_external ? (
                  (() => {
                    const externalType = doc.external_type || 'google_drive';
                    if (externalType === 'google_docs') return <FileText className="h-12 w-12 text-blue-600" />;
                    if (externalType === 'google_sheets') return <FileSpreadsheet className="h-12 w-12 text-green-600" />;
                    if (externalType === 'google_slides') return <FileText className="h-12 w-12 text-orange-600" />;
                    return <ExternalLink className="h-12 w-12 text-blue-600" />;
                  })()
                ) : (
                  <FileText className="h-12 w-12 text-gray-400" />
                )}
                <div className="text-center">
                  <HoverPreview
                    previewType="document"
                    data={doc}
                    align="center"
                    side="right"
                    onAction={(type, id) => {
                      if (type === 'download') handleDownload(doc);
                      if (type === 'view') console.log('View document details', id);
                    }}
                  >
                    <p className="font-medium text-sm truncate w-full hover:text-blue-600 hover:underline">
                      {doc.metadata?.name || doc.file_name || 'Unknown'}
                    </p>
                  </HoverPreview>
                  <p className="text-xs text-gray-500">
                    {doc.metadata?.size || doc.size ? 
                      `${((doc.metadata?.size || doc.size) / 1024 / 1024).toFixed(2)} MB` : 
                      'Unknown'
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Avatar className="h-5 w-5">
                      {doc.avatar_url ? (
                        <AvatarImage src={doc.avatar_url} alt={doc.uploaded_by_name || 'User'} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-[8px]">
                          {doc.uploaded_by_name ? doc.uploaded_by_name.substring(0, 2).toUpperCase() : <User className="h-2 w-2" />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-xs text-gray-500 font-medium">
                      {doc.uploaded_by_name || doc.submitter || (doc.uploaded_by ? doc.uploaded_by.substring(0, 8) : 'Unknown')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                  >
                    {doc.is_external ? (
                      <ExternalLink className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDocument} onOpenChange={(open) => !open && setDeletingDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}