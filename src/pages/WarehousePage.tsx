import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Edit,
  QrCode,
  Eye,
  Package,
  Loader2,
  FileText,
  CalendarClock,
} from 'lucide-react';
import AddWarehouseItemDialog from '@/components/warehouse/AddWarehouseItemDialog';
import EditWarehouseItemDialog from '@/components/warehouse/EditWarehouseItemDialog';
import QRCodeDialog from '@/components/warehouse/QRCodeDialog';
import ReservationDialog from '@/components/warehouse/ReservationDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WarehouseItem {
  id: string;
  item_id: string;
  name: string;
  description: string | null;
  details: string | null;
  photo_url: string | null;
  rack_no: string | null;
  rack_row: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  status?: string;
  current_user_name?: string | null;
  current_event?: string | null;
  current_purpose?: string | null;
  last_checkout_date?: string | null;
  has_reservations?: boolean;
  reservation_count?: number;
  next_reservation_date?: string | null;
}

export default function WarehousePage() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warehouse_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch warehouse items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (newItem: WarehouseItem) => {
    setItems([newItem, ...items]);
    setAddDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Item added successfully',
    });
  };

  const handleUpdateItem = (updatedItem: WarehouseItem) => {
    setItems(items.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setEditDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Item updated successfully',
    });
  };

  const handleEditClick = (item: WarehouseItem) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  const handleQRClick = (item: WarehouseItem) => {
    setSelectedItem(item);
    setQrDialogOpen(true);
  };

  const handleReservationClick = (item: WarehouseItem) => {
    setSelectedItem(item);
    setReservationDialogOpen(true);
  };

  const handleReservationCreated = () => {
    fetchItems();
    setReservationDialogOpen(false);
  };

  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.item_id.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.rack_no?.toLowerCase().includes(query) ||
      item.rack_row?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-bold">Warehouse Management</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by ID, name, rack location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{items.length}</div>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {items.filter(item => item.status === 'in_use').length}
                </div>
                <p className="text-sm text-muted-foreground">Items In Use</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {items.filter(item => item.status === 'available' || !item.status).length}
                </div>
                <p className="text-sm text-muted-foreground">Available Items</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current User / Reservations</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-gray-300" />
                        <p className="text-muted-foreground">
                          {searchQuery ? 'No items found' : 'No items in warehouse'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono">{item.item_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          item.status === 'in_use' ? 'secondary' : 
                          item.status === 'maintenance' ? 'destructive' : 
                          'default'
                        }>
                          {item.status?.replace('_', ' ').toUpperCase() || 'AVAILABLE'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.current_user_name ? (
                          <div>
                            <p className="text-sm">{item.current_user_name}</p>
                            {item.current_event && (
                              <p className="text-xs text-muted-foreground">{item.current_event}</p>
                            )}
                          </div>
                        ) : item.has_reservations ? (
                          <div>
                            <Badge variant="outline" className="text-xs">
                              {item.reservation_count} reservation{item.reservation_count !== 1 ? 's' : ''}
                            </Badge>
                            {item.next_reservation_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Next: {new Date(item.next_reservation_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.rack_no || item.rack_row ? (
                          <div className="flex gap-1">
                            {item.rack_no && <Badge variant="outline">{item.rack_no}</Badge>}
                            {item.rack_row && <Badge variant="secondary">{item.rack_row}</Badge>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(item)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReservationClick(item)}
                            className="h-8 w-8 p-0"
                            title="Reserve"
                          >
                            <CalendarClock className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQRClick(item)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleQRClick(item)}
                            className="h-8 w-8 p-0"
                            title="QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddWarehouseItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onItemAdded={handleAddItem}
      />

      {selectedItem && (
        <>
          <EditWarehouseItemDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            item={selectedItem}
            onItemUpdated={handleUpdateItem}
          />

          <QRCodeDialog
            open={qrDialogOpen}
            onOpenChange={setQrDialogOpen}
            item={selectedItem}
          />

          <ReservationDialog
            open={reservationDialogOpen}
            onOpenChange={setReservationDialogOpen}
            item={selectedItem}
            onReservationCreated={handleReservationCreated}
          />
        </>
      )}
    </div>
  );
}