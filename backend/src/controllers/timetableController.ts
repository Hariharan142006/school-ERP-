import { Request, Response } from 'express';
import TimetableModel from '../models/Timetable';
import { resolveClassIds } from '../utils/classResolver';

export const getTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.query;
    let query: any = {};
    if (classId) {
      const resolved = await resolveClassIds(classId);
      if (resolved.length > 0) {
        query.enrolledClass = resolved.length === 1 ? resolved[0] : { $in: resolved };
      }
    }
    
    const timetables = await TimetableModel.find(query)
      .populate('enrolledClass', 'name section')
      .populate('periods.subject', 'name code')
      .populate('periods.teacher', 'name')
      .sort({ dayOfWeek: 1 });
      
    res.json(timetables);
  } catch (error: any) {
    console.error('getTimetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const saveTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, dayOfWeek, periods } = req.body;

    if (!classId || !dayOfWeek) {
      res.status(400).json({ message: 'Class ID and day of week are required' });
      return;
    }
    
    // Validate conflict: Ensure no teacher is double-booked on the same day and period across different classes
    if (Array.isArray(periods)) {
      for (const p of periods) {
        const teacherId = p.teacher?._id || p.teacher;
        if (!teacherId) continue;
        
        // Find other classes that have this teacher assigned on this day and periodNumber
        const conflictTimetables = await TimetableModel.find({
          dayOfWeek,
          enrolledClass: { $ne: classId },
          periods: {
            $elemMatch: {
              teacher: teacherId,
              periodNumber: p.periodNumber
            }
          }
        }).populate('enrolledClass', 'name section').populate('periods.teacher', 'name username');
        
        if (conflictTimetables.length > 0) {
          const conflict = conflictTimetables[0];
          const conflictClass = conflict.enrolledClass as any;
          const conflictClassName = conflictClass ? `${conflictClass.name} - Sec ${conflictClass.section}` : 'another class';
          
          const conflictPeriod = conflict.periods.find(cp => 
            cp.periodNumber === p.periodNumber && 
            ((cp.teacher as any)?._id?.toString() === teacherId.toString() || cp.teacher?.toString() === teacherId.toString())
          );
          const teacherObj = conflictPeriod?.teacher as any;
          const teacherName = teacherObj?.name || teacherObj?.username || 'Teacher';
          
          res.status(400).json({ 
            message: `Conflict: ${teacherName} is already assigned to ${conflictClassName} on ${dayOfWeek} Period ${p.periodNumber}.` 
          });
          return;
        }
      }
    }
    
    const existing = await TimetableModel.findOne({ enrolledClass: classId, dayOfWeek });
    
    if (existing) {
      existing.periods = periods;
      await existing.save();
      res.json(existing);
    } else {
      const newTimetable = new TimetableModel({
        enrolledClass: classId,
        dayOfWeek,
        periods
      });
      await newTimetable.save();
      res.status(201).json(newTimetable);
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTeacherTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;
    
    // Find all timetables that have this teacher in at least one period
    const timetables = await TimetableModel.find({ 'periods.teacher': teacherId })
      .populate('enrolledClass', 'name section')
      .populate('periods.subject', 'name code')
      .populate('periods.teacher', 'name')
      .sort({ dayOfWeek: 1 });
      
    // The client only cares about the periods taught by this specific teacher.
    // Filtering on the server for cleanliness:
    const filteredTimetables = timetables.map(tt => {
      const filteredPeriods = tt.periods.filter(p => p.teacher?._id?.toString() === teacherId || p.teacher?.toString() === teacherId);
      return {
        _id: tt._id,
        enrolledClass: tt.enrolledClass,
        dayOfWeek: tt.dayOfWeek,
        periods: filteredPeriods
      };
    });
    
    res.json(filteredTimetables);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const saveStaffTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId, dayOfWeek, periods } = req.body;
    
    if (!teacherId || !dayOfWeek) {
      res.status(400).json({ message: 'Teacher ID and day of week are required' });
      return;
    }

    // Check if another teacher is already assigned to this period for any of the target classes
    for (const p of periods) {
      if (!p.classId) continue;
      
      const classTimetable = await TimetableModel.findOne({ enrolledClass: p.classId, dayOfWeek })
        .populate('enrolledClass', 'name section')
        .populate('periods.teacher', 'name username');
        
      if (classTimetable) {
        const existingPeriod = classTimetable.periods.find(cp => cp.periodNumber === p.periodNumber);
        const existingTeacherId = (existingPeriod?.teacher as any)?._id?.toString() || existingPeriod?.teacher?.toString();
        if (existingPeriod && existingTeacherId && existingTeacherId !== teacherId.toString()) {
          const conflictTeacher = (existingPeriod.teacher as any)?.name || 'another teacher';
          const className = (classTimetable.enrolledClass as any)?.name 
            ? `${(classTimetable.enrolledClass as any).name} - Sec ${(classTimetable.enrolledClass as any).section}`
            : 'this class';
          res.status(400).json({ 
            message: `Conflict: Period ${p.periodNumber} for ${className} is already assigned to ${conflictTeacher}.` 
          });
          return;
        }
      }
    }
    
    // First, remove this teacher from all periods on this day across all classes
    // This allows resetting their schedule for the day
    await TimetableModel.updateMany(
      { dayOfWeek },
      { $set: { 'periods.$[elem].teacher': null, 'periods.$[elem].subject': null } },
      { arrayFilters: [{ 'elem.teacher': teacherId }] }
    );

    // Now, assign the new periods
    for (const p of periods) {
      if (!p.classId) continue;
      
      let classTimetable = await TimetableModel.findOne({ enrolledClass: p.classId, dayOfWeek });
      
      if (!classTimetable) {
        classTimetable = new TimetableModel({
          enrolledClass: p.classId,
          dayOfWeek,
          periods: []
        });
      }
      
      // Update or add the period
      classTimetable.periods = classTimetable.periods.filter(cp => cp.periodNumber !== p.periodNumber);
      classTimetable.periods.push({
        periodNumber: p.periodNumber,
        subject: p.subjectId || p.subject,
        teacher: teacherId,
        startTime: p.startTime,
        endTime: p.endTime
      });
      
      await classTimetable.save();
    }
    
    res.json({ message: 'Staff timetable saved successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

