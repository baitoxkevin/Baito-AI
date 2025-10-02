import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Briefcase, Plus, Calendar, ExternalLink } from 'lucide-react';
import { AddExternalGigDialog } from '@/components/AddExternalGigDialog';
import { ExternalGigsList } from '@/components/ExternalGigsList';
import {
  getWorkerEarningsDashboard,
  getUnifiedEarnings,
  getExternalGigStats
} from '@/lib/external-gigs-service';
import type { WorkerEarningsDashboard, UnifiedEarning } from '@/lib/external-gigs-types';
import { format } from 'date-fns';

interface WorkerEarningsPageProps {
  candidateId: string;
}

export function WorkerEarningsPage({ candidateId }: WorkerEarningsPageProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<WorkerEarningsDashboard | null>(null);
  const [earnings, setEarnings] = useState<UnifiedEarning[]>([]);
  const [externalStats, setExternalStats] = useState<any>(null);
  const [addGigOpen, setAddGigOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, [candidateId, refreshKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardData, earningsData, statsData] = await Promise.all([
        getWorkerEarningsDashboard(candidateId),
        getUnifiedEarnings(candidateId),
        getExternalGigStats(candidateId)
      ]);

      setDashboard(dashboardData);
      setEarnings(earningsData);
      setExternalStats(statsData);
    } catch (error) {
      console.error('Error loading earnings data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load earnings data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGigSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Earnings</h1>
          <p className="text-gray-600 mt-1">Track all your income in one place</p>
        </div>
        <Button onClick={() => setAddGigOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add External Gig
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {dashboard.total_earnings.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {dashboard.total_gigs_count} total gigs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              Baito Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">RM {dashboard.baito_total.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {dashboard.baito_gigs_count} gigs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <ExternalLink className="w-4 h-4" />
              External Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">RM {dashboard.external_total.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {dashboard.external_gigs_count} gigs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">RM {dashboard.total_this_month.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">
              Baito: RM {dashboard.baito_this_month.toFixed(2)} | External: RM {dashboard.external_this_month.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* External Gig Stats */}
      {externalStats && externalStats.totalGigs > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              External Gig Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Gigs</div>
                <div className="text-xl font-bold">{externalStats.totalGigs}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">This Month</div>
                <div className="text-xl font-bold">
                  RM {externalStats.thisMonthEarned.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Per Gig</div>
                <div className="text-xl font-bold">
                  RM {externalStats.avgPerGig.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">This Month Gigs</div>
                <div className="text-xl font-bold">{externalStats.thisMonthGigs}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Earnings</TabsTrigger>
          <TabsTrigger value="baito">Baito Only</TabsTrigger>
          <TabsTrigger value="external">External Only</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {earnings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Earnings Yet</h3>
                <p className="text-gray-600">
                  Your earnings will appear here once you start working on gigs.
                </p>
              </CardContent>
            </Card>
          ) : (
            earnings.map((earning) => (
              <Card key={`${earning.source}-${earning.gig_id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{earning.gig_name}</h3>
                        <Badge variant={earning.source === 'baito' ? 'default' : 'secondary'}>
                          {earning.source === 'baito' ? '💼 Baito' : '🌐 External'}
                        </Badge>
                        {earning.verification_status === 'verified' && (
                          <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(earning.work_date), 'MMM dd, yyyy')}
                        </span>
                        {earning.client_name && (
                          <span>{earning.client_name}</span>
                        )}
                        {earning.hours_worked && (
                          <span>{earning.hours_worked}h @ RM {earning.hourly_rate}/hr</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        RM {earning.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{earning.gig_type}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="baito" className="space-y-4">
          {earnings.filter(e => e.source === 'baito').map((earning) => (
            <Card key={`${earning.source}-${earning.gig_id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{earning.gig_name}</h3>
                      <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(earning.work_date), 'MMM dd, yyyy')}
                      </span>
                      <span>Baito Platform</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      RM {earning.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="external" className="space-y-4">
          <ExternalGigsList candidateId={candidateId} onRefresh={refreshKey} />
        </TabsContent>
      </Tabs>

      {/* Add External Gig Dialog */}
      <AddExternalGigDialog
        open={addGigOpen}
        onOpenChange={setAddGigOpen}
        candidateId={candidateId}
        onSuccess={handleAddGigSuccess}
      />
    </div>
  );
}
