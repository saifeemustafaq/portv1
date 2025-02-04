import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg border bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`px-6 py-2 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardProps) {
  return (
    <div className={`border-t p-6 ${className}`}>
      {children}
    </div>
  );
} 