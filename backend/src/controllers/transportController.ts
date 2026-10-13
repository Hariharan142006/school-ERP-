import { Request, Response } from 'express';
import TransportModel from '../models/Transport';

export const getVehicles = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await TransportModel.find().populate({
      path: 'students',
      populate: { path: 'user enrolledClass', select: 'name section' }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

import { isValidPhone, isPositiveNumber } from '../utils/validation';

export const createVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleNumber, route, driverContact, capacity, busNumber, driverName } = req.body;

    if (!vehicleNumber || typeof vehicleNumber !== 'string' || !vehicleNumber.trim()) {
      res.status(400).json({ message: 'Vehicle number is required' });
      return;
    }

    if (!route || typeof route !== 'string' || !route.trim()) {
      res.status(400).json({ message: 'Route description is required' });
      return;
    }

    if (!isPositiveNumber(capacity)) {
      res.status(400).json({ message: 'Vehicle capacity must be at least 1' });
      return;
    }

    if (driverContact && !isValidPhone(driverContact)) {
      res.status(400).json({ message: 'Please provide a valid driver contact phone number (7-15 digits)' });
      return;
    }

    const newVehicle = new TransportModel({
      busNumber: busNumber ? busNumber.trim() : undefined,
      vehicleNumber: vehicleNumber.trim(),
      driverName: driverName ? driverName.trim() : 'Driver',
      driverContact: driverContact ? driverContact.trim() : '',
      route: route.trim(),
      capacity: Number(capacity)
    });
    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Vehicle number already exists.' });
      return;
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    await TransportModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const allocateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    
    const updatedVehicle = await TransportModel.findOneAndUpdate(
      { 
        _id: id,
        students: { $ne: studentId },
        $expr: { $lt: [{ $size: '$students' }, '$capacity'] }
      },
      { 
        $addToSet: { students: studentId }
      },
      { new: true }
    );

    if (!updatedVehicle) {
      const vehicle = await TransportModel.findById(id);
      if (!vehicle) {
        res.status(404).json({ message: 'Vehicle not found' });
        return;
      }
      if (vehicle.students.includes(studentId as any)) {
        res.status(400).json({ message: 'Student is already allocated to this vehicle' });
        return;
      }
      res.status(400).json({ message: 'Vehicle is at full capacity' });
      return;
    }
    
    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, studentId } = req.params;
    
    const updatedVehicle = await TransportModel.findByIdAndUpdate(
      id,
      { $pull: { students: studentId } },
      { new: true }
    );

    if (!updatedVehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }
    
    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

import TransportLogModel from '../models/TransportLog';
import NoticeModel from '../models/Notice';
import StudentProfileModel from '../models/StudentProfile';
import { sendEmail, sendSMS } from '../services/notificationService';

export const notifyBusStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { eventType, notes } = req.body; // 'REACHED_SCHOOL' | 'STARTED_FROM_SCHOOL'

    if (!['REACHED_SCHOOL', 'STARTED_FROM_SCHOOL'].includes(eventType)) {
      res.status(400).json({ message: 'Invalid event type. Must be REACHED_SCHOOL or STARTED_FROM_SCHOOL' });
      return;
    }

    const vehicle = await TransportModel.findById(id);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    const busLabel = vehicle.busNumber ? `Bus No. ${vehicle.busNumber} (${vehicle.vehicleNumber})` : `Vehicle ${vehicle.vehicleNumber}`;
    const studentsNotifiedCount = vehicle.students ? vehicle.students.length : 0;

    let noticeTitle = '';
    let noticeContent = '';

    if (eventType === 'REACHED_SCHOOL') {
      noticeTitle = `🚌 Transport Alert: ${busLabel} Reached School`;
      noticeContent = `Dear Parents, school ${busLabel} on route "${vehicle.route}" has safely reached the school.`;
    } else {
      noticeTitle = `🚌 Transport Alert: ${busLabel} Departed from School`;
      noticeContent = `Dear Parents, school ${busLabel} on route "${vehicle.route}" has started its evening return trip from school.`;
    }

    // Save transport log entry
    const logEntry = new TransportLogModel({
      transport: vehicle._id,
      busNumber: vehicle.busNumber,
      vehicleNumber: vehicle.vehicleNumber,
      route: vehicle.route,
      eventType,
      timestamp: new Date(),
      triggeredBy: (req as any).user?.id || (req as any).user?._id,
      studentsNotifiedCount,
      notes: notes || undefined
    });
    await logEntry.save();

    // Create a Notice for Parents
    try {
      const notice = new NoticeModel({
        title: noticeTitle,
        content: noticeContent,
        targetAudience: 'Parents',
        date: new Date(),
        postedBy: (req as any).user?.id || (req as any).user?._id
      });
      await notice.save();

      if (vehicle.students && vehicle.students.length > 0) {
        const profiles = await StudentProfileModel.find({ _id: { $in: vehicle.students } }).populate('user', 'email username');
        for (const profile of profiles) {
          const studentUser = profile.user as any;
          const phone = profile.contactNumber;
          const email = studentUser?.email;

          const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
    <h2 style="margin: 0;">🚌 Transport Alert</h2>
  </div>
  <div style="padding: 20px; background-color: #ffffff;">
    <p style="font-size: 16px; color: #333;">Dear Parent/Guardian,</p>
    <p style="font-size: 16px; color: #333;">This is an automated notification regarding the school transport for your child.</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${eventType === 'REACHED_SCHOOL' ? '#059669' : '#d97706'}">${eventType === 'REACHED_SCHOOL' ? 'Reached School' : 'Departed from School'}</span></p>
      <p style="margin: 5px 0;"><strong>Bus Details:</strong> ${busLabel}</p>
      <p style="margin: 5px 0;"><strong>Route:</strong> ${vehicle.route}</p>
      <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">Thank you,<br><strong>Aathithiya School ERP</strong></p>
  </div>
</div>
          `;

          if (email) sendEmail(email, noticeTitle, htmlContent).catch(() => {});
          if (phone) sendSMS(phone, noticeTitle + ': ' + noticeContent).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Failed to create parent notice for transport event:', e);
    }

    const populatedLog = await TransportLogModel.findById(logEntry._id)
      .populate('triggeredBy', 'name email role')
      .populate('transport');

      const io = req.app.get('io');
      if (io) io.emit('transport_log_added', populatedLog);

    res.status(201).json({
      message: `Notification sent for ${busLabel}`,
      log: populatedLog
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTransportLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await TransportLogModel.find()
      .populate('triggeredBy', 'name email role')
      .populate('transport')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



