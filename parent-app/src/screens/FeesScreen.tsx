import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { FeesIcon, CheckIcon } from '../components/Icons';

interface FeeItem {
  id: string;
  category: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'Paid' | 'Pending' | 'Partial';
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  remarks?: string;
}

export const FeesScreen = () => {
  const { selectedStudent } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'receipts'>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);

  const fetchFees = async () => {
    const studentId = selectedStudent?.id || selectedStudent?._id;
    if (!studentId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await api.get(`/api/finance/fees?studentId=${studentId}`);
      if (res.data && Array.isArray(res.data)) {
        const mapped: FeeItem[] = res.data.map((f: any, idx: number) => {
          const amount = Number(f.amount) || 0;
          const paidAmount = Number(f.paidAmount) || (f.status === 'Paid' ? amount : 0);
          const balanceAmount = f.balanceAmount !== undefined ? Number(f.balanceAmount) : (amount - paidAmount);

          return {
            id: f._id || String(idx + 1),
            category: f.feeName || 'Tuition Fee',
            dueDate: f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '30 Nov 2026',
            amount,
            paidAmount,
            balanceAmount,
            status: f.status === 'Paid' || balanceAmount <= 0 ? 'Paid' : 'Pending',
            paymentDate: f.paymentDate ? new Date(f.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
            paymentMethod: f.paymentMethod || 'Online Gateway',
            transactionId: f.transactionId || `TXN-${f._id?.slice(-6)?.toUpperCase() || 'SUCCESS'}`,
            remarks: f.remarks,
          };
        });
        setFeeItems(mapped);
      } else {
        setFeeItems([]);
      }
    } catch (e) {
      console.error('Fee fetch error:', e);
      setFeeItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [selectedStudent]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFees();
  };

  const totalAmount = feeItems.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = feeItems.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalPending = feeItems.reduce((acc, curr) => acc + (curr.status === 'Paid' ? 0 : curr.balanceAmount), 0);

  const handlePayNow = (item: FeeItem) => {
    const payAmount = item.balanceAmount > 0 ? item.balanceAmount : item.amount;
    Alert.alert(
      'Payment Gateway Confirmation',
      `Pay ₹${payAmount.toLocaleString('en-IN')} for ${item.category} using School UPI / Net Banking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Pay',
          onPress: async () => {
            try {
              setPayingId(item.id);
              await api.put(`/api/finance/fees/${item.id}/pay`, {
                amountPaid: payAmount,
                paymentMethod: 'UPI / NetBanking',
                transactionId: `TXN-${Date.now().toString().slice(-8)}`,
              });
              Alert.alert('Payment Successful', `Receipt generated for ₹${payAmount.toLocaleString('en-IN')}. Recorded in database.`);
              fetchFees();
            } catch (err: any) {
              const msg = err.response?.data?.message || 'Payment processing failed. Please try again.';
              Alert.alert('Payment Error', msg);
            } finally {
              setPayingId(null);
            }
          },
        },
      ]
    );
  };

  const pendingItems = feeItems.filter(f => f.status !== 'Paid');
  const paidItems = feeItems.filter(f => f.status === 'Paid');

  return (
    <View style={styles.container}>
      {/* Sleek Native Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Fee Management</Text>
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>
              {selectedStudent ? `${selectedStudent.grade}-${selectedStudent.section}` : 'Fee Portal'}
            </Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>
          {selectedStudent ? `${selectedStudent.name} • Admission #${selectedStudent.admissionNo}` : 'Live Fee Billing & Invoices'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Dynamic Financial Overview Hero Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Due Balance</Text>
          <Text style={styles.summaryPendingAmount}>₹{totalPending.toLocaleString('en-IN')}</Text>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summarySubLabel}>Total Annual Fee</Text>
              <Text style={styles.summarySubVal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summarySubLabel}>Total Paid</Text>
              <Text style={[styles.summarySubVal, { color: '#10B981' }]}>
                ₹{totalPaid.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
            onPress={() => setActiveTab('pending')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              Pending Invoices ({pendingItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'receipts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('receipts')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'receipts' && styles.tabTextActive]}>
              Payment History ({paidItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Fetching database financial records...</Text>
          </View>
        ) : activeTab === 'pending' ? (
          pendingItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <CheckIcon size={40} color="#10B981" />
              <Text style={styles.emptyTitle}>All Clear! No Dues Pending</Text>
              <Text style={styles.emptySub}>All student fees for this academic term have been fully settled.</Text>
            </View>
          ) : (
            pendingItems.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardCategory}>{item.category}</Text>
                    <Text style={styles.cardDueDate}>Due Date: {item.dueDate}</Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.amountLabel}>Due Amount</Text>
                    <Text style={styles.cardAmount}>₹{item.balanceAmount.toLocaleString('en-IN')}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.payButton, payingId === item.id && { opacity: 0.6 }]}
                    onPress={() => handlePayNow(item)}
                    activeOpacity={0.8}
                    disabled={payingId === item.id}
                  >
                    {payingId === item.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.payButtonText}>Pay Now</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          paidItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <FeesIcon size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Payment Receipts Yet</Text>
              <Text style={styles.emptySub}>Official receipts appear here immediately once payments are confirmed.</Text>
            </View>
          ) : (
            paidItems.map((item) => (
              <View key={item.id} style={styles.receiptCard}>
                <View style={styles.receiptTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptCategory}>{item.category}</Text>
                    <Text style={styles.receiptDate}>Paid Date: {item.paymentDate || item.dueDate}</Text>
                  </View>
                  <View style={styles.paidBadge}>
                    <CheckIcon size={12} color="#059669" />
                    <Text style={styles.paidBadgeText}>Settled</Text>
                  </View>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptMetaRow}>
                  <View>
                    <Text style={styles.receiptMetaLabel}>Transaction Reference</Text>
                    <Text style={styles.receiptMetaVal}>{item.transactionId}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.receiptMetaLabel}>Amount Paid</Text>
                    <Text style={styles.receiptAmount}>₹{item.paidAmount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  classPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  classPillText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 12,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 125, // Extra clearance for floating bottom bar
  },
  summaryCard: {
    backgroundColor: '#2563EB',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  summaryLabel: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryPendingAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summarySubLabel: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  summarySubVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardCategory: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardDueDate: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  amountLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  payButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  receiptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptCategory: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  receiptDate: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptMetaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  receiptMetaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 36,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});
