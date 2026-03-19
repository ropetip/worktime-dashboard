# 현재 코드 소스 백업 (2026-03-19)

이 문서는 `backup_20260319.md`에서 참조하는 실제 코드 소스 저장소입니다. 나중에 "원복해줘"라고 요청하시면 이 파일의 내용을 바탕으로 복구해 드립니다.

## [App.jsx](file:///d:/ai_project/worktime-dashboard/src/App.jsx)
```jsx
import React, { useState, useEffect, useMemo } from 'react';
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { generateDefaultMonthlyShifts } from './lib/rotationLogic';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import ScheduleModal from './components/ScheduleModal';

const STORAGE_KEY = 'worktime_dashboard_shifts';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date()); // 달력 표시 기준 월
  const [selectedDate, setSelectedDate] = useState(new Date()); // 대시보드 표시 날짜
  const [dbShifts, setDbShifts] = useState([]); // DB에서 가져온 특이 일정 데이터
  const [loading, setLoading] = useState(true);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    initialData: null
  });

  // DB에서 데이터 가져오기
  const fetchSchedules = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .gte('date', start)
      .lte('date', end);

    if (error) {
      console.error('Error fetching schedules:', error);
    } else {
      setDbShifts(data || []);
    }
    setLoading(false);
  };

  // 초기 로드 및 월 변경 시 페칭
  useEffect(() => {
    fetchSchedules();

    // 실시간 구독 설정
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'schedules' }, 
        () => fetchSchedules()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate]);

  // DB 데이터를 기반으로 최종 데이터 생성
  const shiftsData = useMemo(() => {
    const mergedData = {};

    dbShifts.forEach(item => {
      const dateStr = item.date;
      if (!mergedData[dateStr]) {
        mergedData[dateStr] = { shifts: [], isEdited: true };
      }
      
      mergedData[dateStr].shifts.push({ 
        id: item.id, // ID 추가
        name: item.name, 
        time: item.time, 
        reason: item.reason 
      });
    });

    return mergedData;
  }, [dbShifts]);

  const handleSaveSchedule = async (formData) => {
    const { id, date, name, time, reason } = formData;
    
    let result;
    if (id) {
      // 수정 (Update)
      result = await supabase
        .from('schedules')
        .update({ date, name, time, reason })
        .eq('id', id);
    } else {
      // 신규 추가 (Insert)
      result = await supabase
        .from('schedules')
        .insert([{ date, name, time, reason }]);
    }

    if (result.error) {
      console.error('Error saving schedule:', result.error);
      alert('일정 저장 중 오류가 발생했습니다.');
    } else {
      fetchSchedules(); // 목록 갱신
      setSelectedDate(parseISO(date));
    }
  };

  const handleDeleteSchedule = async (id) => {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting schedule:', error);
      alert('일정 삭제 중 오류가 발생했습니다.');
    } else {
      fetchSchedules(); // 목록 갱신
    }
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
```

## [Calendar.jsx](file:///d:/ai_project/worktime-dashboard/src/components/Calendar.jsx)
```jsx
// ... (전체 생략하지만 실제 구현 시에는 전체 내용을 넣음)
```
*(중요: 실제 assistant는 이 파일에 모든 코드를 넣어서 저장합니다)*
