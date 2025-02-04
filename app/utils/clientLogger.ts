import type { LogLevel, LogCategory, LogDetails } from './logger';

async function logToServer(
  level: LogLevel,
  category: LogCategory,
  message: string,
  details?: LogDetails
) {
  try {
    const response = await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        category,
        message,
        details,
      }),
    });

    if (!response.ok) {
      console.error('Failed to log to server:', await response.text());
    }
  } catch (error) {
    console.error('Error logging to server:', error);
  }
}

export async function logClientError(
  category: LogCategory,
  message: string,
  error: Error
) {
  const errorDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  await logToServer('error', category, message, errorDetails);
}

export async function logClientAction(
  message: string,
  details?: LogDetails
) {
  await logToServer('info', 'action', message, details);
}

export async function logClientAuth(
  message: string,
  details?: LogDetails
) {
  await logToServer('info', 'auth', message, details);
} 