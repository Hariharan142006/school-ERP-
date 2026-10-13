"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { LogIn, Sparkles, Calendar as CalendarIcon, Eye, EyeOff, ChevronLeft, ChevronRight, GraduationCap, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export default function LandingPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Public Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  const openCalendar = async () => {
    setShowCalendar(true);
    setLoadingCalendar(true);
    try {
      const res = await api.get('/api/calendar');
      setCalendarEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load calendar', err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', { username, password });
      const { token, user } = response.data;
      
      setAuth(user, token);

      switch(user.role) {
        case 'SUPER_ADMIN': router.push('/admin/dashboard'); break;
        case 'SUB_ADMIN': {
          const redirectUrl = user.customRole?.permissions?.[0] || '/admin/dashboard';
          window.location.href = redirectUrl;
          break;
        }
        case 'STUDENT': router.push('/student/dashboard'); break;
        case 'TEACHER': router.push('/teacher/dashboard'); break;
        case 'PARENT': router.push('/parent/dashboard'); break;
        default: router.push('/');
      }
    } catch (err: any) {
      console.error('Login error details:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (!err.response) {
        setError('Server Connection Error: Unable to reach http://localhost:5000. Please verify backend is running.');
      } else {
        setError('Invalid credentials. Please check username & password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-screen max-h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans relative flex flex-col justify-between">
      
      {/* BACKGROUND GRAPHIC BLOBS (Dashboard Indigo/Violet Theme) */}
      {/* Top Right Indigo/Violet Curved Shape */}
      <div className="absolute top-0 right-0 w-[55vw] h-[55vh] bg-gradient-to-bl from-indigo-600 via-indigo-500 to-violet-600 rounded-bl-[100%] pointer-events-none z-0 shadow-2xl opacity-95"></div>
      
      {/* Bottom Left Soft Indigo Circle */}
      <div className="absolute -bottom-24 -left-24 w-[45vw] h-[45vh] bg-gradient-to-tr from-indigo-100 via-violet-50/40 to-transparent rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-20 px-8 sm:px-14 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-black text-lg border border-indigo-400/30">
            GA
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">GLOBAL ACADEMY</h1>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">International School ERP</p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-8 sm:px-14 py-4 gap-8 overflow-y-auto">
        
        {/* LEFT COLUMN: School Hero Brand & Headline */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 font-black">Smart School</span> Administration & Digital Learning
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
              Unified portal for Students, Teachers, Parents, and Administrators to manage classes, attendance, examinations, fee collection, and academic schedules effortlessly.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <div className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-700">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Comprehensive Academic Suite</span>
            </div>
            <div className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-700">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Multi-Role Access Control</span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: MacBook Laptop Mockup with Indigo Display Screen */}
        <div className="lg:col-span-7 flex justify-center items-center p-2">
          <motion.div 
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-2xl relative"
          >
            {/* LAPTOP BEZEL FRAME */}
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="bg-slate-900 border-[7px] border-slate-800 rounded-[28px] shadow-2xl p-3 relative overflow-hidden">
              
              {/* Webcam Notch Dot */}
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700 mx-auto mb-2 relative z-20 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
              </div>

              {/* LAPTOP DISPLAY SCREEN (Indigo/Violet Theme) */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 rounded-xl overflow-hidden relative shadow-inner p-6 sm:p-8 flex flex-col justify-center items-center min-h-[420px]">
                
                {/* Screen Decorative Curves */}
                <div className="absolute -top-16 -right-16 w-60 h-60 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-indigo-300/20 rounded-full blur-xl pointer-events-none"></div>

                {/* Simulated Screen Top Header Bar */}
                <div className="absolute top-0 left-0 right-0 h-9 bg-slate-900/30 backdrop-blur-md px-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  </div>
                  <div className="w-8"></div>
                </div>

                {/* LOGIN CARD INSIDE LAPTOP SCREEN */}
                <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/90 relative z-10 mt-6">
                  
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 font-bold border border-indigo-400/20">
                      <LogIn className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">Sign In</h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">EduERP Portal</p>
                    </div>
                  </div>

                  <motion.form 
                    onSubmit={handleLogin} 
                    className="space-y-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                  >
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-rose-50 text-rose-600 text-xs font-semibold p-3 rounded-xl border border-rose-200 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                        <span>{error}</span>
                      </motion.div>
                    )}
                    
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="username">
                        Username / Login ID
                      </label>
                      <input
                        id="username"
                        type="text"
                        placeholder="Enter username..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        suppressHydrationWarning
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
                      />
                    </motion.div>
                    
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="password">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          suppressHydrationWarning
                          className="w-full px-3.5 py-2.5 pr-10 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          suppressHydrationWarning
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </motion.div>
                    
                    {/* FLUID SPRING MOTION BUTTON */}
                    <motion.button 
                      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      type="submit" 
                      disabled={loading}
                      className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 border border-indigo-400/20 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      <span>{loading ? 'Authenticating...' : 'Sign In To Dashboard'}</span>
                      {!loading && <ArrowRight className="w-4 h-4 text-white" />}
                    </motion.button>
                  </motion.form>

                </div>
              </div>
            </motion.div>

            {/* LAPTOP KEYBOARD BASE STAND */}
            <div className="w-[106%] -ml-[3%] h-4 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-b-2xl shadow-2xl relative border-t border-slate-500">
              <div className="w-20 h-1.5 bg-slate-500 rounded-b-md mx-auto"></div>
            </div>

          </motion.div>
        </div>

      </main>

      {/* Public Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Academic Calendar</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Upcoming Events & Holidays</p>
                </div>
              </div>
              <button onClick={() => setShowCalendar(false)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors cursor-pointer">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {loadingCalendar ? (
                <div className="py-12 text-center text-slate-500 font-medium animate-pulse">Loading schedule...</div>
              ) : (
                <div className="w-full">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-slate-900">
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="p-2 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="p-2 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
                    {/* Days of week */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="bg-slate-50 py-3 text-center text-xs font-black text-slate-500 uppercase tracking-wider">
                        {day}
                      </div>
                    ))}
                    
                    {/* Blanks */}
                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                      <div key={`blank-${i}`} className="bg-white min-h-[100px] p-2"></div>
                    ))}
                    
                    {/* Days */}
                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                      const dayNumber = i + 1;
                      const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber).toISOString().split('T')[0];
                      
                      const dayEvents = calendarEvents.filter(evt => {
                        const start = new Date(evt.startDate).toISOString().split('T')[0];
                        const end = new Date(evt.endDate).toISOString().split('T')[0];
                        return dateStr >= start && dateStr <= end;
                      });

                      const isToday = new Date().toISOString().split('T')[0] === dateStr;

                      return (
                        <div key={dayNumber} className={`bg-white min-h-[100px] p-2 hover:bg-slate-50 transition-colors ${isToday ? 'ring-2 ring-inset ring-indigo-500' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                              {dayNumber}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1 mt-1">
                            {dayEvents.map(evt => (
                              <div key={`${evt._id}-${dayNumber}`} className={`px-2 py-1 rounded-xl text-[9px] font-bold leading-tight truncate
                                ${evt.type === 'HOLIDAY' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                                  evt.type === 'EXAM' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 
                                  evt.type === 'TERM' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 
                                  'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}
                                title={evt.title}
                              >
                                {evt.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-white text-center">
              <button onClick={() => setShowCalendar(false)} className="text-sm font-bold text-indigo-600 hover:underline cursor-pointer">
                Close Calendar
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}



