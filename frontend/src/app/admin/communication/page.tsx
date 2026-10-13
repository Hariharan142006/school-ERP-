"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { NoticeModal } from '@/components/organisms/NoticeModal';
import { Plus, Trash2, Megaphone, Bell, CalendarClock } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function CommunicationPage() {
  const { user } = useAuthStore();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notices');
      setNotices(res.data);
    } catch (error) {
      console.error('Failed to fetch notices', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this notice?')) {
      try {
        await api.delete(`/api/notices/${id}`);
        fetchNotices();
      } catch (error) {
        alert('Failed to delete notice');
      }
    }
  };

  const [priorityFilter, setPriorityFilter] = useState('All');

  const filteredNotices = notices.filter(n => {
    const audienceMatch = filter === 'All' || n.targetAudience === filter;
    const priorityMatch = priorityFilter === 'All' || (n.priority || 'Normal').toLowerCase() === priorityFilter.toLowerCase();
    return audienceMatch && priorityMatch;
  });

  const formatPriority = (priority: string = 'Normal') => {
    const p = priority.toLowerCase();
    if (p === 'emergency') {
      return { label: 'Emergency', badge: 'bg-rose-100 text-rose-700 border-rose-200 border', strip: 'bg-rose-600', icon: '🚨' };
    }
    if (p === 'urgent') {
      return { label: 'Urgent', badge: 'bg-amber-100 text-amber-700 border-amber-200 border', strip: 'bg-amber-500', icon: '⚠️' };
    }
    if (p === 'important') {
      return { label: 'Important', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200 border', strip: 'bg-indigo-600', icon: '⭐' };
    }
    return { label: 'Normal', badge: 'bg-slate-100 text-slate-700 border-slate-200 border', strip: 'bg-slate-400', icon: '📢' };
  };

  const formatAudience = (audience: string) => {
    if (audience === 'All') return { label: 'Public Broadcast', color: 'bg-purple-100 text-purple-700' };
    if (audience === 'Teachers') return { label: 'Staff Only', color: 'bg-blue-100 text-blue-700' };
    if (audience === 'Students') return { label: 'Students Only', color: 'bg-emerald-100 text-emerald-700' };
    if (audience === 'Parents') return { label: 'Parents Only', color: 'bg-amber-100 text-amber-700' };
    return { label: audience, color: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notice Board</h1>
          <p className="text-slate-500 mt-1">Broadcast announcements to staff, students, and parents.</p>
        </div>
        {user?.role === 'SUPER_ADMIN' && (
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-5 h-5 mr-1" /> Post Notice
          </Button>
        )}
      </div>

      {/* Filter Bars */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Audience:</span>
          {['All', 'Teachers', 'Students', 'Parents'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f === 'All' ? 'All Audiences' : f}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Priority:</span>
          {['All', 'Emergency', 'Urgent', 'Important', 'Normal'].map(p => (
            <button 
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                priorityFilter === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading notices...</div>
        ) : filteredNotices.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 flex flex-col items-center">
            <Bell className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-800">No notices found</p>
            <p className="text-sm">There are currently no announcements matching your filters.</p>
          </div>
        ) : (
          filteredNotices.map((notice, i) => {
            const pInfo = formatPriority(notice.priority);
            return (
              <motion.div 
                key={notice._id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group ${
                  (notice.priority || '').toLowerCase() === 'emergency' ? 'ring-1 ring-rose-300 bg-rose-50/10' : ''
                }`}
              >
                <div className={`absolute top-0 left-0 w-2 h-full ${pInfo.strip}`}></div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                    {/* Priority Badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${pInfo.badge}`}>
                      <span>{pInfo.icon}</span>
                      <span>{pInfo.label}</span>
                    </span>

                    {/* Audience Badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${formatAudience(notice.targetAudience).color}`}>
                      {formatAudience(notice.targetAudience).label}
                    </span>

                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 ml-auto">
                      <CalendarClock className="w-3.5 h-3.5" /> 
                      {new Date(notice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{notice.title}</h3>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-slate-400" />
                    Posted by <span className="font-bold text-slate-700">{notice.postedBy?.name || 'School Administration'}</span>
                  </div>
                </div>

                {user?.role === 'SUPER_ADMIN' && (
                  <div className="flex-shrink-0 flex items-start justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(notice._id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors cursor-pointer">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <NoticeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchNotices} />
    </div>
  );
}
