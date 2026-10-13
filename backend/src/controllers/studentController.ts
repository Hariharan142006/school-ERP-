import { Request, Response } from 'express';
import StudentProfileModel from '../models/StudentProfile';
import UserModel, { UserRole } from '../models/User';
import TransportModel from '../models/Transport';

const syncStudentBusAllocation = async (studentId: any, newBusNumber?: string, oldBusNumber?: string, transportMode?: string) => {
  try {
    if (oldBusNumber && (oldBusNumber !== newBusNumber || transportMode !== 'School Bus')) {
      const oldQuery: any[] = [{ busNumber: oldBusNumber }, { vehicleNumber: oldBusNumber }];
      if (oldBusNumber.match(/^[0-9a-fA-F]{24}$/)) oldQuery.push({ _id: oldBusNumber });
      await TransportModel.updateMany({ $or: oldQuery }, { $pull: { students: studentId } });
    }

    if (transportMode === 'School Bus' && newBusNumber) {
      const newQuery: any[] = [{ busNumber: newBusNumber }, { vehicleNumber: newBusNumber }];
      if (newBusNumber.match(/^[0-9a-fA-F]{24}$/)) newQuery.push({ _id: newBusNumber });
      await TransportModel.findOneAndUpdate({ $or: newQuery }, { $addToSet: { students: studentId } });
    }
  } catch (err) {
    console.error('Failed to sync student bus allocation:', err);
  }
};


export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const profile = await StudentProfileModel.findOne({ user: userId } as any)
      .populate('user', 'name username email')
      .populate('enrolledClass', 'name section')
      .populate('parent', 'name');
      
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyChildren = async (req: Request, res: Response): Promise<void> => {
  try {
    const parentId = (req as any).user?.id || req.query.parentId;
    
    if (!parentId || parentId === 'undefined' || parentId === 'null') {
      res.json([]);
      return;
    }

    const children = await StudentProfileModel.find({ parent: parentId } as any)
      .populate('user', 'name username email')
      .populate('enrolledClass', 'name section');
      
    res.json(children);
  } catch (error: any) {
    console.error('Error in getMyChildren:', error);
    res.json([]);
  }
};

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { getPaginationParams, paginate } = require('../utils/pagination');
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const { search, enrolledClass } = req.query;

    const query: any = { isDeleted: { $ne: true } };
    if (enrolledClass) query.enrolledClass = enrolledClass;
    if (search) {
      query.$or = [
        { admissionNumber: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await StudentProfileModel.countDocuments(query);
    const students = await StudentProfileModel.find(query)
      .populate('user', 'name username email')
      .populate({
        path: 'enrolledClass',
        select: 'name section',
        populate: { path: 'batch', select: 'name' }
      })
      .populate('parent', 'name username email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    if (req.query.page) {
      res.json(paginate(students, total, page, limit));
    } else {
      res.json(students);
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

import { isValidEmail, isValidPhone, isValidDate, isNonNegativeNumber } from '../utils/validation';

export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, username, password, email, // User fields
      admissionNumber, rollNumber, enrolledClass, dob, gender, bloodGroup, parentId, address, // Profile fields
      fatherName, motherName, fatherOccupation, motherOccupation, contactNumber, annualIncome, // Parent Details
      transportMode, busNumber // Transport fields
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ message: 'Student full name must be at least 2 characters long' });
      return;
    }

    if (!admissionNumber || typeof admissionNumber !== 'string' || !admissionNumber.trim()) {
      res.status(400).json({ message: 'Admission number is required' });
      return;
    }

    if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
      res.status(400).json({ message: 'Roll number is required' });
      return;
    }

    if (!enrolledClass) {
      res.status(400).json({ message: 'Enrolled class is required' });
      return;
    }

    if (dob) {
      if (!isValidDate(dob) || new Date(dob) >= new Date()) {
        res.status(400).json({ message: 'Date of birth must be a valid date in the past' });
        return;
      }
    }

    if (email && !isValidEmail(email)) {
      res.status(400).json({ message: 'Please provide a valid email address' });
      return;
    }

    if (contactNumber && !isValidPhone(contactNumber)) {
      res.status(400).json({ message: 'Please provide a valid contact phone number (7-15 digits)' });
      return;
    }

    if (annualIncome !== undefined && annualIncome !== '' && !isNonNegativeNumber(annualIncome)) {
      res.status(400).json({ message: 'Annual income must be a non-negative number' });
      return;
    }

    // 1. Create User
    const newUser = new UserModel({
      name: name.trim(),
      username: (username || rollNumber).trim(),
      password: password || (dob ? (() => { const d = new Date(dob); return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`; })() : 'student123'),
      email: email ? email.trim() : undefined,
      role: UserRole.STUDENT
    });
    await newUser.save();

    let finalParentId = parentId || null;

    if (!finalParentId && contactNumber) {
      const cleanContact = contactNumber.trim();
      let parentUser = await UserModel.findOne({ username: cleanContact });
      if (!parentUser) {
        parentUser = new UserModel({
          name: fatherName ? fatherName.trim() : (motherName ? motherName.trim() : 'Parent'),
          username: cleanContact,
          password: cleanContact,
          email: `${cleanContact}@parent.school.com`,
          role: UserRole.PARENT
        });
        await parentUser.save();
      }
      finalParentId = parentUser._id;
    }

    // 2. Create Profile
    const newProfile = new StudentProfileModel({
      user: newUser._id,
      admissionNumber: admissionNumber.trim(),
      rollNumber: rollNumber.trim(),
      enrolledClass,
      dob: dob ? new Date(dob) : undefined,
      gender: gender || 'Male',
      bloodGroup: bloodGroup || undefined,
      parent: finalParentId,
      fatherName: fatherName ? fatherName.trim() : undefined,
      motherName: motherName ? motherName.trim() : undefined,
      fatherOccupation,
      motherOccupation,
      contactNumber: contactNumber ? contactNumber.trim() : undefined,
      annualIncome: annualIncome ? Number(annualIncome) : 0,
      address: address ? address.trim() : 'N/A',
      transportMode: transportMode || 'Walk',
      busNumber: busNumber || undefined
    });

    try {
      await newProfile.save();
      await syncStudentBusAllocation(newProfile._id, newProfile.busNumber, undefined, newProfile.transportMode);
    } catch (profileError) {
      // Rollback user creation
      await UserModel.findByIdAndDelete(newUser._id);
      throw profileError;
    }

    const populated = await newProfile.populate(['user', 'enrolledClass']);
    res.status(201).json(populated);
  } catch (error: any) {
    if (error.code === 11000) {
      let field = 'Field';
      if (error.message.includes('email_1')) field = 'Email';
      else if (error.message.includes('username_1')) field = 'Username (Roll Number)';
      else if (error.message.includes('admissionNumber_1')) field = 'Admission Number';
      else if (error.message.includes('rollNumber_1')) field = 'Roll Number';
      
      res.status(400).json({ message: `${field} already exists in the system.` });
      return;
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, email, // User fields
      admissionNumber, rollNumber, enrolledClass, dob, gender, bloodGroup, parentId, address,
      fatherName, motherName, fatherOccupation, motherOccupation, contactNumber, annualIncome,
      transportMode, busNumber
    } = req.body;

    if (email && !isValidEmail(email)) {
      res.status(400).json({ message: 'Please provide a valid email address' });
      return;
    }

    if (contactNumber && !isValidPhone(contactNumber)) {
      res.status(400).json({ message: 'Please provide a valid contact phone number (7-15 digits)' });
      return;
    }

    if (dob && (!isValidDate(dob) || new Date(dob) >= new Date())) {
      res.status(400).json({ message: 'Date of birth must be a valid date in the past' });
      return;
    }

    if (annualIncome !== undefined && annualIncome !== '' && !isNonNegativeNumber(annualIncome)) {
      res.status(400).json({ message: 'Annual income must be a non-negative number' });
      return;
    }

    const profile = await StudentProfileModel.findById(req.params.id);
    if (!profile) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    if (name || email) {
      const userUpdate: any = {};
      if (name) userUpdate.name = name.trim();
      if (email) userUpdate.email = email.trim();
      await UserModel.findByIdAndUpdate(profile.user, userUpdate);
    }

    const oldBusNumber = profile.busNumber;
    
    await StudentProfileModel.findByIdAndUpdate(req.params.id, {
      admissionNumber: admissionNumber ? admissionNumber.trim() : profile.admissionNumber,
      rollNumber: rollNumber ? rollNumber.trim() : profile.rollNumber,
      enrolledClass: enrolledClass || profile.enrolledClass,
      dob: dob ? new Date(dob) : profile.dob,
      gender: gender || profile.gender,
      bloodGroup: bloodGroup !== undefined ? bloodGroup : profile.bloodGroup,
      parent: parentId !== undefined ? (parentId || null) : profile.parent,
      address: address !== undefined ? address.trim() : profile.address,
      fatherName: fatherName !== undefined ? fatherName.trim() : profile.fatherName,
      motherName: motherName !== undefined ? motherName.trim() : profile.motherName,
      fatherOccupation: fatherOccupation !== undefined ? fatherOccupation : profile.fatherOccupation,
      motherOccupation: motherOccupation !== undefined ? motherOccupation : profile.motherOccupation,
      contactNumber: contactNumber !== undefined ? contactNumber.trim() : profile.contactNumber,
      annualIncome: annualIncome !== undefined ? Number(annualIncome) : profile.annualIncome,
      transportMode: transportMode || profile.transportMode,
      busNumber: busNumber !== undefined ? busNumber : profile.busNumber
    });

    const finalMode = transportMode || profile.transportMode;
    const finalBus = busNumber !== undefined ? busNumber : profile.busNumber;
    await syncStudentBusAllocation(profile._id, finalBus, oldBusNumber, finalMode);

    const updatedProfile = await StudentProfileModel.findById(req.params.id)

      .populate('user', 'name username email')
      .populate({
        path: 'enrolledClass',
        select: 'name section',
        populate: { path: 'batch', select: 'name' }
      })
      .populate('parent', 'name');
      
    res.json(updatedProfile);
  } catch (error: any) {
    if (error.code === 11000) {
      let field = 'Field';
      if (error.message.includes('email_1')) field = 'Email';
      else if (error.message.includes('username_1')) field = 'Username (Roll Number)';
      else if (error.message.includes('admissionNumber_1')) field = 'Admission Number';
      else if (error.message.includes('rollNumber_1')) field = 'Roll Number';
      
      res.status(400).json({ message: `${field} already exists in the system.` });
      return;
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addOrUpdateParent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // student profile ID
    const { fatherName, motherName, contactNumber, fatherOccupation, annualIncome, email } = req.body;

    if (!contactNumber || !isValidPhone(contactNumber)) {
      res.status(400).json({ message: "A valid Phone Number (7-15 digits) is required for Parent Login." });
      return;
    }

    if (email && !isValidEmail(email)) {
      res.status(400).json({ message: "Please provide a valid email address." });
      return;
    }

    if (annualIncome !== undefined && annualIncome !== '' && !isNonNegativeNumber(annualIncome)) {
      res.status(400).json({ message: "Annual income must be a non-negative number." });
      return;
    }

    const student = await StudentProfileModel.findById(id);
    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    const cleanContact = contactNumber.trim();

    // Check if Parent user account already exists with this phone number (username)
    let parentUser = await UserModel.findOne({ username: cleanContact });

    if (!parentUser) {
      const targetEmail = (email && email.trim()) ? email.trim().toLowerCase() : `${cleanContact}@parent.school.com`;
      const emailConflict = await UserModel.findOne({ email: targetEmail });
      if (emailConflict) {
        res.status(400).json({ 
          message: `The email "${targetEmail}" is already registered to user "${emailConflict.name || emailConflict.username}". Please provide a unique email address or leave it blank.` 
        });
        return;
      }

      // Create new Parent User: ID = Phone No, Password = Phone No
      parentUser = new UserModel({
        name: fatherName ? fatherName.trim() : (motherName ? motherName.trim() : 'Parent'),
        username: cleanContact,
        password: cleanContact,
        email: targetEmail,
        role: UserRole.PARENT
      });
      await parentUser.save();
    } else {
      // Update existing Parent User name/email if provided
      if (fatherName) parentUser.name = fatherName.trim();
      if (email && email.trim()) {
        const targetEmail = email.trim().toLowerCase();
        const emailConflict = await UserModel.findOne({ email: targetEmail, _id: { $ne: parentUser._id } });
        if (emailConflict) {
          res.status(400).json({ 
            message: `The email "${targetEmail}" is already registered to user "${emailConflict.name || emailConflict.username}". Please provide a unique email address or leave it blank.` 
          });
          return;
        }
        parentUser.email = targetEmail;
      }
      await parentUser.save();
    }

    // Link parent account to student profile and update parent details
    student.parent = parentUser._id as any;
    if (fatherName) student.fatherName = fatherName.trim();
    if (motherName) student.motherName = motherName.trim();
    if (contactNumber) student.contactNumber = cleanContact;
    if (fatherOccupation) student.fatherOccupation = fatherOccupation;
    if (annualIncome !== undefined && annualIncome !== '') student.annualIncome = Number(annualIncome);
    await student.save();

    const updated = await StudentProfileModel.findById(id)
      .populate('user', 'name username email')
      .populate({
        path: 'enrolledClass',
        select: 'name section',
        populate: { path: 'batch', select: 'name' }
      })
      .populate('parent', 'name username email role');

    res.json({ message: 'Parent added and credentials generated successfully!', student: updated, parentUser });
  } catch (error: any) {
    console.error('Error in addOrUpdateParent:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email or username';
      res.status(400).json({ 
        message: `This ${field} is already in use by another user account. Please use a unique value or leave email blank.`,
        error: error.message 
      });
      return;
    }
    res.status(500).json({ message: error.message || 'Server error', error: error.message });
  }
};

export const bulkImportStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { students } = req.body; // Array of student objects

    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ message: 'No student data provided' });
      return;
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const item of students) {
      try {
        const { 
          name, admissionNumber, rollNumber, enrolledClass, dob, gender, 
          fatherName, motherName, contactNumber, address, transportMode, busNumber
        } = item;

        if (!name || !admissionNumber || !rollNumber || !enrolledClass) {
          skippedCount++;
          errors.push(`Skipped row: Missing Name, Admission Number, Roll Number, or Class ID`);
          continue;
        }

        // Check if student already exists
        const emailToCheck = `${rollNumber}@student.school.com`;
        const existingUser = await UserModel.findOne({ $or: [{ username: rollNumber }, { email: emailToCheck }] });
        const existingProfile = await StudentProfileModel.findOne({ admissionNumber });
        if (existingUser || existingProfile) {
          skippedCount++;
          errors.push(`Skipped ${name}: Roll Number (${rollNumber}), Admission Number (${admissionNumber}), or Email already exists.`);
          continue;
        }

        let parsedDob: Date | undefined = undefined;
        let password = 'student123';
        
        if (dob) {
          // Attempt to parse standard format
          parsedDob = new Date(dob);
          if (isNaN(parsedDob.getTime())) {
            // Try DD-MM-YYYY or DD/MM/YYYY
            const parts = String(dob).split(/[-/]/);
            if (parts.length === 3) {
              // assume DD-MM-YYYY
              parsedDob = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
          }
          if (parsedDob && !isNaN(parsedDob.getTime())) {
            password = `${String(parsedDob.getDate()).padStart(2,'0')}${String(parsedDob.getMonth()+1).padStart(2,'0')}${parsedDob.getFullYear()}`;
          } else {
            parsedDob = undefined;
          }
        }

        // 1. Create User
        const newUser = new UserModel({
          name,
          username: rollNumber,
          password,
          email: emailToCheck,
          role: UserRole.STUDENT
        });
        await newUser.save();

        let finalParentId = null;
        if (contactNumber) {
          const cleanContact = String(contactNumber).trim();
          let parentUser = await UserModel.findOne({ username: cleanContact });
          if (!parentUser) {
            parentUser = new UserModel({
              name: fatherName ? String(fatherName).trim() : (motherName ? String(motherName).trim() : 'Parent'),
              username: cleanContact,
              password: cleanContact,
              email: `${cleanContact}@parent.school.com`,
              role: UserRole.PARENT
            });
            await parentUser.save();
          }
          finalParentId = parentUser._id;
        }

        // 2. Create Profile
        const newProfile = new StudentProfileModel({
          user: newUser._id,
          admissionNumber,
          rollNumber,
          enrolledClass,
          dob: parsedDob,
          gender: gender || 'Male',
          parent: finalParentId,
          fatherName,
          motherName,
          contactNumber: contactNumber ? String(contactNumber).trim() : undefined,
          address: address || 'N/A',
          transportMode: transportMode || 'Walk',
          busNumber
        });
        try {
          await newProfile.save();
        } catch (profileError) {
          await UserModel.findByIdAndDelete(newUser._id);
          throw profileError;
        }

        importedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`Error importing ${item.name || 'row'}: ${err.message}`);
      }
    }

    res.json({
      message: `Bulk import completed: ${importedCount} imported, ${skippedCount} skipped.`,
      importedCount,
      skippedCount,
      errors
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await StudentProfileModel.findById(req.params.id);
    if (!profile) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    
    // Delete the linked user account
    await UserModel.findByIdAndUpdate(profile.user, { isDeleted: true, deletedAt: new Date() });
    await StudentProfileModel.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
    
    res.json({ message: 'Student and linked account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
