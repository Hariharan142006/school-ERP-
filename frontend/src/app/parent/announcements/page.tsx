"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CalendarClock, Megaphone, AlertTriangle, AlertCircle, Info, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function ParentAnnouncementsPage() {
  const { user } = useAuthStore();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Emergency' | 'Urgent' | 'Important' | 'Normal'>('All');

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const childrenRes = await api.get(`/api/students/children?parentId=${user?.id}`);
        const classIds = childrenRes.data.map((c: any) => c.enrolledClass?._id || c.enrolledClass).filter(Boolean);
        
        let url = '/api/notices?targetAudience=Parents';
        classIds.forEach((id: string) => {
          url += `&classId=${id}`;
        });
        
        const res = await api.get(url);
        setNotices(res.data);
      } catch (error) {
        console.error('Failed to fetch notices', error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchNotices();
  }, [user]);

  const formatPriority = (priority: string = 'Normal') => {
    const p = priority.toLowerCase();
    switch (p) {
      case 'emergency':
        return {
          label: 'EMERGENCY',
          badge: 'bg-rose-100 text-rose-700 border-rose-300 border font-extrabold',
          strip: 'bg-rose-600',
          card: 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20',
          icon: '🚨',
          iconComponent: AlertTriangle,
          textColor: 'text-rose-700'
        };
      case 'urgent':
        return {
          label: 'URGENT',
          badge: 'bg-amber-100 text-amber-800 border-amber-300 border font-bold',
          strip: 'bg-amber-500',
          card: 'border-amber-200 bg-amber-50/10',
          icon: '⚠️',
          iconComponent: AlertCircle,
          textColor: 'text-amber-800'
        };
      case 'important':
        return {
          label: 'IMPORTANT',
          badge: 'bg-indigo-100 text-indigo-700 border-indigo-200 border font-bold',
          strip: 'bg-indigo-600',
          card: 'border-indigo-100 bg-indigo-50/10',
          icon: '⭐',
          iconComponent: Sparkles,
          textColor: 'text-indigo-700'
        };
      default:
        return {
          label: 'NORMAL',
          badge: 'bg-slate-100 text-slate-700 border-slate-200 border font-semibold',
          strip: 'bg-slate-400',
          card: 'border-slate-200',
          icon: '📢',
          iconComponent: Info,
          textColor: 'text-slate-700'
        };
    }
  };

  const filteredNotices = notices.filter(n => {
    if (priorityFilter === 'All') return true;
    return (n.priority || 'Normal').toLowerCase() === priorityFilter.toLowerCase();
  });

  const emergencyCount = notices.filter(n => (n.priority || '').toLowerCase() === 'emergency').length;
  const urgentCount = notices.filter(n => (n.priority || '').toLowerCase() === 'urgent').length;
  const importantCount = notices.filter(n => (n.priority || '').toLowerCase() === 'important').length;
  const normalCount = notices.filter(n => !(n.priority) || (n.priority || '').toLowerCase() === 'normal').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider">
            Notice Feed
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Parent Announcements</h1>
        <p className="text-slate-500 mt-1">Official circulars, urgent advisories, and school notifications.</p>
      </div>

      {/* Emergency Alert Banner if any exist */}
      {emergencyCount > 0 && priorityFilter !== 'Emergency' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-4 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-2xl shadow-lg shadow-rose-500/20 flex items-center justify-between gap-4 cursor-pointer"
          onClick={() => setPriorityFilter('Emergency')}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🚨</span>
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wide">Emergency Alert Active</h4>
              <p className="text-xs text-white/90">There is {emergencyCount} emergency advisory from the school. Click to view immediately.</p>
            </div>
          </div>
          <button className="px-3 py-1.5 bg-white text-rose-600 font-bold text-xs rounded-xl shadow-sm hover:bg-rose-50 transition-colors whitespace-nowrap">
            View Alert
          </button>
        </motion.div>
      )}

      {/* Priority Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setPriorityFilter('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            priorityFilter === 'All' 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({notices.length})
        </button>
        <button
          onClick={() => setPriorityFilter('Emergency')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            priorityFilter === 'Emergency' 
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-300' 
              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          <span>🚨</span> Emergency ({emergencyCount})
        </button>
        <button
          onClick={() => setPriorityFilter('Urgent')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            priorityFilter === 'Urgent' 
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-300' 
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span>⚠️</span> Urgent ({urgentCount})
        </button>
        <button
          onClick={() => setPriorityFilter('Important')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            priorityFilter === 'Important' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-300' 
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          <span>⭐</span> Important ({importantCount})
        </button>
        <button
          onClick={() => setPriorityFilter('Normal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            priorityFilter === 'Normal' 
              ? 'bg-slate-700 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
          }`}
        >
          <span>📢</span> Normal ({normalCount})
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-semibold">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading announcements...
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center p-8">
            <Bell className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-bold text-slate-800">No Announcements Found</p>
            <p className="text-sm text-slate-500 mt-1">There are currently no {priorityFilter !== 'All' ? priorityFilter.toLowerCase() : ''} notices for your review.</p>
            {priorityFilter !== 'All' && (
              <button 
                onClick={() => setPriorityFilter('All')} 
                className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
              >
                View all announcements
              </button>
            )}
          </div>
        ) : (
          filteredNotices.map((notice, i) => {
            const pInfo = formatPriority(notice.priority);
            const isEmergency = (notice.priority || '').toLowerCase() === 'emergency';
            
            return (
              <motion.div 
                key={notice._id}
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-3xl shadow-sm border p-6 relative overflow-hidden transition-all hover:shadow-md ${pInfo.card}`}
              >
                <div className={`absolute top-0 left-0 w-2 h-full ${pInfo.strip}`}></div>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Priority Badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-xs tracking-wide flex items-center gap-1.5 ${pInfo.badge}`}>
                      <span>{pInfo.icon}</span>
                      <span>{pInfo.label}</span>
                    </span>

                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                      {notice.targetAudience === 'All' ? 'Public Circular' : notice.targetAudience === 'SpecificClass' ? `Class ${notice.targetClass?.name || ''}` : 'Parent Notice'}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" /> 
                    {new Date(notice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 className={`text-xl font-black mb-2 ${isEmergency ? 'text-rose-900' : 'text-slate-900'}`}>
                  {notice.title}
                </h3>
                
                <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                  {notice.content}
                </p>
                
                <div className="mt-5 pt-3.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Posted by <strong className="text-slate-700">{notice.postedBy?.name || 'School Administration'}</strong></span>
                  </div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Official Notice
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
