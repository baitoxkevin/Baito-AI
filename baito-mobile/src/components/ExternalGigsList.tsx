import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, Clock, Trash2, Edit, ExternalLink } from 'lucide-react';
import { getExternalGigs, deleteExternalGig, getGigCategories } from '@/lib/external-gigs-service';
import type { ExternalGig, GigCategory } from '@/lib/external-gigs-types';
import { format } from 'date-fns';

interface ExternalGigsListProps {
  candidateId: string;
  onRefresh?: number; // Timestamp to trigger refresh
}

export function ExternalGigsList({ candidateId, onRefresh }: ExternalGigsListProps) {
  const { toast } = useToast();
  const [gigs, setGigs] = useState<ExternalGig[]>([]);
  const [categories, setCategories] = useState<Map<string, GigCategory>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [candidateId, onRefresh]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gigsData, categoriesData] = await Promise.all([
        getExternalGigs(candidateId),
        getGigCategories()
      ]);

      setGigs(gigsData);

      const catMap = new Map();
      categoriesData.forEach(cat => catMap.set(cat.id, cat));
      setCategories(catMap);
    } catch (error) {
      console.error('Error loading external gigs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load external gigs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gigId: string) => {
    if (!confirm('Are you sure you want to delete this gig?')) {
      return;
    }

    try {
      await deleteExternalGig(gigId);
      setGigs(gigs.filter(g => g.id !== gigId));
      toast({
        title: 'Success',
        description: 'External gig deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting gig:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete gig',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-blue-100 text-blue-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'self_reported':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (gigs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ExternalLink className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No External Gigs Yet</h3>
          <p className="text-gray-600 mb-4">
            Start tracking your external gig work to see all your earnings in one place.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {gigs.map((gig) => {
        const category = categories.get(gig.category_id || '');

        return (
          <Card key={gig.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {category?.icon && <span>{category.icon}</span>}
                    {gig.gig_name}
                  </CardTitle>
                  {gig.client_name && (
                    <p className="text-sm text-gray-600 mt-1">{gig.client_name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(gig.status)}>
                    {gig.status}
                  </Badge>
                  <Badge className={getVerificationColor(gig.verification_status)}>
                    {gig.verification_status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(gig.work_date), 'MMM dd, yyyy')}
                  </div>

                  {gig.calculation_method === 'hourly' && gig.hours_worked && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {gig.hours_worked}h @ RM {gig.hourly_rate}/hr
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      RM {gig.total_earned.toFixed(2)}
                    </div>
                    {gig.calculation_method === 'hourly' && (
                      <div className="text-xs text-gray-500">Hourly</div>
                    )}
                    {gig.calculation_method === 'fixed' && (
                      <div className="text-xs text-gray-500">Fixed</div>
                    )}
                  </div>
                </div>
              </div>

              {gig.notes && (
                <div className="p-2 bg-gray-50 rounded text-sm text-gray-700">
                  {gig.notes}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(gig.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
