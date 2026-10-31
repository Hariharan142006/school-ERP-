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
import { TimetableIcon } from '../components/Icons';

export const TimetableScreen = () => {
  const { selectedStudent } = useAuth();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const fetchTimetable = async () => {
    if (!selectedStudent) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const classParam = selectedStudent.classId || `${selectedStudent.grade}-${selectedStudent.section}`;
      const response = await api.get(`/api/timetable?classId=${encodeURIComponent(classParam)}`);
      setTimetable(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      setTimetable([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedStudent]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimetable();
  };

  // Find timetable document for the selected day
  const currentDayDoc = timetable.find(
    (t: any) => (t.dayOfWeek || t.day)?.toLowerCase() === selectedDay.toLowerCase()
  );

  const periods = currentDayDoc?.periods || [];

  return (
    <View style={styles.container}>
      {/* Sleek Native Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Class Timetable</Text>
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>
              {selectedStudent ? `${selectedStudent.grade}-${selectedStudent.section}` : 'Schedule'}
            </Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>
          {selectedStudent ? `${selectedStudent.name} • Weekly Academic Schedule` : 'Daily Period Timetable'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Day Selector Tabs */}
        <View style={styles.daySelector}>
          {days.map((day) => {
            const isActive = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayTab, isActive && styles.dayTabActive]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>
                  {day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Loading class schedule from database...</Text>
          </View>
        ) : periods.length === 0 ? (
          <View style={styles.emptyCard}>
            <TimetableIcon size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Classes Scheduled</Text>
            <Text style={styles.emptySub}>No timetable periods recorded for {selectedDay}.</Text>
          </View>
        ) : (
          <View style={styles.timelineCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardDayTitle}>{selectedDay} Timetable</Text>
              <Text style={styles.cardPeriodsCount}>{periods.length} Periods Scheduled</Text>
            </View>

            {periods.map((p: any, idx: number) => {
              const subjectName = p.subject?.name || p.subject || 'General Study';
              const teacherName = p.teacher?.name || p.teacherName || 'Faculty Teacher';
              const periodNo = p.periodNumber || (idx + 1);

              return (
                <View key={p._id || idx} style={styles.periodRow}>
                  {/* Period Badge */}
                  <View style={styles.periodBadgeCol}>
                    <View style={styles.periodBadge}>
                      <Text style={styles.periodBadgeNum}>P{periodNo}</Text>
                    </View>
                    {idx < periods.length - 1 && <View style={styles.periodConnector} />}
                  </View>

                  {/* Timing Col */}
                  <View style={styles.timeCol}>
                    <Text style={styles.timeStart}>{p.startTime}</Text>
                    <Text style={styles.timeEnd}>{p.endTime}</Text>
                  </View>

                  {/* Subject and Teacher Details */}
                  <View style={styles.subjectBox}>
                    <Text style={styles.subjectName}>{subjectName}</Text>
                    <Text style={styles.teacherName}>Instructor: {teacherName}</Text>
                  </View>
                </View>
              );
            })}
          </View>
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
    backgroundColor: '#ECFCCB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9F99D',
  },
  classPillText: {
    color: '#4D7C0F',
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
  daySelector: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  dayTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  dayTabActive: {
    backgroundColor: '#2563EB',
    elevation: 2,
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dayTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  dayTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardDayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardPeriodsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  periodBadgeCol: {
    alignItems: 'center',
    marginRight: 10,
  },
  periodBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodBadgeNum: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  periodConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
    minHeight: 28,
  },
  timeCol: {
    width: 68,
    marginRight: 10,
    paddingTop: 4,
  },
  timeStart: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  timeEnd: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  subjectBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  teacherName: {
    fontSize: 11.5,
    color: '#64748B',
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
  },
});
