import React, { useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  const getMessageColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-700 dark:text-green-300';
      case 'error':
        return 'text-red-700 dark:text-red-300';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'info':
        return 'text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <div
      className={`
        max-w-md w-auto min-w-[320px] shadow-lg rounded-lg pointer-events-auto border
        transform transition-all duration-300 ease-in-out
        ${getStyles()}
      `}
      style={{ zIndex: 99999 }}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 flex-1 min-w-0">
            <p className={`text-sm font-medium leading-5 ${getTitleColor()}`}>
              {title}
            </p>
            {message && (
              <p className={`mt-1 text-sm leading-5 ${getMessageColor()}`}>
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`
                inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2
                ${
                  type === 'success'
                    ? 'text-green-400 hover:text-green-500 focus:ring-green-500'
                    : ''
                }
                ${
                  type === 'error'
                    ? 'text-red-400 hover:text-red-500 focus:ring-red-500'
                    : ''
                }
                ${
                  type === 'warning'
                    ? 'text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500'
                    : ''
                }
                ${
                  type === 'info'
                    ? 'text-blue-400 hover:text-blue-500 focus:ring-blue-500'
                    : ''
                }
              `}
              onClick={() => onClose(id)}
            >
              <span className="sr-only">Cerrar</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
