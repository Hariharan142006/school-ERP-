"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@/components/atoms/Portal';
import { X, Search, CheckSquare, Square, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import api from '@/lib/axios';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'add' | 'edit';
  initialData?: any;
}

export interface SectionItem {
  id: string;
  label: string;
  category: string;
  isNew?: boolean;
}

export const SECTIONS: SectionItem[] = [
  // Core & Administration
  { id: '/admin/dashboard', label: 'Dashboard', category: 'Core & Overview' },
  { id: '/admin/school', label: 'School Management', category: 'Administration' },
  { id: '/admin/users', label: 'User Management & Roles', category: 'Administration' },
  { id: '/admin/settings', label: 'Settings', category: 'Administration' },
  { id: '/admin/recovery', label: 'Recovery / Trash', category: 'Administration' },

  // Academics
  { id: '/admin/academic', label: 'Academic Classes & Subjects', category: 'Academics' },
  { id: '/admin/academic/calendar', label: 'Academic Calendar', category: 'Academics' },
  { id: '/admin/academic/timetable', label: 'Timetable Hub', category: 'Academics' },
  { id: '/admin/homework', label: 'Homework Management', category: 'Academics', isNew: true },
  { id: '/admin/exam', label: 'Examination', category: 'Academics' },

  // Students & Staff
  { id: '/admin/students', label: 'Student Management', category: 'Students & Staff' },
  { id: '/admin/parents', label: 'Parent Management', category: 'Students & Staff' },
  { id: '/admin/staff', label: 'Staff Management', category: 'Students & Staff' },
  { id: '/admin/attendance', label: 'Attendance Tracking', category: 'Students & Staff' },

  // Finance & Payments
  { id: '/admin/finance', label: 'Finance & Payments', category: 'Finance' },
  { id: '/admin/fee-notice', label: 'Fee Notice', category: 'Finance', isNew: true },

  // Security, Gate Pass & Scanners
  { id: '/admin/gate-pass', label: 'Gate Pass Management', category: 'Security & Checkpoint', isNew: true },
  { id: '/admin/gate-scanner', label: 'Gate Scanner (QR Checkpoint)', category: 'Security & Checkpoint', isNew: true },
  { id: '/admin/visitor', label: 'Visitor Module', category: 'Security & Checkpoint', isNew: true },

  // Facilities & Campus
  { id: '/admin/transport', label: 'Transport Management', category: 'Facilities' },
  { id: '/admin/hostel', label: 'Hostel Management', category: 'Facilities' },
  { id: '/admin/stock', label: 'Stock Management', category: 'Facilities', isNew: true },

  // Communication & Reports
  { id: '/admin/communication', label: 'Announcements', category: 'Communication' },
  { id: '/admin/circular', label: 'Circular Management', category: 'Communication', isNew: true },
  { id: '/admin/reports', label: 'Reports & Analytics', category: 'Communication' }
];

export const RoleModal = ({ isOpen, onClose, onSuccess, mode, initialData }: RoleModalProps) => {
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      if (mode === 'edit' && initialData) {
        setName(initialData.name || '');
        setPermissions(initialData.permissions || []);
      } else {
        setName('');
        setPermissions([]);
      }
    }
  }, [isOpen, mode, initialData]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase().trim();
    return SECTIONS.filter(s => 
      s.label.toLowerCase().includes(q) || 
      s.category.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name: name.trim(), permissions };
      if (mode === 'add') {
        await api.post('/api/roles', payload);
      } else {
        await api.put(`/api/roles/${initialData._id}`, payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckbox = (id: string) => {
    if (permissions.includes(id)) {
      setPermissions(permissions.filter(p => p !== id));
    } else {
      setPermissions([...permissions, id]);
    }
  };

  const handleSelectAll = () => {
    setPermissions(SECTIONS.map(s => s.id));
  };

  const handleClearAll = () => {
    setPermissions([]);
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-slate-800">
                  {mode === 'add' ? 'Create New Role' : 'Edit Role'}
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Role Name Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role Name</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium" 
                  placeholder="e.g., Security Guard, Librarian, Transport Officer" 
                />
              </div>

              {/* Sections Controls */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Select Accessible Sections
                    </label>
                    <span className="text-xs text-slate-500">
                      {permissions.length} of {SECTIONS.length} sections selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 px-2 py-1 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Search Bar for Sections */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search sections (e.g., Scanner, Gate Pass, Transport)..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/40">
                  {filteredSections.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400">
                      No sections matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredSections.map(section => {
                      const isSelected = permissions.includes(section.id);
                      return (
                        <label 
                          key={section.id} 
                          className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-purple-50/80 border-purple-200 shadow-xs' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleCheckbox(section.id)} 
                            className="mt-0.5 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer" 
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-bold truncate ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                                {section.label}
                              </span>
                              {section.isNew && (
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                                  NEW
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {section.category} • {section.id}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
                  {loading ? 'Saving...' : 'Save Role'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  );
};
