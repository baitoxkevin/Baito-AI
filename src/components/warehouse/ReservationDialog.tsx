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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import {
  CalendarClock,
  Loader2,
  Calendar as CalendarIcon,
  User,
  FileText,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface WarehouseItem {
  id: string;
  item_id: string;
  name: string;
  status?: string;
  has_reservations?: boolean;
  reservation_count?: number;
  next_reservation_date?: string | null;
}

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WarehouseItem;
  onReservationCreated: () => void;
}

interface ExistingReservation {
  id: string;
  user_name: string;
  expected_pickup_date: string;
  expected_return_date: string;
  event_name: string | null;
  status: string;
}

export default function ReservationDialog({
  open,
  onOpenChange,
  item,
  onReservationCreated,
}: ReservationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<ExistingReservation[]>([]);
  const [formData, setFormData] = useState({
    user_name: '',
    event_name: '',
    purpose: '',
    notes: '',
    pickup_date: undefined as Date | undefined,
    return_date: undefined as Date | undefined,
    pickup_time: '09:00',
    return_time: '17:00',
    priority: 'normal',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (formData.pickup_date && formData.return_date) {
      checkForConflicts();
    }
  }, [formData.pickup_date, formData.return_date]);

  const checkForConflicts = async () => {
    if (!formData.pickup_date || !formData.return_date) return;

    try {
      setCheckingConflicts(true);
      
      const pickupDateTime = new Date(formData.pickup_date);
      pickupDateTime.setHours(parseInt(formData.pickup_time.split(':')[0]), parseInt(formData.pickup_time.split(':')[1]));
      
      const returnDateTime = new Date(formData.return_date);
      returnDateTime.setHours(parseInt(formData.return_time.split(':')[0]), parseInt(formData.return_time.split(':')[1]));

      // Check for existing reservations
      const { data: reservations, error } = await supabase
        .from('warehouse_reservations')
        .select('*')
        .eq('item_id', item.id)
        .in('status', ['pending', 'confirmed'])
        .or(`expected_pickup_date.lte.${returnDateTime.toISOString()},expected_return_date.gte.${pickupDateTime.toISOString()}`);

      if (error) throw error;

      // Also check if item is currently checked out
      const { data: itemData } = await supabase
        .from('warehouse_items')
        .select('status, current_user_name, last_checkout_date')
        .eq('id', item.id)
        .single();

      if (itemData?.status === 'in_use') {
        toast({
          title: 'Warning',
          description: `Item is currently checked out by ${itemData.current_user_name}`,
          variant: 'destructive',
        });
      }

      setConflicts(reservations || []);
    } catch (error: any) {
      console.error('Error checking conflicts:', error);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_name || !formData.pickup_date || !formData.return_date) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.return_date < formData.pickup_date) {
      toast({
        title: 'Error',
        description: 'Return date must be after pickup date',
        variant: 'destructive',
      });
      return;
    }

    if (conflicts.length > 0 && formData.priority !== 'urgent') {
      toast({
        title: 'Conflicts Detected',
        description: 'There are existing reservations for these dates. Set priority to "Urgent" to override or choose different dates.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const pickupDateTime = new Date(formData.pickup_date);
      pickupDateTime.setHours(parseInt(formData.pickup_time.split(':')[0]), parseInt(formData.pickup_time.split(':')[1]));
      
      const returnDateTime = new Date(formData.return_date);
      returnDateTime.setHours(parseInt(formData.return_time.split(':')[0]), parseInt(formData.return_time.split(':')[1]));

      const { data, error } = await supabase
        .from('warehouse_reservations')
        .insert({
          item_id: item.id,
          user_id: user?.id,
          user_name: formData.user_name,
          event_name: formData.event_name || null,
          purpose: formData.purpose || null,
          reservation_date: formData.pickup_date.toISOString().split('T')[0],
          reservation_start_time: formData.pickup_time,
          reservation_end_time: formData.return_time,
          expected_pickup_date: pickupDateTime.toISOString(),
          expected_return_date: returnDateTime.toISOString(),
          notes: formData.notes || null,
          priority: formData.priority,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Reservation created for ${item.name}`,
      });

      onReservationCreated();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        user_name: '',
        event_name: '',
        purpose: '',
        notes: '',
        pickup_date: undefined,
        return_date: undefined,
        pickup_time: '09:00',
        return_time: '17:00',
        priority: 'normal',
      });
      setConflicts([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create reservation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Pre-order / Reserve Item
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Item:</strong> {item.name} ({item.item_id})
              {item.has_reservations && (
                <>
                  <br />
                  <strong>Active Reservations:</strong> {item.reservation_count}
                  {item.next_reservation_date && (
                    <> - Next: {new Date(item.next_reservation_date).toLocaleDateString()}</>
                  )}
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_name">
              <User className="inline-block mr-2 h-4 w-4" />
              Reserved For *
            </Label>
            <Input
              id="user_name"
              placeholder="Name of person reserving the item"
              value={formData.user_name}
              onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                <CalendarIcon className="inline-block mr-2 h-4 w-4" />
                Pickup Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.pickup_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.pickup_date ? (
                      format(formData.pickup_date, "PPP")
                    ) : (
                      <span>Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.pickup_date}
                    onSelect={(date) => setFormData({ ...formData, pickup_date: date })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup_time">
                <Clock className="inline-block mr-2 h-4 w-4" />
                Pickup Time
              </Label>
              <Input
                id="pickup_time"
                type="time"
                value={formData.pickup_time}
                onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                <CalendarIcon className="inline-block mr-2 h-4 w-4" />
                Return Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.return_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.return_date ? (
                      format(formData.return_date, "PPP")
                    ) : (
                      <span>Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.return_date}
                    onSelect={(date) => setFormData({ ...formData, return_date: date })}
                    disabled={(date) => date < (formData.pickup_date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="return_time">
                <Clock className="inline-block mr-2 h-4 w-4" />
                Return Time
              </Label>
              <Input
                id="return_time"
                type="time"
                value={formData.return_time}
                onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_name">Event Name (Optional)</Label>
            <Input
              id="event_name"
              placeholder="e.g., Annual Conference 2024"
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose (Optional)</Label>
            <Textarea
              id="purpose"
              placeholder="Why is this item being reserved?"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              disabled={loading}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent (Override conflicts)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the reservation..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={loading}
              rows={2}
            />
          </div>

          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Conflicts found:</strong>
                {conflicts.map((conflict, idx) => (
                  <div key={conflict.id} className="mt-1">
                    {idx + 1}. {conflict.user_name} - {new Date(conflict.expected_pickup_date).toLocaleDateString()} to {new Date(conflict.expected_return_date).toLocaleDateString()}
                    {conflict.event_name && ` (${conflict.event_name})`}
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

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
              disabled={loading || checkingConflicts}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Reservation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}