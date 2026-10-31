"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Bus, MapPin, Phone, Sun, Moon, CheckCircle2, Clock, History } from 'lucide-react';

export default function ParentTransportPage() {
  const { user } = useAuthStore();
  const [children, setChildren] = useState<any[]>([]);
  const [transportData, setTransportData] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [childrenRes, transportRes, logsRes] = await Promise.all([
          api.get(`/api/students/children?parentId=${user?.id}`),
          api.get('/api/transport'),
          api.get('/api/transport/logs')
        ]);
        
        const myChildren = childrenRes.data;
        setChildren(myChildren);
        
        const allBuses = transportRes.data;
        setLogs(logsRes.data || []);
        
        const data: Record<string, any> = {};
        for (const child of myChildren) {
          const assignedBus = allBuses.find((b: any) => 
            b.students.some((s: any) => (typeof s === 'string' ? s === child._id : s._id === child._id))
          );
          if (assignedBus) data[child._id] = assignedBus;
        }
        setTransportData(data);
      } catch (err) {
        console.error('Failed to fetch parent transport data', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Bus className="w-8 h-8 text-amber-500" />
          Transport & Bus Tracking
        </h1>
        <p className="text-slate-500 mt-1">Real-time morning/evening bus status alerts, driver details, and history logs.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading transport info...</div>
      ) : children.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">No children linked to your account.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child, i) => {
            const bus = transportData[child._id];

            // Get logs for this child's bus
            const childBusLogs = bus 
              ? logs.filter((l: any) => (typeof l.transport === 'string' ? l.transport === bus._id : l.transport?._id === bus._id))
              : [];
            
            const latestReachedLog = childBusLogs.find((l: any) => l.eventType === 'REACHED_SCHOOL');
            const latestStartedLog = childBusLogs.find((l: any) => l.eventType === 'STARTED_FROM_SCHOOL');
            
            return (
              <motion.div key={child._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {child.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{child.user?.name || 'Child'}</h3>
                      <p className="text-xs text-slate-500">Class {child.enrolledClass?.name || 'N/A'}</p>
                    </div>
                  </div>
                  {bus && bus.busNumber && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                      Bus No. {bus.busNumber}
                    </span>
                  )}
                </div>
                
                <div className="p-5 flex-1 flex flex-col space-y-4">
                  {!bus ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                      <Bus className="w-8 h-8 mb-2 opacity-50 text-slate-300" />
                      <p className="text-sm font-medium">No school transport assigned.</p>
                    </div>
                  ) : (
                    <>
                      {/* Live Status Card */}
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-amber-600" /> Today's Bus Status
                        </h4>

                        <div className="space-y-2">
                          {/* Morning Status */}
                          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100 flex items-center gap-2.5 text-xs">
                            <Sun className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <div>
                              <span className="font-bold text-slate-800">Morning Arrival: </span>
                              {latestReachedLog ? (
                                <span className="text-emerald-700 font-semibold">
                                  Reached School at {new Date(latestReachedLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(latestReachedLog.timestamp).toLocaleDateString()})
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Not marked yet today</span>
                              )}
                            </div>
                          </div>

                          {/* Evening Status */}
                          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100 flex items-center gap-2.5 text-xs">
                            <Moon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <div>
                              <span className="font-bold text-slate-800">Evening Departure: </span>
                              {latestStartedLog ? (
                                <span className="text-amber-700 font-semibold">
                                  Started from School at {new Date(latestStartedLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(latestStartedLog.timestamp).toLocaleDateString()})
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Not marked yet today</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bus & Driver Details */}
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-500 font-bold uppercase">Vehicle Number</span>
                          <span className="font-mono font-bold text-slate-900">{bus.vehicleNumber}</span>
                        </div>
                        
                        <div className="flex items-start gap-2.5 p-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-slate-400 uppercase text-[10px]">Route</p>
                            <p className="font-semibold text-slate-800">{bus.route}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 p-2 text-slate-700">
                          <Phone className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-slate-400 uppercase text-[10px]">Driver Contact</p>
                            <p className="font-semibold text-slate-800">{bus.driverName}</p>
                            <p className="text-slate-500">{bus.driverContact}</p>
                          </div>
                        </div>
                      </div>

                      {/* History Log Timeline for Bus */}
                      {childBusLogs.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-slate-400" /> Bus History Logs
                          </h5>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {childBusLogs.slice(0, 5).map((log: any) => (
                              <div key={log._id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-[11px]">
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  {log.eventType === 'REACHED_SCHOOL' ? (
                                    <>
                                      <Sun className="w-3.5 h-3.5 text-amber-500" /> Reached School
                                    </>
                                  ) : (
                                    <>
                                      <Moon className="w-3.5 h-3.5 text-indigo-500" /> Departed School
                                    </>
                                  )}
                                </span>
                                <span className="text-slate-500 font-mono text-[10px]">
                                  {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
