import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  default: 'bg-primary text-white hover:bg-primary/90',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-[#2a2f3e] bg-[#1a1f2e] text-[#f8fafc] hover:bg-[#2a2f3e]',
  ghost: 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50',
  link: 'text-primary underline-offset-4 hover:underline',
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