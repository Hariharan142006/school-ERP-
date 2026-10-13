"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { motion } from 'framer-motion';
import { Bell, CalendarClock, Megaphone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function StudentAnnouncementsPage() {
  const { user } = useAuthStore();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const profileRes = await api.get(`/api/students/me?userId=${user?.id}`);
        const classId = profileRes.data?.enrolledClass?._id || profileRes.data?.enrolledClass;
        const url = classId ? `/api/notices?targetAudience=Students&classId=${classId}` : `/api/notices?targetAudience=Students`;
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
        return { label: 'EMERGENCY', badge: 'bg-rose-100 text-rose-700 border-rose-300 border font-extrabold', strip: 'bg-rose-600', icon: '🚨' };
      case 'urgent':
        return { label: 'URGENT', badge: 'bg-amber-100 text-amber-800 border-amber-300 border font-bold', strip: 'bg-amber-500', icon: '⚠️' };
      case 'important':
        return { label: 'IMPORTANT', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200 border font-bold', strip: 'bg-indigo-600', icon: '⭐' };
      default:
        return { label: 'NORMAL', badge: 'bg-slate-100 text-slate-700 border-slate-200 border font-semibold', strip: 'bg-slate-400', icon: '📢' };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Announcements</h1>
        <p className="text-slate-500 mt-1">Official notices and updates from the school administration.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading announcements...</div>
        ) : notices.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 flex flex-col items-center">
            <Bell className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-800">No Announcements</p>
            <p className="text-slate-500">There are currently no new notices for students.</p>
          </div>
        ) : (
          notices.map((notice, i) => {
            const pInfo = formatPriority(notice.priority);
            return (
              <motion.div 
                key={notice._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${pInfo.strip}`}></div>
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 ${pInfo.badge}`}>
                    <span>{pInfo.icon}</span>
                    <span>{pInfo.label}</span>
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                    {notice.targetAudience === 'All' ? 'Public Broadcast' : 'Student Notice'}
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 ml-auto">
                    <CalendarClock className="w-3.5 h-3.5" /> 
                    {new Date(notice.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{notice.title}</h3>
                <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                
                <div className="mt-4 pt-3.5 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-slate-400" />
                  Posted by <span className="font-bold text-slate-700">{notice.postedBy?.name || 'Administration'}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
