import mongoose from 'mongoose';
import { CategoryType } from '@/types/projects';

export interface IProject extends mongoose.Document {
  title: string;
  description: string;
  category: mongoose.Types.ObjectId | CategoryType;
  image?: {
    original: string;
    thumbnail: string;
  } | string;
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
      validator: function(value: any) {
        // Allow both ObjectId and string enum values
        return mongoose.Types.ObjectId.isValid(value) || 
               ['product', 'software', 'content', 'innovation'].includes(value);
      },
      message: 'Category must be a valid category ID or type'
    }
  },
  image: {
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(value: any) {
        if (typeof value === 'string') return true;
        if (value && typeof value === 'object') {
          return value.original && value.thumbnail &&
                 typeof value.original === 'string' &&
                 typeof value.thumbnail === 'string';
        }
        return false;
      },
      message: 'Image must be either a string URL or an object with original and thumbnail URLs'
    }
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