import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  level: {
    type: String,
    enum: ['info', 'warn', 'error'],
    required: true
  },
  category: {
    type: String,
    enum: ['auth', 'action', 'system'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userId: {
    type: String
  },
  username: {
    type: String
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  path: {
    type: String
  },
  method: {
    type: String
  }
});

// Index for faster queries
logSchema.index({ timestamp: -1 });
logSchema.index({ level: 1 });
logSchema.index({ category: 1 });
logSchema.index({ userId: 1 });

const Log = mongoose.models.Log || mongoose.model('Log', logSchema);

export default Log; 