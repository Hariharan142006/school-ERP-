"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { CheckCircle2, XCircle, Clock, Save, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function TeacherAttendancePage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<'mark' | 'past'>('mark');

  useEffect(() => {
    if (!user?.id) return;
    // Only fetch classes assigned to this teacher
    api.get('/api/academic/classes').then(res => {
      const myClasses = res.data.filter((c: any) => c.classTeacher?._id === user?.id || c.classTeacher === user?.id);
      setClasses(myClasses);
    }).catch(console.error);
  }, [user]);

  const fetchAttendance = async (fetchDate: string) => {
    if (!selectedClass || !fetchDate) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/attendance?classId=${selectedClass}&date=${fetchDate}`);
      const data = res.data;
      setAttendanceData(data);
      
      const newState: Record<string, string> = {};
      if (data.students) {
        data.students.forEach((s: any) => {
          const existingRecord = data.records?.find((r: any) => r.student._id === s._id);
          newState[s._id] = existingRecord ? existingRecord.status : 'Present';
        });
      }
      setAttendanceState(newState);
    } catch (error) {
      console.error('Failed to fetch attendance', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDate = activeTab === 'mark' ? new Date().toISOString().split('T')[0] : date;
    if (selectedClass) fetchAttendance(fetchDate);
  }, [selectedClass, date, activeTab]);

  const handleStatusChange = (studentId: string, status: string) => {
    if (activeTab === 'past') return; // Read-only in past view
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveClick = () => setShowConfirm(true);

  const confirmSave = async () => {
    setSaving(true);
    setShowConfirm(false);
    try {
      const records = Object.entries(attendanceState).map(([studentId, status]) => ({
        student: studentId,
        status
      }));

      await api.post('/api/attendance', {
        classId: selectedClass,
        date: new Date().toISOString().split('T')[0],
        records,
        markedBy: user?.id
      });
      alert('Attendance saved successfully!');
      fetchAttendance(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const studentsList = attendanceData?.students?.map((s: any) => ({ ...s, status: attendanceState[s._id] || 'Present' })) || [];
  
  const presentCount = Object.values(attendanceState).filter(status => status === 'Present').length;
  const absentCount = Object.values(attendanceState).filter(status => status === 'Absent').length;
  const odCount = Object.values(attendanceState).filter(status => status === 'OD').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Attendance Management</h1>
        <p className="text-slate-500 mt-1">Mark today's attendance or view past records.</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('mark')}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'mark' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Mark Attendance (Today)
        </button>
        <button 
          onClick={() => setActiveTab('past')}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'past' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          View Past Attendance
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-end gap-4">
        <div className="w-full sm:w-1/3">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Class</label>
          <select 
            className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white outline-none"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Choose Class --</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name} - Sec {c.section}</option>)}
          </select>
        </div>
        {activeTab === 'past' && (
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
            <input 
              type="date" 
              className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading attendance data...</div>
      ) : selectedClass && studentsList ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
            <div>
              <h3 className="font-bold text-slate-800">
                {activeTab === 'mark' ? (attendanceData?.isNew ? 'Marking New Attendance' : 'Updating Existing Attendance') : 'Past Attendance Record'}
              </h3>
              <p className="text-sm text-slate-500">{studentsList.length} Students</p>
            </div>
            
            {/* Display counts */}
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-sm font-bold">
                 <CheckCircle2 className="w-4 h-4" /> Present: {presentCount}
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-bold">
                 <XCircle className="w-4 h-4" /> Absent: {absentCount}
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-sm font-bold">
                 <Clock className="w-4 h-4" /> OD: {odCount}
               </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Student Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Roll No</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {studentsList.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">No students enrolled in this class.</td></tr>
                ) : (
                  studentsList.map((student: any) => (
                    <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3"><div className="font-bold text-slate-900">{student.user?.name}</div></td>
                      <td className="px-6 py-3 text-sm text-slate-600 font-mono">{student.rollNumber || 'N/A'}</td>
                      <td className="px-6 py-3 text-right">
                        {activeTab === 'mark' ? (
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                            <button onClick={() => handleStatusChange(student._id, 'Present')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${attendanceState[student._id] === 'Present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><CheckCircle2 className="w-3.5 h-3.5" /> Present</button>
                            <button onClick={() => handleStatusChange(student._id, 'Absent')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${attendanceState[student._id] === 'Absent' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><XCircle className="w-3.5 h-3.5" /> Absent</button>
                            <button onClick={() => handleStatusChange(student._id, 'OD')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${attendanceState[student._id] === 'OD' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><Clock className="w-3.5 h-3.5" /> OD</button>
                          </div>
                        ) : (
                           <div className="inline-flex items-center justify-end">
                              {attendanceState[student._id] === 'Present' && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Present
                                </span>
                              )}
                              {attendanceState[student._id] === 'Absent' && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-100 text-red-700 border border-red-200">
                                  <XCircle className="w-3.5 h-3.5" /> Absent
                                </span>
                              )}
                              {attendanceState[student._id] === 'OD' && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
                                  <Clock className="w-3.5 h-3.5" /> OD
                                </span>
                              )}
                            </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Save Button moved to bottom */}
          {activeTab === 'mark' && studentsList.length > 0 && (
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button onClick={handleSaveClick} disabled={saving} className="flex items-center gap-2 px-8 py-3 text-base">
                <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Class Selected</h3>
          <p className="text-slate-500">Please select a class to view/mark attendance.</p>
        </div>
      )}
    </div>
  );
}

