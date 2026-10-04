'use client';

import { Modal } from './Modal';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} hideClose>
      <p className="mb-5 text-sm leading-relaxed text-slate-600">{message}</p>
      <div className="flex gap-3">
        <button type="button" className="btn btn-ghost flex-1" onClick={onCancel}>
          {cancelText}
        </button>
        <button type="button" className={`btn flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
