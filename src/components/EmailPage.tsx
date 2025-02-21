import { useState } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Mail,
  Star,
  Inbox,
  Send,
  Archive,
  Trash2,
  Edit3,
  Plus,
  Filter,
} from 'lucide-react';

type Email = {
  id: string;
  subject: string;
  from: string;
  to: string;
  content: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'archive' | 'trash';
};

const MOCK_EMAILS: Email[] = [
  {
    id: '1',
    subject: 'New Project Opportunity',
    from: 'client@company.com',
    to: 'me@company.com',
    content: 'We have an exciting new project opportunity...',
    date: '2025-02-14T10:00:00Z',
    read: false,
    starred: true,
    folder: 'inbox'
  },
  {
    id: '2',
    subject: 'Event Schedule Update',
    from: 'events@company.com',
    to: 'me@company.com',
    content: 'Please note the following changes to the event schedule...',
    date: '2025-02-14T09:30:00Z',
    read: true,
    starred: false,
    folder: 'inbox'
  },
  {
    id: '3',
    subject: 'Staff Availability Request',
    from: 'me@company.com',
    to: 'staff@company.com',
    content: 'Could you please confirm your availability for...',
    date: '2025-02-14T09:00:00Z',
    read: true,
    starred: false,
    folder: 'sent'
  }
];

export default function EmailPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("inbox");
  const [composeOpen, setComposeOpen] = useState(false);
  const [emails] = useState<Email[]>(MOCK_EMAILS);

  const filteredEmails = emails.filter(email => {
    const matchesSearch = (
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.to.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesFolder = email.folder === selectedFolder;
    
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r p-4 space-y-4">
        <Button className="w-full" onClick={() => setComposeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Compose
        </Button>

        <div className="space-y-1">
          <Button
            variant={selectedFolder === 'inbox' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSelectedFolder('inbox')}
          >
            <Inbox className="mr-2 h-4 w-4" />
            Inbox
            <Badge variant="secondary" className="ml-auto">
              {emails.filter(e => e.folder === 'inbox' && !e.read).length}
            </Badge>
          </Button>
          <Button
            variant={selectedFolder === 'sent' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSelectedFolder('sent')}
          >
            <Send className="mr-2 h-4 w-4" />
            Sent
          </Button>
          <Button
            variant={selectedFolder === 'archive' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSelectedFolder('archive')}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
          <Button
            variant={selectedFolder === 'trash' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSelectedFolder('trash')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Trash
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter emails" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emails</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="starred">Starred</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No emails found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmails.map((email) => (
                  <TableRow 
                    key={email.id}
                    className={`cursor-pointer hover:bg-muted/50 ${!email.read ? 'font-medium' : ''}`}
                  >
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className={email.starred ? 'text-yellow-500' : ''}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>{email.from}</TableCell>
                    <TableCell>{email.subject}</TableCell>
                    <TableCell className="text-right">
                      {new Date(email.date).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Compose Email Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Email</DialogTitle>
            <DialogDescription>
              Compose a new email message
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input placeholder="To" />
              <Input placeholder="Subject" />
              <textarea
                className="w-full min-h-[200px] p-3 rounded-md border"
                placeholder="Write your message here..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
              <Button>
                Send
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
