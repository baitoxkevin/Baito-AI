import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { paymentService, WorkerEarning, PaymentBatch, WorkerEarningSummary } from '../../lib/payment-service';
import { supabase } from '../../lib/supabase';
import { DollarSign, Users, Clock, CheckCircle, XCircle, Calendar, Download, Send } from 'lucide-react-native';

export default function AdminPayrollPage() {
  const [earnings, setEarnings] = useState<WorkerEarning[]>([]);
  const [batches, setBatches] = useState<PaymentBatch[]>([]);
  const [summary, setSummary] = useState<WorkerEarningSummary[]>([]);
  const [selectedEarnings, setSelectedEarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'e_wallet' | 'check'>('bank_transfer');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);

      const [earningsData, batchesData, summaryData] = await Promise.all([
        paymentService.getWorkerEarnings(undefined, 'pending'),
        paymentService.getPaymentBatches(),
        paymentService.getWorkerEarningsSummary(),
      ]);

      setEarnings(earningsData);
      setBatches(batchesData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleEarningSelection = (earningId: string) => {
    setSelectedEarnings(prev =>
      prev.includes(earningId)
        ? prev.filter(id => id !== earningId)
        : [...prev, earningId]
    );
  };

  const handleCreateBatch = async () => {
    if (selectedEarnings.length === 0) {
      Alert.alert('Error', 'Please select at least one earning to create a batch');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const batchId = await paymentService.createPaymentBatch(
        selectedEarnings,
        paymentMethod,
        scheduledDate,
        user.id,
        notes || undefined
      );

      Alert.alert('Success', 'Payment batch created successfully');
      setShowCreateBatchModal(false);
      setSelectedEarnings([]);
      setNotes('');
      fetchData();
    } catch (error) {
      console.error('Error creating batch:', error);
      Alert.alert('Error', 'Failed to create payment batch');
    }
  };

  const handleProcessBatch = async (batchId: string) => {
    Alert.alert(
      'Confirm Payment',
      'Are you sure you want to process this payment batch? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          style: 'default',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              await paymentService.processPaymentBatch(batchId, user.id);
              Alert.alert('Success', 'Payment batch processed successfully');
              fetchData();
            } catch (error) {
              console.error('Error processing batch:', error);
              Alert.alert('Error', 'Failed to process payment batch');
            }
          },
        },
      ]
    );
  };

  const totalPending = earnings.reduce((sum, e) => sum + Number(e.total_earnings), 0);
  const totalSelected = earnings
    .filter(e => selectedEarnings.includes(e.id))
    .reduce((sum, e) => sum + Number(e.total_earnings), 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
            <Text className="text-3xl font-bold mb-2">Payroll Management</Text>
            <Text className="text-gray-600">Manage worker payments and earnings</Text>
          </View>

          {/* Summary Cards */}
          <View className="mb-6">
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <DollarSign size={24} color="#3b82f6" />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {paymentService.formatCurrency(totalPending)}
                </Text>
                <Text className="text-sm text-gray-600">Pending Payments</Text>
              </View>

              <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Users size={24} color="#10b981" />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {earnings.length}
                </Text>
                <Text className="text-sm text-gray-600">Workers to Pay</Text>
              </View>

              <View className="flex-1 min-w-[160px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <CheckCircle size={24} color="#8b5cf6" />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {batches.filter(b => b.status === 'completed').length}
                </Text>
                <Text className="text-sm text-gray-600">Completed Batches</Text>
              </View>
            </View>
          </View>

          {/* Pending Payments */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold">Pending Payments</Text>
              {selectedEarnings.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowCreateBatchModal(true)}
                  className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
                >
                  <Send size={16} color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">
                    Create Batch ({selectedEarnings.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {earnings.length === 0 ? (
              <View className="bg-white rounded-xl p-8 items-center">
                <CheckCircle size={48} color="#10b981" />
                <Text className="text-gray-600 mt-2">All payments processed!</Text>
              </View>
            ) : (
              earnings.map((earning) => (
                <TouchableOpacity
                  key={earning.id}
                  onPress={() => toggleEarningSelection(earning.id)}
                  className={`bg-white rounded-xl p-4 mb-3 shadow-sm border ${
                    selectedEarnings.includes(earning.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100'
                  }`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">
                        Project #{earning.project_id.substring(0, 8)}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {formatDate(earning.created_at)}
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text className="text-lg font-bold text-blue-600">
                        {paymentService.formatCurrency(Number(earning.total_earnings))}
                      </Text>
                      {selectedEarnings.includes(earning.id) && (
                        <View className="bg-blue-600 rounded-full p-1 mt-1">
                          <CheckCircle size={12} color="#ffffff" />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Payment Batches */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-3">Payment Batches</Text>

            {batches.length === 0 ? (
              <View className="bg-white rounded-xl p-8 items-center">
                <DollarSign size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-2">No payment batches yet</Text>
              </View>
            ) : (
              batches.map((batch) => (
                <View
                  key={batch.id}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900">{batch.batch_number}</Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {batch.total_workers} workers • {paymentService.formatCurrency(Number(batch.total_amount))}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {paymentService.getPaymentMethodLabel(batch.payment_method)}
                      </Text>
                    </View>

                    <View className={`px-3 py-1 rounded-full ${paymentService.getPaymentStatusColor(batch.status)}`}>
                      <Text className="text-xs font-semibold capitalize">{batch.status}</Text>
                    </View>
                  </View>

                  {batch.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => handleProcessBatch(batch.id)}
                      className="bg-green-600 py-2 rounded-lg flex-row items-center justify-center mt-2"
                    >
                      <CheckCircle size={16} color="#ffffff" />
                      <Text className="text-white font-semibold ml-2">Process Payment</Text>
                    </TouchableOpacity>
                  )}

                  {batch.scheduled_date && (
                    <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                      <Calendar size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-600 ml-2">
                        Scheduled for {formatDate(batch.scheduled_date)}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Worker Earnings Summary */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-3">Worker Earnings Summary</Text>

            {summary.map((worker) => (
              <View
                key={worker.candidate_id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{worker.full_name}</Text>
                    <Text className="text-xs text-gray-500">{worker.email}</Text>
                  </View>

                  <Text className="text-lg font-bold text-blue-600">
                    {paymentService.formatCurrency(Number(worker.total_earnings))}
                  </Text>
                </View>

                <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
                  <Text className="text-xs text-gray-600">
                    {worker.total_projects_paid} projects
                  </Text>
                  <Text className="text-xs text-green-600">
                    Paid: {paymentService.formatCurrency(Number(worker.total_paid))}
                  </Text>
                  <Text className="text-xs text-yellow-600">
                    Pending: {paymentService.formatCurrency(Number(worker.total_pending))}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Spacer */}
          <View className="h-8" />
        </View>
      </ScrollView>

      {/* Create Batch Modal */}
      <Modal
        visible={showCreateBatchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateBatchModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl font-bold mb-4">Create Payment Batch</Text>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Selected Payments</Text>
              <Text className="text-2xl font-bold text-blue-600">
                {paymentService.formatCurrency(totalSelected)}
              </Text>
              <Text className="text-sm text-gray-600">{selectedEarnings.length} workers selected</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Payment Method</Text>
              <View className="flex-row flex-wrap gap-2">
                {(['bank_transfer', 'cash', 'e_wallet', 'check'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    className={`px-4 py-2 rounded-lg ${
                      paymentMethod === method
                        ? 'bg-blue-600'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text className={`text-sm font-semibold ${
                      paymentMethod === method
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}>
                      {paymentService.getPaymentMethodLabel(method)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Scheduled Date</Text>
              <TextInput
                value={scheduledDate}
                onChangeText={setScheduledDate}
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Add any notes..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowCreateBatchModal(false)}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateBatch}
                className="flex-1 bg-blue-600 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-white">Create Batch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
