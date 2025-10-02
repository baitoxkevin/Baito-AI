import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, Clock, FileText, Briefcase } from 'lucide-react';
import {
  createExternalGig,
  getGigCategories,
  calculateWage,
  validateGigData
} from '@/lib/external-gigs-service';
import type { ExternalGigFormData, GigCategory, CalculationMethod } from '@/lib/external-gigs-types';

interface AddExternalGigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  onSuccess?: () => void;
}

export function AddExternalGigDialog({
  open,
  onOpenChange,
  candidateId,
  onSuccess
}: AddExternalGigDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<GigCategory[]>([]);

  const [formData, setFormData] = useState<ExternalGigFormData>({
    gig_name: '',
    client_name: '',
    category_id: '',
    gig_type: 'other',
    calculation_method: 'fixed',
    hours_worked: undefined,
    hourly_rate: undefined,
    fixed_amount: undefined,
    work_date: new Date().toISOString().split('T')[0],
    notes: '',
    requires_verification: false,
  });

  // Load categories on mount
  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      const data = await getGigCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const calculatedTotal = calculateWage({
    method: formData.calculation_method,
    hours: formData.hours_worked,
    rate: formData.hourly_rate,
    fixedAmount: formData.fixed_amount,
    total: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateGigData(formData);
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      await createExternalGig(candidateId, formData);

      toast({
        title: 'Success',
        description: 'External gig added successfully'
      });

      // Reset form
      setFormData({
        gig_name: '',
        client_name: '',
        category_id: '',
        gig_type: 'other',
        calculation_method: 'fixed',
        hours_worked: undefined,
        hourly_rate: undefined,
        fixed_amount: undefined,
        work_date: new Date().toISOString().split('T')[0],
        notes: '',
        requires_verification: false,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating external gig:', error);
      toast({
        title: 'Error',
        description: 'Failed to add external gig',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculationMethodChange = (method: CalculationMethod) => {
    setFormData(prev => ({
      ...prev,
      calculation_method: method,
      // Clear values when switching
      hours_worked: undefined,
      hourly_rate: undefined,
      fixed_amount: undefined,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Add External Gig
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="gig_name">Gig Name *</Label>
              <Input
                id="gig_name"
                value={formData.gig_name}
                onChange={(e) => setFormData({ ...formData, gig_name: e.target.value })}
                placeholder="e.g., Food Delivery, Freelance Design"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Client/Platform</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="e.g., GrabFood, Upwork"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Wage Calculation */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <Label className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Wage Calculation
            </Label>

            <div>
              <Label>Calculation Method</Label>
              <Select
                value={formData.calculation_method}
                onValueChange={(value) => handleCalculationMethodChange(value as CalculationMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.calculation_method === 'fixed' ? (
              <div>
                <Label htmlFor="fixed_amount">Fixed Amount (RM) *</Label>
                <Input
                  id="fixed_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fixed_amount || ''}
                  onChange={(e) => setFormData({ ...formData, fixed_amount: parseFloat(e.target.value) || undefined })}
                  placeholder="0.00"
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hours_worked">Hours Worked *</Label>
                  <Input
                    id="hours_worked"
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.hours_worked || ''}
                    onChange={(e) => setFormData({ ...formData, hours_worked: parseFloat(e.target.value) || undefined })}
                    placeholder="0.0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate (RM) *</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourly_rate || ''}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || undefined })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Earned:</span>
                <span className="text-2xl font-bold text-green-600">
                  RM {calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="work_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Work Date *
              </Label>
              <Input
                id="work_date"
                type="date"
                value={formData.work_date}
                onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional details about this gig..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Gig'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
