import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['product', 'software', 'content', 'innovation'],
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  colorPalette: {
    type: String,
    enum: [
      'ocean-depths',
      'forest-haven',
      'sunset-glow',
      'royal-purple',
      'ruby-fusion',
      'arctic-aurora',
      'golden-dawn',
      'cherry-blossom',
      'electric-indigo',
      'midnight-sea'
    ],
    default: 'ocean-depths',
    required: true,
  },
}, {
  timestamps: true,
});

// Add indexes (only for enabled since category is already indexed via unique: true)
categorySchema.index({ enabled: 1 });

export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category; 