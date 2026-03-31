import React from 'react';
import { AlertTriangle, Info, CheckCircle, HelpCircle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  type = 'info' 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle className="modal-icon text-red" size={48} />;
      case 'success': return <CheckCircle className="modal-icon text-green" size={48} />;
      case 'warning': return <AlertTriangle className="modal-icon text-yellow" size={48} />;
      case 'info':
      default: return <HelpCircle className="modal-icon text-blue" size={48} />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger': return 'btn-confirm-danger';
      case 'warning': return 'btn-confirm-warning';
      case 'success': return 'btn-confirm-success';
      default: return 'btn-confirm-primary';
    }
  };

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-header">
          {getIcon()}
          <h2 className="confirm-modal-title">{title}</h2>
        </div>
        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
        </div>
        <div className="confirm-modal-actions">
          {onCancel && (
            <button className="btn-confirm-cancel" onClick={onCancel}>취소</button>
          )}
          <button className={getConfirmButtonClass()} onClick={onConfirm}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
