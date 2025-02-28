import mongoose from 'mongoose';
import { CategoryType } from '@/types/projects';

export interface IProject extends mongoose.Document {
  title: string;
  description: string;
  category: mongoose.Types.ObjectId | CategoryType;
  image: {
    original: string;
    thumbnail: string;
  };
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
    index: true,
    validate: {
      validator: function(value: mongoose.Types.ObjectId | string) {
        // Allow both ObjectId and string enum values
        return mongoose.Types.ObjectId.isValid(value.toString()) || 
               ['product', 'software', 'content', 'innovation'].includes(value.toString());
      },
      message: 'Category must be a valid category ID or type'
    }
  },
  image: {
    type: {
      original: {
        type: String,
        required: true
      },
      thumbnail: {
        type: String,
        required: true
      }
    },
    required: true
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

// Add a pre-save middleware to convert string category to ObjectId
projectSchema.pre('save', async function(this: IProject) {
  if (typeof this.category === 'string') {
    const Category = mongoose.model('Category');
    const categoryDoc = await Category.findOne({ category: this.category });
    if (categoryDoc) {
      this.category = categoryDoc._id;
    }
  }
});

const Project = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema);

export default Project; 