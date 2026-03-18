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

  // 기본 로테이션 데이터와 DB 데이터를 합쳐서 최종 데이터 생성
  const shiftsData = useMemo(() => {
    const baseData = generateDefaultMonthlyShifts(currentDate);
    const mergedData = { ...baseData };

    dbShifts.forEach(item => {
      const dateStr = item.date;
      if (!mergedData[dateStr]) {
        mergedData[dateStr] = { shifts: [], isEdited: true };
      }
      
      // 이름이 같은 기존 데이터가 있으면 제거하고 새 데이터 추가
      const filteredShifts = mergedData[dateStr].shifts.filter(s => s.name !== item.name);
      mergedData[dateStr] = {
        ...mergedData[dateStr],
        shifts: [...filteredShifts, { name: item.name, time: item.time, reason: item.reason }],
        isEdited: true
      };
    });

    return mergedData;
  }, [currentDate, dbShifts]);

  const handleSaveSchedule = async (formData) => {
    const { date, name, time, reason } = formData;
    
    // Supabase에 저장 (있으면 업데이트, 없으면 삽입)
    // 여기서 (date, name) 조합을 유니크하게 관리하는 것이 좋음. 
    // 하지만 일단은 해당 이름의 해당 날짜 데이터를 모두 지우고 새로 넣는 방식으로 처리하거나
    // 간단히 insert 시도 (RLS 정책에 따라 다를 수 있음)
    const { error } = await supabase
      .from('schedules')
      .insert([{ date, name, time, reason }]);

    if (error) {
      console.error('Error saving schedule:', error);
      alert('일정 저장 중 오류가 발생했습니다.');
    } else {
      fetchSchedules(); // 목록 갱신
      setSelectedDate(parseISO(date));
    }
  };

  const handleDeleteSchedule = async (date, name) => {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .match({ date, name });

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
