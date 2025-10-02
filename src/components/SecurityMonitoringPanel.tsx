import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';
import { 
  Shield, AlertTriangle, Clock, Ban, Activity, 
  CheckCircle, XCircle, Info, RefreshCw, Search,
  TrendingUp, Users, Globe, Lock
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  candidate_id?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  blockedAttempts: number;
  suspiciousIPs: number;
  recentActivity: SecurityEvent[];
}

export function SecurityMonitoringPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    loadSecurityData();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('security_monitoring')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_audit_logs'
      }, (payload) => {
        // Add new event to the list
        setEvents(prev => [payload.new as SecurityEvent, ...prev]);
        
        // Show alert for critical events
        if (payload.new.severity === 'critical') {
          toast({
            title: 'Critical Security Event',
            description: `${payload.new.event_type} detected`,
            variant: 'destructive',
          });
        }
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load recent security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (eventsError) throw eventsError;
      
      setEvents(eventsData || []);
      
      // Calculate statistics
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentEvents = eventsData?.filter(e => 
        new Date(e.timestamp) > dayAgo
      ) || [];
      
      const stats: SecurityStats = {
        totalEvents: recentEvents.length,
        criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
        highEvents: recentEvents.filter(e => e.severity === 'high').length,
        blockedAttempts: recentEvents.filter(e => 
          e.event_type.includes('blocked') || e.event_type.includes('lockout')
        ).length,
        suspiciousIPs: new Set(
          recentEvents
            .filter(e => e.severity === 'high' || e.severity === 'critical')
            .map(e => e.ip_address)
            .filter(Boolean)
        ).size,
        recentActivity: recentEvents.slice(0, 10)
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load security data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Security data has been updated',
    });
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };
  
  const getEventIcon = (eventType: string) => {
    if (eventType.includes('blocked')) return Ban;
    if (eventType.includes('failed')) return XCircle;
    if (eventType.includes('suspicious')) return AlertTriangle;
    if (eventType.includes('success') || eventType.includes('granted')) return CheckCircle;
    return Info;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Monitoring
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage security events for candidate update system
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          size="sm"
          variant="outline"
        >
          {refreshing ? (
            <LoadingSpinner className="h-4 w-4 mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Events (24h)
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Security events in last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Events
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.criticalEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Blocked Attempts
            </CardTitle>
            <Ban className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.blockedAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Access attempts blocked
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suspicious IPs
            </CardTitle>
            <Globe className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.suspiciousIPs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unique IPs with issues
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Monitor real-time security events and threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="critical">Critical Only</TabsTrigger>
              <TabsTrigger value="blocked">Blocked Access</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <EventsList events={events} />
            </TabsContent>
            
            <TabsContent value="critical">
              <EventsList 
                events={events.filter(e => 
                  e.severity === 'critical' || e.severity === 'high'
                )} 
              />
            </TabsContent>
            
            <TabsContent value="blocked">
              <EventsList 
                events={events.filter(e => 
                  e.event_type.includes('blocked') || 
                  e.event_type.includes('lockout')
                )} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function EventsList({ events }: { events: SecurityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No events found
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {events.map((event) => {
          const Icon = getEventIcon(event.event_type);
          return (
            <div
              key={event.id}
              className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={getSeverityColor(event.severity)}
                  >
                    {event.severity}
                  </Badge>
                  {event.resolved && (
                    <Badge variant="outline" className="text-green-600">
                      Resolved
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.timestamp), 'PPpp')}
                </p>
                {event.ip_address && (
                  <p className="text-xs">
                    IP: <code className="bg-muted px-1 rounded">{event.ip_address}</code>
                  </p>
                )}
                {event.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:underline">
                      View details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

function getEventIcon(eventType: string) {
  if (eventType.includes('blocked')) return Ban;
  if (eventType.includes('failed')) return XCircle;
  if (eventType.includes('suspicious')) return AlertTriangle;
  if (eventType.includes('success') || eventType.includes('granted')) return CheckCircle;
  return Info;
}