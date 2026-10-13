import mongoose, { Document, Schema } from 'mongoose';

export interface IHomework extends Document {
  title: string;
  description: string;
  enrolledClass: mongoose.Types.ObjectId; // Ref to Class
  subject?: mongoose.Types.ObjectId; // Ref to Subject
  dueDate: Date;
  assignedBy: mongoose.Types.ObjectId; // Ref to User (Teacher or Admin)
  createdAt: Date;
  updatedAt: Date;
}

const HomeworkSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  enrolledClass: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: false },
  dueDate: { type: Date, required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IHomework>('Homework', HomeworkSchema);
