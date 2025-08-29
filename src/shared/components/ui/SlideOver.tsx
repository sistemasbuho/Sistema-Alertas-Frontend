import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 50 }}>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        style={{ zIndex: 40 }}
        onClick={onClose}
      />

      <div
        className="fixed inset-y-0 right-0 flex max-w-full pl-10"
        style={{ zIndex: 45 }}
      >
        <div
          className={`pointer-events-auto relative w-screen max-w-md transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="absolute left-0 top-0 -ml-8 flex pr-2 pt-4 sm:-ml-10 sm:pr-4">
            <button
              type="button"
              className="relative rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar panel</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-gray-900 py-6 shadow-xl">
            <div className="px-4 sm:px-6">
              <h2 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                {title}
              </h2>
            </div>

            <div className="relative mt-6 flex-1 px-4 sm:px-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideOver;
