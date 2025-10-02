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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ArrowRightLeft,
  Loader2,
  Calendar as CalendarIcon,
  User,
  Calendar as EventIcon,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WarehouseItem {
  id: string;
  item_id: string;
  name: string;
  status?: string;
  current_user_name?: string | null;
  current_event?: string | null;
  current_purpose?: string | null;
  last_checkout_date?: string | null;
  rack_no?: string | null;
  rack_row?: string | null;
}

interface ItemCheckInOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WarehouseItem;
  onTransactionComplete: () => void;
}

export default function ItemCheckInOutDialog({
  open,
  onOpenChange,
  item,
  onTransactionComplete,
}: ItemCheckInOutDialogProps) {
  const isCheckingOut = item.status !== 'in_use';
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    event_name: '',
    purpose: '',
    notes: '',
    expected_return_date: undefined as Date | undefined,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCheckingOut && !formData.user_name) {
      toast({
        title: 'Error',
        description: 'User name is required for check out',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const transactionType = isCheckingOut ? 'check_out' : 'check_in';

      // Start a transaction
      const { error: transactionError } = await supabase
        .from('warehouse_item_transactions')
        .insert({
          item_id: item.id,
          transaction_type: transactionType,
          user_id: user?.id,
          user_name: isCheckingOut ? formData.user_name : (item.current_user_name || 'Unknown'),
          event_name: isCheckingOut ? formData.event_name : item.current_event,
          purpose: isCheckingOut ? formData.purpose : item.current_purpose,
          notes: formData.notes || null,
          expected_return_date: isCheckingOut && formData.expected_return_date 
            ? formData.expected_return_date.toISOString().split('T')[0]
            : null,
          actual_return_date: !isCheckingOut ? new Date().toISOString().split('T')[0] : null,
        });

      if (transactionError) throw transactionError;

      // Update item status
      const updateData = isCheckingOut ? {
        status: 'in_use',
        current_user_id: user?.id,
        current_user_name: formData.user_name,
        current_event: formData.event_name || null,
        current_purpose: formData.purpose || null,
        last_checkout_date: new Date().toISOString(),
      } : {
        status: 'available',
        current_user_id: null,
        current_user_name: null,
        current_event: null,
        current_purpose: null,
      };

      const { error: updateError } = await supabase
        .from('warehouse_items')
        .update(updateData)
        .eq('id', item.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: `Item ${isCheckingOut ? 'checked out' : 'checked in'} successfully`,
      });

      onTransactionComplete();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        user_name: '',
        event_name: '',
        purpose: '',
        notes: '',
        expected_return_date: undefined,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isCheckingOut ? 'check out' : 'check in'} item`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            {isCheckingOut ? 'Check Out Item' : 'Check In Item'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Item:</strong> {item.name} ({item.item_id})
              <br />
              <strong>Current Location:</strong> {item.rack_no ? `Rack ${item.rack_no}, Row ${item.rack_row}` : 'Not assigned'}
              {!isCheckingOut && item.current_user_name && (
                <>
                  <br />
                  <strong>Checked out by:</strong> {item.current_user_name}
                  {item.last_checkout_date && (
                    <> on {new Date(item.last_checkout_date).toLocaleDateString()}</>
                  )}
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isCheckingOut ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="user_name">
                  <User className="inline-block mr-2 h-4 w-4" />
                  User Name *
                </Label>
                <Input
                  id="user_name"
                  placeholder="Enter the name of person checking out"
                  value={formData.user_name}
                  onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_name">
                  <EventIcon className="inline-block mr-2 h-4 w-4" />
                  Event Name (Optional)
                </Label>
                <Input
                  id="event_name"
                  placeholder="e.g., Annual Conference 2024"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">
                  <FileText className="inline-block mr-2 h-4 w-4" />
                  Purpose (Optional)
                </Label>
                <Textarea
                  id="purpose"
                  placeholder="Why is this item being checked out?"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  <CalendarIcon className="inline-block mr-2 h-4 w-4" />
                  Expected Return Date (Optional)
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expected_return_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expected_return_date ? (
                        format(formData.expected_return_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expected_return_date}
                      onSelect={(date) => setFormData({ ...formData, expected_return_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Checking in item that was borrowed by: <strong>{item.current_user_name}</strong>
                </p>
                {item.current_event && (
                  <p className="text-sm text-muted-foreground">
                    Event: <strong>{item.current_event}</strong>
                  </p>
                )}
                {item.current_purpose && (
                  <p className="text-sm text-muted-foreground">
                    Purpose: <strong>{item.current_purpose}</strong>
                  </p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">
              <FileText className="inline-block mr-2 h-4 w-4" />
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder={isCheckingOut ? "Additional notes about the checkout..." : "Condition of item, any issues..."}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={loading}
              rows={3}
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
            <Button 
              type="submit" 
              disabled={loading}
              variant={isCheckingOut ? "default" : "secondary"}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCheckingOut ? 'Check Out' : 'Check In'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}