"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Camera, Download, LogOut, Search, Filter, Eye } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function VisitorModulePage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentVisitor, setCurrentVisitor] = useState<any>(null);

  // Form State
  const [visitorName, setVisitorName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [whatsappNo, setWhatsappNo] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [email, setEmail] = useState('');
  const [noOfVisitors, setNoOfVisitors] = useState('1');
  const [visitorType, setVisitorType] = useState('Parent'); // Default
  const [meetingPerson, setMeetingPerson] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [address, setAddress] = useState('');
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/visitors');
      setVisitors(res.data);
    } catch (error) {
      console.error('Failed to fetch visitors', error);
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleAddNew = () => {
    setCurrentVisitor(null);
    setVisitorName('');
    setMobileNo('');
    setWhatsappNo('');
    setSameAsMobile(false);
    setEmail('');
    setNoOfVisitors('1');
    setVisitorType('Parent');
    setMeetingPerson('');
    setDateAndTimes();
    setAddress('');
    setPhotoUrl(null);
    setIsEditing(true);
  };

  const setDateAndTimes = () => {
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    setCheckInTime(`${currentHours}:${currentMinutes}`);
    setCheckOutTime('');
  };

  const setDate = (d: string) => setMeetingDate(d);

  const handleEdit = (visitor: any) => {
    setCurrentVisitor(visitor);
    setVisitorName(visitor.visitorName);
    setMobileNo(visitor.mobileNo);
    setWhatsappNo(visitor.whatsappNo || '');
    setSameAsMobile(visitor.mobileNo === visitor.whatsappNo);
    setEmail(visitor.email || '');
    setNoOfVisitors(visitor.noOfVisitors?.toString() || '1');
    setVisitorType(visitor.visitorType);
    setMeetingPerson(visitor.meetingPerson);
    setMeetingDate(visitor.meetingDate);
    setCheckInTime(visitor.checkInTime);
    setCheckOutTime(visitor.checkOutTime || '');
    setAddress(visitor.address || '');
    setPhotoUrl(visitor.photoUrl || null);
    setIsEditing(true);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setIsCapturing(true);
      setPhotoUrl(null);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      toast.error('Unable to access camera.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const takeSnap = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visitor pass?')) return;
    try {
      await api.delete(`/api/visitors/${id}`);
      toast.success('Visitor deleted successfully');
      fetchVisitors();
    } catch (error) {
      toast.error('Failed to delete visitor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      visitorName, 
      mobileNo, 
      whatsappNo: sameAsMobile ? mobileNo : whatsappNo, 
      email, 
      noOfVisitors: parseInt(noOfVisitors, 10), 
      visitorType, 
      meetingPerson, 
      meetingDate, 
      checkInTime, 
      checkOutTime, 
      address,
      photoUrl
    };
    
    try {
      if (currentVisitor) {
        await api.put(`/api/visitors/${currentVisitor._id}`, payload);
        toast.success('Visitor updated successfully');
      } else {
        await api.post('/api/visitors', payload);
        toast.success('Visitor added successfully');
      }
      setIsEditing(false);
      fetchVisitors();
    } catch (err) {
      toast.error('Failed to save visitor');
    }
  };

  const handleMarkCheckOut = async (id: string) => {
    try {
      const now = new Date();
      const timeOutStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await api.put(`/api/visitors/${id}`, { checkOutTime: timeOutStr });
      toast.success('Visitor checked out');
      fetchVisitors();
    } catch (error) {
      toast.error('Failed to checkout visitor');
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {currentVisitor ? 'Edit Visitor' : 'Add Visitor'}
        </h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 max-w-4xl">
              
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Visitor Name:<span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white" 
                  placeholder="Enter Name"
                  required 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Mobile No:<span className="text-rose-500">*</span></label>
                <div className="flex border rounded-lg overflow-hidden focus-within:border-purple-500 bg-white">
                  <span className="px-3 py-2 bg-slate-50 border-r text-sm text-slate-600 flex items-center font-medium">
                    +91
                  </span>
                  <input 
                    type="tel" 
                    value={mobileNo}
                    onChange={e => {
                      setMobileNo(e.target.value);
                      if (sameAsMobile) setWhatsappNo(e.target.value);
                    }}
                    className="flex-1 px-4 py-2 text-sm focus:outline-none" 
                    placeholder="Phone Number"
                    required 
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="sameAsMobile"
                    checked={sameAsMobile}
                    onChange={e => {
                      setSameAsMobile(e.target.checked);
                      if (e.target.checked) setWhatsappNo(mobileNo);
                    }}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="sameAsMobile" className="text-xs text-slate-600">Mobile number same as WhatsApp number</label>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Whatsapp Number:<span className="text-rose-500">*</span></label>
                <div className="flex border rounded-lg overflow-hidden focus-within:border-purple-500 bg-white opacity-90">
                  <span className="px-3 py-2 bg-slate-50 border-r text-sm text-slate-600 flex items-center font-medium">
                    +91
                  </span>
                  <input 
                    type="tel" 
                    value={whatsappNo}
                    onChange={e => setWhatsappNo(e.target.value)}
                    disabled={sameAsMobile}
                    className="flex-1 px-4 py-2 text-sm focus:outline-none disabled:bg-slate-50 disabled:text-slate-500" 
                    placeholder="WhatsApp number"
                    required 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Email:</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white" 
                  placeholder="Enter Email"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">No Of Visitors:<span className="text-rose-500">*</span></label>
                <select 
                  value={noOfVisitors}
                  onChange={e => setNoOfVisitors(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-purple-500"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Visitor Type <span className="text-rose-500">*</span></label>
                <select 
                  value={visitorType}
                  onChange={e => setVisitorType(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="Parent">Parent</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Guest">Guest</option>
                  <option value="Official">Official</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Meeting Person: <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  </span>
                  <input 
                    type="text" 
                    value={meetingPerson}
                    onChange={e => setMeetingPerson(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white" 
                    placeholder="Who are they meeting?"
                    required 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Meeting Date:<span className="text-rose-500">*</span></label>
                <input 
                  type="date" 
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white" 
                  required 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Check In-time: <span className="text-rose-500">*</span></label>
                <input 
                  type="time" 
                  value={checkInTime}
                  onChange={e => setCheckInTime(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white" 
                  required 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Check out-time:</label>
                <input 
                  type="time" 
                  value={checkOutTime}
                  onChange={e => setCheckOutTime(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Address:<span className="text-rose-500">*</span></label>
                <textarea 
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-sm h-24 resize-none focus:outline-none focus:border-purple-500 bg-white" 
                  placeholder="Address"
                  required 
                />
              </div>
            </div>

            <div className="mt-10">
              <label className="block text-base font-bold text-slate-800 mb-4">Add Photo :</label>
              <div className="border rounded-xl p-6 bg-slate-50 inline-block max-w-sm w-full shadow-sm text-center">
                <p className="text-sm font-medium text-slate-600 mb-6 text-left">Set up Face Capture</p>
                <div className="w-32 h-32 mx-auto bg-slate-200 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-6 overflow-hidden relative">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Visitor" className="w-full h-full object-cover" />
                  ) : isCapturing ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-12 h-12 text-slate-400" />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                {!isCapturing && !photoUrl && (
                  <p className="text-xs text-slate-500 mb-6">
                    Click Start Capturing to use your Camera.<br/>
                    Allow access if prompted.
                  </p>
                )}
                <div className="flex items-center justify-center gap-3">
                  {!isCapturing && !photoUrl && (
                    <button type="button" onClick={startCamera} className="px-4 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Start Capturing</button>
                  )}
                  {isCapturing && (
                    <button type="button" onClick={takeSnap} className="px-4 py-1.5 bg-[#9352F3] text-white rounded-lg text-xs font-semibold hover:bg-purple-600 transition-colors">Take Snap</button>
                  )}
                  {photoUrl && (
                    <button type="button" onClick={() => setPhotoUrl(null)} className="px-4 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Retake</button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="px-8 py-2.5 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-8 py-2.5 bg-[#9352F3] text-white rounded-lg text-sm font-semibold hover:bg-purple-600 transition-colors"
              >
                {currentVisitor ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        
        <div className="bg-[#9352F3] px-6 py-4">
          <h2 className="text-white font-semibold">Visitor Module</h2>
        </div>
        
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-white">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="relative max-w-xs w-full sm:w-auto">
              <input 
                type="text"
                placeholder="Start date - End date"
                className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="relative max-w-xs w-full sm:w-auto min-w-[140px]">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:border-purple-500 appearance-none bg-white">
                <option value="">Select Filter</option>
                <option value="parent">Parent</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-amber-600 font-semibold text-sm rounded-lg hover:bg-amber-50">
              <span className="font-mono border border-amber-600 px-1 rounded-sm text-[10px]">QR</span> SCAN QR
            </button>
            <button className="px-6 py-2 border border-slate-200 font-semibold text-sm rounded-lg hover:bg-slate-50 text-slate-700">
              EXPORT
            </button>
            <button 
              onClick={handleAddNew}
              className="px-6 py-2 bg-[#9352F3] text-white font-semibold text-sm rounded-lg hover:bg-purple-600 transition-colors"
            >
              ADD VISITOR
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#9352F3] text-white">
              <tr>
                <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">VISITOR NAME</th>
                <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">NO. OF VISITORS</th>
                <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">VISITOR PURPOSE</th>
                <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">MEETING PERSON</th>
                <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">CHECK IN</th>
                <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">CHECK OUT</th>
                <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Loading visitors...
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                visitors.map((visitor) => (
                  <tr key={visitor._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {visitor.visitorName}
                      <div className="text-xs text-slate-500 font-normal">{visitor.mobileNo}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-center">{visitor.noOfVisitors}</td>
                    <td className="px-6 py-4 text-slate-600">{visitor.visitorType}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{visitor.meetingPerson}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{visitor.checkInTime}</div>
                      <div className="text-xs text-slate-500">{visitor.meetingDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      {visitor.checkOutTime ? (
                        <div className="text-slate-900">{visitor.checkOutTime}</div>
                      ) : (
                        <span className="text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded">Still In</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!visitor.checkOutTime && (
                          <button 
                            onClick={() => handleMarkCheckOut(visitor._id)}
                            className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                            title="Check Out"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(visitor)}
                          className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(visitor._id)}
                          className="p-1.5 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors"
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
        
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600 bg-white">
          <div>Showing 1 to {visitors.length} of {visitors.length} entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border rounded hover:bg-slate-50 text-slate-400 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1 border rounded hover:bg-slate-50 text-slate-400 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
