import React, { useState, useEffect, useMemo } from 'react';
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth, isBefore, eachDayOfInterval } from 'date-fns';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import ScheduleModal from './components/ScheduleModal';
import PresetManagement from './components/PresetManagement';
import MemberManagement from './components/MemberManagement';
import { Settings, Users, LogOut, Plus, RefreshCw } from 'lucide-react';
import { fetchMembers } from './memberLogic';
import Login from './components/Login';
import ConfirmModal from './components/ConfirmModal';
import { useRef } from 'react';

const STORAGE_KEY = 'worktime_dashboard_shifts';

function App() {
  const fetchControllerRef = useRef(null); // 중복 요청 제어용
  const debounceTimerRef = useRef(null); // 실시간 리스너 디바운스용
  const [currentDate, setCurrentDate] = useState(new Date()); // 달력 표시 기준 월
  const [selectedDate, setSelectedDate] = useState(new Date()); // 대시보드 표시 날짜
  const [dbShifts, setDbShifts] = useState([]); // DB에서 가져온 특이 일정 데이터
  const [members, setMembers] = useState([]); // DB에서 가져온 인원 데이터

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    initialData: null
  });

  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [isMemberOpen, setIsMemberOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [searchTerm, setSearchTerm] = useState(''); // 검색어 상태 추가

  // 커스텀 확인 창 상태
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {}
  });

  // DB에서 데이터 가져오기
  const fetchSchedules = async (overrideDate = null) => {
    // 이전 진행 중인 요청이 있다면 취소
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    try {
      // DB 데이터
      const targetDate = overrideDate || currentDate;
      const start = format(startOfMonth(targetDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(targetDate), 'yyyy-MM-dd');

      const mData = await fetchMembers();
      setMembers(mData || []);

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .neq('sts', 'D')
        .gte('date', start)
        .lte('date', end)
        .abortSignal(controller.signal);

      if (error) {
        // 이미 취소된 요청은 에러 무시
        if (error.name === 'AbortError' || error.code === '20') return;
        console.error('Error fetching schedules:', error);
      } else {
        setDbShifts(data || []);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
    }
  };

  // 초기 로드 및 월 변경 시 페칭
  useEffect(() => {
    fetchSchedules();

    // 실시간 구독 설정 - 디바운스 적용하여 중복 요청 최소화
    const handleChanges = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchSchedules();
      }, 300);
    };

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'schedules' }, 
        handleChanges
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
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
    const { id, date, name, time, reason, dates } = formData; // dates는 배열일 수 있음
    const userEmail = localStorage.getItem('userEmail') || 'unknown';
    const now = new Date().toISOString();
    
    let result;
    if (id) {
      // 수정 (Update) - 단건
      result = await supabase
        .from('schedules')
        .update({ 
          date, 
          name, 
          time, 
          reason,
          sts: 'U',
          mod_id: userEmail,
          mod_dt: now
        })
        .eq('id', id);
    } else if (dates && dates.length > 0) {
      // 다건 등록 (Insert range)
      const batchData = dates.map(d => ({
        date: d,
        name,
        time,
        reason,
        sts: 'C',
        create_id: userEmail
      }));
      result = await supabase
        .from('schedules')
        .insert(batchData);
    } else {
      // 신규 추가 (Insert single)
      result = await supabase
        .from('schedules')
        .insert([{ 
          date, 
          name, 
          time, 
          reason,
          sts: 'C',
          create_id: userEmail 
        }]);
    }

    if (result.error) {
      console.error('Error saving schedule:', result.error);
      alert('일정 저장 중 오류가 발생했습니다.');
    } else {
      fetchSchedules(); // 목록 갱신
      if (date) setSelectedDate(parseISO(date));
      else if (dates && dates.length > 0) setSelectedDate(parseISO(dates[0]));
    }
  };

  // 기간 선택 시 모달 오픈
  const handleRangeSelect = (range) => {
    const { start, end } = range;
    const s = isBefore(start, end) ? start : end;
    const e = isBefore(start, end) ? end : start;
    const days = eachDayOfInterval({ start: s, end: e });
    const formattedDates = days.map(d => format(d, 'yyyy-MM-dd'));

    setModalConfig({
      isOpen: true,
      initialData: {
        dates: formattedDates,
        date: formattedDates[0], // 표시용
        isRange: true
      }
    });
  };

  const handleDeleteSchedule = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: '일정 삭제',
      message: '이 일정을 정말 삭제하시겠습니까?',
      type: 'danger',
      onConfirm: async () => {
        const { error } = await supabase
          .from('schedules')
          .update({ sts: 'D' })
          .eq('id', id);

        if (error) {
          console.error('Error deleting schedule:', error);
          alert('일정 삭제 중 오류가 발생했습니다.');
        } else {
          fetchSchedules();
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 검색어로 필터링된 데이터 (달력 표시용)
  const filteredShiftsData = useMemo(() => {
    if (!searchTerm) return shiftsData;
    
    const filtered = {};
    Object.keys(shiftsData).forEach(date => {
      const dayData = shiftsData[date];
      const matchingShifts = dayData.shifts.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingShifts.length > 0) {
        filtered[date] = { ...dayData, shifts: matchingShifts };
      }
    });
    return filtered;
  }, [shiftsData, searchTerm]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const handleResetMonth = () => {
    const monthStr = format(currentDate, 'yyyy년 M월');
    setConfirmConfig({
      isOpen: true,
      title: '월간 데이터 초기화',
      message: `${monthStr}의 모든 일정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      type: 'danger',
      onConfirm: async () => {
        const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

        const { error } = await supabase
          .from('schedules')
          .update({ sts: 'D' })
          .gte('date', start)
          .lte('date', end);

        if (error) {
          console.error('Error resetting month:', error);
          alert('초기화 중 오류가 발생했습니다.');
        } else {
          fetchSchedules();
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleLogout = () => {
    setConfirmConfig({
      isOpen: true,
      title: '로그아웃',
      message: '정말 로그아웃 하시겠습니까?',
      type: 'warning',
      onConfirm: () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        setIsAuthenticated(false);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="container">
      <div className="header-actions-fixed">
        <div className="search-container mr-4">
          <input 
            type="text" 
            placeholder="구성원 이름 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
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
        shiftsData={filteredShiftsData} 
      />

      <div className="calendar-actions-top">
        <button 
          className="nav-btn refresh" 
          onClick={() => fetchSchedules()}
          title="조회 (새로고침)"
        >
          <RefreshCw size={16} /> 조회
        </button>
        <button 
          className="nav-btn today" 
          onClick={() => {
            const today = new Date();
            setCurrentDate(today);
            setSelectedDate(today);
          }}
        >오늘</button>
        <button 
          className="btn-add" 
          onClick={() => setModalConfig({ 
            isOpen: true, 
            initialData: { date: format(selectedDate, 'yyyy-MM-dd') } 
          })}
        >
          <Plus size={16} /> 일정 추가
        </button>
        <button className="nav-btn reset" onClick={handleResetMonth}>초기화</button>
      </div>

      <Calendar 
        currentDate={currentDate} 
        setCurrentDate={setCurrentDate} 
        shiftsData={filteredShiftsData}
        searchTerm={searchTerm}
        onDateClick={(date) => setSelectedDate(date)}
        onRangeSelect={handleRangeSelect}
        onResetMonth={handleResetMonth}
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
        onSuccess={async (targetMonth, count) => {
          let newDate = currentDate;
          if (targetMonth) {
            const [year, month] = targetMonth.split('-');
            newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            setCurrentDate(newDate);
            setSelectedDate(newDate);
          }
          await fetchSchedules(newDate);
          setConfirmConfig({
            isOpen: true,
            title: '처리 완료',
            message: `${targetMonth}월 배치 처리가 완료되었습니다. (${count}건)`,
            type: 'success',
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        }}
        members={members}
        setConfirmConfig={setConfirmConfig}
      />

      <MemberManagement
        isOpen={isMemberOpen}
        onClose={() => setIsMemberOpen(false)}
        members={members}
        onMemberUpdate={async () => {
          const mData = await fetchMembers();
          setMembers(mData || []);
        }}
        setConfirmConfig={setConfirmConfig}
      />

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default App;
