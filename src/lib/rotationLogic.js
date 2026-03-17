import { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, format, getDay } from 'date-fns';

export const MEMBERS = ['경진', '준', '지원', '미진', '주봉', '대현'];
export const ROTATION_MEMBERS = ['준', '지원', '미진', '주봉', '대현'];

export const SHIFT_TIMES = {
  '0800': { label: '08:00 ~ 17:00', time: '0800', color: 'var(--color-0800)' },
  '0830': { label: '08:30 ~ 17:30', time: '0830', color: 'var(--color-0830)' },
  '0900': { label: '09:00 ~ 18:00', time: '0900', color: 'var(--color-0900)' },
  '0930': { label: '09:30 ~ 18:30', time: '0930', color: 'var(--color-0930)' },
  '1000': { label: '10:00 ~ 19:00', time: '1000', color: 'var(--color-1000)' },
  'OFF': { label: '휴가/연차', time: 'OFF', color: 'var(--color-off)' },
  'OUTSIDE': { label: '외근', time: 'OUTSIDE', color: 'var(--color-outside)' },
};

/**
 * 특정 월의 기본 근무 데이터를 생성합니다.
 * @param {Date} targetDate 해당 월의 Date 객체
 * @returns {Object} 날짜를 키로 하는 초기 근무 데이터
 */
export const generateDefaultMonthlyShifts = (targetDate) => {
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);
  const days = eachDayOfInterval({ start, end });
  
  const shiftsData = {};
  let rotationIdx = 0; // 실제로는 시작점 기준을 맞춰야 하지만, 일단 첫날부터 순회

  days.forEach((day) => {
    if (isWeekend(day)) return;

    const dateKey = format(day, 'yyyy-MM-dd');
    const dayOfWeek = getDay(day); // 0 (일) ~ 6 (토)
    
    let dailyShifts = [];

    // 1) 대현 화요일 10시 픽스
    if (dayOfWeek === 2) {
      dailyShifts.push({ name: '대현', time: '1000' });
    }

    // 2) 08시 출근 로테이션 멤버 1명 배정
    let current8AM = ROTATION_MEMBERS[rotationIdx % ROTATION_MEMBERS.length];
    
    // 만약 대현이 오늘 이미 10시에 배정되었는데 로테이션 순번이라면 다음 사람으로 넘김
    if (dailyShifts.find(s => s.name === current8AM)) {
      rotationIdx++;
      current8AM = ROTATION_MEMBERS[rotationIdx % ROTATION_MEMBERS.length];
    }
    
    dailyShifts.push({ name: current8AM, time: '0800' });
    rotationIdx++;

    // 3) 나머지 인원 기본 09:00 배정
    MEMBERS.forEach((mbr) => {
      if (!dailyShifts.find(s => s.name === mbr)) {
        dailyShifts.push({ name: mbr, time: '0900' });
      }
    });

    shiftsData[dateKey] = {
      shifts: dailyShifts,
      isEdited: false
    };
  });

  return shiftsData;
};

/**
 * 특정 날짜의 18시 상주 인원을 계산합니다.
 */
export const countAfter18 = (shifts) => {
  if (!shifts) return 0;
  // 09:00 이후 출근자 (09:00, 09:30, 10:00)들만 18시 이후에도 상주함
  return shifts.filter(s => ['0900', '0930', '1000'].includes(s.time)).length;
};
