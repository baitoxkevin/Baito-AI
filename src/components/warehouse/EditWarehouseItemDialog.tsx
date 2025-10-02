import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit } from 'lucide-react';

interface WarehouseItem {
  id: string;
  item_id: string;
  name: string;
  description: string | null;
  details: string | null;
  photo_url: string | null;
  rack_no: string | null;
  rack_row: string | null;
}

interface EditWarehouseItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WarehouseItem;
  onItemUpdated: (item: WarehouseItem) => void;
}

export default function EditWarehouseItemDialog({
  open,
  onOpenChange,
  item,
  onItemUpdated,
}: EditWarehouseItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_id: '',
    name: '',
    description: '',
    details: '',
    rack_no: '',
    rack_row: '',
    photo_url: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setFormData({
        item_id: item.item_id,
        name: item.name,
        description: item.description || '',
        details: item.details || '',
        rack_no: item.rack_no || '',
        rack_row: item.rack_row || '',
        photo_url: item.photo_url || '',
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Item name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('warehouse_items')
        .update({
          item_id: formData.item_id,
          name: formData.name,
          description: formData.description || null,
          details: formData.details || null,
          rack_no: formData.rack_no || null,
          rack_row: formData.rack_row || null,
          photo_url: formData.photo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;

      onItemUpdated(data);
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('warehouse_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
      
      onOpenChange(false);
      // Refresh the page to update the list
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Warehouse Item
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_id">Item ID</Label>
              <Input
                id="item_id"
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Laptop Dell XPS 13"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the item..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details</Label>
            <Textarea
              id="details"
              placeholder="Serial number, specifications, etc..."
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rack_no">Rack Number</Label>
              <Input
                id="rack_no"
                placeholder="e.g., A1, B2, C3"
                value={formData.rack_no}
                onChange={(e) => setFormData({ ...formData, rack_no: e.target.value })}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rack_row">Rack Row</Label>
              <Input
                id="rack_row"
                placeholder="e.g., Top, Middle, Bottom"
                value={formData.rack_row}
                onChange={(e) => setFormData({ ...formData, rack_row: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_url">Photo URL</Label>
            <Input
              id="photo_url"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              disabled={loading}
            />
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Item
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}