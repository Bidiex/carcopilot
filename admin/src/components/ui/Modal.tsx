import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
    else {
      // Optional: Add logic here if implementing exit animations
      setShouldRender(false);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-black/40 backdrop-blur-sm animate-fade-in" 
          onClick={onClose} 
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 animate-slide-up">
          <div className={`flex items-start justify-between ${title ? 'mb-5' : 'mb-0 relative z-10'}`}>
            {title ? (
              <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">{title}</h3>
            ) : <div />}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-full hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};
