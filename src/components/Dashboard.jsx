import React from 'react';
import { countAfter18, SHIFT_TIMES } from '../lib/rotationLogic';
import { Check, AlertTriangle } from 'lucide-react';
import { format, isWeekend } from 'date-fns';
import { ko } from 'date-fns/locale';

const Dashboard = ({ selectedDate, shiftsData }) => {
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dailyData = shiftsData[dateKey] || { shifts: [] };
  const shifts = dailyData.shifts;

  const getNamesByTime = (time) => {
    return shifts
      .filter(s => s.time === time)
      .map(s => s.name)
      .join(', ') || '-';
  };

  const getCountByTime = (time) => shifts.filter(s => s.time === time).length;

  const after18Count = countAfter18(shifts);
  const isRuleMet = after18Count >= 2;

  // 휴가/외근 명단
  const offNames = shifts
    .filter(s => ['OFF', 'OUTSIDE'].includes(s.time))
    .map(s => `${s.name}(${s.time === 'OFF' ? '휴가' : '외근'})`)
    .join(', ') || '-';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <div className="selected-date-badge">
            <span className="label">선택된 날짜</span>
            <span className="value">{format(selectedDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}</span>
          </div>
          <h1>📅 파트 근무 현황 대시보드</h1>
        </div>
        <div className="header-actions">
          {!isWeekend(selectedDate) && (
            <div className={`status-badge ${!isRuleMet ? 'warning' : ''}`}>
              {isRuleMet ? (
                <>
                  <Check size={16} /> 오늘자 18시 상주 충족 ({after18Count}명)
                </>
              ) : (
                <>
                  <AlertTriangle size={16} /> 18시 상주 인원 부족! ({after18Count}명 / 최소 2명 필요)
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="stats-container">
        {['0800', '0830', '0900', '0930', '1000'].map(time => (
          <div className="stat-card" key={time}>
            <div className="stat-header">
              <span>{SHIFT_TIMES[time].label.split(' ~ ')[0]} 시작</span>
              <div className="stat-dot" style={{ backgroundColor: SHIFT_TIMES[time].color }}></div>
            </div>
            <div className="stat-count">{getCountByTime(time)}</div>
            <div className="stat-names">{getNamesByTime(time)}</div>
          </div>
        ))}
        
        <div className="stat-card" style={{ background: '#f8fafc' }}>
          <div className="stat-header">
            <span>휴가 / 외근</span>
            <div className="stat-dot" style={{ background: 'var(--color-off)' }}></div>
          </div>
          <div className="stat-count" style={{ color: 'var(--text-sub)' }}>
            {shifts.filter(s => ['OFF', 'OUTSIDE'].includes(s.time)).length}
          </div>
          <div className="stat-names">{offNames}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
