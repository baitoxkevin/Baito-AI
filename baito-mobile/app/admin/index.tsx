import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Animated } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Users, Briefcase, Clock, DollarSign, TrendingUp, Award } from 'lucide-react-native';

interface DashboardStats {
  activeWorkers: number;
  todayShifts: number;
  totalHoursToday: number;
  totalPointsAwarded: number;
  pendingApprovals: number;
  activeProjects: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeWorkers: 0,
    todayShifts: 0,
    totalHoursToday: 0,
    totalPointsAwarded: 0,
    pendingApprovals: 0,
    activeProjects: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    setupRealtimeSubscription();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Active workers (checked in today)
      const { count: activeWorkersCount } = await supabase
        .from('attendance')
        .select('candidate_id', { count: 'exact', head: true })
        .eq('status', 'checked_in')
        .gte('check_in_time', `${today}T00:00:00`);

      // Today's shifts
      const { count: todayShiftsCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', `${today}T00:00:00`);

      // Total hours today
      const { data: hoursData } = await supabase
        .from('attendance')
        .select('total_hours')
        .gte('check_in_time', `${today}T00:00:00`)
        .not('total_hours', 'is', null);

      const totalHours = hoursData?.reduce((sum, record) => sum + (record.total_hours || 0), 0) || 0;

      // Total points awarded today
      const { data: pointsData } = await supabase
        .from('points_log')
        .select('points')
        .gte('created_at', `${today}T00:00:00`);

      const totalPoints = pointsData?.reduce((sum, record) => sum + record.points, 0) || 0;

      // Pending approvals
      const { count: pendingCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');

      // Active projects
      const { count: activeProjectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Published');

      setStats({
        activeWorkers: activeWorkersCount || 0,
        todayShifts: todayShiftsCount || 0,
        totalHoursToday: Math.round(totalHours * 10) / 10,
        totalPointsAwarded: totalPoints,
        pendingApprovals: pendingCount || 0,
        activeProjects: activeProjectsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin-stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance',
      }, () => {
        fetchStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'points_log',
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-4 pt-12 pb-6">
        <Text className="text-2xl font-bold text-white">Admin Dashboard</Text>
        <Text className="text-blue-100 mt-1">Real-time Overview</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-2">
          <StatCard
            icon={Users}
            iconColor="#10B981"
            iconBg="bg-green-100"
            label="Active Workers"
            value={stats.activeWorkers}
            suffix="online"
          />
          <StatCard
            icon={Briefcase}
            iconColor="#3B82F6"
            iconBg="bg-blue-100"
            label="Today's Shifts"
            value={stats.todayShifts}
            suffix="shifts"
          />
          <StatCard
            icon={Clock}
            iconColor="#F59E0B"
            iconBg="bg-amber-100"
            label="Total Hours"
            value={stats.totalHoursToday}
            suffix="hrs"
          />
          <StatCard
            icon={Award}
            iconColor="#8B5CF6"
            iconBg="bg-purple-100"
            label="Points Awarded"
            value={stats.totalPointsAwarded}
            suffix="pts"
          />
          <StatCard
            icon={TrendingUp}
            iconColor="#EF4444"
            iconBg="bg-red-100"
            label="Pending Approvals"
            value={stats.pendingApprovals}
            suffix="pending"
          />
          <StatCard
            icon={DollarSign}
            iconColor="#06B6D4"
            iconBg="bg-cyan-100"
            label="Active Projects"
            value={stats.activeProjects}
            suffix="active"
          />
        </View>

        {/* Recent Activity Section */}
        <View className="mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Quick Actions</Text>
          <View className="bg-white rounded-lg p-4 space-y-3">
            <Text className="text-sm text-gray-600">
              • View live attendance tracking
            </Text>
            <Text className="text-sm text-gray-600">
              • Manage active projects
            </Text>
            <Text className="text-sm text-gray-600">
              • Review worker performance
            </Text>
            <Text className="text-sm text-gray-600">
              • Approve pending claims
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: any;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number;
  suffix: string;
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, suffix }: StatCardProps) {
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value,
      tension: 20,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [value]);

  return (
    <View className="w-1/2 p-2">
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <View className={`${iconBg} w-10 h-10 rounded-lg items-center justify-center mb-3`}>
          <Icon size={20} color={iconColor} />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          {value.toLocaleString()}
        </Text>
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className="text-xs text-gray-400 mt-1">{suffix}</Text>
      </View>
    </View>
  );
}
