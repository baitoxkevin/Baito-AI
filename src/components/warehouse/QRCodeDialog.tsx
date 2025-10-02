import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  QrCode,
  Download,
  Printer,
  Package,
  MapPin,
  User,
  Calendar,
  Clock,
  ArrowRightLeft,
  Info,
  History,
  CalendarCheck,
} from 'lucide-react';
import ItemCheckInOutDialog from './ItemCheckInOutDialog';

interface WarehouseItem {
  id: string;
  item_id: string;
  name: string;
  description: string | null;
  details: string | null;
  photo_url: string | null;
  rack_no: string | null;
  rack_row: string | null;
  status?: string;
  current_user_name?: string | null;
  current_event?: string | null;
  current_purpose?: string | null;
  last_checkout_date?: string | null;
}

interface Transaction {
  id: string;
  transaction_type: 'check_out' | 'check_in';
  user_name: string;
  event_name: string | null;
  purpose: string | null;
  created_at: string;
  notes: string | null;
}

interface Reservation {
  id: string;
  user_name: string;
  event_name: string | null;
  purpose: string | null;
  expected_pickup_date: string;
  expected_return_date: string;
  status: string;
  priority: string;
  notes: string | null;
  created_at: string;
}

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WarehouseItem;
}

export default function QRCodeDialog({
  open,
  onOpenChange,
  item,
}: QRCodeDialogProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checkInOutOpen, setCheckInOutOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentItem, setCurrentItem] = useState<WarehouseItem>(item);
  const { toast } = useToast();

  useEffect(() => {
    if (open && item) {
      generateQRCode();
      fetchItemDetails();
      fetchTransactionHistory();
      fetchReservations();
    }
  }, [open, item]);

  const fetchItemDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_items')
        .select('*')
        .eq('id', item.id)
        .single();

      if (error) throw error;
      if (data) setCurrentItem(data);
    } catch (error: any) {
      console.error('Error fetching item details:', error);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_item_transactions')
        .select('*')
        .eq('item_id', item.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_reservations')
        .select('*')
        .eq('item_id', item.id)
        .in('status', ['pending', 'confirmed'])
        .order('expected_pickup_date', { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
    }
  };

  const generateQRCode = async () => {
    try {
      setLoading(true);
      
      // Create QR data with comprehensive information
      const qrData = {
        id: item.id,
        item_id: item.item_id,
        name: item.name,
        location: {
          rack: item.rack_no,
          row: item.rack_row
        },
        scan_url: `${window.location.origin}/warehouse/scan/${item.id}`,
        timestamp: new Date().toISOString()
      };

      const dataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      setQrCodeDataUrl(dataUrl);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `warehouse-item-${item.item_id}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    
    toast({
      title: 'Success',
      description: 'QR code downloaded successfully',
    });
  };

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${item.item_id}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
              }
              .container {
                text-align: center;
                border: 2px solid #000;
                padding: 20px;
                border-radius: 8px;
              }
              img {
                margin: 20px 0;
              }
              .info {
                margin: 10px 0;
                font-size: 14px;
              }
              .info strong {
                display: inline-block;
                width: 100px;
                text-align: right;
                margin-right: 10px;
              }
              h2 {
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Warehouse Item</h2>
              <img src="${qrCodeDataUrl}" alt="QR Code" />
              <div class="info"><strong>ID:</strong> ${item.item_id}</div>
              <div class="info"><strong>Name:</strong> ${item.name}</div>
              <div class="info"><strong>Location:</strong> ${item.rack_no || 'N/A'} - ${item.rack_row || 'N/A'}</div>
              <div class="info"><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      available: "default",
      in_use: "secondary",
      maintenance: "destructive",
      lost: "outline"
    };
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status?.replace('_', ' ').toUpperCase() || 'AVAILABLE'}
      </Badge>
    );
  };

  const handleItemUpdated = () => {
    fetchItemDetails();
    fetchTransactionHistory();
    fetchReservations();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code & Item Details - {item.item_id}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="qrcode">QR Code</TabsTrigger>
              <TabsTrigger value="reservations">
                Reservations
                {reservations.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {reservations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Item Information
                    </span>
                    {getStatusBadge(currentItem.status || 'available')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Item ID:</span>
                        <span className="font-mono">{currentItem.item_id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Name:</span>
                        <span>{currentItem.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Location:</span>
                        <span>
                          {currentItem.rack_no && currentItem.rack_row 
                            ? `Rack ${currentItem.rack_no}, Row ${currentItem.rack_row}`
                            : 'Not assigned'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {currentItem.current_user_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Current User:</span>
                          <span>{currentItem.current_user_name}</span>
                        </div>
                      )}
                      {currentItem.current_event && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Event:</span>
                          <span>{currentItem.current_event}</span>
                        </div>
                      )}
                      {currentItem.current_purpose && (
                        <div className="flex items-center gap-2 text-sm">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Purpose:</span>
                          <span>{currentItem.current_purpose}</span>
                        </div>
                      )}
                      {currentItem.last_checkout_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Checked Out:</span>
                          <span>{new Date(currentItem.last_checkout_date).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {currentItem.description && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-1">Description:</p>
                      <p className="text-sm text-muted-foreground">{currentItem.description}</p>
                    </div>
                  )}
                  
                  {currentItem.details && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-1">Details:</p>
                      <p className="text-sm text-muted-foreground">{currentItem.details}</p>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <Button 
                      onClick={() => setCheckInOutOpen(true)}
                      className="w-full"
                      variant={currentItem.status === 'in_use' ? 'secondary' : 'default'}
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      {currentItem.status === 'in_use' ? 'Check In Item' : 'Check Out Item'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="qrcode" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                  <CardDescription>
                    Scan this code to view item details and tracking information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {qrCodeDataUrl && (
                    <div className="flex flex-col items-center space-y-4">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code" 
                        className="border-2 border-gray-200 rounded-lg p-4 bg-white"
                      />
                      
                      <div className="flex gap-2">
                        <Button onClick={downloadQRCode} variant="outline">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button onClick={printQRCode} variant="outline">
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                      </div>
                      
                      <div className="text-center text-sm text-muted-foreground">
                        <p>Item ID: {item.item_id}</p>
                        <p>Location: {item.rack_no || 'N/A'} - {item.rack_row || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reservations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5" />
                    Active Reservations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reservations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No active reservations
                    </p>
                  ) : (
                    <ScrollArea className="h-[400px] w-full">
                      <div className="space-y-3">
                        {reservations.map((reservation) => (
                          <div 
                            key={reservation.id}
                            className="p-4 rounded-lg border space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{reservation.user_name}</p>
                                {reservation.event_name && (
                                  <p className="text-sm text-muted-foreground">
                                    Event: {reservation.event_name}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={
                                  reservation.priority === 'urgent' ? 'destructive' :
                                  reservation.priority === 'high' ? 'secondary' :
                                  'outline'
                                }>
                                  {reservation.priority}
                                </Badge>
                                <Badge variant={
                                  reservation.status === 'confirmed' ? 'default' : 'secondary'
                                }>
                                  {reservation.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Pickup:</span>
                                <p className="font-medium">
                                  {new Date(reservation.expected_pickup_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Return:</span>
                                <p className="font-medium">
                                  {new Date(reservation.expected_return_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            {reservation.purpose && (
                              <p className="text-sm text-muted-foreground">
                                Purpose: {reservation.purpose}
                              </p>
                            )}
                            
                            {reservation.notes && (
                              <p className="text-sm text-muted-foreground italic">
                                Notes: {reservation.notes}
                              </p>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              Reserved on {new Date(reservation.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No transaction history available
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div 
                          key={transaction.id}
                          className="flex items-start justify-between p-3 rounded-lg border"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                transaction.transaction_type === 'check_out' 
                                  ? 'destructive' 
                                  : 'default'
                              }>
                                {transaction.transaction_type === 'check_out' ? 'OUT' : 'IN'}
                              </Badge>
                              <span className="font-medium">
                                {transaction.user_name}
                              </span>
                            </div>
                            {transaction.event_name && (
                              <p className="text-sm text-muted-foreground">
                                Event: {transaction.event_name}
                              </p>
                            )}
                            {transaction.purpose && (
                              <p className="text-sm text-muted-foreground">
                                Purpose: {transaction.purpose}
                              </p>
                            )}
                            {transaction.notes && (
                              <p className="text-sm text-muted-foreground">
                                Notes: {transaction.notes}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {currentItem && (
        <ItemCheckInOutDialog
          open={checkInOutOpen}
          onOpenChange={setCheckInOutOpen}
          item={currentItem}
          onTransactionComplete={handleItemUpdated}
        />
      )}
    </>
  );
}