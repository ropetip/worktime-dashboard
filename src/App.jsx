import React, { useState, useEffect } from 'react';
import { format, isSameMonth, parseISO } from 'date-fns';
import { generateDefaultMonthlyShifts } from './lib/rotationLogic';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import ScheduleModal from './components/ScheduleModal';

const STORAGE_KEY = 'worktime_dashboard_shifts';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date()); // 달력 표시 기준 월
  const [selectedDate, setSelectedDate] = useState(new Date()); // 대시보드 표시 날짜
  const [shiftsData, setShiftsData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse shifts data', e);
      }
    }
    // 기본 데이터 생성 (현재 월 기준)
    return generateDefaultMonthlyShifts(new Date());
  });

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    initialData: null
  });

  // 데이터 변경 시 로컬 스토리지 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shiftsData));
  }, [shiftsData]);

  // 새로운 달로 이동할 때 해당 월의 기본 데이터가 없으면 생성
  useEffect(() => {
    const monthKey = format(currentDate, 'yyyy-MM');
    // 간단하게 첫 날의 데이터가 있는지 확인 (실제로는 더 정교할 필요가 있음)
    const firstDayKey = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
    
    if (!shiftsData[firstDayKey]) {
      const newMonthData = generateDefaultMonthlyShifts(currentDate);
      setShiftsData(prev => ({ ...newMonthData, ...prev }));
    }
  }, [currentDate]);

  const handleSaveSchedule = (formData) => {
    const { date, name, time, reason } = formData;
    
    setShiftsData(prev => {
      const newData = { ...prev };
      if (!newData[date]) {
        newData[date] = { shifts: [], isEdited: true };
      }
      
      // 기존 인원 삭제 후 추가 (덮어쓰기)
      const filteredShifts = newData[date].shifts.filter(s => s.name !== name);
      newData[date] = {
        ...newData[date],
        shifts: [...filteredShifts, { name, time, reason }],
        isEdited: true
      };
      
      return newData;
    });
    
    // 저장 후 해당 날짜로 대시보드 갱신
    setSelectedDate(parseISO(date));
  };

  const handleDeleteSchedule = (date, name) => {
    setShiftsData(prev => {
      const newData = { ...prev };
      if (newData[date]) {
        newData[date] = {
          ...newData[date],
          shifts: newData[date].shifts.filter(s => s.name !== name),
          isEdited: true
        };
      }
      return newData;
    });
  };

  return (
    <div className="container">
      <Dashboard 
        selectedDate={selectedDate} 
        shiftsData={shiftsData} 
      />

      <Calendar 
        currentDate={currentDate} 
        setCurrentDate={setCurrentDate} 
        shiftsData={shiftsData}
        onDateClick={(date) => setSelectedDate(date)}
        onAddClick={() => setModalConfig({ 
          isOpen: true, 
          initialData: { date: format(selectedDate, 'yyyy-MM-dd') } 
        })}
        onShiftClick={(date, shift) => setModalConfig({ 
          isOpen: true, 
          initialData: { ...shift, date, isEdit: true } 
        })}
      />

      <ScheduleModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, initialData: null })}
        onSave={handleSaveSchedule}
        onDelete={handleDeleteSchedule}
        initialData={modalConfig.initialData}
      />
    </div>
  );
}

export default App;
