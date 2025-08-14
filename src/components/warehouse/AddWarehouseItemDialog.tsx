import { useState } from 'react';
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
import { Loader2, Package } from 'lucide-react';

interface AddWarehouseItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: (item: any) => void;
}

export default function AddWarehouseItemDialog({
  open,
  onOpenChange,
  onItemAdded,
}: AddWarehouseItemDialogProps) {
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

  const generateItemId = () => {
    const prefix = 'WH';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

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
      
      const itemId = formData.item_id || generateItemId();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('warehouse_items')
        .insert({
          item_id: itemId,
          name: formData.name,
          description: formData.description || null,
          details: formData.details || null,
          rack_no: formData.rack_no || null,
          rack_row: formData.rack_row || null,
          photo_url: formData.photo_url || null,
          created_by: user?.id,
          status: 'available',
        })
        .select()
        .single();

      if (error) throw error;

      onItemAdded(data);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        item_id: '',
        name: '',
        description: '',
        details: '',
        rack_no: '',
        rack_row: '',
        photo_url: '',
      });

      toast({
        title: 'Success',
        description: `Item ${itemId} has been added successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item',
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
            <Package className="h-5 w-5" />
            Add New Warehouse Item
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_id">Item ID (Optional)</Label>
              <Input
                id="item_id"
                placeholder="Auto-generate if empty"
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate
              </p>
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
            <Label htmlFor="photo_url">Photo URL (Optional)</Label>
            <Input
              id="photo_url"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              disabled={loading}
            />
          </div>

          <DialogFooter>
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
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}