import { Request, Response } from 'express';
import FeeRecordModel from '../models/FeeRecord';
import { isPositiveNumber, isValidDate } from '../utils/validation';

import mongoose from 'mongoose';

export const getFees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, studentIds, classId, className } = req.query;
    const filter: any = {};

    if (studentId && studentId !== 'undefined' && studentId !== 'null') {
      const sId = String(studentId).trim();
      if (mongoose.Types.ObjectId.isValid(sId) && /^[0-9a-fA-F]{24}$/.test(sId)) {
        filter.student = sId;
      } else {
        res.json([]);
        return;
      }
    } else if (studentIds) {
      const ids = String(studentIds).split(',').map(id => id.trim()).filter(id => id && id !== 'undefined' && id !== 'null' && mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id));
      if (ids.length > 0) {
        filter.student = { $in: ids };
      }
    }

    let fees = await FeeRecordModel.find(filter)
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email username' },
          { path: 'enrolledClass', select: 'name section' },
          { path: 'parent', select: 'name username contactNumber' }
        ]
      })
      .sort({ createdAt: -1 });

    // Optional class filter in memory if populated
    if (className) {
      fees = fees.filter((f: any) => f.student?.enrolledClass?.name?.toLowerCase() === String(className).toLowerCase());
    }
    if (classId) {
      fees = fees.filter((f: any) => f.student?.enrolledClass?._id?.toString() === String(classId));
    }

    res.json(fees);
  } catch (error: any) {
    console.error('Error in getFees:', error);
    res.status(500).json({ message: 'Failed to fetch fee records' });
  }
};

export const createFee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, className, student, feeName, amount, dueDate, remarks } = req.body;

    if (!isPositiveNumber(amount)) {
      res.status(400).json({ message: 'Fee amount must be a number greater than 0' });
      return;
    }

    if (!dueDate || !isValidDate(dueDate)) {
      res.status(400).json({ message: 'A valid due date is required' });
      return;
    }

    if (!className && !classId && !student) {
      res.status(400).json({ message: 'Please specify a target class for this fee notice' });
      return;
    }

    const numAmount = Number(amount);
    const resolvedFeeName = feeName ? String(feeName).trim() : (remarks ? String(remarks).trim() : 'Term Fees 1');

    if (className && !student) {
      const ClassModel = require('../models/Class').default;
      const StudentProfileModel = require('../models/StudentProfile').default;

      const matchingClasses = await ClassModel.find({ name: className });
      const classIds = matchingClasses.map((c: any) => c._id);

      const students = await StudentProfileModel.find({ enrolledClass: { $in: classIds }, isDeleted: { $ne: true } });
      if (students.length === 0) {
        res.status(400).json({ message: `No active students found in Class ${className}` });
        return;
      }
      const records = students.map((s: any) => ({
        student: s._id,
        feeName: resolvedFeeName,
        amount: numAmount,
        paidAmount: 0,
        balanceAmount: numAmount,
        dueDate,
        remarks: remarks ? String(remarks).trim() : resolvedFeeName,
        status: 'Pending'
      }));
      const created = await FeeRecordModel.insertMany(records);
      res.status(201).json(created);
      return;
    }

    if (classId && !student) {
      const StudentProfileModel = require('../models/StudentProfile').default;
      const students = await StudentProfileModel.find({ enrolledClass: classId, isDeleted: { $ne: true } });
      if (students.length === 0) {
        res.status(400).json({ message: 'No active students found in the selected class' });
        return;
      }
      const records = students.map((s: any) => ({
        student: s._id,
        feeName: resolvedFeeName,
        amount: numAmount,
        paidAmount: 0,
        balanceAmount: numAmount,
        dueDate,
        remarks: remarks ? String(remarks).trim() : resolvedFeeName,
        status: 'Pending'
      }));
      const created = await FeeRecordModel.insertMany(records);
      res.status(201).json(created);
      return;
    }

    const newFee = new FeeRecordModel({ 
      student, 
      feeName: resolvedFeeName,
      amount: numAmount,
      paidAmount: 0,
      balanceAmount: numAmount,
      dueDate, 
      remarks: remarks ? String(remarks).trim() : resolvedFeeName,
      status: 'Pending'
    });
    await newFee.save();
    res.status(201).json(newFee);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markFeePaid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      amountPaid, 
      paymentDate, 
      paymentMethod, 
      transactionId,
      cashReceived, 
      cashChange, 
      remainingDueDate, 
      remarks 
    } = req.body;

    const fee = await FeeRecordModel.findById(req.params.id).populate({
      path: 'student',
      populate: [
        { path: 'user', select: 'name email username' },
        { path: 'enrolledClass', select: 'name section' },
        { path: 'parent', select: 'name username contactNumber' }
      ]
    });
    
    if (!fee) {
      res.status(404).json({ message: 'Fee record not found' });
      return;
    }

    const currentBalance = fee.balanceAmount !== undefined ? fee.balanceAmount : (fee.amount - (fee.paidAmount || 0));
    const paymentAmount = amountPaid !== undefined ? Number(amountPaid) : currentBalance;

    if (!isPositiveNumber(paymentAmount)) {
      res.status(400).json({ message: 'Payment amount must be greater than 0' });
      return;
    }

    if (paymentAmount > currentBalance) {
      res.status(400).json({ message: `Payment amount ($${paymentAmount}) cannot exceed outstanding balance ($${currentBalance})` });
      return;
    }

    const receiptNumber = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const effectivePaymentDate = paymentDate && isValidDate(paymentDate) ? new Date(paymentDate) : new Date();

    const transaction = {
      receiptNumber,
      amount: paymentAmount,
      paymentDate: effectivePaymentDate,
      paymentMethod: paymentMethod || 'Cash',
      transactionId: transactionId ? String(transactionId).trim() : undefined,
      cashReceived: cashReceived !== undefined && cashReceived !== '' ? Number(cashReceived) : undefined,
      cashChange: cashChange !== undefined && cashChange !== '' ? Number(cashChange) : undefined,
      remainingDueDate: remainingDueDate && isValidDate(remainingDueDate) ? new Date(remainingDueDate) : undefined,
      remarks: remarks || `Payment for ${fee.feeName || 'Fee'}`
    };

    fee.payments = fee.payments || [];
    fee.payments.push(transaction as any);

    fee.paidAmount = (fee.paidAmount || 0) + paymentAmount;
    fee.balanceAmount = Math.max(0, fee.amount - fee.paidAmount);
    fee.paymentMethod = paymentMethod || 'Cash';
    fee.paymentDate = effectivePaymentDate;
    if (transactionId) {
      fee.transactionId = String(transactionId).trim();
    }

    if (fee.balanceAmount <= 0) {
      fee.status = 'Paid';
      fee.remainingDueDate = undefined;
    } else {
      fee.status = 'Partial';
      if (remainingDueDate && isValidDate(remainingDueDate)) {
        fee.remainingDueDate = new Date(remainingDueDate);
      }
    }

    await fee.save();

    res.json({ 
      message: fee.status === 'Paid' ? 'Fee payment completed successfully' : 'Partial payment recorded successfully', 
      fee,
      transaction
    });
  } catch (error: any) {
    console.error('Error marking fee paid:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteFee = async (req: Request, res: Response): Promise<void> => {
  try {
    const fee = await FeeRecordModel.findByIdAndDelete(req.params.id);
    if (!fee) {
      res.status(404).json({ message: 'Fee record not found' });
      return;
    }
    res.json({ message: 'Fee record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

