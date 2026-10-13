import { Request, Response } from 'express';
import NoticeModel from '../models/Notice';

export const getNotices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetAudience, classId } = req.query;
    let query: any = {};
    
    if (targetAudience || classId) {
      const orConditions: any[] = [];
      if (targetAudience) {
         orConditions.push({ targetAudience: { $in: [targetAudience, 'All', 'ALL'] } });
      } else {
         orConditions.push({ targetAudience: { $in: ['All', 'ALL'] } });
      }
      
      if (classId && classId !== 'undefined' && classId !== 'null') {
         if (Array.isArray(classId)) {
            const validIds = classId.filter(id => id && id !== 'undefined' && id !== 'null');
            if (validIds.length > 0) orConditions.push({ targetClass: { $in: validIds } });
         } else {
            orConditions.push({ targetClass: classId });
         }
      }
      query = { $or: orConditions };
    }
    
    const notices = await NoticeModel.find(query)
      .sort({ date: -1 })
      .populate('targetClass', 'name section')
      .populate('postedBy', 'name role')
      .lean();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawPriority = req.body.priority ? String(req.body.priority) : 'Normal';
    const normalizedPriority = rawPriority.charAt(0).toUpperCase() + rawPriority.slice(1).toLowerCase();
    const validPriorities = ['Normal', 'Important', 'Urgent', 'Emergency'];
    const priority = validPriorities.includes(normalizedPriority) ? normalizedPriority : 'Normal';

    const noticeData = {
      ...req.body,
      priority,
      postedBy: req.body.postedBy || (req as any).user?.id
    };

    const newNotice = new NoticeModel(noticeData);
    await newNotice.save();
    const populated = await newNotice.populate([
      { path: 'targetClass', select: 'name section' },
      { path: 'postedBy', select: 'name role' }
    ]);
    const io = req.app.get('io');
    if (io) {
      io.emit('notice_created', populated);
      if (populated.priority === 'Emergency') {
        io.emit('emergency_alert', populated);
      }
    }

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    await NoticeModel.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) io.emit('notice_deleted', req.params.id);

    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
