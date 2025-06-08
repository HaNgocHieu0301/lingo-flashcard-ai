
import React from 'react';
import Modal from './Modal'; // Assuming Modal.tsx is in the same directory

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-slate-600 dark:text-slate-300 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors duration-150 ease-in-out"
        >
          {cancelButtonText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose(); // Typically, confirmation action also closes the modal
          }}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-150 ease-in-out"
        >
          {confirmButtonText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
