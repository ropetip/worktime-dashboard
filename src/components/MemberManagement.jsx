import React, { useState } from 'react';
import { addMember, deleteMember } from '../memberLogic';
import { X, Users, Plus, Trash2, UserPlus } from 'lucide-react';

const MemberManagement = ({ isOpen, onClose, members, onMemberUpdate, setConfirmConfig }) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    setLoading(true);
    try {
      await addMember(newMemberName.trim());
      setNewMemberName('');
      if (onMemberUpdate) onMemberUpdate();
    } catch (error) {
      setConfirmConfig({
        isOpen: true,
        title: '추가 오류',
        message: '인원 추가 중 오류가 발생했습니다. (중복 이름 등)',
        type: 'danger',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: '구성원 삭제',
      message: '해당 인원을 전체 목록에서 정말 삭제하시겠습니까?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteMember(id);
          if (onMemberUpdate) onMemberUpdate();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          setConfirmConfig({
            isOpen: true,
            title: '삭제 오류',
            message: '인원 삭제 중 오류가 발생했습니다.',
            type: 'danger',
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      }
    });
  };

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal-content member-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Users size={22} className="mr-2" color="var(--primary-color)" />
            <span>구성원 관리</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="add-member-container">
            <label className="section-label">신규 구성원 등록</label>
            <div className="add-member-form-premium">
              <div className="input-with-icon">
                <UserPlus size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="이름을 입력하세요"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                />
              </div>
              <button 
                className="btn-add-submit" 
                onClick={handleAddMember}
                disabled={loading || !newMemberName.trim()}
              >
                {loading ? '추가 중...' : '등록하기'}
              </button>
            </div>
          </div>

          <div className="member-list-section">
            <label className="section-label">현재 등록된 구성원 ({members.length}명)</label>
            <div className="member-scroll-list">
              {members.length === 0 ? (
                <div className="empty-state">등록된 구성원이 없습니다.</div>
              ) : (
                members.map(m => (
                  <div key={m.id} className="member-item-card">
                    <div className="member-info">
                      <div className="member-avatar">
                        {m.name.charAt(0)}
                      </div>
                      <span className="member-name-text">{m.name}</span>
                    </div>
                    <button 
                      className="btn-delete-member" 
                      onClick={() => handleDeleteMember(m.id)}
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-save" style={{ width: '100%' }} onClick={onClose}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;
