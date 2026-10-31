import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../config/api';
import { HomeworkIcon } from '../components/Icons';

export const HomeworkScreen = () => {
  const { selectedStudent } = useAuth();
  const { socket } = useSocket();

  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeworks = async () => {
    if (!selectedStudent) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const classParam = selectedStudent.classId || `${selectedStudent.grade}-${selectedStudent.section}`;
      const response = await api.get(`/api/homework?classId=${encodeURIComponent(classParam)}`);
      setHomeworks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch homework:', error);
      setHomeworks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, [selectedStudent]);

  useEffect(() => {
    if (!socket || !selectedStudent) return;

    const handleHomeworkAdded = (hw: any) => {
      setHomeworks(prev => [hw, ...prev]);
    };

    socket.on('homework_created', handleHomeworkAdded);

    return () => {
      socket.off('homework_created', handleHomeworkAdded);
    };
  }, [socket, selectedStudent]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeworks();
  };

  return (
    <View style={styles.container}>
      {/* Sleek Native Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Homework & Tasks</Text>
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>
              {selectedStudent ? `${selectedStudent.grade}-${selectedStudent.section}` : 'Tasks'}
            </Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>
          {selectedStudent ? `${selectedStudent.name} • Active Daily Assignments` : 'Assignments'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching assignments from database...</Text>
          </View>
        ) : homeworks.length === 0 ? (
          <View style={styles.emptyCard}>
            <HomeworkIcon size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Pending Homework</Text>
            <Text style={styles.emptySub}>All assignments for this class are complete or none assigned today.</Text>
          </View>
        ) : (
          homeworks.map((hw, index) => {
            const subjectName = hw.subject?.name || hw.subject || 'General Academic';
            const teacherName = hw.assignedBy?.name || 'Class Faculty';
            const dueDateFormatted = hw.dueDate
              ? new Date(hw.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Upcoming';

            return (
              <View key={hw._id || index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectText}>{subjectName}</Text>
                  </View>
                  <View style={styles.dueBadge}>
                    <Text style={styles.dueDateText}>Due: {dueDateFormatted}</Text>
                  </View>
                </View>

                <Text style={styles.hwTitle}>{hw.title}</Text>
                <Text style={styles.hwDesc}>{hw.description}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.teacherName}>Assigned by {teacherName}</Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>Active Task</Text>
                  </View>
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
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  classPillText: {
    color: '#4F46E5',
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
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
  },
  dueBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dueDateText: {
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '700',
  },
  hwTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  hwDesc: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  teacherName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statusPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
