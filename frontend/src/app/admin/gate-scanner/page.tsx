"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, Camera, ShieldCheck, CheckCircle, Clock, XCircle, 
  Search, RefreshCw, Volume2, UserCheck, QrCode, AlertCircle, X,
  GraduationCap
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function GateScannerPage() {
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scannedPass, setScannedPass] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  const html5QrCodeRef = useRef<any>(null);

  // Play audio beep on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5 note
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {}
  };

  const fetchRecentScans = async () => {
    try {
      const res = await api.get('/api/gatepass/logs');
      setRecentScans(res.data.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch recent scans', error);
    }
  };

  useEffect(() => {
    fetchRecentScans();
  }, []);

  // Initialize Scanner
  useEffect(() => {
    let isMounted = true;

    if (isCameraActive) {
      setCameraError('');
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        if (!isMounted) return;

        const scannerId = "checkpoint-reader";
        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.max(180, Math.floor(minEdge * 0.72));
              return { width: qrboxSize, height: qrboxSize };
            }
          },
          (decodedText: string) => {
            handleScanSuccess(decodedText);
          },
          () => {}
        ).catch((err: any) => {
          if (!isMounted) return;
          console.warn("Camera start failed, error:", err);
          setCameraError('Camera access unavailable or blocked. Please allow permissions or enter Pass Code below.');
        });
      }).catch(err => {
        console.error("Html5Qrcode import error", err);
      });
    } else {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current?.clear();
          }).catch(() => {});
        } catch (e) {}
      }
    }

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current?.clear();
          }).catch(() => {});
        } catch (e) {}
      }
    };
  }, [isCameraActive]);

  const handleScanSuccess = (rawCode: string) => {
    playBeep();
    let passCode = rawCode.trim();
    try {
      if (rawCode.startsWith('{') && rawCode.endsWith('}')) {
        const parsed = JSON.parse(rawCode);
        if (parsed.passCode) passCode = parsed.passCode;
      }
    } catch (e) {}

    lookupPass(passCode);
  };

  const lookupPass = async (code: string) => {
    if (!code) {
      toast.error('Please enter a valid Pass Code');
      return;
    }
    const toastId = toast.loading('Searching for Gate Pass...');
    try {
      const res = await api.get(`/api/gatepass/lookup/${encodeURIComponent(code)}`);
      toast.dismiss(toastId);
      setScannedPass(res.data);
      toast.success('Gate Pass verified & loaded!');
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.response?.data?.message || 'Pass not found for the provided QR code');
    }
  };

  const handleVerifyExit = async () => {
    if (!scannedPass) return;
    setIsVerifying(true);
    try {
      const res = await api.post(`/api/gatepass/verify/${encodeURIComponent(scannedPass.passCode)}`, {});
      toast.success('Security Clearance Approved! Exit logged.');
      setScannedPass(res.data.pass);
      fetchRecentScans();
    } catch (error: any) {
      console.error('Gate pass verification error:', error.response?.data || error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to approve exit');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMarkReturned = async () => {
    if (!scannedPass) return;
    setIsVerifying(true);
    try {
      const now = new Date();
      const timeInStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const res = await api.put(`/api/gatepass/${scannedPass._id}`, { status: 'returned', timeIn: timeInStr });
      toast.success('Student marked as Returned successfully!');
      setScannedPass(res.data);
      fetchRecentScans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update pass');
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Verified & Exited School
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Returned to Campus
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Cancelled Pass
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Active • Awaiting Exit Approval
          </span>
        );
    }
  };

  const studentNameDisplay = scannedPass?.studentDetails?.name || scannedPass?.studentName || scannedPass?.personName;
  const escortNameDisplay = scannedPass?.visitorName || 
    (scannedPass?.personName !== studentNameDisplay ? scannedPass?.personName : 
    (scannedPass?.relationship ? `${scannedPass.relationship} (${scannedPass.personName})` : scannedPass?.personName));

  return (
    <div className="p-3 md:p-5 bg-slate-100 min-h-screen space-y-4">
      {/* Sleek Top Checkpoint Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                Security Gate Checkpoint
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Station #1 Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Real-time gate pass QR verification & student departure logger</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isCameraActive 
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCameraActive ? 'Pause Camera' : 'Resume Camera'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Scanner + Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Live Camera + Manual Input (4 Columns) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-purple-600" />
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Live Camera Feed</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-slate-400" /> Beep On
              </span>
            </div>

            {/* Video Feed Box */}
            <div className="w-full h-64 bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-900 flex items-center justify-center shadow-inner">
              {isCameraActive ? (
                <div id="checkpoint-reader" className="w-full h-full relative" />
              ) : (
                <div className="text-center p-4 text-slate-400 space-y-2">
                  <Camera className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs font-medium">Camera is currently paused.</p>
                  <button 
                    onClick={() => setIsCameraActive(true)}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 cursor-pointer"
                  >
                    Turn On Camera
                  </button>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/90 p-4 flex flex-col items-center justify-center text-center text-white space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                  <p className="text-xs text-slate-300">{cameraError}</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
              Point pass QR code directly in front of the lens.
            </p>

            {/* Manual Pass Code Fallback Input */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <label className="block text-[11px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">
                Manual Pass Code / Barcode Gun
              </label>
              <div className="flex gap-1.5">
                <input 
                  type="text" 
                  value={manualCode} 
                  onChange={e => setManualCode(e.target.value)} 
                  placeholder="e.g. GP-20261013-1400" 
                  className="flex-1 px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      lookupPass(manualCode);
                    }
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => lookupPass(manualCode)}
                  className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Lookup</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clearance Details & Photo Inspection (8 Columns) */}
        <div className="lg:col-span-8">
          {scannedPass ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 px-5 py-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h2 className="font-extrabold text-sm leading-tight">Security Clearance Inspection</h2>
                    <span className="text-[11px] text-white/80 font-mono">Pass Code: {scannedPass.passCode}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(scannedPass.status)}
                  <button
                    onClick={() => setScannedPass(null)}
                    className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Clear & Next Scan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 md:p-5 space-y-4">
                {/* Two-Column Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Student Card */}
                  <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-purple-600" /> Student Profile
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-200/70 text-purple-900">
                        {scannedPass.studentClass} - {scannedPass.studentSection}
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900 leading-tight">
                        {studentNameDisplay}
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                        Admission ID: <span className="font-bold text-slate-800">{scannedPass.studentId || '-'}</span>
                        {scannedPass.studentDetails?.rollNumber && (
                          <span className="ml-1.5 font-sans text-slate-500">• Roll No: {scannedPass.studentDetails.rollNumber}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 pt-1.5 border-t border-purple-200/60 flex items-center justify-between">
                      <span>Time Out: <strong className="text-amber-700 font-bold">{scannedPass.timeOut}</strong></span>
                      <span>Date: <strong className="text-slate-800 font-semibold">{scannedPass.date}</strong></span>
                    </div>
                  </div>

                  {/* Visitor / Escort Card */}
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-indigo-600" /> Authorized Escort
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-200/70 text-indigo-900 uppercase">
                        {scannedPass.relationship || 'Guardian'}
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900 leading-tight">
                        {escortNameDisplay}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                        📞 {scannedPass.contactNumber || 'No phone recorded'}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 pt-1.5 border-t border-indigo-200/60">
                      ID Proof: <strong className="text-slate-800 font-semibold">{scannedPass.idProofType} ({scannedPass.idReference || 'Ref Verified'})</strong>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Departure Purpose: </span>
                    <span>{scannedPass.reason}</span>
                  </div>
                </div>

                {/* Identification Photos Side-by-Side */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Identification Photos for Verification
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Click photo to zoom</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Visitor Face Photo */}
                    <div 
                      onClick={() => scannedPass.personPhoto && setZoomedImage({ url: scannedPass.personPhoto, title: `Visitor Face: ${escortNameDisplay}` })}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 transition-all rounded-xl border border-slate-200 text-center cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-700 block mb-1.5 group-hover:text-purple-600">
                        Visitor / Escort Face
                      </span>
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shadow-sm flex items-center justify-center relative">
                        {scannedPass.personPhoto ? (
                          <>
                            <img src={scannedPass.personPhoto} alt="Visitor Face" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-colors">
                              <Search className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">No Photo Captured</span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 block mt-1.5 truncate">
                        {escortNameDisplay}
                      </span>
                    </div>

                    {/* ID Proof Document */}
                    <div 
                      onClick={() => scannedPass.proofPhoto && setZoomedImage({ url: scannedPass.proofPhoto, title: `${scannedPass.idProofType} Document` })}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 transition-all rounded-xl border border-slate-200 text-center cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-700 block mb-1.5 group-hover:text-purple-600">
                        ID Proof Document
                      </span>
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shadow-sm flex items-center justify-center relative">
                        {scannedPass.proofPhoto ? (
                          <>
                            <img src={scannedPass.proofPhoto} alt="ID Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-colors">
                              <Search className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">No Document Photo</span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 block mt-1.5 truncate">
                        {scannedPass.idProofType} ({scannedPass.idReference || 'Ref Verified'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verified By Metadata */}
                {scannedPass.verifiedByName && (
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Security Officer Clearance: <strong>{scannedPass.verifiedByName}</strong></span>
                    </div>
                    {scannedPass.verifiedAt && (
                      <span className="text-emerald-700 font-semibold text-[11px]">
                        {new Date(scannedPass.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                )}

                {/* Verification Actions */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setScannedPass(null)}
                    className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Clear / Next Scan
                  </button>

                  <div className="flex items-center gap-2">
                    {scannedPass.status === 'issued' && (
                      <button
                        onClick={handleVerifyExit}
                        disabled={isVerifying}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{isVerifying ? 'Approving Exit...' : 'Verify & Approve Exit'}</span>
                      </button>
                    )}

                    {scannedPass.status === 'verified' && (
                      <button
                        onClick={handleMarkReturned}
                        disabled={isVerifying}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{isVerifying ? 'Updating...' : 'Mark Student Returned'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">Checkpoint Scanner Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Scan parent app or printed slip QR code, or type Pass Code into manual input on the left to verify photos and approve departure.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Live Checkpoint Activity Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-5 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider">Today's Checkpoint Activity Log</h3>
          </div>
          <button 
            onClick={fetchRecentScans}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-5 py-2.5 font-bold uppercase">PASS CODE</th>
                <th className="px-5 py-2.5 font-bold uppercase">STUDENT & CLASS</th>
                <th className="px-5 py-2.5 font-bold uppercase">AUTHORIZED ESCORT</th>
                <th className="px-5 py-2.5 font-bold uppercase">TIME</th>
                <th className="px-5 py-2.5 font-bold uppercase text-center">STATUS</th>
                <th className="px-5 py-2.5 font-bold uppercase">VERIFIED BY</th>
                <th className="px-5 py-2.5 font-bold uppercase text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentScans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-400 text-xs">
                    No clearance activity logged yet today.
                  </td>
                </tr>
              ) : (
                recentScans.map((scan) => (
                  <tr key={scan._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-2.5 font-mono font-bold text-purple-700">
                      {scan.passCode}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="font-bold text-slate-800">
                        {scan.studentName || scan.personName}
                      </div>
                      <div className="text-[10px] text-slate-500">Class {scan.studentClass}-{scan.studentSection}</div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="font-semibold text-slate-800">
                        {scan.relationship || 'Visitor'}
                      </div>
                      <div className="text-[10px] text-slate-400">{scan.contactNumber || '-'}</div>
                    </td>
                    <td className="px-5 py-2.5 font-semibold text-amber-700">
                      Out: {scan.timeOut}
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      {getStatusBadge(scan.status)}
                    </td>
                    <td className="px-5 py-2.5">
                      {scan.verifiedByName ? (
                        <span className="font-bold text-slate-800">{scan.verifiedByName}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => setScannedPass(scan)}
                        className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-bold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Screen Lightbox Modal for Photo Inspection */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-2xl w-full max-h-[90vh] flex flex-col items-center shadow-2xl"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-white">
              <h3 className="font-bold text-sm">{zoomedImage.title}</h3>
              <button 
                onClick={() => setZoomedImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full flex-1 overflow-auto p-3 flex items-center justify-center">
              <img 
                src={zoomedImage.url} 
                alt={zoomedImage.title} 
                className="max-w-full max-h-[65vh] object-contain rounded-xl border border-slate-700 shadow-md" 
              />
            </div>
            <div className="pt-2 text-xs text-slate-400">
              High resolution identity verification preview
            </div>
          </div>
        </div>
      )}

      {/* Global CSS overrides for clean camera viewfinder */}
      <style jsx global>{`
        #checkpoint-reader {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
        #checkpoint-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem !important;
        }
        #checkpoint-reader img {
          display: none !important;
        }
        #checkpoint-reader__scan_region {
          border: 2px solid #a855f7 !important;
          border-radius: 1rem !important;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.4) !important;
        }
        #qr-shaded-region {
          border-color: rgba(15, 23, 42, 0.4) !important;
        }
      `}</style>
    </div>
  );
}
