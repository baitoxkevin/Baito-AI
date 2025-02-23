import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { initializeGoogleDrive, authenticateGoogleDrive } from '@/lib/google-drive';
import { DOCUMENT_TYPES } from '@/types/documents';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import {
  Search,
  FolderIcon,
  FileIcon,
  UploadIcon,
  FolderPlusIcon,
  Filter,
  MoreVertical,
  ExternalLink,
  Download,
  Trash2,
  Share2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

type Document = {
  id: string;
  name: string;
  type: string;
  size: number;
  folder: string;
  created_at: string;
  updated_at: string;
  shared_with: string[];
  storage_path: string;
  owner_id: string;
  document_type?: 'project_pl' | 'project_claim' | 'project_proposal' | 'briefing_deck';
  project_id?: string;
};

// Document types from previous project implementation


const formatFileSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileIcon className="h-4 w-4 text-red-500" />;
    case 'xlsx':
      return <FileIcon className="h-4 w-4 text-green-500" />;
    case 'docx':
      return <FileIcon className="h-4 w-4 text-blue-500" />;
    default:
      return <FileIcon className="h-4 w-4" />;
  }
};

async function loadDocuments() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', user.id);

  if (error) throw error;
  return data;
}
export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [documents, setDocuments] = useState<Document[]>([]);
  
  useEffect(() => {
    loadDocuments()
      .then(docs => setDocuments(docs || []))
      .catch(error => {
        console.error('Error loading documents:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load documents"
        });
      });
  }, []);
  const { user } = useUser();
  const { toast } = useToast();

  const handleGoogleDriveConnect = async () => {
    try {
      await initializeGoogleDrive();
      await authenticateGoogleDrive();
      await loadDocuments();
      toast({
        title: "Success",
        description: "Connected to Google Drive successfully",
      });
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to Google Drive"
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || doc.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const folders = Array.from(new Set(documents.map(doc => doc.folder)));

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r p-4 space-y-4">
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start text-blue-600"
            onClick={handleGoogleDriveConnect}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect Google Drive
          </Button>
          <Button className="w-full justify-start">
            <UploadIcon className="mr-2 h-4 w-4" />
            Upload File
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <FolderPlusIcon className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>

        <div className="space-y-1">
          <Button
            variant={selectedFolder === 'all' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSelectedFolder('all')}
          >
            <FolderIcon className="mr-2 h-4 w-4" />
            All Files
          </Button>
          {folders.map((folder) => (
            <Button
              key={folder}
              variant={selectedFolder === folder ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSelectedFolder(folder)}
            >
              <FolderIcon className="mr-2 h-4 w-4" />
              {folder}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="name">
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No documents found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getFileIcon(doc.type)}
                        <span>{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {doc.folder}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.size)}</TableCell>
                    <TableCell>
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
