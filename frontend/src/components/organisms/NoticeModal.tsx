"use client";

import React, { useState } from 'react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { X } from 'lucide-react';

import api from '@/lib/axios';
import { Portal } from '@/components/atoms/Portal';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NoticeModal = ({ isOpen, onClose, onSuccess }: NoticeModalProps) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'All',
    targetClass: '',
    priority: 'Normal'
  });
  const [classesData, setClassesData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        content: '',
        targetAudience: user?.role === 'TEACHER' ? 'SpecificClass' : 'All',
        targetClass: '',
        priority: 'Normal'
      });
      setError('');

      const fetchClasses = async () => {
        try {
          const res = await api.get('/api/academic/classes');
          setClassesData(res.data);
          
          if (user?.role === 'TEACHER' && res.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              targetClass: prev.targetClass || res.data[0]._id
            }));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchClasses();
    }
  }, [isOpen, user?.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePrioritySelect = (p: string) => {
    setFormData(prev => ({ ...prev, priority: p }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload: {
        title: string;
        content: string;
        targetAudience: string;
        priority: string;
        postedBy?: string;
        targetClass?: string;
      } = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        targetAudience: formData.targetAudience,
        priority: formData.priority || 'Normal',
        postedBy: user?.id
      };
      if (formData.targetAudience === 'SpecificClass' && formData.targetClass) {
        payload.targetClass = formData.targetClass;
      }
      
      await api.post('/api/notices', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post notice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full relative z-10 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between bg-gray-50/50">
              <h3 className="text-xl font-bold">Post New Notice</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-6">
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 mb-4 rounded-xl border border-red-100">{error}</div>}
              <form id="notice-form" onSubmit={handleSubmit} className="space-y-4">
                <Input label="Notice Title" id="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Annual Sports Day Announcement" />
                
                {/* Priority Selection */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1.5">Notice Priority Level</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: 'Normal', label: 'Normal', desc: 'General info', color: 'border-slate-300 text-slate-700 bg-slate-50', activeColor: 'border-slate-800 bg-slate-800 text-white shadow-sm' },
                      { key: 'Important', label: 'Important', desc: 'Key updates', color: 'border-indigo-200 text-indigo-700 bg-indigo-50/60', activeColor: 'border-indigo-600 bg-indigo-600 text-white shadow-indigo-500/25 shadow-md' },
                      { key: 'Urgent', label: 'Urgent', desc: 'Action required', color: 'border-amber-200 text-amber-700 bg-amber-50/60', activeColor: 'border-amber-500 bg-amber-500 text-white shadow-amber-500/25 shadow-md' },
                      { key: 'Emergency', label: 'Emergency', desc: 'Critical alert', color: 'border-rose-200 text-rose-700 bg-rose-50/60', activeColor: 'border-rose-600 bg-rose-600 text-white shadow-rose-500/25 shadow-md animate-pulse' }
                    ].map(p => {
                      const isSelected = formData.priority === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => handlePrioritySelect(p.key)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected ? p.activeColor : `${p.color} hover:opacity-90`
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs uppercase tracking-wide">{p.label}</span>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                          </div>
                          <span className={`text-[10px] mt-1 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>{p.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1.5">Target Audience</label>
                  {user?.role === 'TEACHER' ? (
                     <div className="flex gap-3">
                        <select id="targetAudience" value={formData.targetAudience} onChange={handleChange} className="w-1/3 px-4 py-2.5 rounded-xl border bg-gray-50 focus:bg-white outline-none">
                          <option value="SpecificClass">Specific Class</option>
                        </select>
                        <select id="targetClass" value={formData.targetClass} onChange={handleChange} className="w-2/3 px-4 py-2.5 rounded-xl border bg-gray-50 focus:bg-white outline-none" required>
                          <option value="">Select a class...</option>
                          {classesData.map(c => (
                            <option key={c._id} value={c._id}>{c.name} - {c.section}</option>
                          ))}
                        </select>
                     </div>
                  ) : (
                     <div className="flex gap-3">
                        <select id="targetAudience" value={formData.targetAudience} onChange={handleChange} className="flex-1 px-4 py-2.5 rounded-xl border bg-gray-50 focus:bg-white outline-none">
                          <option value="All">All (Public Notice Board)</option>
                          <option value="Teachers">Teachers Only</option>
                          <option value="Students">Students Only</option>
                          <option value="Parents">Parents Only</option>
                          <option value="SpecificClass">Specific Class</option>
                        </select>
                        {formData.targetAudience === 'SpecificClass' && (
                          <select id="targetClass" value={formData.targetClass} onChange={handleChange} className="flex-1 px-4 py-2.5 rounded-xl border bg-gray-50 focus:bg-white outline-none" required>
                            <option value="">Select class...</option>
                            {classesData.map(c => (
                              <option key={c._id} value={c._id}>{c.name} - {c.section}</option>
                            ))}
                          </select>
                        )}
                     </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1.5">Notice Content</label>
                  <textarea id="content" value={formData.content} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white outline-none" rows={6} placeholder="Write the details here..."></textarea>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50/50 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button form="notice-form" type="submit" disabled={loading}>{loading ? 'Posting...' : 'Post Notice'}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </Portal>
  );
};
