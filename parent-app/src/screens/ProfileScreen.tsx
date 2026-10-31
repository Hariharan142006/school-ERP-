import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AcademicIcon, CheckIcon, BellIcon, PhoneIcon, LogoutIcon, UserIcon } from '../components/Icons';

export const ProfileScreen = () => {
  const { user, selectedStudent, children, setSelectedStudent, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of Parent Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Sleek Native Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Parent & Student Profile</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>Verified Guardian</Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>
          Account details, registered wards & institutional credentials
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Parent Hero Identity Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'P'}</Text>
          </View>
          <View style={styles.heroDetails}>
            <Text style={styles.userName}>{user?.name || 'Parent Guardian'}</Text>
            <Text style={styles.userRole}>Aathithiya Parent Portal Account</Text>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}>
                <CheckIcon size={12} color="#059669" strokeWidth={3} />
                <Text style={styles.verifiedText}>Active Account</Text>
              </View>
              <Text style={styles.usernameTag}>@{user?.username || 'parent'}</Text>
            </View>
          </View>
        </View>

        {/* Child Selector Card (if multiple children) */}
        {children && children.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enrolled Wards / Children</Text>
            {children.map((child) => {
              const isSelected = selectedStudent?.id === child.id;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childOption, isSelected && styles.childOptionActive]}
                  onPress={() => setSelectedStudent(child)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.childIcon, isSelected && styles.childIconActive]}>
                    <AcademicIcon size={18} color={isSelected ? '#2563EB' : '#64748B'} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.childName, isSelected && styles.childNameActive]}>{child.name}</Text>
                    <Text style={styles.childMeta}>
                      Class {child.grade}-{child.section} • Roll #{child.rollNo}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.activeCheck}>
                      <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Selected Student Information */}
        {selectedStudent && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Active Student Record</Text>
              <View style={styles.cardHeaderBadge}>
                <Text style={styles.cardHeaderBadgeText}>
                  {selectedStudent.grade}-{selectedStudent.section}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{selectedStudent.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Admission Number</Text>
              <Text style={[styles.infoValue, { fontFamily: 'monospace', fontWeight: '800' }]}>
                {selectedStudent.admissionNo}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Roll Number</Text>
              <Text style={styles.infoValue}>{selectedStudent.rollNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{selectedStudent.gender || 'Not specified'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{selectedStudent.dob || 'Recorded'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Group</Text>
              <Text style={[styles.infoValue, { color: '#DC2626', fontWeight: '700' }]}>
                {selectedStudent.bloodGroup || 'O+'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transport Mode</Text>
              <Text style={styles.infoValue}>{selectedStudent.busRoute || 'Self / Walking'}</Text>
            </View>
            {selectedStudent.fatherName ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Father / Guardian</Text>
                <Text style={styles.infoValue}>{selectedStudent.fatherName}</Text>
              </View>
            ) : null}
            {selectedStudent.motherName ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mother Name</Text>
                <Text style={styles.infoValue}>{selectedStudent.motherName}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Contact & Guardian Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Guardian Contact Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registered Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'Registered in DB'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Primary SMS Enabled'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Residential Address</Text>
            <Text style={styles.infoValue}>
              {selectedStudent?.address || 'School Residential Records On File'}
            </Text>
          </View>
        </View>

        {/* App Settings & Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account & Notifications</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert('Push Notifications', 'Real-time alert notifications are active on this device.')}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BellIcon size={18} color="#2563EB" strokeWidth={2.2} />
              <Text style={[styles.settingText, { marginLeft: 12 }]}>Push Alerts & Notices</Text>
            </View>
            <Text style={styles.settingSub}>Active</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert('School Office Helpdesk', 'Direct line: +91 44 2626 0000\nEmail: contact@aathithiyaschool.edu.in')}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PhoneIcon size={18} color="#2563EB" strokeWidth={2.2} />
              <Text style={[styles.settingText, { marginLeft: 12 }]}>School Office Helpdesk</Text>
            </View>
            <Text style={styles.settingSub}>Call Desk</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <LogoutIcon size={18} color="#DC2626" strokeWidth={2.2} />
            <Text style={[styles.logoutBtnText, { marginLeft: 8 }]}>Sign Out from Parent Portal</Text>
          </View>
        </TouchableOpacity>
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
    paddingBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  rolePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rolePillText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 11.5,
  },
  pageSubtitle: {
    fontSize: 13,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  usernameTag: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  cardHeaderBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cardHeaderBadgeText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 11,
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  childOptionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  childIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  childIconActive: {
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
  },
  childName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  childNameActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  childMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '60%',
    textAlign: 'right',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  settingSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
