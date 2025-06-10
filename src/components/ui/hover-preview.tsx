import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger, HoverCardPortal } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  FileText,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileArchive,
  Calendar,
  DollarSign,
  User,
  Clock,
  Package,
  Receipt,
  Eye,
  CheckCircle2,
  XCircle,
  Building2
} from "lucide-react";

interface HoverPreviewProps {
  children: React.ReactNode;
  previewType: 'document' | 'expense';
  data: unknown;
  align?: 'center' | 'start' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  onAction?: (type: string, id: string) => void;
  formatCurrency?: (amount: number) => string;
  formatDate?: (date: string) => string;
  onOpen?: () => void;
}

/**
 * A reusable hover preview component that can be used for both documents and expense claims
 */
export function HoverPreview({
  children,
  previewType,
  data,
  align = 'start',
  side = 'right',
  onAction,
  formatCurrency = (amount) => `RM ${amount.toFixed(2)}`,
  formatDate = (date) => new Date(date).toLocaleDateString(),
  onOpen
}: HoverPreviewProps) {
  // Helper function to determine file type and return appropriate icon
  const getFileIcon = (fileType: string) => {
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
    return { icon: File, color: 'text-gray-600' };
  };

  // Component to render file icon
  const renderFileIcon = (doc: unknown) => {
    const fileType = doc.metadata?.type || doc.type || doc.file_type;
    const { icon: Icon, color } = getFileIcon(fileType);
    return <Icon className={cn("h-6 w-6", color)} />;
  };

  // Helper function to render expense category icon
  const renderCategoryIcon = (category: string) => {
    // Since we don't have the categoryColors object here, we use a simplified approach
    const categoryConfig = {
      'fuel': { bg: 'bg-purple-100', text: 'text-purple-800', icon: Package },
      'food': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Package },
      'accommodation': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package },
      'equipment': { bg: 'bg-green-100', text: 'text-green-800', icon: Package },
      'communication': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Package },
      'training': { bg: 'bg-red-100', text: 'text-red-800', icon: Package },
      'other': { bg: 'bg-gray-100', text: 'text-gray-800', icon: Package },
    }[category] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Package };

    const CategoryIcon = categoryConfig.icon;

    return (
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", categoryConfig.bg)}>
        <CategoryIcon className={cn("h-4 w-4", categoryConfig.text)} />
      </div>
    );
  };

  // Helper function to render appropriate preview based on file type
  const renderPreview = (doc: unknown) => {
    const fileType = doc.metadata?.type || doc.type || doc.file_type;
    const fileUrl = doc.file_url;
    
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
            // Safe alternative to innerHTML - create error message without XSS risk
            const errorDiv = document.createElement('div');
            errorDiv.className = 'text-center text-slate-500 p-12';
            errorDiv.textContent = 'Unable to load image';
            e.currentTarget.parentElement?.appendChild(errorDiv);
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

  return (
    <HoverCard onOpenChange={(open) => {
      if (open && onOpen) {
        onOpen();
      }
    }}>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer group">
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent 
          className={cn(
            "bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl",
            previewType === 'document' ? "w-[500px] max-h-[500px]" : "w-[400px] max-h-[600px]"
          )}
          align={align}
          side={side}
          sideOffset={5}
          avoidCollisions={true}
        >
          <ScrollArea className="max-h-[500px]">
            {previewType === 'document' ? (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-2 pb-3 border-b">
                  {renderFileIcon(data)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm truncate">{data.metadata?.name || data.file_name || 'Unknown'}</h4>
                    <p className="text-xs text-muted-foreground">
                      {data.metadata?.size || data.size ? 
                        `${((data.metadata?.size || data.size) / 1024 / 1024).toFixed(2)} MB` : 
                        'Unknown size'} • {data.created_at ? formatDate(data.created_at) : 'Unknown date'}
                    </p>
                  </div>
                </div>
                
                {/* Content Preview */}
                <div className="flex-1 overflow-auto mt-3">
                  {renderPreview(data)}
                </div>

                {/* User Info */}
                {data.uploaded_by_name && (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">Uploaded by:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {data.avatar_url ? (
                          <AvatarImage src={data.avatar_url} alt={data.uploaded_by_name || 'User'} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                            {data.uploaded_by_name ? data.uploaded_by_name.substring(0, 2).toUpperCase() : <User className="h-3 w-3" />}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm font-medium">{data.uploaded_by_name}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 pt-3 border-t flex justify-end gap-2">
                  {data.file_url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onAction && onAction('download', data.id)}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="default"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => onAction && onAction('view', data.id)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                  </Button>
                </div>
              </div>
            ) : (
              // Expense Claim Preview
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {data.category ? renderCategoryIcon(data.category) : (
                      <Receipt className="h-6 w-6 text-indigo-600" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">{data.title}</h4>
                      <p className="text-xs text-gray-500">
                        {formatDate(data.date || data.created_at)} • Ref: #{data.reference_number || data.id?.substring(0, 6)}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      data.status === 'pending' && "bg-yellow-100 text-yellow-800",
                      data.status === 'approved' && "bg-green-100 text-green-800",
                      data.status === 'rejected' && "bg-red-100 text-red-800"
                    )}
                  >
                    {data.status}
                  </Badge>
                </div>

                {/* Amount */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">Amount</span>
                    </div>
                    <span className="font-bold text-lg text-indigo-600">
                      {formatCurrency(data.amount || data.total_amount || 0)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {data.description && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-500">Description</span>
                    </div>
                    <p className="text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      {data.description}
                    </p>
                  </div>
                )}

                {/* Submitter and Receipts */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-500">Submitter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {data.avatar_url ? (
                          <AvatarImage src={data.avatar_url} alt={data.submitted_by_name || 'User'} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                            {data.submitted_by_name ? data.submitted_by_name.substring(0, 2).toUpperCase() : <User className="h-3 w-3" />}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium">{data.submitted_by_name || data.user_name || 'Unknown'}</span>
                        {data.submitted_by === 'On behalf' && data.staff_name && (
                          <p className="text-xs text-gray-500">For: {data.staff_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-500">Receipts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-800">
                        {Array.isArray(data.receipts) ? data.receipts.length : data.receipt_count || 0}
                      </span>
                      <span className="text-sm">
                        {Array.isArray(data.receipts) ? 
                          data.receipts.length > 0 ? `${data.receipts.length} attached` : 'No receipts' : 
                          data.receipt_count > 0 ? `${data.receipt_count} attached` : 'No receipts'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Project info if available */}
                {(data.project_id || data.project_title) && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-500">Project</span>
                    </div>
                    <span className="text-sm font-medium">{data.project_title || `Project ID: ${data.project_id}`}</span>
                  </div>
                )}

                {/* Timeline */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">Timeline</span>
                  </div>
                  <div className="relative pl-5 pt-1">
                    <div className="absolute top-0 bottom-0 left-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="space-y-3">
                      <div className="relative">
                        <div className="absolute w-4 h-4 rounded-full bg-indigo-500 -left-5 top-0 border-2 border-white dark:border-gray-900"></div>
                        <p className="text-xs font-medium">Created</p>
                        <p className="text-xs text-gray-500">{formatDate(data.created_at || data.date)}</p>
                      </div>
                      {data.status === 'approved' && (
                        <div className="relative">
                          <div className="absolute w-4 h-4 rounded-full bg-green-500 -left-5 top-0 border-2 border-white dark:border-gray-900"></div>
                          <p className="text-xs font-medium text-green-600">Approved</p>
                          <p className="text-xs text-gray-500">{formatDate(data.approved_at || data.date)}</p>
                        </div>
                      )}
                      {data.status === 'rejected' && (
                        <div className="relative">
                          <div className="absolute w-4 h-4 rounded-full bg-red-500 -left-5 top-0 border-2 border-white dark:border-gray-900"></div>
                          <p className="text-xs font-medium text-red-600">Rejected</p>
                          <p className="text-xs text-gray-500">{formatDate(data.rejected_at || data.date)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex justify-end">
                  <Button 
                    size="sm" 
                    variant="default"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => onAction && onAction('viewDetails', data.id)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
}