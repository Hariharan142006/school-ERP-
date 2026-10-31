import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User';
import StudentProfile from './models/StudentProfile';
import Class from './models/Class';
import Subject from './models/Subject';
import Attendance from './models/Attendance';
import Exam from './models/Exam';
import ExamResult from './models/ExamResult';
import FeeRecord from './models/FeeRecord';
import Transport from './models/Transport';
import Timetable from './models/Timetable';
import Homework from './models/Homework';
import GatePass from './models/GatePass';
import LeaveRequest from './models/LeaveRequest';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school-erp';

async function seedRealData() {
  try {
    await mongoose.connect(MONGO_URI, { tlsAllowInvalidCertificates: true });
    console.log('Connected to MongoDB for rich ERP data seeding...');

    // 1. Get Class Grade 10-A
    const class10A = await Class.findOne({ name: 'Grade 10', section: 'A' });
    if (!class10A) {
      console.error('Class Grade 10-A not found! Run npm run seed first.');
      process.exit(1);
    }

    // 2. Get Students (Karthik Murugan & Ananya Ramesh)
    const karthik = await StudentProfile.findOne({ rollNumber: '1001' }).populate('user');
    const ananya = await StudentProfile.findOne({ rollNumber: '1002' }).populate('user');
    if (!karthik || !ananya) {
      console.error('Students not found! Run npm run seed first.');
      process.exit(1);
    }

    // 3. Get Admin & Teachers
    const adminUser = await User.findOne({ username: 'admin' });
    const teacherRamesh = await User.findOne({ username: 'ramesh@school.com' });
    const teacherPriya = await User.findOne({ username: 'priya@school.com' });
    const subjects = await Subject.find();
    const mathSub = subjects.find(s => s.name.toLowerCase().includes('math')) || subjects[0];
    const sciSub = subjects.find(s => s.name.toLowerCase().includes('sci')) || subjects[1];
    const engSub = subjects.find(s => s.name.toLowerCase().includes('eng')) || subjects[2];
    const tamSub = subjects.find(s => s.name.toLowerCase().includes('tam')) || subjects[3];
    const socSub = subjects.find(s => s.name.toLowerCase().includes('soc')) || subjects[4];

    // ==========================================
    // A. SEED ATTENDANCE (Last 30 Days)
    // ==========================================
    console.log('Seeding real Attendance records...');
    const now = new Date();
    const attendanceDates: Date[] = [];
    for (let i = 28; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const day = d.getDay();
      if (day !== 0) { // Exclude Sundays
        attendanceDates.push(d);
      }
    }

    for (let i = 0; i < attendanceDates.length; i++) {
      const d = attendanceDates[i];
      d.setHours(0, 0, 0, 0);

      let karthikStatus: 'Present' | 'Absent' | 'OD' | 'Half-Day' = 'Present';
      if (i === 4) karthikStatus = 'Absent'; // 1 day absent
      else if (i === 12) karthikStatus = 'OD'; // 1 day on duty
      else if (i === 18) karthikStatus = 'Half-Day';

      await Attendance.findOneAndUpdate(
        { enrolledClass: class10A._id, date: d },
        {
          enrolledClass: class10A._id,
          date: d,
          markedBy: teacherRamesh?._id || adminUser?._id,
          records: [
            { student: karthik._id, status: karthikStatus, remarks: karthikStatus === 'OD' ? 'Inter-school Science Olympiad' : '' },
            { student: ananya._id, status: 'Present' }
          ]
        },
        { upsert: true, new: true }
      );
    }
    console.log(`Seeded ${attendanceDates.length} attendance records.`);

    // ==========================================
    // B. SEED EXAMS & EXAM RESULTS
    // ==========================================
    console.log('Seeding real Exams & Results...');
    let midTermExam = await Exam.findOne({ name: 'Mid-Term Assessment 2026' });
    if (!midTermExam) {
      midTermExam = await Exam.create({
        name: 'Mid-Term Assessment 2026',
        description: 'First Semester Comprehensive Mid-Term Examinations',
        startDate: new Date('2026-09-10'),
        endDate: new Date('2026-09-20'),
        enrolledClasses: [class10A._id],
        status: 'Completed',
        schedule: [
          { date: new Date('2026-09-10'), subject: mathSub._id },
          { date: new Date('2026-09-12'), subject: sciSub._id },
          { date: new Date('2026-09-14'), subject: engSub._id },
          { date: new Date('2026-09-16'), subject: tamSub._id },
          { date: new Date('2026-09-18'), subject: socSub._id },
        ]
      });
    }

    let unitTestExam = await Exam.findOne({ name: 'Unit Assessment 1' });
    if (!unitTestExam) {
      unitTestExam = await Exam.create({
        name: 'Unit Assessment 1',
        description: 'Monthly Subject Formative Assessment',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-08'),
        enrolledClasses: [class10A._id],
        status: 'Completed',
        schedule: [
          { date: new Date('2026-08-01'), subject: mathSub._id },
          { date: new Date('2026-08-03'), subject: sciSub._id },
          { date: new Date('2026-08-05'), subject: engSub._id },
        ]
      });
    }

    // Results for Karthik (Mid-Term)
    const karthikMarks = [
      { subject: mathSub._id, marksObtained: 94, totalMarks: 100, grade: 'O', remarks: 'Exceptional problem-solving skills' },
      { subject: sciSub._id, marksObtained: 89, totalMarks: 100, grade: 'A+', remarks: 'Excellent grasp of physics and chemistry concepts' },
      { subject: engSub._id, marksObtained: 92, totalMarks: 100, grade: 'O', remarks: 'Outstanding creative writing and vocabulary' },
      { subject: tamSub._id, marksObtained: 85, totalMarks: 100, grade: 'A', remarks: 'Strong grammar and literature comprehension' },
      { subject: socSub._id, marksObtained: 90, totalMarks: 100, grade: 'O', remarks: 'Thorough understanding of history & civics' },
    ];

    for (const res of karthikMarks) {
      await ExamResult.findOneAndUpdate(
        { exam: midTermExam._id, student: karthik._id, subject: res.subject },
        { ...res, exam: midTermExam._id, student: karthik._id },
        { upsert: true, new: true }
      );
    }

    // Results for Karthik (Unit Assessment 1)
    const karthikUnitMarks = [
      { subject: mathSub._id, marksObtained: 48, totalMarks: 50, grade: 'O', remarks: 'Perfect score on algebra' },
      { subject: sciSub._id, marksObtained: 46, totalMarks: 50, grade: 'A+', remarks: 'Well-labelled circuit diagrams' },
      { subject: engSub._id, marksObtained: 47, totalMarks: 50, grade: 'O', remarks: 'Flawless comprehension answers' },
    ];

    for (const res of karthikUnitMarks) {
      await ExamResult.findOneAndUpdate(
        { exam: unitTestExam._id, student: karthik._id, subject: res.subject },
        { ...res, exam: unitTestExam._id, student: karthik._id },
        { upsert: true, new: true }
      );
    }
    console.log('Seeded Exams and Results.');

    // ==========================================
    // C. SEED FEE RECORDS
    // ==========================================
    console.log('Seeding real Fee records...');
    const feeItems = [
      {
        student: karthik._id,
        feeName: 'Term 1 Tuition Fee',
        amount: 30000,
        paidAmount: 30000,
        balanceAmount: 0,
        dueDate: new Date('2026-07-31'),
        status: 'Paid',
        paymentMethod: 'Net Banking',
        paymentDate: new Date('2026-07-15'),
        transactionId: 'TXN-882914-SBI',
        remarks: 'Paid in full via SBI Online'
      },
      {
        student: karthik._id,
        feeName: 'Term 2 Tuition Fee',
        amount: 25000,
        paidAmount: 0,
        balanceAmount: 25000,
        dueDate: new Date('2026-11-30'),
        status: 'Pending',
        remarks: 'Term 2 Tuition - Standard Academic'
      },
      {
        student: karthik._id,
        feeName: 'Annual Science & Computer Lab Fee',
        amount: 6500,
        paidAmount: 0,
        balanceAmount: 6500,
        dueDate: new Date('2026-12-15'),
        status: 'Pending',
        remarks: 'Laboratory equipment & digital high-speed lab'
      }
    ];

    for (const fee of feeItems) {
      await FeeRecord.findOneAndUpdate(
        { student: karthik._id, feeName: fee.feeName },
        fee,
        { upsert: true, new: true }
      );
    }
    console.log('Seeded Fee records.');

    // ==========================================
    // D. SEED TRANSPORT
    // ==========================================
    console.log('Seeding real Transport Route...');
    await Transport.findOneAndUpdate(
      { vehicleNumber: 'TN-09-AX-4821' },
      {
        busNumber: 'Route 14',
        vehicleNumber: 'TN-09-AX-4821',
        driverName: 'K. Selvam',
        driverContact: '9840123999',
        route: 'Anna Nagar West - Roundtana - Thirumangalam - School Campus',
        capacity: 42,
        $addToSet: { students: karthik._id }
      },
      { upsert: true, new: true }
    );
    console.log('Seeded Transport Route.');

    // ==========================================
    // E. SEED TIMETABLE
    // ==========================================
    console.log('Seeding real Timetable for Grade 10-A...');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periodTimes = [
      { startTime: '09:00 AM', endTime: '09:45 AM' },
      { startTime: '09:50 AM', endTime: '10:35 AM' },
      { startTime: '10:50 AM', endTime: '11:35 AM' },
      { startTime: '11:40 AM', endTime: '12:25 PM' },
      { startTime: '01:15 PM', endTime: '02:00 PM' },
      { startTime: '02:05 PM', endTime: '02:50 PM' },
    ];

    const daySubjectSequence = [
      [mathSub, sciSub, engSub, tamSub, socSub, mathSub],
      [sciSub, mathSub, tamSub, engSub, mathSub, sciSub],
      [engSub, socSub, mathSub, sciSub, tamSub, engSub],
      [tamSub, engSub, sciSub, socSub, mathSub, sciSub],
      [socSub, tamSub, engSub, mathSub, sciSub, socSub],
    ];

    for (let dIdx = 0; dIdx < days.length; dIdx++) {
      const dayName = days[dIdx];
      const seq = daySubjectSequence[dIdx];

      const periods = seq.map((sub, pIdx) => ({
        periodNumber: pIdx + 1,
        subject: sub._id,
        teacher: (pIdx % 2 === 0 ? teacherRamesh?._id : teacherPriya?._id) || adminUser?._id,
        startTime: periodTimes[pIdx].startTime,
        endTime: periodTimes[pIdx].endTime
      }));

      await Timetable.findOneAndUpdate(
        { enrolledClass: class10A._id, dayOfWeek: dayName },
        {
          enrolledClass: class10A._id,
          dayOfWeek: dayName,
          periods
        },
        { upsert: true, new: true }
      );
    }
    console.log('Seeded 5-day Timetable.');

    // ==========================================
    // F. SEED HOMEWORK
    // ==========================================
    console.log('Seeding real Homework assignments...');
    const hwList = [
      {
        title: 'Quadratic Equations Practice Set',
        description: 'Complete Exercise 4.2 Problems 1 to 10 in Classwork Notebook. Show all factorization steps clearly.',
        enrolledClass: class10A._id,
        subject: mathSub._id,
        dueDate: new Date(Date.now() + 24 * 3600 * 1000 * 2), // in 2 days
        assignedBy: teacherPriya?._id || adminUser?._id
      },
      {
        title: 'Ray Optics Ray Diagrams',
        description: 'Draw ray diagrams for concave and convex mirrors at different object positions with focal point annotations.',
        enrolledClass: class10A._id,
        subject: sciSub._id,
        dueDate: new Date(Date.now() + 24 * 3600 * 1000 * 3), // in 3 days
        assignedBy: teacherRamesh?._id || adminUser?._id
      },
      {
        title: 'Formal Letter to Municipal Commissioner',
        description: 'Draft a 150-word formal letter requesting improvement of street lighting in school zone.',
        enrolledClass: class10A._id,
        subject: engSub._id,
        dueDate: new Date(Date.now() + 24 * 3600 * 1000 * 4), // in 4 days
        assignedBy: teacherRamesh?._id || adminUser?._id
      }
    ];

    for (const hw of hwList) {
      await Homework.findOneAndUpdate(
        { enrolledClass: class10A._id, title: hw.title },
        hw,
        { upsert: true, new: true }
      );
    }
    console.log('Seeded Homework.');

    // ==========================================
    // G. SEED DIGITAL GATE PASS
    // ==========================================
    console.log('Seeding real Digital Gate Pass...');
    const todayPassDate = new Date();
    await GatePass.findOneAndUpdate(
      { passCode: 'GP-2026-1042' },
      {
        passCode: 'GP-2026-1042',
        passType: 'EarlyExit',
        personType: 'Student',
        personName: 'Karthik Murugan',
        studentId: 'ADM-1001',
        studentClass: 'Grade 10',
        studentSection: 'A',
        parentName: 'Murugan V',
        parentContact: '9840123456',
        purpose: 'Doctor Appointment (Dental checkup and orthodontic adjustment)',
        exitDate: todayPassDate,
        expectedReturn: new Date(todayPassDate.getTime() + 3 * 3600 * 1000),
        status: 'Approved',
        approvedBy: adminUser?._id,
        approvedAt: new Date(todayPassDate.getTime() - 3600 * 1000)
      },
      { upsert: true, new: true }
    );
    console.log('Seeded Gate Pass.');

    // ==========================================
    // H. SEED LEAVE REQUESTS
    // ==========================================
    console.log('Seeding real Leave Requests...');
    const pastLeaveDate1 = new Date('2026-09-12');
    const pastLeaveDate2 = new Date('2026-09-13');
    await LeaveRequest.findOneAndUpdate(
      { student: karthik._id, reason: 'Viral fever and prescribed medical rest' },
      {
        student: karthik._id,
        reason: 'Viral fever and prescribed medical rest',
        startDate: pastLeaveDate1,
        endDate: pastLeaveDate2,
        status: 'Approved',
        reviewedBy: teacherRamesh?._id || adminUser?._id
      },
      { upsert: true, new: true }
    );

    const upcomingLeave1 = new Date('2026-11-12');
    const upcomingLeave2 = new Date('2026-11-13');
    await LeaveRequest.findOneAndUpdate(
      { student: karthik._id, reason: 'Attending elder sister wedding ceremony in Madurai' },
      {
        student: karthik._id,
        reason: 'Attending elder sister wedding ceremony in Madurai',
        startDate: upcomingLeave1,
        endDate: upcomingLeave2,
        status: 'Pending'
      },
      { upsert: true, new: true }
    );
    console.log('Seeded Leave Requests.');

    console.log('\n==========================================');
    console.log('SUCCESS: All Real Database ERP Records Seeded!');
    console.log('==========================================');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding rich ERP data:', err);
    process.exit(1);
  }
}

seedRealData();
