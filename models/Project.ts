import mongoose from 'mongoose';
import { CategoryType } from '@/types/projects';

export interface IProject extends mongoose.Document {
  title: string;
  description: string;
  category: mongoose.Types.ObjectId | CategoryType;
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
    type: mongoose.Schema.Types.Mixed,
    required: true,
    ref: 'Category',
    validate: {
      validator: function(value: any) {
        // Allow both ObjectId and string enum values
        return mongoose.Types.ObjectId.isValid(value) || 
               ['product', 'software', 'content', 'innovation'].includes(value);
      },
      message: 'Category must be a valid category ID or type'
    }
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

// Add a pre-find middleware to populate category if it's an ObjectId
projectSchema.pre('find', function() {
  this.populate('category');
});

projectSchema.pre('findOne', function() {
  this.populate('category');
});

const Project = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema);

export default Project; 