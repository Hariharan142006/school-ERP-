import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../config/api';

type PriorityType = 'All' | 'Emergency' | 'Urgent' | 'Important' | 'Normal';

export const AnnouncementsScreen = () => {
  const { selectedStudent } = useAuth();
  const { socket } = useSocket();

  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<PriorityType>('All');

  const fetchNotices = async () => {
    try {
      const targetClass = selectedStudent?.grade ? `${selectedStudent.grade}-${selectedStudent.section}` : '';
      const response = await api.get(`/api/notices?targetAudience=Parents&classId=${targetClass}`);
      setNotices(response.data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedStudent]);

  useEffect(() => {
    if (!socket) return;

    const handleNoticeAdded = (newNotice: any) => {
      if (newNotice.targetAudience === 'Parents' || newNotice.targetAudience === 'All') {
        setNotices(prev => [newNotice, ...prev]);
      }
    };

    socket.on('notice_created', handleNoticeAdded);

    return () => {
      socket.off('notice_created', handleNoticeAdded);
    };
  }, [socket]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotices();
  };

  const getPriorityConfig = (priority: string = 'Normal') => {
    const p = (priority || 'Normal').toLowerCase();
    switch (p) {
      case 'emergency':
        return {
          label: '🚨 EMERGENCY',
          badgeBg: '#FEE2E2',
          badgeText: '#DC2626',
          borderLeft: '#EF4444',
          cardBg: '#FEF2F2',
          isEmergency: true
        };
      case 'urgent':
        return {
          label: '⚠️ URGENT',
          badgeBg: '#FEF3C7',
          badgeText: '#B45309',
          borderLeft: '#F59E0B',
          cardBg: '#FFFBEB',
          isEmergency: false
        };
      case 'important':
        return {
          label: '⭐ IMPORTANT',
          badgeBg: '#EEF2FF',
          badgeText: '#4338CA',
          borderLeft: '#4F46E5',
          cardBg: '#FFFFFF',
          isEmergency: false
        };
      default:
        return {
          label: '📢 NORMAL',
          badgeBg: '#F1F5F9',
          badgeText: '#475569',
          borderLeft: '#94A3B8',
          cardBg: '#FFFFFF',
          isEmergency: false
        };
    }
  };

  const filteredNotices = notices.filter(n => {
    if (selectedPriority === 'All') return true;
    return (n.priority || 'Normal').toLowerCase() === selectedPriority.toLowerCase();
  });

  const emergencyCount = notices.filter(n => (n.priority || '').toLowerCase() === 'emergency').length;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
        <Text style={styles.headerSubtitle}>Official school notices & emergency advisories</Text>
      </View>

      {/* Priority Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['All', 'Emergency', 'Urgent', 'Important', 'Normal'] as PriorityType[]).map(p => {
            const isSelected = selectedPriority === p;
            const chipStyle = [
              styles.filterChip,
              isSelected && (
                p === 'Emergency' ? styles.chipSelectedEmergency :
                p === 'Urgent' ? styles.chipSelectedUrgent :
                p === 'Important' ? styles.chipSelectedImportant :
                styles.chipSelected
              )
            ];
            const textStyle = isSelected ? styles.chipTextSelectedWhite : styles.filterChipText;

            return (
              <TouchableOpacity
                key={p}
                onPress={() => setSelectedPriority(p)}
                style={chipStyle}
                activeOpacity={0.7}
              >
                <Text style={textStyle}>
                  {p === 'All' ? 'All' : p === 'Emergency' ? '🚨 Emergency' : p === 'Urgent' ? '⚠️ Urgent' : p === 'Important' ? '⭐ Important' : '📢 Normal'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Emergency Notification Banner if active and not already on Emergency tab */}
      {emergencyCount > 0 && selectedPriority !== 'Emergency' && (
        <TouchableOpacity 
          style={styles.emergencyBanner} 
          onPress={() => setSelectedPriority('Emergency')}
          activeOpacity={0.8}
        >
          <Text style={styles.emergencyBannerIcon}>🚨</Text>
          <View style={styles.emergencyBannerContent}>
            <Text style={styles.emergencyBannerTitle}>EMERGENCY ADVISORY ACTIVE</Text>
            <Text style={styles.emergencyBannerSub}>
              {emergencyCount} critical notice{emergencyCount > 1 ? 's' : ''} published. Tap to view.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredNotices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyTitle}>No Announcements</Text>
            <Text style={styles.emptyText}>
              There are currently no {selectedPriority !== 'All' ? selectedPriority.toLowerCase() : ''} notices for you.
            </Text>
          </View>
        ) : (
          filteredNotices.map((notice, index) => {
            const config = getPriorityConfig(notice.priority);

            return (
              <View 
                key={notice._id || index} 
                style={[
                  styles.noticeCard, 
                  { 
                    backgroundColor: config.cardBg, 
                    borderLeftColor: config.borderLeft,
                    borderLeftWidth: 5 
                  }
                ]}
              >
                <View style={styles.noticeHeader}>
                  <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
                    <Text style={[styles.badgeText, { color: config.badgeText }]}>
                      {config.label}
                    </Text>
                  </View>
                  <Text style={styles.noticeDate}>
                    {new Date(notice.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>

                <Text style={[styles.noticeTitle, config.isEmergency && { color: '#991B1B' }]}>
                  {notice.title}
                </Text>
                
                <Text style={styles.noticeContent}>
                  {notice.content}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.postedByText}>
                    Posted by: {notice.postedBy?.name || 'School Administration'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipSelectedEmergency: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  chipSelectedUrgent: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  chipSelectedImportant: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextSelectedWhite: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emergencyBanner: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 6,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 3,
    shadowColor: '#DC2626',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  emergencyBannerIcon: {
    fontSize: 22,
  },
  emergencyBannerContent: {
    flex: 1,
  },
  emergencyBannerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  emergencyBannerSub: {
    color: '#FEE2E2',
    fontSize: 11,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 36,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noticeDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  noticeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  noticeContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
  cardFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  postedByText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
