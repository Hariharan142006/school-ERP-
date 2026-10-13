"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { 
  LayoutDashboard, Users, BookOpen, UserCheck, 
  Wallet, FileText, CalendarCheck, Bus, Library, 
  Home, MessageSquare, Settings, CheckSquare,
  Award, Briefcase, GraduationCap, LogOut, History, Package, Ticket, Scan
} from 'lucide-react';

// ... (keep the same menu arrays)
interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const adminMenu: SidebarItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'School Management', href: '/admin/school', icon: Home },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Academic', href: '/admin/academic', icon: BookOpen },
  { name: 'Academic Calendar', href: '/admin/academic/calendar', icon: CalendarCheck },
  { name: 'Timetable Hub', href: '/admin/academic/timetable', icon: CalendarCheck },
  { name: 'Homework', href: '/admin/homework', icon: BookOpen },
  { name: 'Student', href: '/admin/students', icon: GraduationCap },
  { name: 'Parent Management', href: '/admin/parents', icon: Users },
  { name: 'Staff', href: '/admin/staff', icon: Briefcase },
  { name: 'Fee Notice', href: '/admin/fee-notice', icon: FileText },
  { name: 'Finance', href: '/admin/finance', icon: Wallet },
  { name: 'Examination', href: '/admin/exam', icon: FileText },
  { name: 'Attendance', href: '/admin/attendance', icon: UserCheck },
  { name: 'Announcements', href: '/admin/communication', icon: MessageSquare },
  { name: 'Circular', href: '/admin/circular', icon: FileText },
  { name: 'Gate Pass', href: '/admin/gate-pass', icon: Ticket },
  { name: 'Gate Scanner', href: '/admin/gate-scanner', icon: Scan },
  { name: 'Visitor Module', href: '/admin/visitor', icon: Users },
  { name: 'Transport', href: '/admin/transport', icon: Bus },
  { name: 'Hostel', href: '/admin/hostel', icon: Home },
  { name: 'Stock Management', href: '/admin/stock', icon: Package },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Recovery / Trash', href: '/admin/recovery', icon: History },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const studentMenu: SidebarItem[] = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'My Profile', href: '/student/profile', icon: UserCheck },
  { name: 'Attendance', href: '/student/attendance', icon: CalendarCheck },
  { name: 'Timetable', href: '/student/timetable', icon: CalendarCheck },
  { name: 'Homework', href: '/student/homework', icon: BookOpen },
  { name: 'Study Materials', href: '/student/materials', icon: FileText },
  { name: 'Exams', href: '/student/exams', icon: FileText },
  { name: 'Results', href: '/student/results', icon: Award },
  { name: 'Fees', href: '/student/fees', icon: Wallet },
  { name: 'Leave Request', href: '/student/leave', icon: CheckSquare },
  { name: 'Announcements', href: '/student/announcements', icon: MessageSquare },
];

const teacherMenu: SidebarItem[] = [
  { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { name: 'Profile & Settings', href: '/teacher/profile', icon: Settings },
  { name: 'My Classes', href: '/teacher/classes', icon: Users },
  { name: 'Attendance', href: '/teacher/attendance', icon: UserCheck },
  { name: 'Timetable', href: '/teacher/timetable', icon: CalendarCheck },
  { name: 'Homework', href: '/teacher/homework', icon: BookOpen },
  { name: 'Study Materials', href: '/teacher/materials', icon: FileText },
  { name: 'Marks Entry', href: '/teacher/marks', icon: Award },
  { name: 'Students', href: '/teacher/students', icon: GraduationCap },
  { name: 'Leave', href: '/teacher/leave', icon: CheckSquare },
  { name: 'Announcements', href: '/teacher/communication', icon: MessageSquare },
];

const parentMenu: SidebarItem[] = [
  { name: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { name: 'My Children', href: '/parent/children', icon: Users },
  { name: 'Attendance', href: '/parent/attendance', icon: CalendarCheck },
  { name: 'Academic Performance', href: '/parent/performance', icon: Award },
  { name: 'Homework', href: '/parent/homework', icon: BookOpen },
  { name: 'Timetable', href: '/parent/timetable', icon: CalendarCheck },
  { name: 'Fees & Payments', href: '/parent/fees', icon: Wallet },
  { name: 'Bus Tracking', href: '/parent/bus', icon: Bus },
  { name: 'Announcements', href: '/parent/announcements', icon: MessageSquare },
  { name: 'Gate Pass', href: '/parent/gate-pass', icon: Ticket },
  { name: 'Leave Requests', href: '/parent/leave', icon: CheckSquare },
];

export const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) => {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');

  const fetchSettings = () => {
    api.get('/api/settings').then((res) => {
      if (res.data) {
        if (res.data.logoUrl !== undefined) setLogoUrl(res.data.logoUrl || '');
        if (res.data.schoolName) setSchoolName(res.data.schoolName);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchSettings();
    window.addEventListener('school-settings-updated', fetchSettings);
    return () => window.removeEventListener('school-settings-updated', fetchSettings);
  }, []);

  const handleLogout = () => {
    logout();
    document.cookie = 'token=; Max-Age=0; path=/';
    document.cookie = 'role=; Max-Age=0; path=/';
    router.push('/');
  };

  let menuItems: SidebarItem[] = [];
  if (user?.role === 'SUPER_ADMIN') {
    menuItems = adminMenu;
  } else if (user?.role === 'SUB_ADMIN') {
    const allowed = user.customRole?.permissions || [];
    menuItems = adminMenu.filter(item => allowed.includes(item.href));
  } else if (user?.role === 'STUDENT') {
    menuItems = studentMenu;
  } else if (user?.role === 'TEACHER') {
    menuItems = teacherMenu;
  } else if (user?.role === 'PARENT') {
    menuItems = parentMenu;
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#F8F6FC] text-slate-700 shadow-xl lg:shadow-none border-r border-white/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col h-full ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-20 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <div className="w-11 h-11 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                <img src={logoUrl} alt="School Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-11 h-11 bg-[#9352F3] rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="min-w-0 truncate">
              <h1 className="text-base font-bold text-slate-800 truncate">
                {schoolName || 'EduERP'}
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-purple-600">School Portal</p>
            </div>
          </div>
        </div>

        
        <nav className="flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-purple-200/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-300">
          <div className="mb-4 px-3 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Menu</p>
            {user?.role && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#9352F3] shadow-sm">
                {user.role}
              </span>
            )}
          </div>
          <ul className="space-y-1.5 relative">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.name} className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="active-sidebar-bg"
                      className="absolute inset-0 bg-white shadow-[0_2px_10px_rgba(147,82,243,0.08)] rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2, z: 10 }}
                    whileTap={{ scale: 0.96 }}
                    style={{ perspective: 1000, transformStyle: "preserve-3d" }}
                    className="relative z-10"
                  >
                    <Link 
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 group ${
                        isActive 
                          ? 'text-[#9352F3] font-semibold' 
                          : 'text-[#64748B] hover:text-[#9352F3] hover:bg-white/40 font-medium'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive ? 'text-[#9352F3]' : 'text-[#8B5CF6]/70 group-hover:text-[#9352F3]'}`} />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </motion.div>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-purple-50 flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2, z: 10 }}
            whileTap={{ scale: 0.96 }}
            style={{ perspective: 1000, transformStyle: "preserve-3d" }}
          >
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 group cursor-pointer font-medium"
            >
              <LogOut className="w-5 h-5 mr-3 text-slate-400 group-hover:text-rose-500 transition-colors" />
              <span className="text-sm">Logout</span>
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
};
