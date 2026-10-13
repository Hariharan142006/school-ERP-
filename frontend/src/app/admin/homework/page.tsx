"use client";

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { 
  Plus, Trash2, Edit3, BookOpen, Clock, FileText, X, Eye, 
  User, Calendar, Search, Filter, CheckCircle2, AlertCircle, 
  Send, School, Layers, CheckSquare, Bell
} from 'lucide-react';

// --- MODAL: Homework Details ---
const HomeworkDetailsModal = ({ isOpen, onClose, hw }: { isOpen: boolean; onClose: () => void; hw: any }) => {
  if (!isOpen || !hw) return null;

  const dueDate = new Date(hw.dueDate);
  const now = new Date();
  const isOverdue = dueDate < now && dueDate.toDateString() !== now.toDateString();
  const isDueToday = dueDate.toDateString() === now.toDateString();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full relative z-10 overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wider">
                {hw.subject?.name || 'General Task'}
              </span>
              <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
                Class {hw.enrolledClass?.name} - {hw.enrolledClass?.section}
              </span>
              {isOverdue ? (
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">Overdue</span>
              ) : isDueToday ? (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">Due Today</span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">Active</span>
              )}
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{hw.title}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Assigned by: <strong className="text-slate-800 dark:text-slate-200">{hw.assignedBy?.name || 'Administrator'}</strong> ({hw.assignedBy?.role || 'ADMIN'})</span>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Instructions & Description</h4>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {hw.description || 'No specific instructions provided.'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Date</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {new Date(hw.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isOverdue 
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40' 
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40'
              }`}>
                <Clock className={`w-5 h-5 shrink-0 ${isOverdue ? 'text-rose-500' : 'text-amber-500'}`} />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Submission Due</div>
                  <div className={`text-xs font-bold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// --- MODAL: Assign or Edit Homework ---
const HomeworkFormModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  classes, 
  subjects, 
  teachers,
  editHw 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
  classes: any[]; 
  subjects: any[]; 
  teachers: any[];
  editHw?: any;
}) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    enrolledClass: '',
    subject: '',
    dueDate: '',
    assignedBy: '',
    notify: true
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editHw) {
      setFormData({
        title: editHw.title || '',
        description: editHw.description || '',
        enrolledClass: editHw.enrolledClass?._id || editHw.enrolledClass || '',
        subject: editHw.subject?._id || editHw.subject || '',
        dueDate: editHw.dueDate ? new Date(editHw.dueDate).toISOString().split('T')[0] : '',
        assignedBy: editHw.assignedBy?._id || editHw.assignedBy || '',
        notify: false
      });
    } else {
      setFormData({
        title: '',
        description: '',
        enrolledClass: '',
        subject: '',
        dueDate: '',
        assignedBy: user?.id || '',
        notify: true
      });
    }
    setErrorMsg('');
  }, [editHw, isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title.trim()) {
      setErrorMsg('Please enter a homework title');
      return;
    }
    if (!formData.enrolledClass) {
      setErrorMsg('Please select a target class');
      return;
    }
    if (!formData.dueDate) {
      setErrorMsg('Please select a due date');
      return;
    }

    setLoading(true);
    try {
      if (editHw) {
        await api.put(`/api/homework/${editHw._id}`, {
          title: formData.title,
          description: formData.description,
          enrolledClass: formData.enrolledClass,
          subject: formData.subject || undefined,
          dueDate: formData.dueDate
        });
      } else {
        await api.post('/api/homework', {
          title: formData.title,
          description: formData.description,
          enrolledClass: formData.enrolledClass,
          subject: formData.subject || undefined,
          dueDate: formData.dueDate,
          assignedBy: formData.assignedBy || user?.id,
          notify: formData.notify
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save homework assignment.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full relative z-10 overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800"
        >
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editHw ? 'Edit Homework Assignment' : 'Assign Homework to Class'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {editHw ? 'Update assignment parameters and instructions' : 'Fill in the coursework details for students'}
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {errorMsg && (
              <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form id="admin-hw-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Homework Title *
                </label>
                <input 
                  type="text"
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  required 
                  placeholder="e.g. Science Chapter 4 Problem Set"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                    Target Class *
                  </label>
                  <select 
                    value={formData.enrolledClass} 
                    onChange={e => setFormData({ ...formData, enrolledClass: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all" 
                    required
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((c: any) => (
                      <option key={c._id} value={c._id}>Class {c.name} - {c.section}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <select 
                    value={formData.subject} 
                    onChange={e => setFormData({ ...formData, subject: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  >
                    <option value="">-- Select Subject (Optional) --</option>
                    {subjects.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.code || 'SUB'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                    Due Date *
                  </label>
                  <input 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })} 
                    required 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>

                {!editHw && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                      Assigned By
                    </label>
                    <select 
                      value={formData.assignedBy} 
                      onChange={e => setFormData({ ...formData, assignedBy: e.target.value })} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    >
                      <option value={user?.id}>School Administration (You)</option>
                      {teachers.map((t: any) => (
                        <option key={t._id} value={t._id}>{t.name} (Teacher)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Detailed Instructions & Description
                </label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  rows={4} 
                  placeholder="Outline the assignment requirements, pages to read, homework problems, or guidelines..." 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>

              {!editHw && (
                <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="notify-students" 
                    checked={formData.notify} 
                    onChange={e => setFormData({ ...formData, notify: e.target.checked })} 
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="notify-students" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Send Email & SMS Notification to enrolled students and parents</span>
                  </label>
                </div>
              )}
            </form>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button form="admin-hw-form" type="submit" disabled={loading}>
              {loading ? 'Saving...' : editHw ? 'Update Homework' : 'Assign Homework'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// --- MAIN ADMIN HOMEWORK PAGE ---
export default function AdminHomeworkPage() {
  const { user } = useAuthStore();
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE'>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<any>(null);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hwRes, classRes, subRes, usersRes] = await Promise.all([
        api.get('/api/homework'),
        api.get('/api/academic/classes'),
        api.get('/api/academic/subjects'),
        api.get('/api/users')
      ]);

      setHomeworks(Array.isArray(hwRes.data) ? hwRes.data : []);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
      
      const teacherUsers = (Array.isArray(usersRes.data) ? usersRes.data : []).filter(
        (u: any) => u.role === 'TEACHER'
      );
      setTeachers(teacherUsers);
    } catch (err) {
      console.error('Failed to load homework data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this homework assignment?')) {
      try {
        await api.delete(`/api/homework/${id}`);
        setHomeworks(prev => prev.filter(h => h._id !== id));
      } catch (err) {
        alert('Failed to delete homework');
      }
    }
  };

  const handleEdit = (hw: any) => {
    setEditingHomework(hw);
    setIsFormModalOpen(true);
  };

  const handleCreate = () => {
    setEditingHomework(null);
    setIsFormModalOpen(true);
  };

  // Filtered list
  const filteredHomeworks = useMemo(() => {
    return homeworks.filter(hw => {
      // Search
      const searchMatch = 
        !searchTerm ||
        hw.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hw.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hw.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Class
      const classId = hw.enrolledClass?._id || hw.enrolledClass;
      const classMatch = !selectedClassFilter || classId === selectedClassFilter;

      // Subject
      const subId = hw.subject?._id || hw.subject;
      const subMatch = !selectedSubjectFilter || subId === selectedSubjectFilter;

      // Status
      const dueDate = new Date(hw.dueDate);
      const isOverdue = dueDate < new Date() && dueDate.toDateString() !== new Date().toDateString();
      let statusMatch = true;
      if (statusFilter === 'ACTIVE') statusMatch = !isOverdue;
      if (statusFilter === 'OVERDUE') statusMatch = isOverdue;

      return searchMatch && classMatch && subMatch && statusMatch;
    });
  }, [homeworks, searchTerm, selectedClassFilter, selectedSubjectFilter, statusFilter]);

  // Analytics stats
  const totalAssignments = homeworks.length;
  const overdueCount = homeworks.filter(hw => {
    const d = new Date(hw.dueDate);
    return d < new Date() && d.toDateString() !== new Date().toDateString();
  }).length;
  const activeCount = totalAssignments - overdueCount;
  const classesEngaged = new Set(homeworks.map(h => (h.enrolledClass?._id || h.enrolledClass))).size;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Academic Coursework
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Homework & Assignments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Assign tasks directly to classes, manage submissions, and ensure student curriculum progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleCreate} className="shadow-lg shadow-indigo-500/20">
            <Plus className="w-5 h-5 mr-1" /> Assign Homework
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Assignments</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalAssignments}</h3>
            <span className="text-[11px] text-slate-500 font-medium">All recorded tasks</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Tasks</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</h3>
            <span className="text-[11px] text-emerald-600/80 font-medium">Ongoing deadlines</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Past Due</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{overdueCount}</h3>
            <span className="text-[11px] text-rose-600/80 font-medium">Deadline elapsed</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Classes Engaged</p>
            <h3 className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">{classesEngaged}</h3>
            <span className="text-[11px] text-slate-500 font-medium">With active coursework</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <School className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search homework by title, keywords, or subject..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Class filter */}
            <select
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>Class {c.name} - {c.section}</option>
              ))}
            </select>

            {/* Subject filter */}
            <select
              value={selectedSubjectFilter}
              onChange={e => setSelectedSubjectFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            {/* Status pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'ACTIVE' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setStatusFilter('OVERDUE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'OVERDUE' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Overdue
              </button>
            </div>

            {(searchTerm || selectedClassFilter || selectedSubjectFilter || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClassFilter('');
                  setSelectedSubjectFilter('');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Homework Grid */}
      <div>
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm font-semibold">Loading coursework records...</p>
          </div>
        ) : filteredHomeworks.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
            <BookOpen className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Homework Assignments Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              {homeworks.length === 0 
                ? 'No homework assignments have been created yet. Assign your first homework task to get started.' 
                : 'No assignments matched your search and filter criteria.'}
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-1" /> Assign Homework Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHomeworks.map((hw, idx) => {
              const dueDate = new Date(hw.dueDate);
              const now = new Date();
              const isOverdue = dueDate < now && dueDate.toDateString() !== now.toDateString();
              const isDueToday = dueDate.toDateString() === now.toDateString();

              return (
                <motion.div
                  key={hw._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group relative"
                >
                  <div className={`h-1.5 w-full ${isOverdue ? 'bg-rose-500' : isDueToday ? 'bg-amber-500' : 'bg-indigo-600'}`}></div>

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Top Badges & Actions */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold text-[11px] rounded-lg">
                          {hw.subject?.name || 'General'}
                        </span>
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-lg">
                          Class {hw.enrolledClass?.name} - {hw.enrolledClass?.section}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(hw)}
                          title="Edit Assignment"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(hw._id)}
                          title="Delete Assignment"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 
                      onClick={() => { setSelectedDetails(hw); setIsDetailsOpen(true); }}
                      className="text-base font-bold text-slate-900 dark:text-white mb-1.5 hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
                    >
                      {hw.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed flex-1">
                      {hw.description || 'No additional instructions.'}
                    </p>

                    {/* Metadata Row */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Assigned by:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                          {hw.assignedBy?.name || 'Admin'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Due Date:</span>
                        <div className={`flex items-center gap-1 font-bold ${
                          isOverdue ? 'text-rose-600 dark:text-rose-400' : isDueToday ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          {isOverdue && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">Late</span>}
                          {isDueToday && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-bold">Today</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Created {new Date(hw.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => { setSelectedDetails(hw); setIsDetailsOpen(true); }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal (Create or Edit) */}
      <HomeworkFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchData}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        editHw={editingHomework}
      />

      {/* Details View Modal */}
      <HomeworkDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        hw={selectedDetails}
      />
    </div>
  );
}
