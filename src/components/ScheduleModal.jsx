import React, { useState, useEffect } from 'react';
import { SHIFT_TIMES, SHIFT_ORDER } from '../lib/rotationLogic';
import { X } from 'lucide-react';

const ScheduleModal = ({ isOpen, onClose, onSave, onDelete, initialData, members }) => {
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    time: '0900',
    reason: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || null,
        date: initialData.date || '',
        name: initialData.name || '',
        time: initialData.time || '0900',
        reason: initialData.reason || ''
      });
    } else {
      setFormData({
        id: null,
        date: new Date().toISOString().split('T')[0],
        name: '',
        time: '0900',
        reason: ''
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date) return setError('날짜를 선택해주세요.');
    if (!formData.name) return setError('대상자를 선택해주세요.');
    
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    if (initialData) {
      setFormData({
        id: initialData.id || null,
        date: initialData.date || '',
        name: initialData.name || '',
        time: initialData.time || '0900',
        reason: initialData.reason || ''
      });
    } else {
      setFormData(prev => ({
        ...prev,
        name: '',
        time: '0900',
        reason: ''
      }));
    }
  };

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>{initialData?.isEdit ? '일정 수정' : '일정 등록'}</span>
          <button className="close-btn" onClick={onClose}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        
        {error && <div className="modal-error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>선택된 날짜</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>대상자</label>
            <select 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            >
              <option value="">선택</option>
              {members.map(m => <option key={m.id || m.name} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label>근무 시간 변경</label>
            <select 
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
            >
              {SHIFT_ORDER.map(key => (
                <option key={key} value={key}>{SHIFT_TIMES[key].label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>사유 (예: 정기점검, 연차 사유 등)</label>
            <input 
              type="text" 
              placeholder="사유를 입력하세요"
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <div className="footer-left">
              <button 
                type="button" 
                className="btn btn-reset" 
                onClick={handleReset}
              >
                초기화
              </button>
            </div>
            <button type="button" className="btn btn-cancel" onClick={onClose}>닫기</button>
            {initialData?.isEdit && (
              <button 
                type="button" 
                className="btn btn-delete" 
                onClick={() => {
                  if (window.confirm('정말 삭제하시겠습니까?')) {
                    onDelete(formData.id);
                    onClose();
                  }
                }}
              >
                삭제
              </button>
            )}
            <button type="submit" className="btn btn-save">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
