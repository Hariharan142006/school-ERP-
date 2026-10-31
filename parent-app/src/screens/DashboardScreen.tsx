import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth, StudentChild } from '../context/AuthContext';
import api from '../config/api';
import {
  CalendarIcon,
  FeesIcon,
  AwardIcon,
  TransportIcon,
  GatePassIcon,
  AcademicIcon,
  LeaveIcon,
  UserIcon,
} from '../components/Icons';

export const DashboardScreen = ({ navigation }: any) => {
  const { user, selectedStudent, children: childList, setSelectedStudent } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('month');
  const [notices, setNotices] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<{ rate: string; totalDays: number; presentDays: number }>({
    rate: '100%',
    totalDays: 0,
    presentDays: 0,
  });
  const [feeStats, setFeeStats] = useState<{ status: string; pendingAmount: number }>({
    status: 'All Clear',
    pendingAmount: 0,
  });
  const [academicStats, setAcademicStats] = useState<{ grade: string; examName: string }>({
    grade: 'A+',
    examName: 'Mid-Term Exam',
  });
  const [transportStats, setTransportStats] = useState<{ routeName: string; busNo: string }>({
    routeName: 'Route #14',
    busNo: 'Live GPS',
  });

  useEffect(() => {
    fetchDashboardData();
  }, [selectedStudent]);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const studentId = selectedStudent?.id || selectedStudent?._id;

      // 1. Fetch live notices from backend
      const noticePromise = api.get('/api/notices').catch(() => ({ data: [] }));

      // 2. Fetch live attendance for this student if id exists
      const attendancePromise = studentId
        ? api.get(`/api/attendance/student/${studentId}`).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] });

      // 3. Fetch live fees for this student
      const feePromise = studentId
        ? api.get(`/api/finance/fees?studentId=${studentId}`).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] });

      // 4. Fetch live exam results for this student
      const examPromise = studentId
        ? api.get(`/api/exams/student/${studentId}`).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] });

      // 5. Fetch live transport routes
      const transportPromise = api.get('/api/transport').catch(() => ({ data: [] }));

      const [noticeRes, attendanceRes, feeRes, examRes, transportRes] = await Promise.all([
        noticePromise,
        attendancePromise,
        feePromise,
        examPromise,
        transportPromise,
      ]);

      // Handle Notices
      if (noticeRes.data && Array.isArray(noticeRes.data) && noticeRes.data.length > 0) {
        setNotices(noticeRes.data.slice(0, 4));
      }

      // Handle Real Attendance Data
      if (attendanceRes.data && Array.isArray(attendanceRes.data) && attendanceRes.data.length > 0) {
        const records = attendanceRes.data;
        const presentCount = records.filter(
          (r: any) => String(r.status).toUpperCase() === 'PRESENT' || String(r.status).toUpperCase() === 'ON DUTY'
        ).length;
        const total = records.length;
        const calculatedRate = Math.round((presentCount / total) * 100);
        setAttendanceStats({
          rate: `${calculatedRate}%`,
          totalDays: total,
          presentDays: presentCount,
        });
      } else {
        setAttendanceStats({
          rate: '100%',
          totalDays: 0,
          presentDays: 0,
        });
      }

      // Handle Real Fee Data
      if (feeRes.data && Array.isArray(feeRes.data)) {
        const unpaid = feeRes.data.filter((f: any) => f.status !== 'Paid');
        const pendingTotal = unpaid.reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);
        setFeeStats({
          status: pendingTotal > 0 ? 'Pending' : 'All Clear',
          pendingAmount: pendingTotal,
        });
      }

      // Handle Real Academic Exam Data
      if (examRes.data && Array.isArray(examRes.data) && examRes.data.length > 0) {
        const firstExam = examRes.data[0];
        const examName = firstExam.examId?.name || 'Term Exam';
        const totalMarks = examRes.data.reduce((sum: number, e: any) => sum + (Number(e.marksObtained) || 0), 0);
        const maxMarks = examRes.data.reduce((sum: number, e: any) => sum + (Number(e.totalMarks) || 100), 0);
        const pct = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 85;
        let gradeLetter = 'A';
        if (pct >= 90) gradeLetter = 'O';
        else if (pct >= 80) gradeLetter = 'A+';
        else if (pct >= 70) gradeLetter = 'A';
        else if (pct >= 60) gradeLetter = 'B+';
        else gradeLetter = 'B';

        setAcademicStats({
          grade: gradeLetter,
          examName,
        });
      }

      // Handle Real Transport Data
      if (transportRes.data && Array.isArray(transportRes.data) && transportRes.data.length > 0) {
        const assignedRoute = transportRes.data.find((r: any) =>
          Array.isArray(r.students) && r.students.some((s: any) =>
            (typeof s === 'string' && s === studentId) || s?._id === studentId || s?.id === studentId
          )
        ) || transportRes.data[0];

        setTransportStats({
          routeName: assignedRoute.routeName || `Route #${assignedRoute.routeNumber || 14}`,
          busNo: assignedRoute.vehicleNumber ? assignedRoute.vehicleNumber.toUpperCase() : 'Bus Active',
        });
      }
    } catch (error) {
      console.log('Dashboard live data fetch error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const childName = selectedStudent?.name || user?.name || 'Student';
  const gradeText = selectedStudent
    ? `${selectedStudent.grade}-${selectedStudent.section}`
    : '10-A';
  const rollNo = selectedStudent?.rollNo || '1001';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchDashboardData} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Child Quick Switcher (when parent has multiple enrolled children) */}
        {childList && childList.length > 1 && (
          <View style={styles.switcherRow}>
            <Text style={styles.switcherLabel}>Active Child:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.switcherScroll}>
              {childList.map((child: StudentChild) => {
                const isSelected = selectedStudent?.id === child.id;
                return (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles.switcherChip, isSelected && styles.switcherChipActive]}
                    onPress={() => setSelectedStudent(child)}
                    activeOpacity={0.8}
                  >
                    <View style={{ marginRight: 6 }}>
                      <UserIcon size={14} color={isSelected ? '#1E40AF' : '#64748B'} strokeWidth={2.2} />
                    </View>
                    <Text style={[styles.switcherChipText, isSelected && styles.switcherChipTextActive]}>
                      {child.name} ({child.grade}-{child.section})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 
          =======================================================
          REFERENCE CARD DESIGN (Matching user uploaded layout)
          - Top row: Uppercase badge + Week/Month pill toggle
          - Middle row: Metric bullet line
          - Bottom row: Bold uppercase student name + Interlocking circles
          - Themed in our application's royal blue / indigo palette
          =======================================================
        */}
        <View style={styles.cardContainer}>
          {/* Subtle Background Geometric Watermark Circles */}
          <View style={styles.bgWatermarkLeft} />
          <View style={styles.bgWatermarkRight} />

          {/* Top Row: Category Label & Week/Month Segmented Pill */}
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.cardCategoryText}>STUDENT PROFILE • 2026-27</Text>
            </View>
            <View style={styles.pillToggleContainer}>
              <TouchableOpacity
                style={[styles.pillOption, timeframe === 'week' && styles.pillOptionActive]}
                onPress={() => setTimeframe('week')}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillOptionText, timeframe === 'week' && styles.pillOptionTextActive]}>
                  Week
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillOption, timeframe === 'month' && styles.pillOptionActive]}
                onPress={() => setTimeframe('month')}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillOptionText, timeframe === 'month' && styles.pillOptionTextActive]}>
                  Month
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Middle Row: Key Status Bullet Line */}
          <View style={styles.cardMiddleRow}>
            <Text style={styles.cardMetricsText}>
              {attendanceStats.rate} ATT  •  GRADE {gradeText}  •  ROLL {rollNo}
            </Text>
          </View>

          {/* Bottom Row: Large Bold Student Name & Interlocking Circles Watermark */}
          <View style={styles.cardBottomRow}>
            <Text style={styles.cardStudentName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {childName.toUpperCase()}
            </Text>

            {/* Overlapping Dual Circles Emblem (Reference Watermark) */}
            <View style={styles.circlesEmblem}>
              <View style={styles.emblemCircleOne} />
              <View style={styles.emblemCircleTwo} />
            </View>
          </View>
        </View>

        {/* Overview Analytics KPI Grid */}
        <Text style={styles.sectionTitle}>Performance & Status</Text>
        <View style={styles.kpiGrid}>
          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: '#EFF6FF' }]}
            onPress={() => navigation.navigate('Attendance')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiIconBox}>
              <CalendarIcon size={20} color="#2563EB" strokeWidth={2.2} />
            </View>
            <Text style={styles.kpiValue}>{attendanceStats.rate}</Text>
            <Text style={styles.kpiLabel}>Attendance Rate</Text>
            <Text style={styles.kpiSub}>
              {attendanceStats.presentDays} of {attendanceStats.totalDays} Days Present
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: '#ECFDF5' }]}
            onPress={() => navigation.navigate('Fees')}
            activeOpacity={0.8}
          >
            <View style={[styles.kpiIconBox, { backgroundColor: '#D1FAE5' }]}>
              <FeesIcon size={20} color={feeStats.pendingAmount > 0 ? '#DC2626' : '#059669'} strokeWidth={2.2} />
            </View>
            <Text style={[styles.kpiValue, { color: feeStats.pendingAmount > 0 ? '#DC2626' : '#059669' }]}>
              {feeStats.pendingAmount > 0 ? `₹${feeStats.pendingAmount}` : 'Paid'}
            </Text>
            <Text style={styles.kpiLabel}>Term Fee Status</Text>
            <Text style={styles.kpiSub}>
              {feeStats.pendingAmount > 0 ? 'Due soon' : 'Receipts Available'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: '#FAF5FF' }]}
            onPress={() => navigation.navigate('Academic')}
            activeOpacity={0.8}
          >
            <View style={[styles.kpiIconBox, { backgroundColor: '#F3E8FF' }]}>
              <AwardIcon size={20} color="#7C3AED" strokeWidth={2.2} />
            </View>
            <Text style={styles.kpiValue}>{academicStats.grade}</Text>
            <Text style={styles.kpiLabel}>Academic Grade</Text>
            <Text style={styles.kpiSub}>{academicStats.examName}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: '#FFFBEB' }]}
            onPress={() => navigation.navigate('Transport')}
            activeOpacity={0.8}
          >
            <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
              <TransportIcon size={20} color="#D97706" strokeWidth={2.2} />
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>{transportStats.routeName}</Text>
            <Text style={styles.kpiLabel}>Transport Bus</Text>
            <Text style={styles.kpiSub}>{transportStats.busNo}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access Modules */}
        <Text style={styles.sectionTitle}>Primary Portals</Text>
        <View style={styles.moduleGrid}>
          {[
            { label: 'Attendance', icon: <CalendarIcon size={22} color="#FFFFFF" strokeWidth={2.2} />, screen: 'Attendance', color: '#3B82F6' },
            { label: 'Gate Pass', icon: <GatePassIcon size={22} color="#FFFFFF" strokeWidth={2.2} />, screen: 'GatePass', color: '#7C3AED' },
            { label: 'Term Fees', icon: <FeesIcon size={22} color="#FFFFFF" strokeWidth={2.2} />, screen: 'Fees', color: '#10B981' },
            { label: 'Academic', icon: <AcademicIcon size={22} color="#FFFFFF" strokeWidth={2.2} />, screen: 'Academic', color: '#8B5CF6' },
            { label: 'Bus Tracking', icon: <TransportIcon size={22} color="#FFFFFF" strokeWidth={2.2} />, screen: 'Transport', color: '#F59E0B' },
            { label: 'Apply Leave', icon: <LeaveIcon size={22} color="#FFFFFF" strokeWidth={2.2} />, screen: 'Leave', color: '#EC4899' },
            { label: 'Profile Info', icon: <UserIcon size={22} color="#FFFFFF" strokeWidth={2.2} />, screen: 'Profile', color: '#06B6D4' },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.moduleCard}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconBox, { backgroundColor: item.color }]}>
                {item.icon}
              </View>
              <Text style={styles.moduleLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Latest School Circulars & Official Notices */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>School Circulars & Notices</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Cloud Synced</Text>
          </View>
        </View>

        <View style={styles.noticeBox}>
          {notices.length === 0 ? (
            <View style={styles.noticeItem}>
              <View style={styles.noticeHeader}>
                <Text style={styles.noticeTitle}>Term 2 Tuition & Transport Notice</Text>
                <Text style={styles.noticeDate}>Oct 30</Text>
              </View>
              <Text style={styles.noticeContent}>
                Dear Parents, please ensure all pending term 2 fees and school transport fees are settled before the due date.
              </Text>
            </View>
          ) : (
            notices.map((n, i) => {
              const p = (n.priority || 'Normal').toLowerCase();
              const badgeBg = p === 'emergency' ? '#FEE2E2' : p === 'urgent' ? '#FEF3C7' : p === 'important' ? '#EEF2FF' : '#F1F5F9';
              const badgeColor = p === 'emergency' ? '#DC2626' : p === 'urgent' ? '#B45309' : p === 'important' ? '#4338CA' : '#475569';
              const badgeLabel = p === 'emergency' ? 'EMERGENCY' : p === 'urgent' ? 'URGENT' : p === 'important' ? 'IMPORTANT' : 'NOTICE';
              const leftBorder = p === 'emergency' ? '#EF4444' : p === 'urgent' ? '#F59E0B' : p === 'important' ? '#4F46E5' : '#CBD5E1';

              return (
                <View key={i} style={[styles.noticeItem, { borderLeftColor: leftBorder, borderLeftWidth: 3, paddingLeft: 8 }]}>
                  <View style={styles.noticeHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <View style={{ backgroundColor: badgeBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: badgeColor, fontSize: 9, fontWeight: '800' }}>{badgeLabel}</Text>
                      </View>
                      <Text style={styles.noticeTitle} numberOfLines={1}>{n.title}</Text>
                    </View>
                    <Text style={styles.noticeDate}>
                      {new Date(n.date || n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={styles.noticeContent} numberOfLines={2}>{n.content}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 125, // Clearance for floating island navbar
  },
  switcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  switcherLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 8,
  },
  switcherScroll: {
    flexGrow: 0,
  },
  switcherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  switcherChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  switcherChipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  switcherChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  switcherChipTextActive: {
    color: '#1E40AF',
    fontWeight: '700',
  },

  /* 
   * =========================================
   * REFERENCE CARD STYLES
   * =========================================
   */
  cardContainer: {
    backgroundColor: '#1E40AF', // Deep Royal Blue
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 22,
    minHeight: 185,
    justifyContent: 'space-between',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#1E40AF',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  bgWatermarkLeft: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bgWatermarkRight: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  cardCategoryText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pillToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 20,
    padding: 3,
  },
  pillOption: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  pillOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  pillOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  pillOptionTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  cardMiddleRow: {
    marginVertical: 14,
    zIndex: 2,
  },
  cardMetricsText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  cardStudentName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.0,
    flex: 1,
    marginRight: 12,
  },
  circlesEmblem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emblemCircleOne: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  emblemCircleTwo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    marginLeft: -12,
  },

  /* 
   * =========================================
   * KPI & DASHBOARD BODY STYLES
   * =========================================
   */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  kpiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiIcon: {
    fontSize: 20,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moduleCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  moduleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  moduleIconText: {
    fontSize: 22,
  },
  moduleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  noticeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  noticeItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  noticeDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 8,
    fontWeight: '600',
  },
  noticeContent: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
