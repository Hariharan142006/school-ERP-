import { Request, Response } from 'express';
import HomeworkModel from '../models/Homework';
import StudentProfileModel from '../models/StudentProfile';
import { sendEmail, sendSMS } from '../services/notificationService';

export const getHomework = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.query;
    let query: any = {};
    if (classId) query.enrolledClass = classId;
    
    const homework = await HomeworkModel.find(query)
      .populate("enrolledClass", "name section")
      .populate("subject", "name")
      .populate("assignedBy", "name role")
      .sort({ createdAt: -1 })
      .lean();
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createHomework = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, enrolledClass, subject, dueDate, assignedBy, notify = true } = req.body;

    const userId = (assignedBy && assignedBy !== '') ? assignedBy : (req as any).user?.id || (req as any).user?._id;

    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Homework Title is required' });
      return;
    }

    if (!enrolledClass || enrolledClass === '') {
      res.status(400).json({ message: 'Class selection is required' });
      return;
    }

    const payload: any = {
      title: title.trim(),
      description: description || '',
      dueDate,
      enrolledClass,
      assignedBy: userId
    };

    if (subject && subject !== '') {
      payload.subject = subject;
    }

    const newHomework = new HomeworkModel(payload);
    await newHomework.save();
    const populated = await newHomework.populate([
      { path: "enrolledClass", select: "name section" },
      { path: "subject", select: "name" },
      { path: "assignedBy", select: "name role" }
    ]);

    const io = req.app.get('io');
    if (io) io.emit('homework_created', populated);

    // Notify students and parents of the enrolled class if notify is true
    if (notify) {
      try {
        const studentProfiles = await StudentProfileModel.find({
          enrolledClass,
          isDeleted: { $ne: true }
        }).populate('user', 'name email').lean();

        const className = (populated.enrolledClass as any)?.name || '';
        const classSection = (populated.enrolledClass as any)?.section || '';
        const subjectName = (populated.subject as any)?.name || 'General Assignment';
        const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
        const assignerName = (populated.assignedBy as any)?.name || 'School Administration';

        for (const sp of studentProfiles) {
          const studentUser = (sp as any).user;
          const studentEmail = studentUser?.email;
          const studentPhone = sp.contactNumber;

          if (studentEmail) {
            const html = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px 24px; text-align: center; color: white;">
                  <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 8px;">Academic Update</span>
                  <h1 style="margin: 0; font-size: 22px; font-weight: 800;">New Homework Assigned</h1>
                  <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px; font-weight: 500;">Class ${className} - ${classSection}</p>
                </div>
                <div style="padding: 24px;">
                  <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">${title}</h2>
                  <div style="background: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
                    <div style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Subject:</strong> <span style="color: #1e293b; font-weight: 600;">${subjectName}</span></div>
                    <div style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Due Date:</strong> <span style="color: #dc2626; font-weight: 600;">${formattedDueDate}</span></div>
                    <div style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Assigned By:</strong> <span style="color: #1e293b; font-weight: 600;">${assignerName}</span></div>
                  </div>
                  <h3 style="font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px;">Instructions:</h3>
                  <div style="background: #f1f5f9; padding: 14px 16px; border-radius: 12px; font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${description || 'Please complete the assigned homework before the due date.'}</div>
                </div>
                <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  Aathithiya School ERP Notification System
                </div>
              </div>
            `;
            sendEmail(studentEmail, `Homework Assigned: ${title} (${subjectName})`, html).catch(() => {});
          }

          if (studentPhone) {
            sendSMS(studentPhone, `Homework Alert: "${title}" (${subjectName}) assigned for Class ${className}-${classSection}. Due: ${formattedDueDate}. Please check student portal.`).catch(() => {});
          }
        }
      } catch (notifErr) {
        console.error('Failed to notify students of homework:', notifErr);
      }
    }

    res.status(201).json(populated);
  } catch (error: any) {
    console.error('Error in createHomework:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateHomework = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, enrolledClass, subject, dueDate } = req.body;

    const updatePayload: any = {};
    if (title) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description;
    if (enrolledClass) updatePayload.enrolledClass = enrolledClass;
    if (subject !== undefined) updatePayload.subject = subject || null;
    if (dueDate) updatePayload.dueDate = dueDate;

    const updated = await HomeworkModel.findByIdAndUpdate(id, updatePayload, { new: true })
      .populate("enrolledClass", "name section")
      .populate("subject", "name")
      .populate("assignedBy", "name role");

    if (!updated) {
      res.status(404).json({ message: 'Homework not found' });
      return;
    }

    const io = req.app.get('io');
    if (io) io.emit('homework_updated', updated);

    res.json(updated);
  } catch (error: any) {
    console.error('Error in updateHomework:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteHomework = async (req: Request, res: Response): Promise<void> => {
  try {
    await HomeworkModel.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) io.emit('homework_deleted', req.params.id);

    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
