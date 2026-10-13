import mongoose, { Document, Schema } from 'mongoose';

export interface INotice extends Document {
  title: string;
  content: string;
  targetAudience: 'All' | 'Teachers' | 'Students' | 'Parents' | 'SpecificClass';
  targetClass?: mongoose.Types.ObjectId;
  priority: 'Normal' | 'Important' | 'Urgent' | 'Emergency';
  date: Date;
  postedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  targetAudience: { type: String, enum: ['All', 'Teachers', 'Students', 'Parents', 'SpecificClass'], default: 'All' },
  targetClass: { type: Schema.Types.ObjectId, ref: 'Class' },
  priority: { 
    type: String, 
    enum: ['Normal', 'Important', 'Urgent', 'Emergency', 'normal', 'important', 'urgent', 'emergency'], 
    default: 'Normal' 
  },
  date: { type: Date, required: true, default: Date.now },
  postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<INotice>('Notice', NoticeSchema);
