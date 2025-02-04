import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg'
};

export function Button({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 
        disabled:pointer-events-none disabled:opacity-50
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
} 