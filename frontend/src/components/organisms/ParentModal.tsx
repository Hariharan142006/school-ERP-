"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { X, User, Phone, Lock, KeyRound } from 'lucide-react';

import api from '@/lib/axios';
import { Portal } from '@/components/atoms/Portal';
import { motion, AnimatePresence } from 'framer-motion';
import { isValidEmail, isValidPhone, isNonNegativeNumber } from '@/lib/validation';

interface ParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: any;
}

export const ParentModal = ({ isOpen, onClose, onSuccess, student }: ParentModalProps) => {
  const [formData, setFormData] = useState({
    fatherName: '',
    motherName: '',
    contactNumber: '',
    fatherOccupation: '',
    annualIncome: '',
    email: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && student) {
      setFormData({
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        contactNumber: student.contactNumber || '',
        fatherOccupation: student.fatherOccupation || '',
        annualIncome: student.annualIncome || '',
        email: student.parent?.email || ''
      });
      setError('');
    }
  }, [isOpen, student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?._id) return;
    setError('');

    if (!formData.contactNumber || !isValidPhone(formData.contactNumber)) {
      setError("Please provide a valid Father's Phone Number (7-15 digits) for Parent Login ID and Password.");
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      setError("Please provide a valid email address.");
      return;
    }

    if (formData.annualIncome && !isNonNegativeNumber(formData.annualIncome)) {
      setError("Annual income must be a non-negative number.");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/api/students/${student._id}/parent`, {
        ...formData,
        fatherName: formData.fatherName.trim(),
        motherName: formData.motherName?.trim() || undefined,
        contactNumber: formData.contactNumber.trim(),
        annualIncome: formData.annualIncome ? Number(formData.annualIncome) : 0,
        email: formData.email?.trim() || undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add parent');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <Portal>
      <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
          
          <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Add / Link Parent Details</h3>
              <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                Student: {student.user?.name} (Class {student.enrolledClass?.name || ''} - {student.enrolledClass?.section || ''})
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{error}</div>}

            {/* Generated Credentials Info Banner */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Parent Account Credentials</h4>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Parent <strong>Login ID</strong> will be the <strong>Father Phone No</strong>, and the initial <strong>Password</strong> will be the <strong>Same Phone No</strong>.
                </p>
              </div>
            </div>

            <form id="parent-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Father's Name" id="fatherName" value={formData.fatherName} onChange={handleChange} required placeholder="e.g. John Doe" />
                <Input label="Mother's Name" id="motherName" value={formData.motherName} onChange={handleChange} placeholder="e.g. Mary Doe" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Father's Phone Number (Login ID & Pass)" 
                  id="contactNumber" 
                  value={formData.contactNumber} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. 9876543210" 
                />
                <Input label="Email Address (Optional)" id="email" type="email" value={formData.email} onChange={handleChange} placeholder="parent@gmail.com" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Father's Occupation" id="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} placeholder="e.g. Engineer" />
                <Input label="Annual Income ($)" id="annualIncome" type="number" value={formData.annualIncome} onChange={handleChange} placeholder="e.g. 50000" />
              </div>
            </form>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50/50 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button form="parent-form" type="submit" disabled={loading}>{loading ? 'Creating Credentials...' : 'Save Parent & Credentials'}</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
    </Portal>
  );
};
