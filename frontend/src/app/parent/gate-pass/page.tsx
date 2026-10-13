"use client";

import React, { useState, useEffect } from 'react';
import { 
  QrCode, ShieldCheck, Clock, CheckCircle, AlertTriangle, 
  Printer, UserCheck, CalendarClock, ArrowUpRight 
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { io } from 'socket.io-client';

export default function ParentGatePassPage() {
  const { user } = useAuthStore();
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState<any | null>(null);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/gatepass/parent');
      setPasses(res.data);
      if (res.data.length > 0 && !selectedPass) {
        setSelectedPass(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch parent gate passes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on('gatepass_issued', () => {
      fetchPasses();
    });
    socket.on('gatepass_verified', () => {
      fetchPasses();
    });
    socket.on('gatepass_returned', () => {
      fetchPasses();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Verified & Exited School
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Returned to School
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Active • Show at Security Gate
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold uppercase tracking-wider">
            Security & Exit
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Gate Pass</h1>
        <p className="text-slate-500 mt-1">Official digital gate passes issued for your children. Present the QR code at the school gate.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-semibold">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading your gate passes...
        </div>
      ) : passes.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center p-8">
          <QrCode className="w-14 h-14 text-slate-300 mb-4" />
          <p className="text-lg font-bold text-slate-800">No Gate Passes Issued</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            When the school administration issues an early exit or departure pass for your child, it will appear here with a digital QR code.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Pass List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Issued Passes ({passes.length})
            </h3>
            {passes.map((p) => {
              const isSelected = selectedPass?._id === p._id;
              return (
                <div
                  key={p._id}
                  onClick={() => setSelectedPass(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-purple-50/70 border-purple-400 shadow-sm ring-1 ring-purple-300' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-100">
                      {p.passCode}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{p.date}</span>
                  </div>

                  <div className="font-bold text-slate-900 text-sm">{p.personName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Class {p.studentClass} - {p.studentSection} • Out: <strong className="text-amber-600">{p.timeOut}</strong>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {getStatusBadge(p.status)}
                    <ArrowUpRight className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-slate-300'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Full Pass Details with Large QR Code */}
          {selectedPass && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-5 h-5 text-purple-300" />
                    <div>
                      <h2 className="font-black text-base">Digital Gate Pass Slip</h2>
                      <span className="text-xs text-white/80 font-mono">{selectedPass.passCode}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Verification Status</span>
                      {getStatusBadge(selectedPass.status)}
                    </div>

                    {selectedPass.verifiedByName && (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-semibold">Verified by Security</span>
                        <span className="text-xs font-bold text-slate-800">{selectedPass.verifiedByName}</span>
                        {selectedPass.verifiedAt && (
                          <span className="text-[11px] text-slate-500 block">
                            {new Date(selectedPass.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* QR Code and Photos Display */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
                    {/* QR Code */}
                    <div className="text-center">
                      <div className="p-3 bg-white border-2 border-slate-900 rounded-3xl shadow-md inline-block">
                        {selectedPass.qrCode ? (
                          <img src={selectedPass.qrCode} alt="Gate Pass QR" className="w-52 h-52 object-contain" />
                        ) : (
                          <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">No QR Code Available</div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-600 block mt-2">
                        Present this QR to Security Officer
                      </span>
                    </div>

                    {/* Escort / Visitor Photo */}
                    {selectedPass.personPhoto && (
                      <div className="text-center">
                        <div className="w-40 h-40 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm mx-auto bg-slate-100">
                          <img src={selectedPass.personPhoto} alt="Authorized Escort" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 block mt-2">
                          Authorized Visitor Photo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Key Pass Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Student Name</span>
                      <strong className="text-slate-900 text-base">{selectedPass.personName}</strong>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Admission Number</span>
                      <span className="font-mono font-bold text-slate-800">{selectedPass.studentId || '-'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Enrolled Class</span>
                      <span className="font-semibold text-slate-800">Class {selectedPass.studentClass} - {selectedPass.studentSection}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Authorized Escort / Relation</span>
                      <span className="font-semibold text-slate-800">{selectedPass.relationship || 'Guardian / Self'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Approved Departure Time</span>
                      <strong className="text-amber-600 text-base">{selectedPass.timeOut}</strong>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Valid Date</span>
                      <span className="font-semibold text-slate-800">{selectedPass.date}</span>
                    </div>
                  </div>

                  {/* Reason Box */}
                  <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-xs">
                    <span className="font-bold text-purple-900 block mb-0.5">Departure Reason:</span>
                    <p className="text-slate-700 leading-relaxed">{selectedPass.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
