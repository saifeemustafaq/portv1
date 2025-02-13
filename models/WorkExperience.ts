import mongoose from 'mongoose';

interface IWorkExperience extends mongoose.Document {
  companyName: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  isPresent: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const workExperienceSchema = new mongoose.Schema<IWorkExperience>({
  companyName: {
    type: String,
    required: true,
    maxlength: 100
  },
  position: {
    type: String,
    required: true,
    maxlength: 100
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: function(this: IWorkExperience) {
      return !this.isPresent;
    }
  },
  isPresent: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
workExperienceSchema.index({ startDate: -1 });
workExperienceSchema.index({ companyName: 1 });

const WorkExperience = mongoose.models.WorkExperience || mongoose.model<IWorkExperience>('WorkExperience', workExperienceSchema);

export default WorkExperience; 