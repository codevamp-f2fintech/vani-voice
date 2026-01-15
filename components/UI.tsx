
import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md',
  ...props 
}) => {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-vani-plum focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "vani-gradient text-white vani-glow shadow-lg",
    secondary: "bg-vani-plum/10 text-vani-plum dark:bg-vani-plum/20 dark:text-vani-pink",
    outline: "border-2 border-vani-plum/20 bg-transparent hover:bg-vani-plum/5 dark:border-white/10 dark:text-white",
    ghost: "bg-transparent hover:bg-vani-plum/5 text-gray-600 dark:text-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-xl shadow-sm hover:shadow-md transition-all ${className} ${onClick ? 'cursor-pointer hover:border-vani-plum/40' : ''}`}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, variant?: 'success' | 'warning' | 'info' | 'default' }> = ({ children, variant = 'default' }) => {
  const variants = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    default: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-vani-plum transition-all ${className}`}
    {...props}
  />
);

export const Label: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <label className={`block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ${className}`}>
    {children}
  </label>
);
