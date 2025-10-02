import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { paymentService, WorkerEarning, PaymentHistory } from '../../lib/payment-service';
import { supabase } from '../../lib/supabase';
import { DollarSign, Clock, TrendingUp, Calendar, CreditCard } from 'lucide-react-native';

export default function WorkerEarningsPage() {
  const [earnings, setEarnings] = useState<WorkerEarning[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  // Summary stats
  const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.total_earnings), 0);
  const totalPaid = earnings.filter(e => e.payment_status === 'paid').reduce((sum, e) => sum + Number(e.total_earnings), 0);
  const totalPending = earnings.filter(e => e.payment_status === 'pending').reduce((sum, e) => sum + Number(e.total_earnings), 0);

  const fetchEarnings = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get candidate ID for current user
      const { data: candidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!candidate) return;

      setCandidateId(candidate.id);

      // Fetch earnings and payment history
      const [earningsData, historyData] = await Promise.all([
        paymentService.getWorkerEarnings(candidate.id),
        paymentService.getPaymentHistory(candidate.id),
      ]);

      setEarnings(earningsData);
      setPaymentHistory(historyData);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

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
            <Text className="text-3xl font-bold mb-2">My Earnings</Text>
            <Text className="text-gray-600">Track your income and payment history</Text>
          </View>

          {/* Summary Cards */}
          <View className="mb-6">
            <View className="flex-row flex-wrap gap-3">
              {/* Total Earnings */}
              <View className="flex-1 min-w-[160px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg">
                <View className="flex-row items-center justify-between mb-2">
                  <DollarSign size={24} color="#ffffff" />
                  <TrendingUp size={20} color="#ffffff" opacity={0.8} />
                </View>
                <Text className="text-2xl font-bold text-white">
                  {paymentService.formatCurrency(totalEarnings)}
                </Text>
                <Text className="text-sm text-white opacity-90">Total Earnings</Text>
              </View>

              {/* Total Paid */}
              <View className="flex-1 min-w-[160px] bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 shadow-lg">
                <View className="flex-row items-center justify-between mb-2">
                  <CreditCard size={24} color="#ffffff" />
                </View>
                <Text className="text-2xl font-bold text-white">
                  {paymentService.formatCurrency(totalPaid)}
                </Text>
                <Text className="text-sm text-white opacity-90">Paid</Text>
              </View>

              {/* Pending */}
              <View className="flex-1 min-w-[160px] bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 shadow-lg">
                <View className="flex-row items-center justify-between mb-2">
                  <Clock size={24} color="#ffffff" />
                </View>
                <Text className="text-2xl font-bold text-white">
                  {paymentService.formatCurrency(totalPending)}
                </Text>
                <Text className="text-sm text-white opacity-90">Pending</Text>
              </View>
            </View>
          </View>

          {/* Earnings by Project */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-3">Earnings by Project</Text>

            {earnings.length === 0 ? (
              <View className="bg-white rounded-xl p-8 items-center justify-center">
                <DollarSign size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-2">No earnings yet</Text>
                <Text className="text-gray-400 text-sm text-center mt-1">
                  Complete shifts to start earning
                </Text>
              </View>
            ) : (
              earnings.map((earning) => (
                <View
                  key={earning.id}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 mb-1">
                        Project #{earning.project_id.substring(0, 8)}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {formatDate(earning.created_at)}
                      </Text>
                    </View>

                    <View className={`px-3 py-1 rounded-full ${getStatusBadge(earning.payment_status)}`}>
                      <Text className="text-xs font-semibold capitalize">
                        {earning.payment_status}
                      </Text>
                    </View>
                  </View>

                  {/* Earnings Breakdown */}
                  <View className="space-y-2 bg-gray-50 rounded-lg p-3">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-gray-600">Base Salary</Text>
                      <Text className="text-sm font-medium text-gray-900">
                        {paymentService.formatCurrency(Number(earning.base_salary))}
                      </Text>
                    </View>

                    {Number(earning.overtime_pay) > 0 && (
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-600">
                          Overtime ({Number(earning.overtime_hours).toFixed(1)}h)
                        </Text>
                        <Text className="text-sm font-medium text-gray-900">
                          {paymentService.formatCurrency(Number(earning.overtime_pay))}
                        </Text>
                      </View>
                    )}

                    {Number(earning.bonus) > 0 && (
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-600">Bonus</Text>
                        <Text className="text-sm font-medium text-green-600">
                          +{paymentService.formatCurrency(Number(earning.bonus))}
                        </Text>
                      </View>
                    )}

                    {Number(earning.deductions) > 0 && (
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-600">Deductions</Text>
                        <Text className="text-sm font-medium text-red-600">
                          -{paymentService.formatCurrency(Number(earning.deductions))}
                        </Text>
                      </View>
                    )}

                    <View className="border-t border-gray-200 pt-2 mt-2">
                      <View className="flex-row justify-between">
                        <Text className="text-base font-bold text-gray-900">Total</Text>
                        <Text className="text-base font-bold text-blue-600">
                          {paymentService.formatCurrency(Number(earning.total_earnings))}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {earning.payment_date && (
                    <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                      <Calendar size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-600 ml-2">
                        Paid on {formatDate(earning.payment_date)}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold mb-3">Payment History</Text>

              {paymentHistory.map((payment) => (
                <View
                  key={payment.id}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">
                        {paymentService.formatCurrency(Number(payment.amount))}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {paymentService.getPaymentMethodLabel(payment.payment_method)}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {formatDate(payment.payment_date)}
                      </Text>
                    </View>

                    <View className={`px-3 py-1 rounded-full ${getStatusBadge(payment.payment_status)}`}>
                      <Text className="text-xs font-semibold capitalize">
                        {payment.payment_status}
                      </Text>
                    </View>
                  </View>

                  {payment.transaction_id && (
                    <View className="mt-3 pt-3 border-t border-gray-100">
                      <Text className="text-xs text-gray-500">
                        Transaction ID: {payment.transaction_id}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Info Card */}
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <Text className="text-sm font-semibold text-blue-900 mb-2">
              💡 Payment Information
            </Text>
            <Text className="text-sm text-blue-700">
              • Earnings are calculated after shift completion{'\n'}
              • Payments are processed in batches{'\n'}
              • Check your bank account 1-3 business days after payment{'\n'}
              • Contact admin for payment inquiries
            </Text>
          </View>

          {/* Spacer */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </View>
  );
}
