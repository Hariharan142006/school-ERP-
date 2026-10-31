import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../config/api';
import { CalendarIcon, CheckIcon, ChevronLeftIcon } from '../components/Icons';

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  appliedDate: string;
  remarks?: string;
}

export const LeaveScreen = ({ navigation }: { navigation?: any }) => {
  const { selectedStudent, user } = useAuth();
  const { socket } = useSocket();

  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pastLeaves, setPastLeaves] = useState<LeaveRequest[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const studentName = selectedStudent?.name || 'Karthik Murugan';
  const studentClass = `${selectedStudent?.grade || '10'}-${selectedStudent?.section || 'A'}`;

  // Helper to format date YYYY-MM-DD
  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Quick Date Preset Selectors
  const applyPreset = (preset: 'today' | 'tomorrow' | 'two_days' | 'three_days') => {
    const now = new Date();
    if (preset === 'today') {
      const todayStr = formatDateStr(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomStr = formatDateStr(tomorrow);
      setStartDate(tomStr);
      setEndDate(tomStr);
    } else if (preset === 'two_days') {
      const start = formatDateStr(now);
      const end = new Date(now);
      end.setDate(end.getDate() + 1);
      setStartDate(start);
      setEndDate(formatDateStr(end));
    } else if (preset === 'three_days') {
      const start = formatDateStr(now);
      const end = new Date(now);
      end.setDate(end.getDate() + 2);
      setStartDate(start);
      setEndDate(formatDateStr(end));
    }
  };

  const fetchLeaves = async () => {
    const studentId = selectedStudent?.id || selectedStudent?._id;
    if (!studentId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await api.get(`/api/leave?studentId=${studentId}`);
      if (res.data && Array.isArray(res.data)) {
        const mapped: LeaveRequest[] = res.data.map((l: any, idx: number) => {
          const s = l.startDate ? new Date(l.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date';
          const e = l.endDate ? new Date(l.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : s;
          const a = l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent';

          return {
            id: l._id || String(idx + 1),
            leaveType: l.reason?.toLowerCase().includes('sick') || l.reason?.toLowerCase().includes('fever') ? 'Medical Leave' : 'Casual Leave',
            startDate: s,
            endDate: e,
            reason: l.reason || 'Leave requested',
            status: l.status || 'Pending',
            appliedDate: a,
            remarks: l.reviewedBy ? 'Reviewed by Principal / Class Teacher' : 'Sent to Principal & Teacher (Pending Review)',
          };
        });
        setPastLeaves(mapped);
      } else {
        setPastLeaves([]);
      }
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [selectedStudent]);

  // Live WebSocket Listeners for real-time leave status updates from Principal/Teacher
  useEffect(() => {
    if (!socket) return;

    const handleLiveLeaveUpdate = () => {
      fetchLeaves();
    };

    socket.on('leave_applied', handleLiveLeaveUpdate);
    socket.on('leave_created', handleLiveLeaveUpdate);
    socket.on('leave_updated', handleLiveLeaveUpdate);
    socket.on('leave_status_changed', handleLiveLeaveUpdate);

    return () => {
      socket.off('leave_applied', handleLiveLeaveUpdate);
      socket.off('leave_created', handleLiveLeaveUpdate);
      socket.off('leave_updated', handleLiveLeaveUpdate);
      socket.off('leave_status_changed', handleLiveLeaveUpdate);
    };
  }, [socket]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaves();
  };

  const handleSubmitLeave = async () => {
    const studentId = selectedStudent?.id || selectedStudent?._id;
    if (!studentId) {
      Alert.alert('Error', 'Please select an active student first.');
      return;
    }

    if (!startDate.trim() || !endDate.trim() || !reason.trim()) {
      Alert.alert('Missing Required Information', 'Please provide Start Date, End Date, and Reason for absence.');
      return;
    }

    // Parse dates safely
    let parsedStart = new Date(startDate.trim());
    let parsedEnd = new Date(endDate.trim());

    if (isNaN(parsedStart.getTime())) {
      parsedStart = new Date();
    }
    if (isNaN(parsedEnd.getTime())) {
      parsedEnd = parsedStart;
    }

    // Ensure start date <= end date
    if (parsedStart.getTime() > parsedEnd.getTime()) {
      parsedEnd = parsedStart;
    }

    const leaveReasonText = `${leaveType}: ${reason.trim()}`;
    const formattedStartDate = parsedStart.toISOString();
    const formattedEndDate = parsedEnd.toISOString();

    // OPTIMISTIC LIVELY UPDATE: Immediately reflect in UI list before network roundtrip
    const optimisticLeave: LeaveRequest = {
      id: 'temp_' + Date.now(),
      leaveType,
      startDate: parsedStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      endDate: parsedEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      reason: leaveReasonText,
      status: 'Pending',
      appliedDate: 'Just now',
      remarks: 'Sent Lively to Principal & Class Teacher',
    };

    setPastLeaves((prev) => [optimisticLeave, ...prev]);

    try {
      setIsSubmitting(true);
      const res = await api.post('/api/leave', {
        student: studentId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        reason: leaveReasonText,
      });

      // Emit live WebSocket event to Principal & Teacher portal
      if (socket) {
        socket.emit('leave_applied', res.data);
      }

      setSubmitSuccess(true);
      setStartDate('');
      setEndDate('');
      setReason('');

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 4000);

      fetchLeaves();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit leave request. Please check date format.';
      Alert.alert('Submission Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'Approved':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'Pending':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'Rejected':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Sleek Native Page Header with Back Button */}
      <View style={styles.pageHeader}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.() || navigation?.navigate?.('Home')}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon size={18} color="#0F172A" strokeWidth={2.4} />
            <Text style={styles.backButtonText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>
              {studentClass}
            </Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>Apply Student Leave</Text>
            <Text style={styles.pageSubtitle}>
              {studentName} • Official Absence Approval
            </Text>
          </View>
        </View>

        {/* Live sync banner */}
        <View style={styles.liveSyncBar}>
          <View style={styles.livePulseDot} />
          <Text style={styles.liveSyncBarText}>
            Direct Live Connection to Principal & Class Teacher
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Success Confirmation Banner */}
        {submitSuccess && (
          <View style={styles.successBanner}>
            <View style={styles.successIconBadge}>
              <CheckIcon size={16} color="#047857" strokeWidth={3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.successBannerTitle}>Application Submitted Lively!</Text>
              <Text style={styles.successBannerText}>
                Recorded in database and transmitted to Principal & Class Teacher for instant approval.
              </Text>
            </View>
          </View>
        )}

        {/* Application Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Absence Request</Text>

          {/* Leave Type Selector */}
          <Text style={styles.inputLabel}>Absence Category</Text>
          <View style={styles.typeSelector}>
            {['Sick Leave', 'Casual Leave', 'Emergency'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, leaveType === type && styles.typeChipActive]}
                onPress={() => setLeaveType(type)}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeChipText, leaveType === type && styles.typeChipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Date Presets */}
          <Text style={styles.inputLabel}>Quick Dates</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('today')}>
              <Text style={styles.presetChipText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('tomorrow')}>
              <Text style={styles.presetChipText}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('two_days')}>
              <Text style={styles.presetChipText}>2-Day Leave</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('three_days')}>
              <Text style={styles.presetChipText}>3-Day Leave</Text>
            </TouchableOpacity>
          </View>

          {/* Dates Input */}
          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-11-10"
                placeholderTextColor="#94A3B8"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-11-12"
                placeholderTextColor="#94A3B8"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          {/* Reason Input */}
          <Text style={styles.inputLabel}>Detailed Reason for Absence</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Severe cold & fever, doctor prescribed 2 days bed rest"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={reason}
            onChangeText={setReason}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmitLeave}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit to Principal & Teacher Lively</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* History Header */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Leave Applications History</Text>
          <Text style={styles.historyCount}>{pastLeaves.length} Records</Text>
        </View>

        {/* Past Leaves List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Fetching live leave records...</Text>
          </View>
        ) : pastLeaves.length === 0 ? (
          <View style={styles.emptyCard}>
            <CalendarIcon size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Past Leave Applications</Text>
            <Text style={styles.emptySubtitle}>
              New absence applications submitted above will appear here in real time.
            </Text>
          </View>
        ) : (
          pastLeaves.map((leave) => {
            const badge = getStatusBadge(leave.status);
            return (
              <View key={leave.id} style={styles.leaveCard}>
                <View style={styles.leaveCardHeader}>
                  <View>
                    <Text style={styles.leaveType}>{leave.leaveType}</Text>
                    <Text style={styles.leaveDates}>
                      {leave.startDate} → {leave.endDate}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>
                      {leave.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.leaveReason}>{leave.reason}</Text>

                <View style={styles.leaveFooter}>
                  <Text style={styles.appliedDate}>Applied: {leave.appliedDate}</Text>
                  <Text style={styles.leaveRemarks}>{leave.remarks}</Text>
                </View>
              </View>
            );
          })
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
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 4,
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
  titleRow: {
    marginTop: 2,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  liveSyncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
    marginRight: 7,
  },
  liveSyncBarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 125, // Bottom navbar clearance
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: '#A7F3D0',
  },
  successIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  successBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  successBannerText: {
    fontSize: 11.5,
    color: '#047857',
    marginTop: 1,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  presetChip: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 17,
  },
  leaveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    elevation: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  leaveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leaveType: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  leaveDates: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  leaveReason: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginTop: 4,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  leaveFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  appliedDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  leaveRemarks: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
});
