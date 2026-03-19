import React, { useState, useEffect } from 'react';
import { SHIFT_TIMES, SHIFT_ORDER } from '../lib/rotationLogic';
import { generateMonthlyBatchData, executeBatchInsert } from '../lib/batchLogic';
import { X, Calendar as CalendarIcon, Play, AlertCircle } from 'lucide-react';
import { format, addMonths } from 'date-fns';

const PresetManagement = ({ isOpen, onClose, onSuccess, members }) => {
  const [targetMonth, setTargetMonth] = useState(format(addMonths(new Date(), 1), 'yyyy-MM'));
  const [rules, setRules] = useState({});
  const [loading, setLoading] = useState(false);

  // 인원 목록(members)이 변경될 때마다 rules 초기화 (모든 인원이 나오게)
  useEffect(() => {
    if (members && members.length > 0) {
      const initialRules = {};
      [1, 2, 3, 4, 5].forEach(day => {
        initialRules[day] = members.map(m => ({
          name: m.name,
          time: '0900' // 기본값 09:00
        }));
      });
      setRules(initialRules);
    }
  }, [members, isOpen]);

  if (!isOpen) return null;

  // 규칙 시간 변경
  const updateRuleTime = (dayValue, index, time) => {
    setRules(prev => {
      const newDayRules = [...prev[dayValue]];
      newDayRules[index] = { ...newDayRules[index], time };
      return { ...prev, [dayValue]: newDayRules };
    });
  };

  const handleExecute = async () => {
    if (!window.confirm(`${targetMonth}월 데이터를 생성하시겠습니까?\n(기존에 자동으로 생성된 동일 월의 데이터는 삭제 후 재생성됩니다.)`)) {
      return;
    }

    setLoading(true);
    try {
      const batchData = generateMonthlyBatchData(targetMonth, rules);
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

  const dayConfig = [
    { label: '월요일', value: 1, color: '#ef4444' },
    { label: '화요일', value: 2, color: '#f59e0b' },
    { label: '수요일', value: 3, color: '#10b981' },
    { label: '목요일', value: 4, color: '#3b82f6' },
    { label: '금요일', value: 5, color: '#8b5cf6' },
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
          <div className="form-group">
            <label className="section-label">생성 대상 월</label>
            <input 
              type="month" 
              value={targetMonth} 
              onChange={(e) => setTargetMonth(e.target.value)}
              className="month-picker"
            />
          </div>

          <div className="info-box" style={{ marginBottom: '16px' }}>
            <AlertCircle size={18} />
            <span>등록된 모든 구성원이 기본 노출됩니다. 각 요일별 출근 시간을 확인하세요.</span>
          </div>

          <div className="rules-grid-advanced">
            {dayConfig.map(day => (
              <div key={day.value} className="day-card">
                <div className="day-card-header">
                  <div className="day-label-group">
                    <div className="day-indicator" style={{ background: day.color }}></div>
                    <span className="day-name">{day.label}</span>
                  </div>
                </div>
                
                <div className="day-rows">
                  {(!rules[day.value] || rules[day.value].length === 0) && (
                    <div className="empty-rules">구성원을 먼저 등록해주세요.</div>
                  )}
                  {rules[day.value]?.map((rule, idx) => (
                    <div key={idx} className="rule-row-static">
                      <span className="static-name">{rule.name}</span>
                      <select 
                        className="select-time-premium"
                        value={rule.time} 
                        onChange={(e) => updateRuleTime(day.value, idx, e.target.value)}
                      >
                        {SHIFT_ORDER.filter(key => !['OFF', 'OUTSIDE'].includes(key)).map(key => (
                          <option key={key} value={key}>{SHIFT_TIMES[key].label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
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
