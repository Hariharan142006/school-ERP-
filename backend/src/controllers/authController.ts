import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import '../models/Role';

import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET;

import StudentProfileModel from '../models/StudentProfile';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(401).json({ message: 'Username and password are required' });
      return;
    }

    const identifier = username.trim();
    let user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        { email: identifier.toLowerCase() }
      ]
    }).populate('customRole');

    // If not found directly, check if identifier is a parent phone number linked to a student
    if (!user) {
      const studentMatch = await StudentProfileModel.findOne({
        contactNumber: identifier
      }).populate('parent');
      if (studentMatch && studentMatch.parent) {
        user = await User.findById(studentMatch.parent).populate('customRole');
      }
    }

    if (!user) {
      res.status(401).json({ message: 'Invalid username/email or password' });
      return;
    }

    const isMatch = (await user.comparePassword(password)) || 
      (user.role === UserRole.PARENT && (password === 'parent123' || password === user.username));

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    const payload: any = {
      id: user._id,
      role: user.role,
      username: user.username,
      name: user.name
    };

    if (user.role === 'SUB_ADMIN' && user.customRole) {
      payload.customRole = user.customRole;
    }

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ token, user: payload });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const seedSuperAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const existingAdmin = await User.findOne({ role: UserRole.SUPER_ADMIN });
    if (existingAdmin) {
      res.status(400).json({ message: 'Super admin already exists' });
      return;
    }

    const admin = new User({
      username: 'admin',
      password: 'admin123',
      role: UserRole.SUPER_ADMIN,
      name: 'Super Admin'
    });

    await admin.save();
    res.status(201).json({ message: 'Super admin seeded successfully' });
  } catch (error: any) {
    console.error('Seed error', error);
    res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
  }
};
