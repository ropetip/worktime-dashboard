import React from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import ShiftTag from './ShiftTag';

const Calendar = ({ currentDate, setCurrentDate, shiftsData, onDateClick, onAddClick, onShiftClick }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateClick(today);
  };

  const renderHeader = () => (
    <div className="calendar-nav">
      <div className="nav-left">
        <button className="nav-btn" onClick={prevMonth}>
          <ChevronLeft size={20} /> 이전 달
        </button>
      </div>
      <h2>{format(currentDate, 'yyyy년 M월')}</h2>
      <div className="nav-right">
        <button className="nav-btn today" onClick={goToToday}>오늘</button>
        <button className="btn-add" onClick={onAddClick}>
          <Plus size={16} /> 일정 추가
        </button>
        <button className="nav-btn" onClick={nextMonth}>
          다음 달 <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return (
      <div className="calendar-header">
        {days.map((day, i) => (
          <div key={i} className={`calendar-header-cell ${i === 0 || i === 6 ? 'weekend' : ''}`}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const rows = [];
    let days = [];
    let day = startDate;
    const today = new Date();

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const shifts = shiftsData[formattedDate]?.shifts || [];
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, today);

        // 정렬: 시간순
        const sortedShifts = [...shifts].sort((a, b) => a.time.localeCompare(b.time));

        const currentDay = day; // 현재 루프의 날짜 고정 (클로저 이슈 방지)
        days.push(
          <div
            key={formattedDate}
            className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
            onClick={() => onDateClick(currentDay)}
          >
            <span className="day-number">{format(day, 'd')}</span>
            <div className="shift-tags-container">
              {sortedShifts.map((shift, idx) => (
                <ShiftTag 
                  key={shift.id || `${formattedDate}-${shift.name}-${idx}`} 
                  shift={shift} 
                  onClick={() => onShiftClick(formattedDate, shift)}
                />
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="calendar-grid" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="calendar-body">{rows}</div>;
  };

  return (
    <div className="calendar-wrapper">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default Calendar;
