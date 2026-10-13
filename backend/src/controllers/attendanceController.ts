import { Request, Response } from 'express';
import AttendanceModel from '../models/Attendance';
import StudentProfileModel from '../models/StudentProfile';
import { sendEmail, sendSMS } from '../services/notificationService';

// Get attendance for a specific class on a specific date
export const getAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, date } = req.query;
    
    if (!classId || !date) {
      res.status(400).json({ message: 'classId and date are required query parameters.' });
      return;
    }

    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await AttendanceModel.findOne({
      enrolledClass: classId,
      date: { $gte: startOfDay, $lte: endOfDay }
    } as any).populate('records.student').populate({
      path: 'records.student',
      populate: { path: 'user', select: 'name' }
    });

    const students = await StudentProfileModel.find({ enrolledClass: classId, isDeleted: { $ne: true } } as any).populate('user', 'name');

    if (attendance) {
      res.json({ ...attendance.toJSON(), isNew: false, students });
    } else {
      // If no attendance found for that day, return the list of students in that class
      res.json({ isNew: true, students, records: [] });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark or Update attendance
export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, date, records, markedBy } = req.body;

    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const existingAttendance = await AttendanceModel.findOne({
      enrolledClass: classId,
      date: normalizedDate
    });

    if (existingAttendance) {
      await AttendanceModel.findByIdAndUpdate(existingAttendance._id, {
        $set: { records, markedBy }
      });
    } else {
      const newAttendance = new AttendanceModel({
        enrolledClass: classId,
        date: normalizedDate,
        records,
        markedBy
      });
      await newAttendance.save();
    }
    
    const io = req.app.get('io');
    if (io) io.emit('attendance_updated', { classId, date });

    // Notify Parents
    try {
      const studentIds = records.map((r: any) => r.student);
      const profiles = await StudentProfileModel.find({ _id: { $in: studentIds } }).populate('user', 'email username name');
      const formattedDate = normalizedDate.toLocaleDateString();

      for (const profile of profiles) {
        const record = records.find((r: any) => r.student === profile._id.toString());
        if (!record) continue;

        const studentUser = profile.user as any;
        const phone = profile.contactNumber;
        const email = studentUser?.email;
        
        console.log('--- ATTENDANCE NOTIFICATION FOR', studentUser?.name, '---');
        console.log('Contact number found:', phone);
        console.log('Student email found:', email);

        const subject = `Attendance Alert: Student was marked ${record.status}`;
        
        const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
    <h2 style="margin: 0;">📅 Attendance Alert</h2>
  </div>
  <div style="padding: 20px; background-color: #ffffff;">
    <p style="font-size: 16px; color: #333;">Dear Parent/Guardian,</p>
    <p style="font-size: 16px; color: #333;">This is an automated notification regarding the attendance of your child, <strong>${studentUser?.name || 'the student'}</strong>.</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${record.status === 'Present' ? '#059669' : '#dc2626'}">${record.status}</span></p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">Thank you,<br><strong>Aathithiya School ERP</strong></p>
  </div>
</div>
        `;

        if (email) {
          console.log('Sending Email to', email);
          sendEmail(email, subject, htmlContent).then(() => console.log('Email sent successfully!')).catch(e => console.error('Email failed:', e));
        } else {
           console.log('No email found for student', studentUser?.name);
        }

        if (phone) {
           console.log('Sending SMS to', phone);
           sendSMS(phone, `Attendance Alert: Student is marked ${record.status} on ${formattedDate}.`).catch(() => {});
        } else {
           console.log('No phone found for student profile', profile._id);
        }
      }
    } catch(err) {
      console.error('Failed to notify parents of attendance', err);
    }

    res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    
    // Find all attendance documents where this student has a record
    const attendanceDocs = await AttendanceModel.find({
      'records.student': studentId
    }).sort({ date: -1 });
    
    const history = attendanceDocs.map(doc => {
      const record = doc.records.find(r => r.student.toString() === studentId);
      return {
        date: doc.date,
        status: record?.status || 'Unknown'
      };
    });
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};



