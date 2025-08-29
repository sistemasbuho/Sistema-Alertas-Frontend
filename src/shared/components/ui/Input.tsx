import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
           w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
           placeholder-gray-500 dark:placeholder-gray-400
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
           disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400
           transition-colors
           ${
             error
               ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
               : ''
           }
           ${className}
         `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
