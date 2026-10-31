import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

// Import Screens
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AttendanceScreen } from '../screens/AttendanceScreen';
import { FeesScreen } from '../screens/FeesScreen';
import { AcademicScreen } from '../screens/AcademicScreen';
import { TransportScreen } from '../screens/TransportScreen';
import { LeaveScreen } from '../screens/LeaveScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen';
import { HomeworkScreen } from '../screens/HomeworkScreen';
import { TimetableScreen } from '../screens/TimetableScreen';
import { GatePassScreen } from '../screens/GatePassScreen';

import {
  HomeIcon,
  CalendarIcon,
  AcademicIcon,
  FeesIcon,
  TransportIcon,
  BellIcon,
  UserIcon,
  GatePassIcon,
  LeaveIcon,
  AwardIcon,
  AnnouncementIcon,
  HomeworkIcon,
  TimetableIcon,
  LogoutIcon,
  ChevronRightIcon,
  CheckIcon,
  CloseIcon,
  MenuIcon,
} from '../components/Icons';

export type TabName = 'Home' | 'Attendance' | 'Academic' | 'Fees' | 'Transport' | 'Leave' | 'Profile' | 'Announcements' | 'Homework' | 'Timetable' | 'GatePass';

export const RootNavigator = () => {
  const { user, selectedStudent, children: childList, setSelectedStudent, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Connecting to Parent Portal...</Text>
      </View>
    );
  }

  // Auth Guard: Only Parent / Super Admin accounts
  if (!user) {
    return <LoginScreen />;
  }

  const navigateTo = (tabName: TabName) => {
    setActiveTab(tabName);
    setMenuVisible(false);
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <DashboardScreen navigation={{ navigate: navigateTo }} />;
      case 'Attendance':
        return <AttendanceScreen navigation={{ navigate: navigateTo }} />;
      case 'Academic':
        return <AcademicScreen />;
      case 'Fees':
        return <FeesScreen />;
      case 'Transport':
        return <TransportScreen />;
      case 'Leave':
        return <LeaveScreen navigation={{ navigate: navigateTo, goBack: () => navigateTo('Home') }} />;
      case 'Profile':
        return <ProfileScreen />;
      case 'Announcements':
        return <AnnouncementsScreen />;
      case 'Homework':
        return <HomeworkScreen />;
      case 'Timetable':
        return <TimetableScreen />;
      case 'GatePass':
        return <GatePassScreen navigation={{ navigate: navigateTo, goBack: () => navigateTo('Home') }} />;
      default:
        return <DashboardScreen navigation={{ navigate: navigateTo }} />;
    }
  };

  // Bottom Navigation Bar with Modern Stroke Icons
  const primaryTabs: { name: TabName; icon: (color: string) => React.ReactNode; label: string }[] = [
    { name: 'Home', icon: (color) => <HomeIcon size={20} color={color} strokeWidth={2.2} />, label: 'Home' },
    { name: 'Attendance', icon: (color) => <CalendarIcon size={20} color={color} strokeWidth={2.2} />, label: 'Attendance' },
    { name: 'Academic', icon: (color) => <AcademicIcon size={20} color={color} strokeWidth={2.2} />, label: 'Academic' },
    { name: 'Fees', icon: (color) => <FeesIcon size={20} color={color} strokeWidth={2.2} />, label: 'Fees' },
    { name: 'Transport', icon: (color) => <TransportIcon size={20} color={color} strokeWidth={2.2} />, label: 'Transport' },
  ];


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Top Application Header */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.schoolLogoBadge}>
            <AcademicIcon size={20} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <View style={styles.schoolTitleContainer}>
            <Text style={styles.schoolTitle}>AATHITHIYA</Text>
            <Text style={styles.schoolSubtitle}>INTERNATIONAL PUBLIC SCHOOL</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Quick Notice Bell */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigateTo('Announcements')}
            activeOpacity={0.7}
          >
            <BellIcon size={18} color="#FFFFFF" strokeWidth={2.2} />
            <View style={styles.headerIconBadge} />
          </TouchableOpacity>

          {/* Modern Sleek Hamburger Menu Button on RIGHT */}
          <TouchableOpacity
            style={styles.menuButtonRight}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
          >
            <MenuIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Active Screen */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Modern Luxury Floating Island Navigation Bar */}
      <View style={styles.tabBarWrapper} pointerEvents="box-none">
        <View style={styles.tabBar}>
          {primaryTabs.map((tab) => {
            const isActive = activeTab === tab.name;
            const iconColor = isActive ? '#FFFFFF' : '#64748B';
            return (
              <TouchableOpacity
                key={tab.name}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => {
                  if (activeTab !== tab.name) {
                    setActiveTab(tab.name);
                  }
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                  {tab.icon(iconColor)}
                </View>
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
                {isActive && <View style={styles.activePillDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Slide-out Menu Drawer Modal */}
      {menuVisible ? (
        <Modal
          visible={menuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setMenuVisible(false)}
            />
            <View style={styles.drawerContainer}>
                {/* Drawer Header */}
                <View style={styles.drawerHeader}>
                  <View style={styles.drawerAvatar}>
                    <UserIcon size={24} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                  <View style={styles.drawerUserInfo}>
                    <Text style={styles.drawerUserName}>{user.name || 'Parent'}</Text>
                    <Text style={styles.drawerUserRole}>Parent Portal Account</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setMenuVisible(false)}
                  >
                    <CloseIcon size={16} color="#64748B" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
                  {/* Switch Active Child Section */}
                  <Text style={styles.drawerSectionTitle}>SELECT ACTIVE STUDENT</Text>
                  {childList.map((child) => {
                    const isSelected = selectedStudent?.id === child.id;
                    return (
                      <TouchableOpacity
                        key={child.id}
                        style={[styles.childOption, isSelected && styles.childOptionActive]}
                        onPress={() => {
                          setSelectedStudent(child);
                          setMenuVisible(false);
                        }}
                      >
                        <View style={styles.childOptionLeft}>
                          <View style={[styles.childAvatarBadge, isSelected && styles.childAvatarBadgeActive]}>
                            <Text style={[styles.childAvatarInitialSmall, isSelected && styles.childAvatarInitialSmallActive]}>
                              {child.name.charAt(0)}
                            </Text>
                          </View>
                          <View>
                            <Text style={[styles.childOptionName, isSelected && styles.childOptionNameActive]}>
                              {child.name}
                            </Text>
                            <Text style={styles.childOptionClass}>
                              {child.grade}-{child.section} • Roll: {child.rollNo}
                            </Text>
                          </View>
                        </View>
                        {isSelected && <CheckIcon size={18} color="#2563EB" strokeWidth={2.5} />}
                      </TouchableOpacity>
                    );
                  })}

                  {/* Remaining Application Features */}
                  <Text style={[styles.drawerSectionTitle, { marginTop: 24 }]}>MORE MODULES</Text>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('GatePass')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#F3E8FF' }]}>
                      <GatePassIcon size={20} color="#7C3AED" strokeWidth={2} />
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Digital Gate Pass & QR</Text>
                      <Text style={styles.drawerItemSubtitle}>Early exit authorization & QR code</Text>
                    </View>
                    <ChevronRightIcon size={18} color="#94A3B8" strokeWidth={2} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Leave')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#FDF2F8' }]}>
                      <LeaveIcon size={20} color="#DB2777" strokeWidth={2} />
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Apply Leave / History</Text>
                      <Text style={styles.drawerItemSubtitle}>Request leave with principal/class teacher</Text>
                    </View>
                    <ChevronRightIcon size={18} color="#94A3B8" strokeWidth={2} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Profile')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#EFF6FF' }]}>
                      <UserIcon size={20} color="#2563EB" strokeWidth={2} />
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Student & Parent Profile</Text>
                      <Text style={styles.drawerItemSubtitle}>Admission details, emergency contacts</Text>
                    </View>
                    <ChevronRightIcon size={18} color="#94A3B8" strokeWidth={2} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Academic')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#F3E8FF' }]}>
                      <AwardIcon size={20} color="#9333EA" strokeWidth={2} />
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Report Cards & Grades</Text>
                      <Text style={styles.drawerItemSubtitle}>Term assessments, marks and ranking</Text>
                    </View>
                    <ChevronRightIcon size={18} color="#94A3B8" strokeWidth={2} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Announcements')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#FCE7F3' }]}>
                      <AnnouncementIcon size={20} color="#E11D48" strokeWidth={2} />
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Announcements</Text>
                      <Text style={styles.drawerItemSubtitle}>Live school notices & updates</Text>
                    </View>
                    <ChevronRightIcon size={18} color="#94A3B8" strokeWidth={2} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Homework')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#E0E7FF' }]}>
                      <HomeworkIcon size={20} color="#4F46E5" strokeWidth={2} />
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Homework</Text>
                      <Text style={styles.drawerItemSubtitle}>Daily assignments</Text>
                    </View>
                    <ChevronRightIcon size={18} color="#94A3B8" strokeWidth={2} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Timetable')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#ECFCCB' }]}>
                      <TimetableIcon size={20} color="#65A30D" strokeWidth={2} />
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Timetable</Text>
                      <Text style={styles.drawerItemSubtitle}>Weekly class schedule</Text>
                    </View>
                    <ChevronRightIcon size={18} color="#94A3B8" strokeWidth={2} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Transport')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#FEF3C7' }]}>
                      <TransportIcon size={20} color="#D97706" strokeWidth={2} />
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Bus Transport Details</Text>
                      <Text style={styles.drawerItemSubtitle}>Vehicle number, driver contact & stops</Text>
                    </View>
                    <ChevronRightIcon size={18} color="#94A3B8" strokeWidth={2} />
                  </TouchableOpacity>

                  {/* School Contact Card */}
                  <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>School Contact & Helpdesk</Text>
                    <Text style={styles.contactText}>Phone: +91 98401 23456</Text>
                    <Text style={styles.contactText}>Email: office@aathithiyaschool.edu</Text>
                  </View>

                  {/* Logout Button */}
                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => {
                      setMenuVisible(false);
                      logout();
                    }}
                  >
                    <LogoutIcon size={18} color="#DC2626" strokeWidth={2.2} />
                    <Text style={[styles.logoutButtonText, { marginLeft: 8 }]}>Sign Out from Portal</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  schoolLogoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  schoolTitleContainer: {
    justifyContent: 'center',
  },
  schoolTitle: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: 1.0,
  },
  schoolSubtitle: {
    color: '#93C5FD',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 1.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  menuButtonRight: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerIconEmoji: {
    fontSize: 16,
  },
  headerIconBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
  },
  menuBar: {
    width: 18,
    height: 2.2,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginVertical: 1.8,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 100,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 7,
    paddingHorizontal: 8,
    width: '100%',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    elevation: 22,
    shadowColor: '#1E293B',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderRadius: 22,
    flex: 1,
  },
  tabItemActive: {
    backgroundColor: '#F0F7FF',
  },
  iconCircle: {
    width: 38,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 1,
  },
  iconCircleActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 0,
  },
  tabIcon: {
    fontSize: 16,
    opacity: 0.65,
  },
  tabIconActive: {
    fontSize: 17,
    opacity: 1.0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1.5,
    letterSpacing: 0.15,
  },
  tabLabelActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  activePillDot: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#2563EB',
    marginTop: 2.5,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  modalBackdrop: {
    flex: 1,
    height: '100%',
  },
  drawerContainer: {
    width: '84%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    elevation: 35,
    shadowColor: '#0F172A',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: -8, height: 0 },
    overflow: 'hidden',
    zIndex: 1000,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 40 : 48,
    paddingBottom: 22,
  },
  drawerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  drawerAvatarText: {
    fontSize: 22,
  },
  drawerUserInfo: {
    flex: 1,
  },
  drawerUserName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  drawerUserRole: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerContent: {
    flex: 1,
    padding: 16,
  },
  drawerSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  childOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  childOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childAvatarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  childAvatarBadgeActive: {
    backgroundColor: '#2563EB',
  },
  childAvatarInitialSmall: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  childAvatarInitialSmallActive: {
    color: '#FFFFFF',
  },
  childOptionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  childOptionNameActive: {
    color: '#1E40AF',
  },
  childOptionClass: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  checkMark: {
    fontSize: 18,
    color: '#2563EB',
    fontWeight: '900',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  drawerItemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drawerItemIcon: {
    fontSize: 20,
  },
  drawerItemTextContainer: {
    flex: 1,
  },
  drawerItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  drawerItemSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  drawerItemArrow: {
    fontSize: 20,
    color: '#CBD5E1',
    fontWeight: '700',
    marginLeft: 6,
  },
  contactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 36,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
});

