import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="flex flex-col items-center text-center pb-2">
        <div className={`p-4 mb-4 rounded-full ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
          {isDestructive ? <AlertTriangle size={32} /> : <Info size={32} />}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <div className="text-gray-500 mb-8">{message}</div>
        
        <div className="flex w-full gap-3 flex-col sm:flex-row-reverse">
          <Button 
            className="w-full sm:w-auto sm:flex-1"
            variant={isDestructive ? 'danger' : 'primary'} 
            onClick={onConfirm} 
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
          <Button 
            className="w-full sm:w-auto sm:flex-1"
            variant="secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
