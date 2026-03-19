import React, { useState } from 'react';
import { MEMBERS } from '../lib/rotationLogic';
import { generateMonthlyBatchData, executeBatchInsert } from '../lib/batchLogic';
import { X, Calendar as CalendarIcon, Play, AlertCircle } from 'lucide-react';
import { format, addMonths } from 'date-fns';

const PresetManagement = ({ isOpen, onClose, onSuccess }) => {
  const [targetMonth, setTargetMonth] = useState(format(addMonths(new Date(), 1), 'yyyy-MM'));
  const [rules, setRules] = useState({
    1: '', // 월
    2: '', // 화
    3: '', // 수
    4: '', // 목
    5: '', // 금
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRuleChange = (day, name) => {
    setRules(prev => ({ ...prev, [day]: name }));
  };

  const handleExecute = async () => {
    const activeRules = Object.fromEntries(
      Object.entries(rules).filter(([_, name]) => name !== '')
    );

    if (Object.keys(activeRules).length === 0) {
      alert('최소 한 명 이상의 요일별 담당자를 설정해주세요.');
      return;
    }

    if (!window.confirm(`${targetMonth}월 데이터를 생성하시겠습니까?\n(기존에 자동으로 생성된 동일 월의 데이터는 삭제 후 재생성됩니다.)`)) {
      return;
    }

    setLoading(true);
    try {
      const batchData = generateMonthlyBatchData(targetMonth, activeRules);
      await executeBatchInsert(targetMonth, batchData);
      alert(`${targetMonth}월 배치 처리가 완료되었습니다. (${batchData.length}건)`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Batch execution failed:', error);
      alert('배치 실행 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { label: '월요일', value: 1, color: '#ef4444' }, // 빨간색 계열
    { label: '화요일', value: 2, color: '#f59e0b' }, // 주황색 계열
    { label: '수요일', value: 3, color: '#10b981' }, // 초록색 계열
    { label: '목요일', value: 4, color: '#3b82f6' }, // 파란색 계열
    { label: '금요일', value: 5, color: '#8b5cf6' }, // 보라색 계열
  ];

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal-content preset-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <CalendarIcon size={22} className="mr-2" color="var(--primary-color)" />
            <span>월간 근무 프리셋 설정</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="info-box">
            <AlertCircle size={18} />
            <span>설정한 요일별 담당자를 해당 월의 모든 평일에 일괄 배정합니다.</span>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
              생성 대상 월
            </label>
            <input 
              type="month" 
              value={targetMonth} 
              onChange={(e) => setTargetMonth(e.target.value)}
              className="month-picker"
            />
          </div>

          <div className="rules-grid">
            {days.map(day => (
              <div key={day.value} className="rule-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '4px', height: '16px', borderRadius: '2px', background: day.color }}></div>
                   <label>{day.label}</label>
                </div>
                <select 
                  value={rules[day.value]} 
                  onChange={(e) => handleRuleChange(day.value, e.target.value)}
                >
                  <option value="">미배정 (기존 유지)</option>
                  {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <div className="footer-left">
            <button className="btn btn-cancel" onClick={onClose}>취소</button>
          </div>
          <button 
            className="btn btn-save btn-batch" 
            onClick={handleExecute}
            disabled={loading}
          >
            {loading ? '처리 중...' : (
              <>
                <Play size={16} /> 일괄 생성 실행
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresetManagement;
