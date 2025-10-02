import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { analyticsService, AnalyticsSummary, RevenueTrend, ShiftCompletionRate, DailyAttendanceStats, TopPerformer } from '../../lib/analytics-service';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Award } from 'lucide-react-native';

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [shiftCompletion, setShiftCompletion] = useState<ShiftCompletionRate[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceStats[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const screenWidth = Dimensions.get('window').width;

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all analytics data in parallel
      const [summaryData, revenueData, completionData, attendanceData, performersData] = await Promise.all([
        analyticsService.getAnalyticsSummary(),
        analyticsService.getRevenueTrend(6),
        analyticsService.getShiftCompletionRate(6),
        analyticsService.getDailyAttendanceStats(30),
        analyticsService.getTopPerformers(5),
      ]);

      setSummary(summaryData);
      setRevenueTrend(revenueData);
      setShiftCompletion(completionData);
      setDailyAttendance(attendanceData);
      setTopPerformers(performersData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#3b82f6',
    },
  };

  // Format revenue chart data
  const revenueChartData = analyticsService.formatRevenueChartData(revenueTrend);

  // Format shift completion chart data
  const shiftChartData = analyticsService.formatShiftCompletionChartData(shiftCompletion);

  // Format daily attendance chart data
  const attendanceChartData = analyticsService.formatDailyAttendanceChartData(dailyAttendance.slice(0, 14)); // Last 14 days

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold mb-2">Analytics Dashboard</Text>
            <Text className="text-gray-600">Real-time insights and performance metrics</Text>
          </View>

          {/* Summary Cards */}
          {summary && (
            <View className="mb-6">
              <Text className="text-lg font-bold mb-3">Overview (Last 30 Days)</Text>

              <View className="flex-row flex-wrap gap-3">
                {/* Total Workers */}
                <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Users size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">{summary.total_workers}</Text>
                  <Text className="text-sm text-gray-600">Total Workers</Text>
                </View>

                {/* Total Projects */}
                <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Award size={24} color="#10b981" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">{summary.total_projects}</Text>
                  <Text className="text-sm text-gray-600">Total Projects</Text>
                </View>

                {/* Total Shifts */}
                <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Clock size={24} color="#f59e0b" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">{summary.total_shifts_completed}</Text>
                  <Text className="text-sm text-gray-600">Shifts Completed</Text>
                </View>

                {/* Total Hours */}
                <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Clock size={24} color="#8b5cf6" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {analyticsService.formatHours(summary.total_hours_worked)}
                  </Text>
                  <Text className="text-sm text-gray-600">Hours Worked</Text>
                </View>

                {/* Total Revenue */}
                <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <DollarSign size={24} color="#22c55e" />
                    <TrendingUp size={16} color="#22c55e" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {analyticsService.formatCurrency(summary.total_revenue)}
                  </Text>
                  <Text className="text-sm text-gray-600">Total Revenue</Text>
                </View>

                {/* Total Expenses */}
                <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <DollarSign size={24} color="#ef4444" />
                    <TrendingDown size={16} color="#ef4444" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {analyticsService.formatCurrency(summary.total_expenses)}
                  </Text>
                  <Text className="text-sm text-gray-600">Total Expenses</Text>
                </View>

                {/* Completion Rate */}
                <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Award size={24} color="#06b6d4" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {analyticsService.formatPercentage(summary.avg_shift_completion_rate)}
                  </Text>
                  <Text className="text-sm text-gray-600">Completion Rate</Text>
                </View>

                {/* Net Profit */}
                <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <DollarSign size={24} color="#8b5cf6" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {analyticsService.formatCurrency(summary.total_revenue - summary.total_expenses)}
                  </Text>
                  <Text className="text-sm text-gray-600">Net Profit</Text>
                </View>
              </View>
            </View>
          )}

          {/* Revenue Trend Chart */}
          {revenueChartData.labels.length > 0 && (
            <View className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <Text className="text-lg font-bold mb-3">Revenue vs Expenses (Last 6 Months)</Text>
              <LineChart
                data={{
                  labels: revenueChartData.labels,
                  datasets: revenueChartData.datasets,
                  legend: revenueChartData.legend,
                }}
                width={screenWidth - 48}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          )}

          {/* Shift Completion Rate Chart */}
          {shiftChartData.labels.length > 0 && (
            <View className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <Text className="text-lg font-bold mb-3">Shift Completion Rate (Last 6 Months)</Text>
              <BarChart
                data={{
                  labels: shiftChartData.labels,
                  datasets: shiftChartData.datasets,
                }}
                width={screenWidth - 48}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                showValuesOnTopOfBars
              />
            </View>
          )}

          {/* Daily Attendance Chart */}
          {attendanceChartData.labels.length > 0 && (
            <View className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <Text className="text-lg font-bold mb-3">Daily Attendance (Last 14 Days)</Text>
              <LineChart
                data={{
                  labels: attendanceChartData.labels,
                  datasets: attendanceChartData.datasets,
                  legend: attendanceChartData.legend,
                }}
                width={screenWidth - 48}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(20, 184, 166, ${opacity})`,
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          )}

          {/* Top Performers Leaderboard */}
          {topPerformers.length > 0 && (
            <View className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <Text className="text-lg font-bold mb-3">🏆 Top Performers</Text>

              {topPerformers.map((performer, index) => (
                <View
                  key={performer.candidate_id}
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                      <Text className="text-blue-600 font-bold">#{index + 1}</Text>
                    </View>

                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{performer.full_name}</Text>
                      <Text className="text-xs text-gray-600">
                        {performer.completed_shifts} shifts • {analyticsService.formatHours(performer.total_hours_worked)}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-lg font-bold text-blue-600">{performer.total_points}</Text>
                    <Text className="text-xs text-gray-600">points</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Spacer */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </View>
  );
}
