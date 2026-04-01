import React, { useState, useEffect } from 'react';
import { SHIFT_TIMES, SHIFT_ORDER } from '../lib/rotationLogic';
import { generateMonthlyBatchData, executeBatchInsert } from '../lib/batchLogic';
import { X, Calendar as CalendarIcon, Play, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { format, addMonths } from 'date-fns';

const PresetManagement = ({ isOpen, onClose, onSuccess, members, setConfirmConfig }) => {
  const [targetMonth, setTargetMonth] = useState(format(addMonths(new Date(), 1), 'yyyy-MM'));
  const [memberDefaults, setMemberDefaults] = useState({}); // { name: time }
  const [weekdayRules, setWeekdayRules] = useState({}); // { day: [{name, time}, ...] }
  const [showExceptions, setShowExceptions] = useState(false);
  const [loading, setLoading] = useState(false);

  // 인원 목록(members)이 변경될 때마다 초기화
  useEffect(() => {
    if (members && members.length > 0 && isOpen) {
      // 기본값 설정 (모든 인원 09:00 시작)
      const defaults = {};
      members.forEach(m => {
        defaults[m.name] = '0900';
      });
      setMemberDefaults(defaults);

      // 요일별 스케줄은 비워둠 (예외 상황만 기록)
      const initialWeekdayRules = {};
      [1, 2, 3, 4, 5].forEach(day => {
        initialWeekdayRules[day] = [];
      });
      setWeekdayRules(initialWeekdayRules);
    }
  }, [members, isOpen]);

  if (!isOpen) return null;

  const updateDefaultTime = (name, time) => {
    setMemberDefaults(prev => ({ ...prev, [name]: time }));
  };

  const addException = (dayValue) => {
    setWeekdayRules(prev => ({
      ...prev,
      [dayValue]: [...prev[dayValue], { name: members[0]?.name || '', time: '0900' }]
    }));
  };

  const updateException = (dayValue, index, field, value) => {
    setWeekdayRules(prev => {
      const newDayRules = [...prev[dayValue]];
      newDayRules[index] = { ...newDayRules[index], [field]: value };
      return { ...prev, [dayValue]: newDayRules };
    });
  };

  const removeException = (dayValue, index) => {
    setWeekdayRules(prev => ({
      ...prev,
      [dayValue]: prev[dayValue].filter((_, i) => i !== index)
    }));
  };

  const handleExecute = () => {
    setConfirmConfig({
      isOpen: true,
      title: '배치 생성',
      message: `${targetMonth}월 데이터를 생성하시겠습니까?\n(기존에 자동으로 생성된 동일 월의 데이터는 삭제 후 재생성됩니다.)`,
      type: 'warning',
      onConfirm: async () => {
        setLoading(true);
        try {
          const batchData = generateMonthlyBatchData(targetMonth, memberDefaults, weekdayRules);
          await executeBatchInsert(targetMonth, batchData);
          
          if (onSuccess) {
            await onSuccess(targetMonth, batchData.length);
          }
          onClose();
        } catch (error) {
          console.error('Batch execution failed:', error);
          setConfirmConfig({
            isOpen: true,
            title: '실행 오류',
            message: '배치 실행 중 오류가 발생했습니다.',
            type: 'danger',
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        } finally {
          setLoading(false);
        }
      }
    });
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
      <div className="modal-content preset-modal" onClick={e => e.stopPropagation()} style={{position: 'relative'}}>

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
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="section-label">생성 대상 월</label>
            <input 
              type="month" 
              value={targetMonth} 
              onChange={(e) => setTargetMonth(e.target.value)}
              className="month-picker"
            />
          </div>

          <div className="preset-section">
            <h3 className="section-title">기본 근무 시간 설정</h3>
            <p className="section-desc">모든 평일에 적용되는 각 구성원의 기본 출근 시간입니다.</p>
            <div className="member-defaults-list">
              {Object.keys(memberDefaults).map(name => (
                <div key={name} className="member-default-row">
                  <span className="member-name">{name}</span>
                  <select 
                    className="select-time-premium"
                    value={memberDefaults[name]} 
                    onChange={(e) => updateDefaultTime(name, e.target.value)}
                  >
                    <option value="NONE">미지정 (생성 제외)</option>
                    {SHIFT_ORDER.filter(key => !['OFF', 'OUTSIDE'].includes(key)).map(key => (
                      <option key={key} value={key}>{SHIFT_TIMES[key].label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="preset-section" style={{ marginTop: '24px' }}>
            <div 
              className="section-header-toggle" 
              onClick={() => setShowExceptions(!showExceptions)}
            >
              <h3 className="section-title">[예외] 요일별 설정</h3>
              {showExceptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            <p className="section-desc">특정 요일에만 다른 시간을 적용해야 할 경우 사용하세요.</p>
            
            {showExceptions && (
              <div className="rules-grid-advanced" style={{ maxHeight: '300px' }}>
                {dayConfig.map(day => (
                  <div key={day.value} className="day-card">
                    <div className="day-card-header">
                      <div className="day-label-group">
                        <div className="day-indicator" style={{ background: day.color }}></div>
                        <span className="day-name">{day.label}</span>
                      </div>
                      <button className="btn-add-row" onClick={() => addException(day.value)}>
                        + 추가
                      </button>
                    </div>
                    
                    <div className="day-rows">
                      {weekdayRules[day.value]?.map((rule, idx) => (
                        <div key={idx} className="rule-row">
                          <select 
                            className="select-name"
                            value={rule.name}
                            onChange={(e) => updateException(day.value, idx, 'name', e.target.value)}
                          >
                            {members.map(m => (
                              <option key={m.name} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                          <select 
                            className="select-time"
                            value={rule.time} 
                            onChange={(e) => updateException(day.value, idx, 'time', e.target.value)}
                          >
                            {SHIFT_ORDER.filter(key => !['OFF', 'OUTSIDE'].includes(key)).map(key => (
                              <option key={key} value={key}>{SHIFT_TIMES[key].label}</option>
                            ))}
                          </select>
                          <button className="btn-remove-row" onClick={() => removeException(day.value, idx)}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {(!weekdayRules[day.value] || weekdayRules[day.value].length === 0) && (
                        <div className="empty-rules">예외 설정 없음</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
