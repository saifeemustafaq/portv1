import type { Model } from 'mongoose';
import mongoose from 'mongoose';

interface ILog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  category: 'auth' | 'action' | 'system';
  message: string;
  details: mongoose.Schema.Types.Mixed;
  userId?: string;
  username?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

interface ILogModel extends Model<ILog> {
  findByCategory(category: ILog['category']): Promise<ILog[]>;
}

const logSchema = new mongoose.Schema<ILog>({
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

let Log: ILogModel;

try {
  // Try to get the existing model
  Log = mongoose.model<ILog, ILogModel>('Log');
} catch {
  // Model doesn't exist, create it
  Log = mongoose.model<ILog, ILogModel>('Log', logSchema);
}

export default Log; 