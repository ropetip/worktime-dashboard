import React, { useState, useEffect, useMemo } from 'react';
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import ScheduleModal from './components/ScheduleModal';
import PresetManagement from './components/PresetManagement';
import MemberManagement from './components/MemberManagement';
import { Settings, Users, LogOut } from 'lucide-react';
import { fetchMembers } from './memberLogic';
import Login from './components/Login';

const STORAGE_KEY = 'worktime_dashboard_shifts';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date()); // 달력 표시 기준 월
  const [selectedDate, setSelectedDate] = useState(new Date()); // 대시보드 표시 날짜
  const [dbShifts, setDbShifts] = useState([]); // DB에서 가져온 특이 일정 데이터
  const [members, setMembers] = useState([]); // DB에서 가져온 인원 데이터
  const [loading, setLoading] = useState(true);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    initialData: null
  });

  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [isMemberOpen, setIsMemberOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  // DB에서 데이터 가져오기
  const fetchSchedules = async () => {
    setLoading(true);
    const mData = await fetchMembers();
    setMembers(mData || []);

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

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
  };

  return (
    <div className="container">
      <div className="header-actions-fixed">
        <button 
          className="btn-preset-open mr-2"
          onClick={handleLogout}
          title="로그아웃"
          style={{ borderColor: '#e2e8f0', color: '#ef4444' }}
        >
          <LogOut size={16} /> 로그아웃
        </button>
        <button 
          className="btn-preset-open mr-2" 
          onClick={() => setIsMemberOpen(true)}
          style={{ borderColor: '#e2e8f0' }}
        >
          <Users size={16} /> 구성원 관리
        </button>
        <button 
          className="btn-preset-open" 
          onClick={() => setIsPresetOpen(true)}
        >
          <Settings size={16} /> 프리셋 설정
        </button>
      </div>

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
        members={members}
      />

      <PresetManagement 
        isOpen={isPresetOpen}
        onClose={() => setIsPresetOpen(false)}
        onSuccess={fetchSchedules}
        members={members}
      />

      <MemberManagement
        isOpen={isMemberOpen}
        onClose={() => setIsMemberOpen(false)}
        members={members}
        onMemberUpdate={async () => {
          const mData = await fetchMembers();
          setMembers(mData || []);
        }}
      />
    </div>
  );
}

export default App;
