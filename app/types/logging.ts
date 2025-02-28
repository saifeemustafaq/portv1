export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogCategory = 'auth' | 'mongodb' | 'bootstrap' | 'system' | 'action' | 'performance';

export interface LogDetails {
  [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}

export interface LogData {
  message: string;
  details?: LogDetails;
  userId?: string;
  username?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

export interface LogMessage {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, unknown>;
} 