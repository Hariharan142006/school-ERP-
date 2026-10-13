import mongoose, { Document, Schema } from 'mongoose';

export interface IGatePass extends Document {
  passCode: string;
  qrCode?: string;
  passType: string; // 'student', 'staff', 'visitor'
  personName: string;
  studentName?: string; // Name of the student
  visitorName?: string; // Optional separate visitor name
  relationship?: string; // Relationship to student/school (e.g., Father, Vendor)
  idProofType?: string; // e.g., Aadhar Card, Driving License
  contactNumber?: string;
  studentId?: string; // Admission Number / Student ID
  student?: mongoose.Types.ObjectId; // Ref to StudentProfile
  studentClass?: string;
  studentSection?: string;
  reason: string;
  idReference?: string; // ID Number
  timeOut: string;
  timeIn?: string;
  date: string;
  status: 'issued' | 'verified' | 'returned' | 'cancelled';
  verifiedBy?: mongoose.Types.ObjectId; // Ref to User (Admin / Staff who verified)
  verifiedByName?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  proofPhoto?: string;
  personPhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GatePassSchema: Schema = new Schema({
  passCode: { type: String, required: true, unique: true, index: true },
  qrCode: { type: String },
  passType: { type: String, enum: ['student', 'staff', 'visitor'], required: true, default: 'visitor' },
  personName: { type: String, required: true },
  studentName: { type: String },
  visitorName: { type: String },
  relationship: { type: String },
  idProofType: { type: String },
  contactNumber: { type: String },
  studentId: { type: String },
  student: { type: Schema.Types.ObjectId, ref: 'StudentProfile' },
  studentClass: { type: String },
  studentSection: { type: String },
  reason: { type: String, required: true },
  idReference: { type: String },
  timeOut: { type: String, required: true },
  timeIn: { type: String },
  date: { type: String, required: true },
  status: { type: String, enum: ['issued', 'verified', 'returned', 'cancelled'], default: 'issued' },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedByName: { type: String },
  verifiedAt: { type: Date },
  verificationNotes: { type: String },
  proofPhoto: { type: String },
  personPhoto: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<IGatePass>('GatePass', GatePassSchema);
