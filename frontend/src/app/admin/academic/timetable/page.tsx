"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Button } from '@/components/atoms/Button';
import { Calendar, Save, Trash2, Plus, Clock, BookOpen, Settings as SettingsIcon, Layout, UserPlus, Users, Eye, Edit2, X, AlertTriangle, Utensils, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TABS = [
  { id: 'structure', label: 'Structure', icon: Layout },
  { id: 'byClass', label: 'Assign By Class', icon: Users },
  { id: 'byStaff', label: 'Assign By Staff', icon: UserPlus },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
];



const getAcademicPeriodLabel = (periods: any[], index: number) => {
  let count = 0;
  for (let i = 0; i <= index; i++) {
    if (!periods[i].type || periods[i].type === 'academic') count++;
  }
  return `P${count}`;
};

const Toggle = ({ label, description, checked, onChange }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
    <div>
      <h4 className="font-bold text-slate-800">{label}</h4>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
    <button onClick={() => onChange(!checked)} className={`w-12 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-300'}`}>
      <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" animate={{ x: checked ? 24 : 0 }} />
    </button>
  </div>
);

export default function AdminTimetablePage() {
  const [activeTab, setActiveTab] = useState('byClass');
  
  // Master data
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ showTimetableToStudents: true, showTimetableToStaff: true });
  const [allTimetables, setAllTimetables] = useState<any[]>([]);
  
  // Cascading Selection State
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  const uniqueClassNames = Array.from(new Set(classes.map(c => c.name))).sort();
  const availableSections = classes.filter(c => c.name === selectedClassName).sort((a, b) => a.section.localeCompare(b.section));
  
  const getSelectedClassObj = () => classes.find(c => c.name === selectedClassName && c.section === selectedSection);

  // Other Shared State
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedDay, setSelectedDay] = useState('Monday');
  
  const [structurePeriods, setStructurePeriods] = useState<any[]>([]);
  
  // Grid State (Assign By Class)
  const [gridData, setGridData] = useState<Record<string, any[]>>({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
  });
  
  // Grid State (Assign By Staff)
  const [staffGridData, setStaffGridData] = useState<Record<string, any[]>>({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
  });
  const maxPeriods = Math.max(8, ...classes.map(c => c.periodStructures?.length || 0));
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCell, setModalCell] = useState<{day: string, periodNumber: number, data: any, isStaffMode?: boolean} | null>(null);
  const [modalSubject, setModalSubject] = useState('');
  const [modalTeacher, setModalTeacher] = useState('');
  const [modalClass, setModalClass] = useState('');

  // Preview State
  const [previewType, setPreviewType] = useState('class');
  const [previewEntity, setPreviewEntity] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initial load
  useEffect(() => {
    Promise.all([
      api.get('/api/academic/classes'),
      api.get('/api/academic/subjects'),
      api.get('/api/staff'),
      api.get('/api/settings'),
      api.get('/api/timetable')
    ]).then(([classRes, subRes, staffRes, settingsRes, ttRes]) => {
      setClasses(classRes.data);
      setSubjects(subRes.data);
      setTeachers(staffRes.data.filter((s: any) => s.user?.role === 'TEACHER'));
      if(settingsRes.data) setSettings(settingsRes.data);
      setAllTimetables(ttRes.data);
    });
  }, []);

  // Handle Tab changes
  useEffect(() => {
    setStructurePeriods([]);
    setSelectedClassName('');
    setSelectedSection('');
    setSelectedTeacher('');
  }, [activeTab]);

  // Load Settings
  useEffect(() => {
    if (activeTab === 'settings') {
      api.get('/api/settings').then(res => setSettings(res.data));
    }
  }, [activeTab]);

  // Load Structure
  useEffect(() => {
    if (activeTab === 'structure' && selectedClassName) {
      if (!selectedSection) {
        setStructurePeriods([]);
        return;
      }
      let cls;
      if (selectedSection === 'ALL') {
        const matching = classes.filter(c => c.name === selectedClassName);
        // Look for any section that has a saved structure, otherwise first section
        cls = matching.find(c => c.periodStructures && c.periodStructures.length > 0) || matching[0];
      } else {
        cls = classes.find(c => c.name === selectedClassName && c.section === selectedSection);
      }
      setStructurePeriods(cls?.periodStructures && cls.periodStructures.length > 0 ? JSON.parse(JSON.stringify(cls.periodStructures)) : []);
    }
  }, [activeTab, selectedClassName, selectedSection, classes]);

  // Load Timetables for Grid (Assign By Class)
  useEffect(() => {
    if (activeTab === 'byClass' && selectedClassName && selectedSection && selectedSection !== 'ALL') {
      const cls = getSelectedClassObj();
      if (!cls) return;
      setLoading(true);
      api.get(`/api/timetable?classId=${cls._id}`).then(res => {
        const newGrid: Record<string, any[]> = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
        res.data.forEach((tt: any) => {
          newGrid[tt.dayOfWeek] = tt.periods || [];
        });
        setGridData(newGrid);
        setLoading(false);
      });
    }
  }, [activeTab, selectedClassName, selectedSection, classes]);

  // Load Timetables for Staff
  useEffect(() => {
    if (activeTab === 'byStaff' && selectedTeacher) {
      setLoading(true);
      api.get(`/api/timetable/teacher/${selectedTeacher}`).then(res => {
        const newGrid: Record<string, any[]> = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
        // The API returns all timetables where this teacher has at least one period
        res.data.forEach((tt: any) => {
          const day = tt.dayOfWeek;
          tt.periods.forEach((p: any) => {
            if ((p.teacher?._id || p.teacher) === selectedTeacher) {
              newGrid[day].push({
                periodNumber: p.periodNumber,
                classId: tt.enrolledClass?._id || tt.enrolledClass,
                subjectId: p.subject?._id || p.subject,
                startTime: p.startTime,
                endTime: p.endTime
              });
            }
          });
        });
        setStaffGridData(newGrid);
        setLoading(false);
      });
    }
  }, [activeTab, selectedTeacher, classes]);

  // Load Preview
  useEffect(() => {
    if (activeTab === 'preview' && previewEntity) {
      if (previewType === 'class') {
        api.get(`/api/timetable?classId=${previewEntity}`).then(res => setPreviewData(res.data));
      } else {
        api.get(`/api/timetable/teacher/${previewEntity}`).then(res => setPreviewData(res.data));
      }
    } else {
      setPreviewData([]);
    }
  }, [previewEntity, previewType, activeTab]);


  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/api/settings', settings);
      toast.success('Settings saved successfully!');
    } catch(e: any) { 
      toast.error(e.response?.data?.message || 'Error saving settings'); 
    } finally { 
      setSaving(false); 
    }
  };

  const saveStructure = async () => {
    if(!selectedClassName || !selectedSection) {
      toast.error('Please select class and section');
      return;
    }
    if (structurePeriods.length === 0) {
      toast.error('Please add at least one period to the structure before saving.');
      return;
    }
    setSaving(true);
    try {
      const classesToUpdate = selectedSection === 'ALL' 
        ? classes.filter(c => c.name === selectedClassName)
        : classes.filter(c => c.name === selectedClassName && c.section === selectedSection);
        
      if (classesToUpdate.length === 0) {
        toast.error('No matching classes found');
        return;
      }

      await Promise.all(classesToUpdate.map(cls => 
        api.put(`/api/academic/classes/${cls._id}`, { 
          name: cls.name,
          section: cls.section,
          capacity: cls.capacity,
          batch: cls.batch?._id || cls.batch,
          classTeacher: cls.classTeacher?._id || cls.classTeacher,
          periodStructures: structurePeriods 
        })
      ));
      
      const res = await api.get('/api/academic/classes');
      setClasses(res.data);
      toast.success(`Structure saved successfully for ${classesToUpdate.length} class section(s)!`);
    } catch(e: any) { 
      toast.error(e.response?.data?.message || 'Error saving structure'); 
    } finally { 
      setSaving(false); 
    }
  };

  const saveGridTimetable = async () => {
    const cls = getSelectedClassObj();
    if(!cls) {
      toast.error('Please select a class and section');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(DAYS.map(day => {
        const formattedPeriods = gridData[day].map(p => ({
          periodNumber: p.periodNumber,
          subject: p.subjectId || p.subject?._id || p.subject,
          teacher: p.teacherId || p.teacher?._id || p.teacher,
          startTime: p.startTime,
          endTime: p.endTime
        }));
        
        return api.post('/api/timetable', { classId: cls._id, dayOfWeek: day, periods: formattedPeriods });
      }));
      
      const ttRes = await api.get('/api/timetable');
      setAllTimetables(ttRes.data);
      toast.success('Weekly Timetable saved successfully!');
    } catch(e: any) { 
      toast.error(e.response?.data?.message || 'Error saving timetable'); 
    } finally { 
      setSaving(false); 
    }
  };

  const saveStaffGridTimetable = async () => {
    if(!selectedTeacher) {
      toast.error('Please select a teacher');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(DAYS.map(day => {
        const formattedPeriods = staffGridData[day].map(p => ({
          periodNumber: p.periodNumber,
          classId: p.classId || p.enrolledClass?._id || p.enrolledClass,
          subjectId: p.subjectId || p.subject?._id || p.subject,
          startTime: p.startTime,
          endTime: p.endTime
        }));
        
        return api.post('/api/timetable/staff', { teacherId: selectedTeacher, dayOfWeek: day, periods: formattedPeriods });
      }));
      
      const ttRes = await api.get('/api/timetable');
      setAllTimetables(ttRes.data);
      toast.success('Staff Timetable saved successfully!');
    } catch(e: any) { 
      toast.error(e.response?.data?.message || 'Error saving timetable'); 
    } finally { 
      setSaving(false); 
    }
  };

  const getTeacherAssignedClass = (teacherUserId: string, day: string, periodNumber: number, currentClassId?: string) => {
    if (!teacherUserId || !day || !periodNumber) return null;
    const conflictTt = allTimetables.find(t => {
      const tClassId = t.enrolledClass?._id || t.enrolledClass;
      if (currentClassId && tClassId?.toString() === currentClassId?.toString()) return false;
      if (t.dayOfWeek !== day) return false;
      return t.periods?.some((p: any) => {
        const pTeacherId = p.teacher?._id || p.teacher;
        return pTeacherId?.toString() === teacherUserId?.toString() && p.periodNumber === periodNumber;
      });
    });
    
    if (!conflictTt) return null;
    const cId = conflictTt.enrolledClass?._id || conflictTt.enrolledClass;
    const clsObj = classes.find(c => c._id?.toString() === cId?.toString()) || conflictTt.enrolledClass;
    if (clsObj && clsObj.name) {
      return `${clsObj.name} - Sec ${clsObj.section}`;
    }
    return 'Another Class';
  };

  const getClassPeriodAssignedTeacher = (classId: string, day: string, periodNumber: number, currentTeacherId?: string) => {
    if (!classId || !day || !periodNumber) return null;
    const tt = allTimetables.find(t => {
      const tClassId = t.enrolledClass?._id || t.enrolledClass;
      return tClassId?.toString() === classId?.toString() && t.dayOfWeek === day;
    });
    if (!tt) return null;
    const period = tt.periods?.find((p: any) => p.periodNumber === periodNumber);
    if (!period) return null;
    const pTeacherId = period.teacher?._id || period.teacher;
    if (pTeacherId && pTeacherId?.toString() !== currentTeacherId?.toString()) {
      const tObj = teachers.find(t => t.user?._id?.toString() === pTeacherId?.toString());
      return tObj?.user?.name || period.teacher?.name || 'Another Teacher';
    }
    return null;
  };

  const isClassAssignedElsewhere = (cId: string, periodNumber: number, day: string) => {
    return !!getClassPeriodAssignedTeacher(cId, day, periodNumber, selectedTeacher);
  };

  const openModal = (day: string, periodNumber: number, data: any) => {
    setModalCell({ day, periodNumber, data, isStaffMode: false });
    setModalSubject(data?.subjectId || data?.subject?._id || '');
    setModalTeacher(data?.teacherId || data?.teacher?._id || '');
    setModalOpen(true);
  };
  
  const openStaffModal = (day: string, periodNumber: number, data: any) => {
    setModalCell({ day, periodNumber, data, isStaffMode: true });
    setModalSubject(data?.subjectId || data?.subject?._id || '');
    setModalClass(data?.classId || data?.enrolledClass?._id || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalCell(null);
  };

  const saveModalData = () => {
    if (!modalCell) return;
    const { day, periodNumber, isStaffMode } = modalCell;
    
    if (isStaffMode) {
      const conflictTeacher = getClassPeriodAssignedTeacher(modalClass, day, periodNumber, selectedTeacher);
      if (conflictTeacher) {
        toast.error(`Cannot assign: Period ${periodNumber} is already assigned to ${conflictTeacher}.`);
        return;
      }

      const cls = classes.find(c => c._id === modalClass);
      const struct = cls?.periodStructures?.find((ps: any) => ps.periodNumber === periodNumber);
      
      const newData = {
        periodNumber,
        subjectId: modalSubject,
        classId: modalClass,
        startTime: struct?.startTime || '09:00',
        endTime: struct?.endTime || '10:00'
      };
      
      const newDayData = [...staffGridData[day]];
      const existingIdx = newDayData.findIndex(p => p.periodNumber === periodNumber);
      if (existingIdx >= 0) newDayData[existingIdx] = newData;
      else newDayData.push(newData);
      
      setStaffGridData({...staffGridData, [day]: newDayData});
    } else {
      const currentClassId = getSelectedClassObj()?._id;
      const conflictClass = getTeacherAssignedClass(modalTeacher, day, periodNumber, currentClassId);
      if (conflictClass) {
        toast.error(`Cannot assign: Teacher is already assigned to ${conflictClass} on ${day} Period ${periodNumber}.`);
        return;
      }

      const cls = getSelectedClassObj();
      const struct = cls?.periodStructures?.find((ps: any) => ps.periodNumber === periodNumber);
      
      const newData = {
        periodNumber,
        subjectId: modalSubject,
        teacherId: modalTeacher,
        startTime: struct?.startTime || '',
        endTime: struct?.endTime || ''
      };
      
      const newDayData = [...gridData[day]];
      const existingIdx = newDayData.findIndex(p => p.periodNumber === periodNumber);
      if (existingIdx >= 0) newDayData[existingIdx] = newData;
      else newDayData.push(newData);
      
      setGridData({...gridData, [day]: newDayData});
    }
    closeModal();
  };

  const clearGridCell = (day: string, periodNumber: number) => {
    const newDayData = gridData[day].filter(p => p.periodNumber !== periodNumber);
    setGridData({...gridData, [day]: newDayData});
  };
  
  const clearStaffGridCell = (day: string, periodNumber: number) => {
    const newDayData = staffGridData[day].filter(p => p.periodNumber !== periodNumber);
    setStaffGridData({...staffGridData, [day]: newDayData});
  };

  return (
    <div className="space-y-6 max-w-[95%] mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Timetable Management</h1>
        <p className="text-slate-500 mt-1">Configure structures, manage assignments, and view schedules.</p>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto hide-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl">
          <div className="p-5 border-b border-slate-100 bg-indigo-50/50">
            <h2 className="text-lg font-bold text-slate-800">Global Visibility</h2>
          </div>
          <div className="p-5 space-y-4">
            <Toggle label="Show Timetable to Students" description="Allow students to view their class timetable." checked={settings.showTimetableToStudents !== false} onChange={(val: boolean) => setSettings({...settings, showTimetableToStudents: val})} />
            <Toggle label="Show Timetable to Staff" description="Allow teachers to view their teaching schedule." checked={settings.showTimetableToStaff !== false} onChange={(val: boolean) => setSettings({...settings, showTimetableToStaff: val})} />
            <div className="flex justify-end pt-4"><Button onClick={saveSettings} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Settings'}</Button></div>
          </div>
        </motion.div>
      )}

      {/* STRUCTURE TAB */}
      {activeTab === 'structure' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-4xl">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
              <select className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none" value={selectedClassName} onChange={e => { setSelectedClassName(e.target.value); setSelectedSection(''); }}>
                <option value="">-- Choose Class --</option>
                {uniqueClassNames.map(name => <option key={name as string} value={name as string}>{name as string}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Section</label>
              <select className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} disabled={!selectedClassName}>
                <option value="">-- Choose Section --</option>
                <option value="ALL">All Sections (Apply to entire Class)</option>
                {availableSections.map(c => <option key={c._id} value={c.section}>Section {c.section}</option>)}
              </select>
            </div>
          </div>
          
          {selectedClassName && selectedSection && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Period Timings</h3>
                  <p className="text-sm text-slate-500">
                    Define structure for {selectedClassName} {selectedSection === 'ALL' ? '(All Sections)' : `- Section ${selectedSection}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStructurePeriods([...structurePeriods, { periodNumber: structurePeriods.length + 1, startTime: '09:00', endTime: '10:00', type: 'academic', label: '' }])}>
                    <Plus className="w-4 h-4 mr-2"/> Add Period
                  </Button>
                  <Button onClick={saveStructure} disabled={saving}><Save className="w-4 h-4 mr-2"/> Save Structure</Button>
                </div>
              </div>
              
              {structurePeriods.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">No periods defined.</div>
              ) : (
                <div className="space-y-3">
                  {structurePeriods.map((period, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="bg-indigo-100 text-indigo-700 font-bold w-12 h-10 flex items-center justify-center rounded-lg">
                        {!period.type || period.type === 'academic' ? getAcademicPeriodLabel(structurePeriods, idx) : (
                          period.type === 'lunch' ? <Utensils className="w-4 h-4 text-indigo-600" /> : <Coffee className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                          <select value={period.type || 'academic'} onChange={e => { const np = [...structurePeriods]; np[idx].type = e.target.value; setStructurePeriods(np); }} className="w-full px-3 py-1.5 rounded-lg border bg-white">
                            <option value="academic">Academic</option>
                            <option value="break">Break</option>
                            <option value="lunch">Lunch</option>
                            <option value="breakfast">Breakfast</option>
                          </select>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Start Time</label><input type="time" value={period.startTime} onChange={e => { const np = [...structurePeriods]; np[idx].startTime = e.target.value; setStructurePeriods(np); }} className="w-full px-3 py-1.5 rounded-lg border bg-white" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">End Time</label><input type="time" value={period.endTime} onChange={e => { const np = [...structurePeriods]; np[idx].endTime = e.target.value; setStructurePeriods(np); }} className="w-full px-3 py-1.5 rounded-lg border bg-white" /></div>
                      </div>
                      <button onClick={() => { const np = [...structurePeriods]; np.splice(idx, 1); np.forEach((p,i)=>p.periodNumber=i+1); setStructurePeriods(np); }} className="p-2 text-red-400 hover:text-red-600 mt-4"><Trash2 className="w-5 h-5"/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ASSIGN BY CLASS TAB */}
      {activeTab === 'byClass' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
              <select className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none" value={selectedClassName} onChange={e => { setSelectedClassName(e.target.value); setSelectedSection(''); }}>
                <option value="">-- Choose Class --</option>
                {uniqueClassNames.map(name => <option key={name as string} value={name as string}>{name as string}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Section</label>
              <select className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} disabled={!selectedClassName}>
                <option value="">-- Choose Section --</option>
                {availableSections.map(c => <option key={c._id} value={c.section}>Section {c.section}</option>)}
              </select>
            </div>
          </div>

          {selectedClassName && selectedSection && selectedSection !== 'ALL' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500"/> Weekly Grid for {selectedClassName} - Sec {selectedSection}</h3>
                <Button onClick={saveGridTimetable} disabled={saving}><Save className="w-4 h-4 mr-2"/> {saving ? 'Saving...' : 'Save All Changes'}</Button>
              </div>
              
              <div className="p-6 overflow-x-auto">
                {loading ? <div className="text-center py-8 text-slate-500">Loading Grid...</div> : 
                 (getSelectedClassObj()?.periodStructures?.length || 0) === 0 ? <div className="text-center py-8 text-slate-500">No period structure defined for this class. Go to the Structure tab first.</div> :
                 <table className="w-full border-collapse min-w-[800px]">
                   <thead>
                     <tr>
                       <th className="border border-slate-200 bg-slate-50 p-3 text-left w-24">Time</th>
                       {DAYS.map(d => <th key={d} className="border border-slate-200 bg-slate-50 p-3 text-center w-40">{d}</th>)}
                     </tr>
                   </thead>
                   <tbody>
                     {getSelectedClassObj()?.periodStructures?.map((ps: any, idx: number) => {
                       const isNonAcademic = ps.type && ps.type !== 'academic';
                       return (
                         <tr key={ps.periodNumber}>
                           <td className="border border-slate-200 p-3 bg-slate-50 text-center">
                             <span className="block font-black text-slate-700">{isNonAcademic ? '' : getAcademicPeriodLabel(getSelectedClassObj()?.periodStructures || [], idx)}</span>
                             <span className="block text-[10px] font-bold text-slate-400 mt-1 whitespace-nowrap">{ps.startTime} - {ps.endTime}</span>
                           </td>
                           {isNonAcademic ? (
                             <td colSpan={DAYS.length} className="border border-slate-200 p-3 bg-slate-100 text-slate-400 font-bold tracking-[0.2em] uppercase text-center align-middle">
                               {ps.type}
                             </td>
                           ) : (
                             DAYS.map(day => {
                               const cellData = gridData[day]?.find(p => p.periodNumber === ps.periodNumber);
                               let subjName = '';
                               let teachName = '';
                               if (cellData) {
                                 const subjId = cellData.subjectId || cellData.subject?._id || cellData.subject;
                                 const teachId = cellData.teacherId || cellData.teacher?._id || cellData.teacher;
                                 subjName = subjects.find(s => s._id === subjId)?.name || 'Unknown';
                                 teachName = teachers.find(t => t.user?._id === teachId)?.user?.name || 'Unknown';
                               }
                               
                               return (
                                 <td key={day} className="border border-slate-200 p-2 align-top h-20">
                                   {cellData ? (
                                     <div className="bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 p-2 rounded-lg relative group h-full transition-colors cursor-pointer" onClick={() => openModal(day, ps.periodNumber, cellData)}>
                                       <p className="font-bold text-indigo-900 text-sm truncate">{subjName}</p>
                                       <p className="text-xs text-indigo-600 truncate">{teachName}</p>
                                       {(() => {
                                          const teachId = cellData.teacherId || cellData.teacher?._id || cellData.teacher;
                                          const conflictClass = getTeacherAssignedClass(teachId, day, ps.periodNumber, getSelectedClassObj()?._id);
                                          if (conflictClass) {
                                            return (
                                              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 truncate" title={`Conflict: Also assigned to ${conflictClass}`}>
                                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                                <span className="truncate">{conflictClass}</span>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                       <button onClick={(e) => { e.stopPropagation(); clearGridCell(day, ps.periodNumber); }} className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity">
                                         <Trash2 className="w-3 h-3"/>
                                       </button>
                                     </div>
                                   ) : (
                                     <div 
                                       onClick={() => openModal(day, ps.periodNumber, null)} 
                                       className="h-full min-h-[60px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-300 hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-500 cursor-pointer transition-all"
                                     >
                                       <Plus className="w-5 h-5"/>
                                     </div>
                                   )}
                                 </td>
                               )
                             })
                           )}
                         </tr>
                       )
                     })}
                   </tbody>
                 </table>
                }
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ASSIGN BY STAFF TAB */}
      {activeTab === 'byStaff' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Staff Member</label>
            <select className="w-full max-w-md px-4 py-2 rounded-xl border bg-slate-50 outline-none" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
              <option value="">-- Choose --</option>
              {teachers.map(t => <option key={t.user?._id} value={t.user?._id}>{t.user?.name}</option>)}
            </select>
          </div>

          {selectedTeacher && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500"/> Weekly Grid for {teachers.find(t=>t.user?._id === selectedTeacher)?.user?.name}</h3>
                <Button onClick={saveStaffGridTimetable} disabled={saving}><Save className="w-4 h-4 mr-2"/> {saving ? 'Saving...' : 'Save All Changes'}</Button>
              </div>
              
              <div className="p-6 overflow-x-auto">
                {loading ? <div className="text-center py-8 text-slate-500">Loading Grid...</div> : 
                 <table className="w-full border-collapse min-w-[800px]">
                   <thead>
                     <tr>
                       <th className="border border-slate-200 bg-slate-50 p-3 text-left w-24">Period</th>
                       {DAYS.map(d => <th key={d} className="border border-slate-200 bg-slate-50 p-3 text-center w-40">{d}</th>)}
                     </tr>
                   </thead>
                   <tbody>
                     {Array.from({length: maxPeriods}).map((_, i) => {
                       const pNum = i + 1;
                       return (
                         <tr key={pNum}>
                           <td className="border border-slate-200 p-3 bg-slate-50 text-center">
                             <span className="block font-black text-slate-700">Slot {pNum}</span>
                           </td>
                           {DAYS.map(day => {
                             const cellData = staffGridData[day]?.find(p => p.periodNumber === pNum);
                             let subjName = '';
                             let classNameStr = '';
                             if (cellData) {
                               const subjId = cellData.subjectId || cellData.subject?._id || cellData.subject;
                               const clsId = cellData.classId || cellData.enrolledClass?._id || cellData.enrolledClass;
                               subjName = subjects.find(s => s._id === subjId)?.name || 'Unknown';
                               const c = classes.find(cl => cl._id === clsId);
                               classNameStr = c ? `${c.name}-${c.section}` : 'Unknown';
                             }
                             
                             return (
                               <td key={day} className="border border-slate-200 p-2 align-top h-20">
                                 {cellData ? (
                                   <div className="bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 p-2 rounded-lg relative group h-full transition-colors cursor-pointer" onClick={() => openStaffModal(day, pNum, cellData)}>
                                     <p className="font-bold text-indigo-900 text-sm truncate">{subjName}</p>
                                     <p className="text-xs text-indigo-600 truncate">{classNameStr}</p>
                                     <p className="text-[10px] text-slate-400 mt-1">{cellData.startTime} - {cellData.endTime}</p>
                                     <button onClick={(e) => { e.stopPropagation(); clearStaffGridCell(day, pNum); }} className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity">
                                       <Trash2 className="w-3 h-3"/>
                                     </button>
                                   </div>
                                 ) : (
                                   <div 
                                     onClick={() => openStaffModal(day, pNum, null)} 
                                     className="h-full min-h-[60px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-300 hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-500 cursor-pointer transition-all"
                                   >
                                     <Plus className="w-5 h-5"/>
                                   </div>
                                 )}
                               </td>
                             )
                           })}
                         </tr>
                       )
                     })}
                   </tbody>
                 </table>
                }
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* PREVIEW TAB */}
      {activeTab === 'preview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-4 items-end">
             <div className="w-64">
               <label className="block text-sm font-medium text-slate-700 mb-1">Preview Type</label>
               <select className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none" value={previewType} onChange={e => { setPreviewType(e.target.value); setPreviewEntity(''); }}>
                 <option value="class">Class Section</option>
                 <option value="teacher">Staff Member</option>
               </select>
             </div>
             
             {previewType === 'class' ? (
               <>
                 <div className="w-64">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
                   <select className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none" value={selectedClassName} onChange={e => { setSelectedClassName(e.target.value); setSelectedSection(''); setPreviewEntity(''); }}>
                     <option value="">-- Choose Class --</option>
                     {uniqueClassNames.map(name => <option key={name as string} value={name as string}>{name as string}</option>)}
                   </select>
                 </div>
                 <div className="w-64">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Select Section</label>
                   <select className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none" value={selectedSection} onChange={e => { setSelectedSection(e.target.value); const cls = classes.find(c => c.name === selectedClassName && c.section === e.target.value); setPreviewEntity(cls?._id || ''); }} disabled={!selectedClassName}>
                     <option value="">-- Choose Section --</option>
                     {availableSections.map(c => <option key={c._id} value={c.section}>Section {c.section}</option>)}
                   </select>
                 </div>
               </>
             ) : (
               <div className="w-64">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Select Teacher</label>
                 <select className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none" value={previewEntity} onChange={e => setPreviewEntity(e.target.value)}>
                   <option value="">-- Choose --</option>
                   {teachers.map(t => <option key={t.user?._id} value={t.user?._id}>{t.user?.name}</option>)}
                 </select>
               </div>
             )}
           </div>

           {previewEntity && (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="font-bold text-lg mb-4">Weekly Schedule</h3>
               {DAYS.map(day => {
                 let dayPeriods: any[] = [];
                 if (previewType === 'class') {
                   const tt = previewData.find(t => t.dayOfWeek === day);
                   if (tt) dayPeriods = tt.periods;
                 } else {
                   const tts = previewData.filter(t => t.dayOfWeek === day);
                   tts.forEach(tt => tt.periods.forEach((p: any) => dayPeriods.push({...p, enrolledClass: tt.enrolledClass})));
                   dayPeriods.sort((a, b) => a.periodNumber - b.periodNumber);
                 }
                 if (dayPeriods.length === 0) return null;
                 return (
                   <div key={day} className="mb-6 last:mb-0">
                     <h4 className="font-bold text-slate-700 bg-slate-50 p-2 rounded-lg mb-2">{day}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                       {dayPeriods.map((p: any, i: number) => {
                         const cId = p.enrolledClass?._id || p.enrolledClass || previewEntity;
                         const cls = classes.find(c => c._id === cId);
                         const structIdx = cls?.periodStructures?.findIndex((s:any) => s.periodNumber === p.periodNumber) ?? -1;
                         const pLabel = structIdx >= 0 && cls?.periodStructures ? getAcademicPeriodLabel(cls.periodStructures, structIdx) : `P${p.periodNumber}`;
                         
                         return (
                         <div key={i} className="border border-slate-200 rounded-xl p-3 flex gap-3">
                           <div className="bg-indigo-50 text-indigo-700 font-bold w-12 h-12 flex items-center justify-center rounded-lg shrink-0">{pLabel}</div>
                           <div className="min-w-0">
                             <p className="font-bold text-sm truncate">{p.subject?.name}</p>
                             <p className="text-xs text-slate-500 truncate">{previewType === 'class' ? `by ${p.teacher?.name}` : `Class ${p.enrolledClass?.name}-${p.enrolledClass?.section}`}</p>
                             <p className="text-xs text-slate-400 mt-1">{p.startTime} - {p.endTime}</p>
                           </div>
                         </div>
                       )})}
                     </div>
                   </div>
                 );
               })}
               {previewData.length === 0 && <div className="text-center text-slate-500 py-8">No timetable data found.</div>}
             </div>
           )}
        </motion.div>
      )}

      {/* ASSIGNMENT MODAL (GRID) */}
      <AnimatePresence>
        {modalOpen && modalCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Assign {(() => {
                  const clsId = modalCell.isStaffMode ? modalClass : getSelectedClassObj()?._id;
                  const cls = classes.find(c => c._id === clsId);
                  const structIdx = cls?.periodStructures?.findIndex((s:any) => s.periodNumber === modalCell.periodNumber) ?? -1;
                  return structIdx >= 0 && cls?.periodStructures ? getAcademicPeriodLabel(cls.periodStructures, structIdx) : `Slot ${modalCell.periodNumber}`;
                })()}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {modalCell.day} • {modalCell.isStaffMode ? teachers.find(t=>t.user?._id === selectedTeacher)?.user?.name : `${getSelectedClassObj()?.name} Sec ${getSelectedClassObj()?.section}`}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                  <select value={modalSubject} onChange={e => {
                    setModalSubject(e.target.value);
                    if (!modalCell.isStaffMode) setModalTeacher('');
                  }} className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none">
                    <option value="">Select Subject...</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                
                {modalCell.isStaffMode ? (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Class Section</label>
                    <select value={modalClass} onChange={e => setModalClass(e.target.value)} className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none">
                      <option value="">Select Class...</option>
                      {classes.map(c => {
                        const assignedTeacher = getClassPeriodAssignedTeacher(c._id, modalCell.day, modalCell.periodNumber, selectedTeacher);
                        return (
                          <option key={c._id} value={c._id} disabled={!!assignedTeacher} className={assignedTeacher ? 'text-red-500 font-medium' : ''}>
                            {c.name} - Sec {c.section} {assignedTeacher ? `— (Assigned to ${assignedTeacher})` : ''}
                          </option>
                        );
                      })}
                    </select>
                    {modalClass && (() => {
                      const conflictTeacher = getClassPeriodAssignedTeacher(modalClass, modalCell.day, modalCell.periodNumber, selectedTeacher);
                      if (conflictTeacher) {
                        return (
                          <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span className="font-bold shrink-0">Conflict Detected:</span>
                            <span>Period {modalCell.periodNumber} for this class is already assigned to <strong className="underline">{conflictTeacher}</strong>.</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Teacher</label>
                    <select value={modalTeacher} onChange={e => setModalTeacher(e.target.value)} className="w-full px-4 py-2 rounded-xl border bg-slate-50 outline-none" disabled={!modalSubject}>
                      <option value="">{modalSubject ? 'Select Teacher...' : 'Select a subject first'}</option>
                      {teachers
                        .filter(t => {
                          if (!modalSubject) return false;
                          const teacherSubId = t.subject?._id || t.subject;
                          if (teacherSubId && teacherSubId === modalSubject) return true;
                          if (Array.isArray(t.assignedSubjects) && t.assignedSubjects.some((as: any) => (as?._id || as) === modalSubject)) return true;
                          
                          // Fallback name matching
                          const subjectObj = subjects.find(s => s._id === modalSubject);
                          if (!subjectObj || !t.department) return true;
                          return t.department.toLowerCase().includes(subjectObj.name.toLowerCase()) || subjectObj.name.toLowerCase().includes(t.department.toLowerCase());
                        })
                        .map(t => {
                          const assignedClass = getTeacherAssignedClass(t.user?._id, modalCell.day, modalCell.periodNumber, getSelectedClassObj()?._id);
                          return (
                            <option key={t.user?._id} value={t.user?._id} disabled={!!assignedClass} className={assignedClass ? 'text-red-500 font-medium' : ''}>
                              {t.user?.name} {assignedClass ? `— (Already assigned to ${assignedClass})` : `(${t.subject?.name || t.department || 'General'})`}
                            </option>
                          );
                        })
                      }
                    </select>
                    {modalTeacher && (() => {
                      const conflictClass = getTeacherAssignedClass(modalTeacher, modalCell.day, modalCell.periodNumber, getSelectedClassObj()?._id);
                      if (conflictClass) {
                        return (
                          <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span className="font-bold shrink-0">Conflict Detected:</span>
                            <span>This teacher is already assigned to <strong className="underline font-bold">{conflictClass}</strong> on {modalCell.day} Period {modalCell.periodNumber}.</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
                
                <div className="pt-4 flex gap-3">
                  <Button variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
                  <Button 
                    onClick={saveModalData} 
                    className="flex-1" 
                    disabled={
                      !modalSubject || 
                      (modalCell.isStaffMode 
                        ? (!modalClass || !!getClassPeriodAssignedTeacher(modalClass, modalCell.day, modalCell.periodNumber, selectedTeacher))
                        : (!modalTeacher || !!getTeacherAssignedClass(modalTeacher, modalCell.day, modalCell.periodNumber, getSelectedClassObj()?._id))
                      )
                    }
                  >
                    Update Cell
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
