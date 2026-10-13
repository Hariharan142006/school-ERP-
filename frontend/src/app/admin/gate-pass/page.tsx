"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Camera, 
  QrCode, ShieldCheck, UserCheck, Search, Printer, 
  X, Eye
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function GatePassPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'logs'>('active');

  const [passes, setPasses] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentPass, setCurrentPass] = useState<any>(null);

  // Verification & View Modals
  const [verifyingPass, setVerifyingPass] = useState<any | null>(null);
  const [viewingPass, setViewingPass] = useState<any | null>(null);
  const [isVerifyingAction, setIsVerifyingAction] = useState(false);

  // Filter in Logs
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('all');

  // Form State
  const [passType, setPassType] = useState('student');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  const [personName, setPersonName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [idProofType, setIdProofType] = useState('Aadhar Card');
  const [contactNumber, setContactNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentSection, setStudentSection] = useState('');
  const [reason, setReason] = useState('');
  const [idReference, setIdReference] = useState('');
  const [date, setDate] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [timeIn, setTimeIn] = useState('');
  const [status, setStatus] = useState<'issued' | 'verified' | 'returned' | 'cancelled'>('issued');

  // Camera State & Refs for Form Photos
  const [isCapturingProof, setIsCapturingProof] = useState(false);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);

  const proofVideoRef = useRef<HTMLVideoElement>(null);
  const faceVideoRef = useRef<HTMLVideoElement>(null);
  const proofCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [passesRes, classesRes, studentsRes] = await Promise.all([
        api.get('/api/gatepass'),
        api.get('/api/academic/classes'),
        api.get('/api/students')
      ]);
      setPasses(passesRes.data);
      setClassesList(classesRes.data);
      setStudentsList(studentsRes.data.data || studentsRes.data);
    } catch (error) {
      console.error('Failed to fetch gate pass data', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/api/gatepass/logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Failed to fetch gate pass logs', error);
      toast.error('Failed to load pass logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const handleConfirmVerify = async () => {
    if (!verifyingPass) return;
    setIsVerifyingAction(true);
    try {
      const res = await api.post(`/api/gatepass/verify/${verifyingPass.passCode}`);
      toast.success('Gate Pass verified! Exit approved.');
      setVerifyingPass(res.data.pass);
      fetchData();
      if (activeTab === 'logs') fetchLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify gate pass');
    } finally {
      setIsVerifyingAction(false);
    }
  };

  const handleMarkReturnedFromVerification = async () => {
    if (!verifyingPass) return;
    setIsVerifyingAction(true);
    try {
      const now = new Date();
      const timeInStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const res = await api.put(`/api/gatepass/${verifyingPass._id}`, { status: 'returned', timeIn: timeInStr });
      toast.success('Marked as returned successfully!');
      setVerifyingPass(res.data);
      fetchData();
      if (activeTab === 'logs') fetchLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update pass');
    } finally {
      setIsVerifyingAction(false);
    }
  };

  const uniqueYears = Array.from(new Set(classesList.map(c => c.batch?.name).filter(Boolean)));
  const filteredClasses = classesList.filter(c => c.batch?.name === selectedYear);
  const uniqueClassNames = Array.from(new Set(filteredClasses.map(c => c.name)));
  const filteredSections = filteredClasses.filter(c => c.name === selectedClass).map(c => c.section);
  
  const filteredStudents = studentsList.filter(s => 
    s.enrolledClass?.name === selectedClass && 
    s.enrolledClass?.section === selectedSection
  );

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentObjId = e.target.value;
    const student = studentsList.find(s => s._id === studentObjId);
    if (student) {
      setStudentName(student.user?.name || '');
      setStudentId(student.admissionNumber || '');
      setContactNumber(student.contactNumber || '');
      if (!personName) {
        setPersonName(student.fatherName || '');
      }
    } else {
      setStudentName('');
      setStudentId('');
      setContactNumber('');
    }
  };

  const handleAddNew = () => {
    setCurrentPass(null);
    setPassType('student');
    setPersonName('');
    setStudentName('');
    setRelationship('Father');
    setIdProofType('Aadhar Card');
    setContactNumber('');
    setStudentId('');
    setStudentClass('');
    setStudentSection('');
    setReason('');
    
    const now = new Date();
    setIdReference('');
    setDate(now.toISOString().split('T')[0]);
    setTimeOut(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setTimeIn('');
    setStatus('issued');
    setProofPhoto(null);
    setFacePhoto(null);
    setIsEditing(true);
  };

  const handleEdit = (pass: any) => {
    setCurrentPass(pass);
    
    const student = studentsList.find(s => s.admissionNumber === pass.studentId);
    if (student) {
      setSelectedYear(student.enrolledClass?.batch?.name || '');
      setSelectedClass(student.enrolledClass?.name || pass.studentClass || '');
      setSelectedSection(student.enrolledClass?.section || pass.studentSection || '');
    } else {
      setSelectedYear('');
      setSelectedClass(pass.studentClass || '');
      setSelectedSection(pass.studentSection || '');
    }
    
    setPassType(pass.passType || 'student');
    setPersonName(pass.personName);
    setStudentName(pass.studentName || (student?.user?.name || ''));
    setRelationship(pass.relationship || '');
    setIdProofType(pass.idProofType || 'Aadhar Card');
    setContactNumber(pass.contactNumber || '');
    setStudentId(pass.studentId || '');
    setStudentClass(pass.studentClass || '');
    setStudentSection(pass.studentSection || '');
    setReason(pass.reason);
    setIdReference(pass.idReference || '');
    setDate(pass.date);
    setTimeOut(pass.timeOut);
    setTimeIn(pass.timeIn || '');
    setStatus(pass.status);
    setProofPhoto(pass.proofPhoto || null);
    setFacePhoto(pass.personPhoto || null);
    setIsEditing(true);
  };

  const startCamera = async (type: 'proof' | 'face') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (type === 'proof') {
        setIsCapturingProof(true);
        setProofPhoto(null);
        setTimeout(() => {
          if (proofVideoRef.current) {
            proofVideoRef.current.srcObject = stream;
          }
        }, 100);
      } else {
        setIsCapturingFace(true);
        setFacePhoto(null);
        setTimeout(() => {
          if (faceVideoRef.current) {
            faceVideoRef.current.srcObject = stream;
          }
        }, 100);
      }
    } catch (err) {
      toast.error('Unable to access camera. Please allow permissions.');
      console.error(err);
    }
  };

  const stopCamera = (type: 'proof' | 'face') => {
    const videoRef = type === 'proof' ? proofVideoRef : faceVideoRef;
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (type === 'proof') setIsCapturingProof(false);
    else setIsCapturingFace(false);
  };

  const takeSnap = (type: 'proof' | 'face') => {
    const videoRef = type === 'proof' ? proofVideoRef : faceVideoRef;
    const canvasRef = type === 'proof' ? proofCanvasRef : faceCanvasRef;
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (type === 'proof') {
          setProofPhoto(dataUrl);
        } else {
          setFacePhoto(dataUrl);
        }
        stopCamera(type);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gate pass?')) return;
    try {
      await api.delete(`/api/gatepass/${id}`);
      toast.success('Gate pass deleted successfully');
      fetchData();
      if (activeTab === 'logs') fetchLogs();
    } catch (error) {
      toast.error('Failed to delete gate pass');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPersonName = personName.trim() || relationship || studentName;
    const payload = { 
      passType: 'student', 
      personName: finalPersonName, 
      studentName: studentName || '',
      relationship, 
      idProofType, 
      contactNumber, 
      studentId, 
      studentClass, 
      studentSection, 
      reason, 
      idReference, 
      date, 
      timeOut, 
      timeIn, 
      status,
      proofPhoto,
      personPhoto: facePhoto
    };
    
    try {
      if (currentPass) {
        await api.put(`/api/gatepass/${currentPass._id}`, payload);
        toast.success('Gate pass updated successfully');
      } else {
        const res = await api.post('/api/gatepass', payload);
        toast.success('Gate pass issued with QR Code!');
        setViewingPass(res.data);
      }
      setIsEditing(false);
      fetchData();
      if (activeTab === 'logs') fetchLogs();
    } catch (err) {
      toast.error('Failed to save gate pass');
    }
  };

  const handleMarkReturned = async (id: string) => {
    try {
      const now = new Date();
      const timeInStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await api.put(`/api/gatepass/${id}`, { status: 'returned', timeIn: timeInStr });
      toast.success('Marked as returned');
      fetchData();
      if (activeTab === 'logs') fetchLogs();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.personName || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.passCode || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.studentId || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.verifiedByName || '').toLowerCase().includes(logSearch.toLowerCase());
    
    const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Verified & Out
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Returned
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Issued / Pending Exit
          </span>
        );
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {currentPass ? 'Edit Gate Pass' : 'New Gate Pass'}
        </h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-white" />
              <h2 className="text-white font-bold">
                {currentPass ? 'Edit Pass Details' : 'Generate New Gate Pass with QR'}
              </h2>
            </div>
            <span className="text-xs text-white/80 font-medium">QR Code will be auto-generated</span>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Academic Year</label>
                <select 
                  value={selectedYear}
                  onChange={e => { setSelectedYear(e.target.value); setSelectedClass(''); setSelectedSection(''); setPersonName(''); }}
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Year</option>
                  {uniqueYears.map((year: any) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Class</label>
                <select 
                  value={selectedClass}
                  onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); setPersonName(''); setStudentClass(e.target.value); }}
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={!selectedYear}
                >
                  <option value="">Select Class</option>
                  {uniqueClassNames.map((cName: any) => <option key={cName} value={cName}>{cName}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Section</label>
                <select 
                  value={selectedSection}
                  onChange={e => { setSelectedSection(e.target.value); setPersonName(''); setStudentSection(e.target.value); }}
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={!selectedClass}
                >
                  <option value="">Select Section</option>
                  {filteredSections.map((sec: any) => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Student</label>
                <select 
                  value={studentsList.find(s => s.admissionNumber === studentId)?._id || ''}
                  onChange={handleStudentChange}
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={!selectedSection}
                >
                  <option value="">Select Student</option>
                  {filteredStudents.map((student: any) => (
                    <option key={student._id} value={student._id}>
                      {student.user?.name} ({student.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">ID Proof Type</label>
                <select
                  value={idProofType}
                  onChange={e => setIdProofType(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Aadhar Card">Aadhar Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Parent ID">Parent ID</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">ID Proof Number</label>
                <input 
                  type="text" 
                  value={idReference}
                  onChange={e => setIdReference(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                  placeholder="e.g. 1234 5678 9012"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Contact Number</label>
                <input 
                  type="text" 
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Visitor / Escort Name</label>
                <input 
                  type="text" 
                  value={personName}
                  onChange={e => setPersonName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                  placeholder="e.g. Parent Name / Authorized Relative"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Relationship to Student</label>
                <input 
                  type="text" 
                  value={relationship}
                  onChange={e => setRelationship(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                  placeholder="e.g. Father, Mother, Guardian, Driver, Self"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Date</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Departure Time Out</label>
                <input 
                  type="time" 
                  value={timeOut}
                  onChange={e => setTimeOut(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Expected Return Time (Optional)</label>
                <input 
                  type="time" 
                  value={timeIn}
                  onChange={e => setTimeIn(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Pass Status</label>
                <select 
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="issued">Issued / Ready for Exit</option>
                  <option value="verified">Verified & Exited</option>
                  <option value="returned">Returned / In School</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Reason / Purpose of Leaving</label>
              <textarea 
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" 
                placeholder="e.g. Medical emergency, Doctor appointment, Family event, Going home early..."
                required 
              />
            </div>

            <div className="mt-8">
              <label className="block text-base font-bold text-slate-800 mb-4">Security Photos Capture :</label>
              <div className="flex flex-wrap gap-8">
                
                {/* Proof Photo */}
                <div className="border rounded-2xl p-6 bg-slate-50 flex-1 min-w-[280px] max-w-sm shadow-sm text-center">
                  <p className="text-sm font-bold text-slate-700 mb-4 text-left flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-600" /> ID Proof Photo
                  </p>
                  <div className="w-48 h-32 mx-auto bg-slate-200 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-6 overflow-hidden relative">
                    {proofPhoto ? (
                      <img src={proofPhoto} alt="Proof" className="w-full h-full object-cover" />
                    ) : isCapturingProof ? (
                      <video ref={proofVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-10 h-10 text-slate-400" />
                    )}
                    <canvas ref={proofCanvasRef} className="hidden" />
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    {!isCapturingProof && !proofPhoto && (
                      <button type="button" onClick={() => startCamera('proof')} className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Start Camera</button>
                    )}
                    {isCapturingProof && (
                      <button type="button" onClick={() => takeSnap('proof')} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors">Take Snap</button>
                    )}
                    {proofPhoto && (
                      <button type="button" onClick={() => setProofPhoto(null)} className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Retake</button>
                    )}
                  </div>
                </div>

                {/* Person Photo */}
                <div className="border rounded-2xl p-6 bg-slate-50 flex-1 min-w-[280px] max-w-sm shadow-sm text-center">
                  <p className="text-sm font-bold text-slate-700 mb-4 text-left flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" /> Visitor / Person Face Photo
                  </p>
                  <div className="w-32 h-32 mx-auto bg-slate-200 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-6 overflow-hidden relative">
                    {facePhoto ? (
                      <img src={facePhoto} alt="Face" className="w-full h-full object-cover" />
                    ) : isCapturingFace ? (
                      <video ref={faceVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-12 h-12 text-slate-400" />
                    )}
                    <canvas ref={faceCanvasRef} className="hidden" />
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    {!isCapturingFace && !facePhoto && (
                      <button type="button" onClick={() => startCamera('face')} className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Start Camera</button>
                    )}
                    {isCapturingFace && (
                      <button type="button" onClick={() => takeSnap('face')} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors">Take Snap</button>
                    )}
                    {facePhoto && (
                      <button type="button" onClick={() => setFacePhoto(null)} className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Retake</button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition-all"
              >
                {currentPass ? 'Update Gate Pass' : 'Issue Pass & Generate QR'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Header with Title and Generate Button ONLY */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gate Pass Management</h1>
          <p className="text-slate-500 text-sm mt-1">Issue gate passes with scannable QR codes, manage departures, and view audit logs.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Generate Gate Pass Button */}
          <button 
            onClick={handleAddNew}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Gate Pass</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-4 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'active' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active & Recent Passes</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 font-extrabold ml-1">
            {passes.filter(p => p.status === 'issued' || p.status === 'verified').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'logs' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Gate Pass Logs</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700 font-extrabold ml-1">
            {logs.length || passes.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ACTIVE PASSES */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-white font-bold">Active Gate Passes</h2>
            <span className="text-xs text-white/80">Real-time status tracking</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase">DATE & PASS CODE</th>
                  <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase">PERSON / VISITOR</th>
                  <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase">STUDENT DETAILS</th>
                  <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase">REASON</th>
                  <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase text-center">TIME OUT</th>
                  <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase text-center">STATUS</th>
                  <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase text-center">QR CODE</th>
                  <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Loading gate passes...
                    </td>
                  </tr>
                ) : passes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No gate passes issued yet. Click <strong>Generate Gate Pass</strong> above to create one.
                    </td>
                  </tr>
                ) : (
                  passes.map((pass) => (
                    <tr key={pass._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{pass.date}</div>
                        <div className="text-xs font-mono text-purple-600 font-semibold mt-0.5">
                          {pass.passCode || `GP-${pass._id.slice(-6).toUpperCase()}`}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {pass.personPhoto ? (
                            <img src={pass.personPhoto} alt="Face" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                              {pass.personName?.charAt(0) || 'P'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{pass.personName}</div>
                            <div className="text-xs text-slate-500">
                              {pass.relationship && <span className="font-medium mr-1.5">{pass.relationship}</span>}
                              {pass.contactNumber && <span>📞 {pass.contactNumber}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">
                          Class {pass.studentClass || '-'} {pass.studentSection ? `(${pass.studentSection})` : ''}
                        </div>
                        <div className="text-xs text-slate-500">
                          Adm ID: <span className="font-semibold text-slate-700">{pass.studentId || '-'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600 max-w-[180px] truncate" title={pass.reason}>
                        {pass.reason}
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-amber-600">
                        {pass.timeOut}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(pass.status)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {pass.qrCode ? (
                          <button
                            onClick={() => setViewingPass(pass)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-xs font-bold cursor-pointer"
                            title="View / Print Pass with QR"
                          >
                            <QrCode className="w-4 h-4 text-purple-600" />
                            <span>View Pass</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No QR</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {pass.status === 'verified' && (
                            <button 
                              onClick={() => handleMarkReturned(pass._id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Mark Student as Returned"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Return
                            </button>
                          )}

                          <button 
                            onClick={() => handleEdit(pass)}
                            className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Edit Pass"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => handleDelete(pass._id)}
                            className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Delete Pass"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PASS LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Logs Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input 
                  type="text" 
                  value={logSearch} 
                  onChange={e => setLogSearch(e.target.value)} 
                  placeholder="Search logs by person, student, pass code, reason..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <select 
                value={logStatusFilter} 
                onChange={e => setLogStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified & Exited</option>
                <option value="returned">Returned</option>
                <option value="issued">Issued / Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button 
              onClick={fetchLogs} 
              className="px-4 py-2 text-xs font-bold text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer self-end md:self-auto"
            >
              Refresh Logs
            </button>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold">Gate Pass Verification Audit Trail</h2>
              </div>
              <span className="text-xs text-slate-400">Total Entries: {filteredLogs.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase">DATE & PASS CODE</th>
                    <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase">PERSON & PHOTO</th>
                    <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase">STUDENT & CLASS</th>
                    <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase text-center">TIME (OUT / IN)</th>
                    <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase text-center">STATUS</th>
                    <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase">VERIFIED BY</th>
                    <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase">VERIFIED AT</th>
                    <th className="px-6 py-3.5 font-bold text-xs tracking-wider uppercase text-right">DETAILS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                        Loading verification logs...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No logs match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{log.date}</div>
                          <div className="text-xs font-mono text-purple-600 font-semibold mt-0.5">
                            {log.passCode || `GP-${log._id.slice(-6).toUpperCase()}`}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {log.personPhoto ? (
                              <img src={log.personPhoto} alt="Person" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {log.personName?.charAt(0) || 'P'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900">{log.personName}</div>
                              <div className="text-xs text-slate-500">{log.relationship || 'Visitor'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">
                            Class {log.studentClass || '-'} {log.studentSection ? `(${log.studentSection})` : ''}
                          </div>
                          <div className="text-xs text-slate-500">
                            Adm: <span className="font-semibold text-slate-700">{log.studentId || '-'}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="font-bold text-amber-600 text-xs">Out: {log.timeOut}</div>
                          <div className="font-bold text-emerald-600 text-xs">In: {log.timeIn || '--:--'}</div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(log.status)}
                        </td>

                        <td className="px-6 py-4">
                          {log.verifiedByName ? (
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <div>
                                <div className="font-bold text-slate-800 text-xs">{log.verifiedByName}</div>
                                <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                  {log.verifiedBy?.role || 'Admin'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Pending Verification</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-600">
                          {log.verifiedAt ? (
                            <div>
                              <div className="font-semibold text-slate-800">
                                {new Date(log.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(log.verifiedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setViewingPass(log)}
                            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                            title="Inspect Pass & Photos"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW & PRINT PASS SLIP MODAL */}
      {viewingPass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white print:hidden">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">Official School Gate Pass</h3>
              </div>
              <button 
                onClick={() => setViewingPass(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Pass Slip Content */}
            <div id="printable-gate-pass" className="p-6 bg-white space-y-4 text-center">
              <div className="border-b pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600">
                  Aathithiya International School
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">STUDENT GATE PASS</h2>
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                  {viewingPass.passCode}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="py-2 flex flex-col items-center justify-center">
                {viewingPass.qrCode ? (
                  <div className="p-2.5 bg-white border-2 border-slate-900 rounded-2xl shadow-sm">
                    <img src={viewingPass.qrCode} alt="Pass QR Code" className="w-44 h-44 object-contain" />
                  </div>
                ) : (
                  <div className="w-44 h-44 border border-dashed rounded-2xl flex items-center justify-center text-xs text-slate-400">
                    No QR Generated
                  </div>
                )}
                <span className="text-[11px] font-semibold text-slate-400 mt-2">Scan at the security checkpoint</span>
              </div>

              {/* Pass Key Details Grid */}
              <div className="text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <strong className="text-slate-800">{viewingPass.personName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admission No:</span>
                  <span className="font-mono font-bold text-slate-700">{viewingPass.studentId || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class & Section:</span>
                  <span className="font-semibold text-slate-700">{viewingPass.studentClass} - {viewingPass.studentSection}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorized Escort:</span>
                  <span className="font-semibold text-slate-700">{viewingPass.relationship || 'Guardian'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Departure Time Out:</span>
                  <strong className="text-amber-600">{viewingPass.timeOut}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-700">{viewingPass.date}</span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <span className="text-slate-500 block text-[10px]">Reason:</span>
                  <span className="text-slate-800 font-medium">{viewingPass.reason}</span>
                </div>
              </div>

              {/* Verification Stamp if Verified */}
              {viewingPass.verifiedByName && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified by {viewingPass.verifiedByName} on {new Date(viewingPass.verifiedAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {/* Print Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
              <button 
                type="button" 
                onClick={() => setViewingPass(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button 
                type="button" 
                onClick={() => window.print()}
                className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
