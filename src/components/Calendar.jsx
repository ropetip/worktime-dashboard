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
  eachDayOfInterval,
  isBefore,
  isAfter
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import ShiftTag from './ShiftTag';

const Calendar = ({ currentDate, setCurrentDate, shiftsData, searchTerm, onDateClick, onRangeSelect, onShiftClick }) => {
  const [selectionRange, setSelectionRange] = React.useState(null); // { start, end }
  const [isSelecting, setIsSelecting] = React.useState(false);

  // 전역 마우스 업 리스너
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting && selectionRange) {
        if (!isSameDay(selectionRange.start, selectionRange.end)) {
          // 기간 선택 완료
          if (onRangeSelect) onRangeSelect(selectionRange);
        }
      }
      setIsSelecting(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting, selectionRange, onRangeSelect]);

  const handleMouseDown = (date) => {
    setSelectionRange({ start: date, end: date });
    setIsSelecting(true);
    onDateClick(date);
  };

  const handleMouseEnter = (date) => {
    if (isSelecting) {
      setSelectionRange(prev => ({ ...prev, end: date }));
    }
  };

  const isBetween = (day, range) => {
    if (!range) return false;
    const { start, end } = range;
    const s = isBefore(start, end) ? start : end;
    const e = isBefore(start, end) ? end : start;
    return (isAfter(day, s) || isSameDay(day, s)) && (isBefore(day, e) || isSameDay(day, e));
  };
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const renderHeader = () => (
    <div className="calendar-nav">
      <div className="nav-left">
        <button className="nav-btn" onClick={prevMonth}>
          <ChevronLeft size={20} /> 이전 달
        </button>
      </div>
      <h2>{format(currentDate, 'yyyy년 M월')}</h2>
      <div className="nav-right">
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
        const isSelected = isBetween(day, selectionRange);

        days.push(
          <div
            key={formattedDate}
            className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
            onMouseDown={() => handleMouseDown(currentDay)}
            onMouseEnter={() => handleMouseEnter(currentDay)}
          >
            <span className="day-number">{format(day, 'd')}</span>
            <div className="shift-tags-container">
              {sortedShifts.map((shift, idx) => (
                <ShiftTag 
                  key={shift.id || `${formattedDate}-${shift.name}-${idx}`} 
                  shift={shift} 
                  onClick={() => onShiftClick(formattedDate, shift)}
                  onMouseDown={(e) => e.stopPropagation()} // 드래그 시작 방지
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
