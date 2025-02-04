import mongoose from 'mongoose';

export interface IProject extends mongoose.Document {
  title: string;
  description: string;
  category: 'product' | 'software' | 'content' | 'innovation';
  image?: string;
  link?: string;
  tags?: string[];
  skills?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new mongoose.Schema<IProject>({
  title: {
    type: String,
    required: true,
    maxlength: 50
  },
  description: {
    type: String,
    required: true,
    maxlength: 300
  },
  category: {
    type: String,
    required: true,
    enum: ['product', 'software', 'content', 'innovation'],
  },
  image: {
    type: String,
  },
  link: {
    type: String,
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  skills: [{
    type: String,
    maxlength: 30
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, {
  timestamps: true,
});

const Project = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema);

export default Project; 