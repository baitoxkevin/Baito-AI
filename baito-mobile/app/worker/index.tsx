import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { GigCard } from '../../components/ui/GigCard';

interface Gig {
  id: string;
  title: string;
  company_name?: string;
  venue_address: string;
  crew_count: number;
  start_date: string;
  end_date?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  status: string;
  project_type?: string;
}

export default function WorkerHome() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGigs = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'Published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGigs(data || []);
    } catch (error: any) {
      console.error('Error fetching gigs:', error);
      Alert.alert('Error', 'Failed to load gigs. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGigs();

    // Set up real-time subscription for new gigs
    const channel = supabase
      .channel('gigs-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'projects',
        filter: 'status=eq.Published',
      }, (payload) => {
        setGigs(prev => [payload.new as Gig, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
      }, (payload) => {
        setGigs(prev => prev.map(gig =>
          gig.id === payload.new.id ? payload.new as Gig : gig
        ));
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleApply = async (gigId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'Please login to apply for gigs');
        return;
      }

      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('project_applications')
        .select('id')
        .eq('project_id', gigId)
        .eq('candidate_id', user.id)
        .single();

      if (existingApplication) {
        Alert.alert('Already Applied', 'You have already applied for this gig');
        return;
      }

      // Create application
      const { error } = await supabase
        .from('project_applications')
        .insert({
          project_id: gigId,
          candidate_id: user.id,
          status: 'pending',
        });

      if (error) throw error;

      Alert.alert('Success', 'Application submitted successfully!');
    } catch (error: any) {
      console.error('Error applying for gig:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGigs();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateRange = (gig: Gig) => {
    const start = formatDate(gig.start_date);
    if (gig.end_date) {
      const end = formatDate(gig.end_date);
      return `${start} - ${end}`;
    }
    return start;
  };

  const formatPayRate = (gig: Gig) => {
    // Assuming crew_count represents daily rate for now
    return `RM ${gig.crew_count}/day`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading gigs...</Text>
      </View>
    );
  }

  if (gigs.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Text className="text-2xl mb-2">📦</Text>
        <Text className="text-lg font-semibold text-gray-900 mb-2">No Gigs Available</Text>
        <Text className="text-sm text-gray-600 text-center">
          Check back later for new opportunities
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Available Gigs</Text>
        <Text className="text-sm text-gray-600 mt-1">
          {gigs.length} {gigs.length === 1 ? 'gig' : 'gigs'} available
        </Text>
      </View>

      {/* Gig List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {gigs.map((gig) => (
          <GigCard
            key={gig.id}
            id={gig.id}
            title={gig.title}
            company={gig.company_name}
            location={gig.venue_address}
            payRate={formatPayRate(gig)}
            date={formatDateRange(gig)}
            jobType={gig.project_type || 'Event Staff'}
            tags={gig.working_hours_start && gig.working_hours_end ? [
              `${gig.working_hours_start} - ${gig.working_hours_end}`,
              'Immediate Start',
            ] : []}
            onApply={handleApply}
          />
        ))}
      </ScrollView>
    </View>
  );
}
