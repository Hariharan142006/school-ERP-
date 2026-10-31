import { Request, Response } from 'express';
import LeaveRequestModel from '../models/LeaveRequest';

export const getLeaveRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, classIds } = req.query;
    let query: any = {};
    if (studentId) query.student = studentId;

    const requests = await LeaveRequestModel.find(query)
      .populate({
        path: "student",
        select: "user admissionNumber rollNumber enrolledClass",
        populate: [
          { path: "user", select: "name username" },
          { path: "enrolledClass", select: "name section" }
        ]
      })
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    let finalRequests = requests;
    if (classIds) {
      const classesArray = (classIds as string).split(',');
      finalRequests = requests.filter((r: any) => classesArray.includes(r.student?.enrolledClass?._id?.toString() || r.student?.enrolledClass?.toString()));
    }
      
    res.json(finalRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

import { isDateRangeValid } from '../utils/validation';

export const createLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { student, startDate, endDate, reason } = req.body;

    if (!student) {
      res.status(400).json({ message: 'Student ID is required' });
      return;
    }

    if (!startDate || !endDate || !isDateRangeValid(startDate, endDate)) {
      res.status(400).json({ message: 'Leave start date must be before or equal to end date' });
      return;
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      res.status(400).json({ message: 'Reason for leave is required' });
      return;
    }

    const newRequest = new LeaveRequestModel({
      student,
      startDate,
      endDate,
      reason: reason.trim(),
      status: 'Pending'
    });
    await newRequest.save();

    // Populate deeply for live WebSocket broadcast to Teacher and Principal
    const populatedLeave = await LeaveRequestModel.findById(newRequest._id)
      .populate({
        path: 'student',
        select: 'user admissionNumber rollNumber enrolledClass',
        populate: [
          { path: 'user', select: 'name username' },
          { path: 'enrolledClass', select: 'name section' }
        ]
      })
      .lean();

    const io = req.app.get('io');
    if (io) {
      io.emit('leave_applied', populatedLeave || newRequest);
      io.emit('leave_created', populatedLeave || newRequest);
      io.emit('new_notification', {
        type: 'LEAVE_REQUEST',
        title: 'New Student Absence Submitted',
        message: `Absence request submitted: ${reason.trim()}`,
        studentId: student,
        timestamp: new Date()
      });
    }

    res.status(201).json(populatedLeave || newRequest);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reviewedBy } = req.body;
    
    const updated = await LeaveRequestModel.findByIdAndUpdate(
      id,
      { status, reviewedBy },
      { new: true }
    )
    .populate({
      path: 'student',
      select: 'user admissionNumber rollNumber enrolledClass',
      populate: [
        { path: 'user', select: 'name username' },
        { path: 'enrolledClass', select: 'name section' }
      ]
    })
    .populate('reviewedBy', 'name role')
    .lean();
    
    const io = req.app.get('io');
    if (io) {
      io.emit('leave_updated', updated);
      io.emit('leave_status_changed', updated);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
