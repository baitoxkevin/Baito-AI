import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Trash2, FileCheck, Plus, X, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

import { logger } from '../../lib/logger';
interface Document {
  id: string;
  name: string;
  description?: string;
  type: string;
  size: number;
  uploaded_by: string;
  upload_date: Date;
  url?: string;
  external_link?: string;
  is_external?: boolean;
}

interface DocumentsTabProps {
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  projectId?: string; // Required for database operations
}

const DocumentsTab = ({ documents, setDocuments, projectId }: DocumentsTabProps) => {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const BUCKET_NAME = 'project-documents';
  const [newDocument, setNewDocument] = useState<Partial<Document>>({
    name: '',
    description: '',
    type: 'Contract',
    uploaded_by: 'Current User'
  });
  const [fileDetails, setFileDetails] = useState<{ name?: string, size?: number }>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the actual file
    setSelectedFile(file);

    // Extract file details
    setFileDetails({
      name: file.name,
      size: file.size
    });

    // Auto-fill name field if empty
    if (!newDocument.name) {
      setNewDocument(prev => ({
        ...prev,
        name: file.name.split('.')[0], // Remove extension
        type: getFileType(file.name)
      }));
    }
  };

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'PDF Document';
      case 'doc':
      case 'docx': return 'Word Document';
      case 'xls':
      case 'xlsx': return 'Spreadsheet';
      case 'ppt':
      case 'pptx': return 'Presentation';
      case 'jpg':
      case 'jpeg':
      case 'png': return 'Image';
      default: return 'Other';
    }
  };

  const handleAddDocument = async () => {
    // Get the external link
    const externalLink = (document.getElementById('docLink') as HTMLInputElement)?.value;
    
    // Check if we have a file or external link
    if (!newDocument.name || (!selectedFile && !externalLink)) {
      toast({
        title: "Missing information",
        description: "Please provide a document name and either select a file or provide an external link",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    try {
      // Handle external link (like Google Drive)
      if (externalLink && !selectedFile) {
        const isGoogleDrive = externalLink.includes('drive.google.com') || 
                              externalLink.includes('docs.google.com') || 
                              externalLink.includes('sheets.google.com') || 
                              externalLink.includes('slides.google.com');
        
        // Determine document type based on the link
        let docType = newDocument.type || 'Link';
        if (isGoogleDrive) {
          if (externalLink.includes('document')) docType = 'Google Doc';
          else if (externalLink.includes('spreadsheets')) docType = 'Google Sheet';
          else if (externalLink.includes('presentation')) docType = 'Google Slides';
          else if (externalLink.includes('form')) docType = 'Google Form';
          else docType = 'Google Drive';
        }
        
        // For Google Drive links, description is optional
        // If no description is provided, use a default one based on the document type
        let description = newDocument.description;
        if (!description && isGoogleDrive) {
          description = `${docType} - External Link`;
        }
        
        const doc: Document = {
          id: `doc-${Date.now()}`,
          name: newDocument.name,
          description: description,
          type: docType,
          size: 0, // External links don't have a file size
          uploaded_by: newDocument.uploaded_by || 'Current User',
          upload_date: new Date(),
          external_link: externalLink,
          is_external: true
        };
        
        // Update local state
        const updatedDocuments = [...documents, doc];
        setDocuments(updatedDocuments);
        
        // Update database if projectId is provided
        if (projectId) {
          const { error: dbError } = await supabase
            .from('project_documents')
            .insert({
              project_id: projectId,
              file_name: doc.name,
              file_type: doc.type,
              description: description,
              uploaded_by: doc.uploaded_by,
              created_at: doc.upload_date,
              external_link: externalLink,
              is_external: true
            });
            
          if (dbError) {
            logger.error('Database insert error:', dbError);
            throw dbError;
          }
        }
        
        // Reset form
        setNewDocument({
          name: '',
          description: '',
          type: 'Contract',
          uploaded_by: 'Current User'
        });
        setShowAddForm(false);
        
        toast({
          title: "External link added",
          description: "The external document link has been added successfully",
          variant: "default"
        });
        
        return;
      }
      
      // Handle file upload (original functionality)
      if (selectedFile) {
        // Generate unique file path
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${projectId}/${Date.now()}-${newDocument.name}.${fileExt}`;
        
        // Upload file to Supabase storage if projectId exists
        if (projectId) {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, selectedFile);
            
          if (uploadError) {
            logger.error('Storage upload error:', uploadError);
            throw uploadError;
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
        }
        
        const doc: Document = {
          id: `doc-${Date.now()}`,
          name: newDocument.name,
          description: newDocument.description,
          type: newDocument.type || 'Other',
          size: selectedFile.size || 0,
          uploaded_by: newDocument.uploaded_by || 'Current User',
          upload_date: new Date(),
          url: projectId ? filePath : `#${selectedFile.name}`,
          is_external: false
        };
        
        // Update local state
        const updatedDocuments = [...documents, doc];
        setDocuments(updatedDocuments);
        
        // Update database if projectId is provided
        if (projectId) {
          const { error: dbError } = await supabase
            .from('project_documents')
            .insert({
              project_id: projectId,
              file_name: doc.name,
              file_path: filePath,
              file_type: doc.type,
              file_size: doc.size,
              description: doc.description,
              uploaded_by: doc.uploaded_by,
              created_at: doc.upload_date,
              is_external: false
            });
            
          if (dbError) {
            logger.error('Database insert error:', dbError);
            throw dbError;
          }
        }
        
        // Reset form
        setNewDocument({
          name: '',
          description: '',
          type: 'Contract',
          uploaded_by: 'Current User'
        });
        setFileDetails({});
        setSelectedFile(null);
        setShowAddForm(false);
        
        // Reset file input
        const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Reset external link input
        const linkInput = document.getElementById('docLink') as HTMLInputElement;
        if (linkInput) {
          linkInput.value = '';
        }
        
        toast({
          title: "Document uploaded",
          description: "Document has been uploaded successfully",
          variant: "default"
        });
      }
    } catch (error) {
      logger.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    const documentToRemove = documents.find(doc => doc.id === docId);
    if (!documentToRemove) return;
    
    try {
      // Handle different document types (external link vs file)
      if (documentToRemove.is_external) {
        // For external links, we just need to remove the database entry
        if (projectId) {
          const { error: dbError } = await supabase
            .from('project_documents')
            .delete()
            .eq('project_id', projectId)
            .eq('external_link', documentToRemove.external_link);
            
          if (dbError) throw dbError;
        }
      } else {
        // For uploaded files, handle storage and database
        if (projectId && documentToRemove.url && !documentToRemove.url.startsWith('#')) {
          const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([documentToRemove.url]);
            
          if (storageError) logger.error('Storage deletion error:', storageError);
        }
        
        // Update database if projectId is provided
        if (projectId) {
          const { error: dbError } = await supabase
            .from('project_documents')
            .delete()
            .eq('project_id', projectId)
            .eq('file_path', documentToRemove.url);
            
          if (dbError) throw dbError;
        }
      }
      
      // Update local state (for both types)
      const updatedDocuments = documents.filter(doc => doc.id !== docId);
      setDocuments(updatedDocuments);
      
      toast({
        title: documentToRemove.is_external ? "Link removed" : "Document removed",
        description: documentToRemove.is_external 
          ? "External link has been removed successfully" 
          : "Document has been removed successfully",
        variant: "default"
      });
    } catch (error) {
      logger.error('Error removing document:', error);
      toast({
        title: "Removal failed",
        description: "Failed to remove document. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Format file size in a human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Project Documents ({documents.length})</h3>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? "outline" : "default"}
        >
          {showAddForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </>
          )}
        </Button>
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="text-center p-6 border rounded-lg">
          <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No documents added yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 border rounded-lg flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {doc.is_external ? (
                    doc.type?.includes('Google') ? (
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                          {doc.type?.includes('Doc') && (
                            <>
                              <path fill="#2196f3" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"/>
                              <path fill="#bbdefb" d="M40 13L30 13 30 3z"/>
                              <path fill="#1565c0" d="M30 13L40 13 40 15 30 15z"/>
                              <path fill="#e3f2fd" d="M15 23H33V25H15zM15 27H33V29H15zM15 31H33V33H15zM15 35H25V37H15z"/>
                            </>
                          )}
                          {doc.type?.includes('Sheet') && (
                            <>
                              <path fill="#43a047" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"/>
                              <path fill="#c8e6c9" d="M40 13L30 13 30 3z"/>
                              <path fill="#2e7d32" d="M30 13L40 13 40 15 30 15z"/>
                              <path fill="#e8f5e9" d="M31 23H33V37H31zM27 23H29V37H27zM23 23H25V37H23zM19 23H21V37H19zM15 23H17V37H15z"/>
                              <path fill="#e8f5e9" d="M15 23H33V25H15zM15 27H33V29H15zM15 31H33V33H15zM15 35H33V37H15z"/>
                            </>
                          )}
                          {doc.type?.includes('Slides') && (
                            <>
                              <path fill="#ff9800" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"/>
                              <path fill="#ffe0b2" d="M40 13L30 13 30 3z"/>
                              <path fill="#e65100" d="M30 13L40 13 40 15 30 15z"/>
                              <path fill="#fff3e0" d="M20 24A2 2 0 1 0 20 28A2 2 0 1 0 20 24Z"/>
                              <path fill="#fff3e0" d="M28 26H24V28H28z"/>
                              <path fill="#fff3e0" d="M15 34H33V36H15z"/>
                            </>
                          )}
                          {doc.type?.includes('Drive') && !doc.type?.includes('Doc') && !doc.type?.includes('Sheet') && !doc.type?.includes('Slides') && (
                            <>
                              <path fill="#1e88e5" d="M40,12H24l-4,4H8c-2.2,0-4,1.8-4,4v20c0,2.2,1.8,4,4,4h32c2.2,0,4-1.8,4-4V16C44,13.8,42.2,12,40,12z"/>
                              <path fill="#4caf50" d="M36,36H20l-4-4H8v4c0,2.2,1.8,4,4,4h24c2.2,0,4-1.8,4-4v-4h-4V36z"/>
                              <path fill="#fbc02d" d="M40,24h-8l-4-4H12v8h4v-4h16v8h4l4-4V24z"/>
                              <path fill="#1565c0" d="M12,16v4h16l4-4H12z"/>
                              <path fill="#e53935" d="M34,36l-3.2-3.2c-0.5-0.5-0.5-1.1,0-1.6c0.5-0.5,1.1-0.5,1.6,0L36,34.4V30h-8v-3.8c-0.4,0.5-0.7,1.1-0.8,1.8h-6.4c-0.5,0-0.8-0.4-0.8-0.9c0-0.3,0.1-0.5,0.3-0.7l4.9-4.9c0.1-0.1,0.1-0.2,0.2-0.4c0-0.3-0.2-0.5-0.5-0.5c-0.1,0-0.3,0.1-0.4,0.2L16,29.2V32h16V36z"/>
                            </>
                          )}
                          {doc.type?.includes('Form') && (
                            <>
                              <path fill="#673ab7" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"/>
                              <path fill="#d1c4e9" d="M40 13L30 13 30 3z"/>
                              <path fill="#4527a0" d="M30 13L40 13 40 15 30 15z"/>
                              <path fill="#ede7f6" d="M15 23H33V25H15z"/>
                              <path fill="#ede7f6" d="M24 29.8c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9S24.5 29.8 24 29.8zM15 33H33V35H15z"/>
                            </>
                          )}
                        </svg>
                      </div>
                    ) : (
                      <LinkIcon className="h-5 w-5 text-blue-500" />
                    )
                  ) : (
                    <FileText className="h-5 w-5 text-blue-500" />
                  )}
                  <h4 className="font-medium">{doc.name}</h4>
                </div>
                <div className="flex gap-1">
                  {doc.is_external ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      title="Open Link"
                      onClick={() => window.open(doc.external_link, '_blank')}
                    >
                      <LinkIcon className="h-4 w-4 text-blue-500 mr-1" />
                      Open
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-blue-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDocument(doc.id)}
                    className="h-8 w-8 p-0"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              {doc.description && (
                <p className="text-sm text-gray-500">{doc.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${doc.is_external && doc.type?.includes('Google') ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}>
                  {doc.type}
                </Badge>
                {!doc.is_external && (
                  <Badge variant="outline" className="text-xs">
                    {formatFileSize(doc.size)}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  {doc.is_external ? 'Added' : 'Uploaded'}: {format(doc.upload_date, 'MMM d, yyyy')}
                </Badge>
                {doc.is_external && (
                  <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                    External Link
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Form */}
      {showAddForm && (
        <div className="border p-4 rounded-lg mt-4">
          <h4 className="font-medium mb-4">Add New Document</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="docName">Document Name</Label>
              <Input
                id="docName"
                value={newDocument.name}
                onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                placeholder="Document name"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="docDescription">Description (Optional)</Label>
                <span className="text-xs text-gray-500">Not required for Google Drive links</span>
              </div>
              <Textarea
                id="docDescription"
                value={newDocument.description}
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                placeholder="Brief description of the document"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="docType">Document Type</Label>
              <Select
                value={newDocument.type}
                onValueChange={(value) => setNewDocument({ ...newDocument, type: value })}
              >
                <SelectTrigger id="docType">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Report">Report</SelectItem>
                  <SelectItem value="Specification">Specification</SelectItem>
                  <SelectItem value="Image">Image</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-4 items-center my-4">
              <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-sm text-gray-500">Choose one of the following</span>
              <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Upload File */}
              <div className="space-y-2 border p-4 rounded-lg">
                <div className="font-medium mb-2 flex items-center">
                  <Upload className="h-4 w-4 mr-2 text-blue-500" />
                  Upload File
                </div>
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/10 transition-colors">
                  <input
                    type="file"
                    id="fileUpload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer">
                    {fileDetails.name ? (
                      <div className="flex flex-col items-center">
                        <FileCheck className="h-8 w-8 text-green-500 mb-2" />
                        <span className="text-sm font-medium">{fileDetails.name}</span>
                        <span className="text-xs text-gray-500 mt-1">
                          {fileDetails.size && formatFileSize(fileDetails.size)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium">Click to upload file</span>
                        <span className="text-xs text-gray-500 mt-1">
                          PDF, Word, Excel, PowerPoint, or images
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              
              {/* Option 2: Add Google Drive Link */}
              <div className="space-y-2 border p-4 rounded-lg">
                <div className="font-medium mb-2 flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2 text-blue-500" />
                  Add Google Drive Link
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="docLink"
                        className="pl-9"
                        placeholder="https://drive.google.com/document/d..."
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      className="flex-shrink-0"
                      onClick={() => {
                        const linkInput = document.getElementById('docLink') as HTMLInputElement;
                        const link = linkInput?.value;
                        
                        if (!link) {
                          toast({
                            title: "No link provided",
                            description: "Please enter a URL to validate",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Simple validation
                        try {
                          const url = new URL(link);
                          
                          // Auto-detect Google Drive documents
                          if (url.hostname.includes('google.com')) {
                            let docType = 'Google Drive';
                            
                            if (url.hostname.includes('docs.google.com')) {
                              docType = 'Google Doc';
                            } else if (url.hostname.includes('sheets.google.com')) {
                              docType = 'Google Sheet';
                            } else if (url.hostname.includes('slides.google.com')) {
                              docType = 'Google Slides';
                            } else if (url.hostname.includes('forms.google.com')) {
                              docType = 'Google Form';
                            } else if (url.hostname.includes('drive.google.com')) {
                              docType = 'Google Drive';
                            }
                            
                            // Auto-fill document type
                            setNewDocument(prev => ({
                              ...prev,
                              type: docType
                            }));
                            
                            toast({
                              title: "Google Drive Link Detected",
                              description: `Link validated as ${docType}`,
                            });
                          } else {
                            toast({
                              title: "Link Validated",
                              description: "The link format is valid",
                            });
                          }
                        } catch (err) {
                          toast({
                            title: "Invalid URL",
                            description: "Please enter a valid URL with http:// or https://",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Validate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Provide a URL for external documents (Google Drive, Dropbox, etc.)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddDocument}
                disabled={
                  !newDocument.name || 
                  (!(document.getElementById('docLink') as HTMLInputElement)?.value && !selectedFile) || 
                  uploading
                }
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {selectedFile ? 'Upload Document' : (document.getElementById('docLink') as HTMLInputElement)?.value ? 'Add Link' : 'Add Document'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;