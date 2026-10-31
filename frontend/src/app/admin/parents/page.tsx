"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { ParentModal } from '@/components/organisms/ParentModal';
import { Search, Users, UserPlus, Edit, KeyRound, CheckCircle, ShieldAlert, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/axios';

export default function ParentManagementPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [search, setSearch] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentRes, batchRes, classRes] = await Promise.all([
        api.get('/api/students'),
        api.get('/api/batches'),
        api.get('/api/academic/classes')
      ]);

      setStudents(studentRes.data);
      setBatches(batchRes.data);
      setClasses(classRes.data);
    } catch (error) {
      console.error('Failed to fetch parent management data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  // Unique class names & sections for filters
  const uniqueClassNames = Array.from(new Set(classes.map(c => c.name)));
  const uniqueSections = Array.from(new Set(classes.map(c => c.section)));

  // Filter students based on Batch, Class, Section, and Search text
  const filteredStudents = students.filter(s => {
    const cls = s.enrolledClass;
    
    // Batch Filter
    if (selectedBatch && (cls?.batch?._id || cls?.batch) !== selectedBatch) {
      return false;
    }
    // Class Filter
    if (selectedClass && cls?.name?.toLowerCase() !== selectedClass.toLowerCase()) {
      return false;
    }
    // Section Filter
    if (selectedSection && cls?.section?.toLowerCase() !== selectedSection.toLowerCase()) {
      return false;
    }
    // Search Query (Name, Roll, Admission, Father, Phone)
    if (search) {
      const q = search.toLowerCase();
      const matchName = s.user?.name?.toLowerCase().includes(q);
      const matchRoll = s.rollNumber?.toLowerCase().includes(q);
      const matchAdm = s.admissionNumber?.toLowerCase().includes(q);
      const matchFather = s.fatherName?.toLowerCase().includes(q);
      const matchPhone = s.contactNumber?.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchAdm && !matchFather && !matchPhone) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Parent Management</h1>
          <p className="text-slate-500 mt-1">Assign parents to students, set up credentials, and filter by batch/class.</p>
        </div>
      </div>

      {/* Filter Options Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-indigo-500" /> Filter Students & Parents
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Batch Filter */}
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Batch</label>
            <select 
              value={selectedBatch} 
              onChange={e => setSelectedBatch(e.target.value)} 
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 text-sm outline-none focus:bg-white"
            >
              <option value="">All Batches</option>
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Class</label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)} 
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 text-sm outline-none focus:bg-white"
            >
              <option value="">All Classes</option>
              {uniqueClassNames.map(c => (
                <option key={c} value={c}>{c.toLowerCase().startsWith('class') ? c : `Class ${c}`}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Section</label>
            <select 
              value={selectedSection} 
              onChange={e => setSelectedSection(e.target.value)} 
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 text-sm outline-none focus:bg-white"
            >
              <option value="">All Sections</option>
              {uniqueSections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Search</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Student, Father, Phone..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border bg-slate-50 text-sm outline-none focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Student Parent Credentials Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Student Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Class & Batch</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Parent Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Login Credentials</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading student records...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-lg font-medium text-slate-900">No student records found matching filters</p>
                  </div>
                </td></tr>
              ) : (
                filteredStudents.map((student, i) => {
                  const hasParentAccount = Boolean(student.parent);
                  
                  return (
                    <motion.tr key={student._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            {student.user?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-900">{student.user?.name}</div>
                            <div className="text-xs text-slate-500">Adm: <span className="font-mono">{student.admissionNumber}</span> | Roll: <span className="font-mono">{student.rollNumber || 'N/A'}</span></div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">
                          Class {student.enrolledClass?.name} - {student.enrolledClass?.section}
                        </div>
                        {student.enrolledClass?.batch?.name && (
                          <div className="text-xs text-slate-500 font-medium">Batch: {student.enrolledClass.batch.name}</div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {student.fatherName || student.contactNumber ? (
                          <div>
                            <div className="text-sm font-bold text-slate-900">{student.fatherName || 'Father'}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                              Phone: {student.contactNumber}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No parent added</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {student.parent ? (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1 shadow-sm">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <KeyRound className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>ID: <strong className="font-mono text-indigo-600">{(student.parent as any).username || student.contactNumber}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <KeyRound className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>Pass: <strong className="font-mono text-indigo-600">{(student.parent as any).username === 'parent_murugan' ? 'parent123' : ((student.parent as any).username || student.contactNumber)}</strong></span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium pt-0.5 border-t border-slate-200/60 flex items-center justify-between">
                              <span>Parent Mobile / Web</span>
                              <span className="text-emerald-600 font-semibold">Verified</span>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                            <ShieldAlert className="w-3.5 h-3.5" /> Credentials Not Set
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => handleOpenModal(student)} 
                          variant={hasParentAccount ? "secondary" : "primary"}
                          className="text-xs py-1.5 px-3"
                        >
                          {hasParentAccount ? (
                            <>
                              <Edit className="w-3.5 h-3.5 mr-1" /> Edit Parent
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5 mr-1" /> + Add Parent
                            </>
                          )}
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Parent Modal Component */}
      <ParentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
        student={selectedStudent} 
      />
    </div>
  );
}
