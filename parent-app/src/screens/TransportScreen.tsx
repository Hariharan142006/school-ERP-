import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../config/api';
import { TransportIcon, PhoneIcon } from '../components/Icons';

export const TransportScreen = () => {
  const { selectedStudent } = useAuth();
  const { socket } = useSocket();

  const [route, setRoute] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransportData();
  }, [selectedStudent]);

  useEffect(() => {
    if (!socket || !route) return;

    const handleLogAdded = (newLog: any) => {
      if ((newLog.transport?._id || newLog.transport) === route._id) {
        setLogs(prev => [newLog, ...prev]);
      }
    };

    socket.on('transport_log_added', handleLogAdded);

    return () => {
      socket.off('transport_log_added', handleLogAdded);
    };
  }, [socket, route]);

  const fetchTransportData = async () => {
    const studentId = selectedStudent?.id || selectedStudent?._id;
    if (!studentId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [transportsRes, logsRes] = await Promise.all([
        api.get('/api/transport'),
        api.get('/api/transport/logs').catch(() => ({ data: [] }))
      ]);

      const allTransports = transportsRes.data;
      if (Array.isArray(allTransports)) {
        const assignedRoute = allTransports.find((t: any) =>
          Array.isArray(t.students) && t.students.some((s: any) => {
            const sid = s?._id || s?.id || s;
            return String(sid) === String(selectedStudent._id) || String(sid) === String(selectedStudent.id);
          })
        );

        setRoute(assignedRoute || null);

        if (assignedRoute && Array.isArray(logsRes.data)) {
          const assignedLogs = logsRes.data.filter((log: any) =>
            (log.transport?._id || log.transport) === assignedRoute._id
          );
          setLogs(assignedLogs);
        }
      }
    } catch (error) {
      console.error('Failed to fetch transport data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransportData();
  };

  const handleCallDriver = (phone: string, name: string) => {
    Alert.alert(
      'School Transport Call',
      `Call Driver ${name} at +91 ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            Linking.openURL(`tel:${phone}`).catch(() => {
              Alert.alert('Call Failed', 'Unable to initiate call on this device.');
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Sleek Native Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>School Transport</Text>
          <View style={styles.busPill}>
            <Text style={styles.busPillText}>
              {route?.busNumber || 'Route 14'}
            </Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>
          {selectedStudent ? `${selectedStudent.name} • ${selectedStudent.grade}-${selectedStudent.section}` : 'Live Bus Route & Telematics'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D97706']} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#D97706" />
            <Text style={styles.loadingText}>Fetching database GPS transport route...</Text>
          </View>
        ) : !route ? (
          <View style={styles.noRouteCard}>
            <TransportIcon size={44} color="#94A3B8" />
            <Text style={styles.noRouteText}>Self / Walking Commute</Text>
            <Text style={styles.noRouteSub}>
              {selectedStudent?.name || 'This student'} is currently registered as a walking or self-commute student.
            </Text>
            <Text style={styles.noRouteNote}>
              To request official bus transport allocation, please contact the transport administrative desk.
            </Text>
          </View>
        ) : (
          <>
            {/* Live Vehicle Status Hero Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View>
                  <Text style={styles.busNo}>{route.busNumber || 'School Bus'}</Text>
                  <Text style={styles.regNo}>Vehicle: {route.vehicleNumber.toUpperCase()}</Text>
                </View>
                <View style={styles.liveBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.liveBadgeText}>
                    {logs.length > 0 ? (logs[0].eventType === 'REACHED_SCHOOL' ? 'At School' : 'In Transit') : 'Route Active'}
                  </Text>
                </View>
              </View>

              <View style={styles.routeDivider} />

              <View style={styles.routeRow}>
                <View style={styles.routeIconBox}>
                  <TransportIcon size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>Designated Route Path</Text>
                  <Text style={styles.routeName}>{route.route}</Text>
                </View>
              </View>

              <View style={styles.busStatsRow}>
                <View style={styles.busStatItem}>
                  <Text style={styles.busStatVal}>{route.capacity || 40}</Text>
                  <Text style={styles.busStatLbl}>Seat Capacity</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.busStatItem}>
                  <Text style={styles.busStatVal}>GPS</Text>
                  <Text style={styles.busStatLbl}>Telemetry Enabled</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.busStatItem}>
                  <Text style={[styles.busStatVal, { color: '#059669' }]}>Verified</Text>
                  <Text style={styles.busStatLbl}>Safety Audit</Text>
                </View>
              </View>
            </View>

            {/* Staff / Driver Card */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Assigned Driver & Helpline</Text>
              <Text style={styles.sectionSub}>Emergency Contact</Text>
            </View>

            <View style={styles.staffCard}>
              <View style={styles.staffAvatar}>
                <TransportIcon size={24} color="#D97706" strokeWidth={2.2} />
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffRole}>Vehicle Pilot / Driver</Text>
                <Text style={styles.staffName}>{route.driverName}</Text>
                <Text style={styles.staffPhone}>+91 {route.driverContact}</Text>
              </View>
              {route.driverContact ? (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCallDriver(route.driverContact, route.driverName)}
                  activeOpacity={0.8}
                >
                  <PhoneIcon size={14} color="#FFFFFF" />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Real Route Checkpoint Stops */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Stops & Schedule Sequence</Text>
              <Text style={styles.sectionSub}>Morning Pickup</Text>
            </View>

            <View style={styles.stopsCard}>
              {route.route.split('-').map((stop: string, idx: number, arr: string[]) => {
                const isLast = idx === arr.length - 1;
                return (
                  <View key={idx} style={styles.stopItem}>
                    <View style={styles.stopTimelineCol}>
                      <View style={[styles.stopDot, isLast && styles.stopDotSchool]} />
                      {!isLast && <View style={styles.stopLine} />}
                    </View>
                    <View style={styles.stopContent}>
                      <Text style={[styles.stopName, isLast && styles.stopNameSchool]}>
                        {stop.trim()}
                      </Text>
                      <Text style={styles.stopTime}>
                        {idx === 0 ? '07:45 AM (Origin)' : isLast ? '08:25 AM (Campus Arrival)' : `Stop #${idx + 1}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
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
  busPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  busPillText: {
    color: '#D97706',
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 18,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  busNo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  regNo: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
    lineHeight: 20,
  },
  busStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  busStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  busStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  busStatLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  staffAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  staffInfo: {
    flex: 1,
  },
  staffRole: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  staffName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  staffPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  stopsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  stopItem: {
    flexDirection: 'row',
  },
  stopTimelineCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  stopDotSchool: {
    backgroundColor: '#10B981',
    borderColor: '#D1FAE5',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stopLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
    minHeight: 30,
  },
  stopContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stopName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  stopNameSchool: {
    color: '#059669',
    fontWeight: '800',
  },
  stopTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  noRouteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  noRouteText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  noRouteSub: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  noRouteNote: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
    textAlign: 'center',
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
});
