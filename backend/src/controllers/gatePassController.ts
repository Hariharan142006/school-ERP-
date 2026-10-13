import { Request, Response } from 'express';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import GatePassModel from '../models/GatePass';
import StudentProfileModel from '../models/StudentProfile';

export const getGatePasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, studentId } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (studentId) query.studentId = studentId;

    const passes = await GatePassModel.find(query)
      .sort({ createdAt: -1 })
      .populate('verifiedBy', 'name username role')
      .lean();
    res.json(passes);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching gate passes' });
  }
};

export const createGatePass = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const passCode = req.body.passCode || `GP-${dateStr}-${randomSuffix}`;

    // Link student profile if studentId (admission number) is provided
    let studentRef = req.body.student;
    let resolvedStudentName = req.body.studentName || '';
    if (req.body.studentId) {
      const studentProfile = await StudentProfileModel.findOne({ 
        admissionNumber: req.body.studentId 
      }).populate('user', 'name');
      if (studentProfile) {
        studentRef = studentProfile._id;
        if (!resolvedStudentName && (studentProfile.user as any)?.name) {
          resolvedStudentName = (studentProfile.user as any).name;
        }
      }
    }

    // Generate Base64 QR Code containing scannable payload
    const qrPayload = JSON.stringify({
      passCode,
      studentId: req.body.studentId || '',
      studentName: resolvedStudentName || req.body.studentName || '',
      personName: req.body.personName || '',
      date: req.body.date || now.toISOString().slice(0, 10),
      timeOut: req.body.timeOut || ''
    });

    const qrCode = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      }
    });

    const newPass = new GatePassModel({
      ...req.body,
      passCode,
      qrCode,
      studentName: resolvedStudentName || req.body.studentName,
      student: studentRef,
      status: req.body.status || 'issued'
    });

    await newPass.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('gatepass_issued', newPass);
    }

    res.status(201).json(newPass);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error while creating gate pass', error: error.message });
  }
};

export const updateGatePass = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedPass = await GatePassModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('verifiedBy', 'name username role');

    if (!updatedPass) {
      res.status(404).json({ message: 'Gate pass not found' });
      return;
    }

    const io = req.app.get('io');
    if (io) {
      if (updatedPass.status === 'returned') {
        io.emit('gatepass_returned', updatedPass);
      } else if (updatedPass.status === 'verified') {
        io.emit('gatepass_verified', updatedPass);
      }
    }

    res.json(updatedPass);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error while updating gate pass', error: error.message });
  }
};

export const deleteGatePass = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedPass = await GatePassModel.findByIdAndDelete(req.params.id);
    if (!deletedPass) {
      res.status(404).json({ message: 'Gate pass not found' });
      return;
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('gatepass_deleted', req.params.id);
    }

    res.json({ message: 'Gate pass deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting gate pass' });
  }
};

/**
 * Lookup a gate pass by QR passCode or mongo _id
 */
export const getGatePassByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = String(req.params.code);
    const isObjectId = mongoose.Types.ObjectId.isValid(code);

    let pass = await GatePassModel.findOne({
      $or: [
        { passCode: code },
        ...(isObjectId ? [{ _id: code }] : [])
      ]
    }).populate('verifiedBy', 'name username role').lean() as any;

    if (!pass) {
      res.status(404).json({ message: 'Gate pass not found for the provided QR code' });
      return;
    }

    // Resolve student info to enrich verification view
    if (pass.studentId) {
      const studentProfile = await StudentProfileModel.findOne({ admissionNumber: pass.studentId })
        .populate('user', 'name email profilePhoto')
        .lean() as any;
      if (studentProfile) {
        pass.studentDetails = {
          name: (studentProfile.user as any)?.name || '',
          rollNumber: studentProfile.rollNumber,
          admissionNumber: studentProfile.admissionNumber,
          fatherName: studentProfile.fatherName,
          motherName: studentProfile.motherName,
          contactNumber: studentProfile.contactNumber,
          address: studentProfile.address
        };
        if (!pass.studentName && (studentProfile.user as any)?.name) {
          pass.studentName = (studentProfile.user as any).name;
        }
      }
    }

    res.json(pass);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during QR lookup', error: error.message });
  }
};

/**
 * Verify a gate pass (Admin scans QR and approves exit)
 */
export const verifyGatePass = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = String(req.params.code);
    const isObjectId = mongoose.Types.ObjectId.isValid(code);
    const authUser = (req as any).user;

    const pass = await GatePassModel.findOne({
      $or: [
        { passCode: code },
        ...(isObjectId ? [{ _id: code }] : [])
      ]
    });

    if (!pass) {
      res.status(404).json({ message: 'Gate pass not found' });
      return;
    }

    if (pass.status === 'verified') {
      res.status(400).json({ 
        message: 'Gate pass is already verified!', 
        pass 
      });
      return;
    }

    if (pass.status === 'returned') {
      res.status(400).json({ 
        message: 'Gate pass is already marked returned!', 
        pass 
      });
      return;
    }

    pass.status = 'verified';
    const userId = authUser?.id || authUser?._id;
    pass.verifiedBy = (userId && mongoose.Types.ObjectId.isValid(userId)) ? new mongoose.Types.ObjectId(userId) : undefined;
    pass.verifiedByName = authUser?.name || 'Administrator';
    pass.verifiedAt = new Date();
    if (req.body?.verificationNotes) {
      pass.verificationNotes = req.body.verificationNotes;
    }

    await pass.save();
    const populated = await pass.populate('verifiedBy', 'name username role');
    const resultObj = populated.toObject() as any;

    if (resultObj.studentId) {
      const studentProfile = await StudentProfileModel.findOne({ admissionNumber: resultObj.studentId })
        .populate('user', 'name email profilePhoto')
        .lean() as any;
      if (studentProfile) {
        resultObj.studentDetails = {
          name: (studentProfile.user as any)?.name || '',
          rollNumber: studentProfile.rollNumber,
          admissionNumber: studentProfile.admissionNumber,
          fatherName: studentProfile.fatherName,
          contactNumber: studentProfile.contactNumber
        };
        if (!resultObj.studentName && (studentProfile.user as any)?.name) {
          resultObj.studentName = (studentProfile.user as any).name;
        }
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('gatepass_verified', resultObj);
    }

    res.json({
      message: 'Gate pass verified successfully',
      pass: resultObj
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error while verifying gate pass', error: error.message });
  }
};

/**
 * Get gate passes for a logged-in parent
 */
export const getParentGatePasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const parentUserId = (req as any).user?.id || req.query.parentId;
    if (!parentUserId) {
      res.status(400).json({ message: 'Parent ID required' });
      return;
    }

    // Find children linked to this parent
    const children = await StudentProfileModel.find({ parent: parentUserId }).select('_id admissionNumber');
    const childIds = children.map(c => c._id);
    const admissionNumbers = children.map(c => c.admissionNumber);

    const passes = await GatePassModel.find({
      $or: [
        { student: { $in: childIds } },
        { studentId: { $in: admissionNumbers } }
      ]
    }).sort({ createdAt: -1 }).populate('verifiedBy', 'name role').lean();

    res.json(passes);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error while fetching parent gate passes', error: error.message });
  }
};

/**
 * Get gate pass audit logs
 */
export const getGatePassLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status } = req.query;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const logs = await GatePassModel.find(query)
      .sort({ updatedAt: -1 })
      .populate('verifiedBy', 'name username role')
      .lean();

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error while fetching gate pass logs', error: error.message });
  }
};
