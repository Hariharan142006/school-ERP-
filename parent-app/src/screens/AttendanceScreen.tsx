import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { CalendarIcon, CheckIcon, CloseIcon } from '../components/Icons';

interface AttendanceRecord {
  id: string;
  rawDate: Date;
  date: string;
  day: string;
  status: 'Present' | 'Absent' | 'On Duty' | 'Half Day' | 'Holiday';
  session: string;
  remarks?: string;
}

export const AttendanceScreen = ({ navigation }: any) => {
  const { selectedStudent } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Present' | 'Absent' | 'OD'>('All');

  const fetchAttendance = async () => {
    const studentId = selectedStudent?.id || selectedStudent?._id;
    if (!studentId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await api.get(`/api/attendance/student/${studentId}`);
      if (res.data && Array.isArray(res.data)) {
        const mapped: AttendanceRecord[] = res.data.map((item: any, idx: number) => {
          const d = new Date(item.date);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const statusRaw = String(item.status || 'Present').toUpperCase();

          let statusVal: AttendanceRecord['status'] = 'Present';
          if (statusRaw === 'ABSENT') statusVal = 'Absent';
          else if (statusRaw === 'ON DUTY' || statusRaw === 'OD') statusVal = 'On Duty';
          else if (statusRaw === 'HALF DAY' || statusRaw === 'HALF-DAY') statusVal = 'Half Day';
          else if (statusRaw === 'HOLIDAY') statusVal = 'Holiday';

          return {
            id: item._id || String(idx + 1),
            rawDate: d,
            date: dateFormatted,
            day: dayName,
            status: statusVal,
            session: 'Full Day',
            remarks: item.remarks || (statusVal === 'On Duty' ? 'Official School Activity' : undefined),
          };
        });
        setRecords(mapped);
      }
    } catch (e) {
      console.error('Attendance fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedStudent]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
  };

  // Real Computed Statistics from Database Records
  const totalDays = records.length;
  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const odCount = records.filter(r => r.status === 'On Duty').length;
  const halfDayCount = records.filter(r => r.status === 'Half Day').length;

  const attendancePercentage = totalDays > 0
    ? (((presentCount + odCount + halfDayCount * 0.5) / totalDays) * 100).toFixed(1)
    : '100.0';

  const filteredRecords = records.filter(r => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Present') return r.status === 'Present';
    if (selectedFilter === 'Absent') return r.status === 'Absent';
    if (selectedFilter === 'OD') return r.status === 'On Duty' || r.status === 'Half Day';
    return true;
  });

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'Present':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', dot: '#10B981' };
      case 'Absent':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', dot: '#EF4444' };
      case 'On Duty':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', dot: '#3B82F6' };
      case 'Half Day':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', dot: '#F59E0B' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', dot: '#94A3B8' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Sleek Native Page Header - Seamlessly integrated, zero collision */}
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Attendance Record</Text>
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>
              {selectedStudent ? `${selectedStudent.grade}-${selectedStudent.section}` : 'Class'}
            </Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>
          {selectedStudent ? `${selectedStudent.name} • Roll: ${selectedStudent.rollNo}` : 'Real-time Attendance Records'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Dynamic Percentage & Metric Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.circleContainer}>
              <View style={styles.percentageCircle}>
                <Text style={styles.percentageNumber}>{attendancePercentage}%</Text>
                <Text style={styles.percentageLabel}>Overall Rate</Text>
              </View>
            </View>

            <View style={styles.heroSummaryCol}>
              <Text style={styles.summaryTitle}>Academic Term</Text>
              <Text style={styles.summaryDesc}>
                {totalDays > 0 ? `${totalDays} Recorded Working Days` : 'Synchronizing records...'}
              </Text>
              <View style={styles.statusIndicatorRow}>
                <View style={[styles.statusDot, { backgroundColor: Number(attendancePercentage) >= 85 ? '#10B981' : '#F59E0B' }]} />
                <Text style={styles.statusIndicatorText}>
                  {Number(attendancePercentage) >= 85 ? 'Eligible for Examinations' : 'Review Required'}
                </Text>
              </View>
            </View>
          </View>

          {/* Real Live Stats Counters */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { borderLeftColor: '#10B981' }]}>
              <Text style={[styles.statNumber, { color: '#059669' }]}>{presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>

            <View style={[styles.statBox, { borderLeftColor: '#EF4444' }]}>
              <Text style={[styles.statNumber, { color: '#DC2626' }]}>{absentCount}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>

            <View style={[styles.statBox, { borderLeftColor: '#3B82F6' }]}>
              <Text style={[styles.statNumber, { color: '#2563EB' }]}>{odCount}</Text>
              <Text style={styles.statLabel}>On Duty</Text>
            </View>

            <View style={[styles.statBox, { borderLeftColor: '#F59E0B' }]}>
              <Text style={[styles.statNumber, { color: '#D97706' }]}>{halfDayCount}</Text>
              <Text style={styles.statLabel}>Half Day</Text>
            </View>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['All', 'Present', 'Absent', 'OD'] as const).map(tab => {
            const active = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedFilter(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {tab === 'All' ? `All (${totalDays})` :
                   tab === 'Present' ? `Present (${presentCount})` :
                   tab === 'Absent' ? `Absent (${absentCount})` : `OD (${odCount})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Real Daily Attendance List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Daily Verification Log</Text>
          <Text style={styles.listHeaderSub}>Live Cloud Sync</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Fetching database attendance records...</Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <CalendarIcon size={38} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Attendance Records</Text>
            <Text style={styles.emptySub}>No attendance entries match this filter.</Text>
          </View>
        ) : (
          filteredRecords.map(item => {
            const badge = getStatusBadge(item.status);
            return (
              <View key={item.id} style={styles.logCard}>
                <View style={styles.logLeft}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateDay}>{item.day}</Text>
                    <Text style={styles.dateText}>{item.date.split(' ')[0]}</Text>
                  </View>
                  <View style={styles.logInfo}>
                    <Text style={styles.logFullDate}>{item.date}</Text>
                    <Text style={styles.logSession}>{item.session} Session</Text>
                    {item.remarks ? (
                      <Text style={styles.logRemarks}>Note: {item.remarks}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  <View style={[styles.badgeDot, { backgroundColor: badge.dot }]} />
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>{item.status}</Text>
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
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  circleContainer: {
    marginRight: 16,
  },
  percentageCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EFF6FF',
    borderWidth: 3,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  percentageLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  heroSummaryCol: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 3,
    borderLeftWidth: 3.5,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  listHeaderSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
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
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateDay: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  logInfo: {
    flex: 1,
  },
  logFullDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  logSession: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  logRemarks: {
    fontSize: 11,
    color: '#2563EB',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
