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
  TouchableWithoutFeedback,
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
        return <LeaveScreen />;
      case 'Profile':
        return <ProfileScreen />;
      case 'Announcements':
        return <AnnouncementsScreen />;
      case 'Homework':
        return <HomeworkScreen />;
      case 'Timetable':
        return <TimetableScreen />;
      case 'GatePass':
        return <GatePassScreen />;
      default:
        return <DashboardScreen navigation={{ navigate: navigateTo }} />;
    }
  };

  // Bottom Navigation Bar: strictly the requested core pages
  const primaryTabs: { name: TabName; icon: string; label: string }[] = [
    { name: 'Home', icon: '🏠', label: 'Home' },
    { name: 'Attendance', icon: '📅', label: 'Attendance' },
    { name: 'Academic', icon: '📖', label: 'Academic' },
    { name: 'Fees', icon: '💰', label: 'Fees' },
    { name: 'Transport', icon: '🚌', label: 'Transport' },
  ];

  const currentChildName = selectedStudent?.name || 'Karthik Murugan';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Top Application Header */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          {/* Professional Hamburger Menu Button on TOP-LEFT */}
          <TouchableOpacity
            style={styles.menuButtonLeft}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuBar} />
            <View style={[styles.menuBar, { width: 14 }]} />
            <View style={styles.menuBar} />
          </TouchableOpacity>

          <View style={styles.schoolTitleContainer}>
            <Text style={styles.schoolTitle}>AATHITHIYA</Text>
            <Text style={styles.schoolSubtitle}>INTERNATIONAL PUBLIC SCHOOL</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Active Child Selector Pill */}
          <TouchableOpacity
            style={styles.childPill}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.childAvatarDot}>
              <Text style={styles.childAvatarInitial}>{currentChildName.charAt(0)}</Text>
            </View>
            <Text style={styles.childPillText} numberOfLines={1}>
              {currentChildName.split(' ')[0]}
            </Text>
            <Text style={styles.childPillArrow}>▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Active Screen */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          {primaryTabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.name)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                  <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                    {tab.icon}
                  </Text>
                </View>
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Slide-out Menu Drawer Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.drawerContainer}>
                {/* Drawer Header */}
                <View style={styles.drawerHeader}>
                  <View style={styles.drawerAvatar}>
                    <Text style={styles.drawerAvatarText}>👨‍👩‍👦</Text>
                  </View>
                  <View style={styles.drawerUserInfo}>
                    <Text style={styles.drawerUserName}>{user.name || 'Parent'}</Text>
                    <Text style={styles.drawerUserRole}>Parent Portal Account</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setMenuVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
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
                          <Text style={styles.childOptionIcon}>👦</Text>
                          <View>
                            <Text style={[styles.childOptionName, isSelected && styles.childOptionNameActive]}>
                              {child.name}
                            </Text>
                            <Text style={styles.childOptionClass}>
                              {child.grade}-{child.section} • Roll: {child.rollNo}
                            </Text>
                          </View>
                        </View>
                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
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
                      <Text style={styles.drawerItemIcon}>🎫</Text>
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Digital Gate Pass & QR</Text>
                      <Text style={styles.drawerItemSubtitle}>Early exit authorization & QR code</Text>
                    </View>
                    <Text style={styles.drawerItemArrow}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Leave')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#FDF2F8' }]}>
                      <Text style={styles.drawerItemIcon}>📝</Text>
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Apply Leave / History</Text>
                      <Text style={styles.drawerItemSubtitle}>Request leave with principal/class teacher</Text>
                    </View>
                    <Text style={styles.drawerItemArrow}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Profile')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#EFF6FF' }]}>
                      <Text style={styles.drawerItemIcon}>👤</Text>
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Student & Parent Profile</Text>
                      <Text style={styles.drawerItemSubtitle}>Admission details, emergency contacts</Text>
                    </View>
                    <Text style={styles.drawerItemArrow}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Academic')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#F3E8FF' }]}>
                      <Text style={styles.drawerItemIcon}>🏆</Text>
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Report Cards & Grades</Text>
                      <Text style={styles.drawerItemSubtitle}>Term assessments, marks and ranking</Text>
                    </View>
                    <Text style={styles.drawerItemArrow}>›</Text>
                  </TouchableOpacity>


                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Announcements')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#FCE7F3' }]}>
                      <Text style={styles.drawerItemIcon}>📢</Text>
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Announcements</Text>
                      <Text style={styles.drawerItemSubtitle}>Live school notices & updates</Text>
                    </View>
                    <Text style={styles.drawerItemArrow}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Homework')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#E0E7FF' }]}>
                      <Text style={styles.drawerItemIcon}>📝</Text>
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Homework</Text>
                      <Text style={styles.drawerItemSubtitle}>Daily assignments</Text>
                    </View>
                    <Text style={styles.drawerItemArrow}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Timetable')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#ECFCCB' }]}>
                      <Text style={styles.drawerItemIcon}>📅</Text>
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Timetable</Text>
                      <Text style={styles.drawerItemSubtitle}>Weekly class schedule</Text>
                    </View>
                    <Text style={styles.drawerItemArrow}>›</Text>
                  </TouchableOpacity>


                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => navigateTo('Transport')}
                  >
                    <View style={[styles.drawerItemIconBox, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={styles.drawerItemIcon}>🚌</Text>
                    </View>
                    <View style={styles.drawerItemTextContainer}>
                      <Text style={styles.drawerItemTitle}>Bus Transport Details</Text>
                      <Text style={styles.drawerItemSubtitle}>Vehicle number, driver contact & stops</Text>
                    </View>
                    <Text style={styles.drawerItemArrow}>›</Text>
                  </TouchableOpacity>

                  {/* School Contact Card */}
                  <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>🏫 School Contact & Helpdesk</Text>
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
                    <Text style={styles.logoutButtonText}>Sign Out from Portal</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonLeft: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 9,
    marginRight: 10,
  },
  schoolTitleContainer: {
    justifyContent: 'center',
  },
  schoolTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  schoolSubtitle: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  childAvatarDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  childAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  childPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 90,
  },
  childPillArrow: {
    color: '#BFDBFE',
    fontSize: 12,
    marginLeft: 4,
  },
  menuBar: {
    width: 18,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginVertical: 2,
  },
  screenContainer: {
    flex: 1,
  },
  tabBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#EFF6FF',
  },
  tabIcon: {
    fontSize: 19,
    opacity: 0.55,
  },
  tabIconActive: {
    opacity: 1.0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  drawerContainer: {
    width: '85%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: -4, height: 0 },
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 20,
  },
  drawerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  childOptionIcon: {
    fontSize: 24,
    marginRight: 12,
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

