import { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, format, getDay } from 'date-fns';
import { supabase } from './supabase';

/**
 * 특정 월의 요일별 규칙에 따른 스케줄 데이터를 생성합니다.
 * @param {string} dateStr 'YYYY-MM' 형식의 연월
 * @param {Object} rules { 1: '이름', 2: '이름', ... } // 1(월)~5(금)
 * @returns {Array} 생성된 스케줄 객체 배열
 */
export const generateMonthlyBatchData = (dateStr, rules) => {
  const [year, month] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, 1);
  
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);
  const days = eachDayOfInterval({ start, end });
  
  const batchData = [];

  days.forEach((day) => {
    if (isWeekend(day)) return;

    const dayOfWeek = getDay(day); // 0(일)~6(토)
    const dayRules = rules[dayOfWeek] || [];

    dayRules.forEach(rule => {
      if (rule.name) {
        batchData.push({
          date: format(day, 'yyyy-MM-dd'),
          name: rule.name,
          time: rule.time || '0900',
          reason: '월간 프리셋 자동 생성'
        });
      }
    });
  });

  return batchData;
};

/**
 * 해당 월의 기존 데이터를 삭제하고 새로운 배치 데이터를 삽입합니다.
 * @param {string} dateStr 'YYYY-MM' 형식
 * @param {Array} batchData 삽입할 데이터 배열
 */
export const executeBatchInsert = async (dateStr, batchData) => {
  const [year, month] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, 1);
  const start = format(startOfMonth(targetDate), 'yyyy-MM-dd');
  const end = format(endOfMonth(targetDate), 'yyyy-MM-dd');

  // 1. 해당 월의 기존 '9시 자동 생성' 데이터만 삭제하거나 전체 삭제 선택 가능
  // 여기서는 안전을 위해 기존 배치 생성 데이터만 삭제하거나, 사용자 요청대로 전체 삭제 후 재생성
  const { error: deleteError } = await supabase
    .from('schedules')
    .delete()
    .gte('date', start)
    .lte('date', end)
    .eq('reason', '월간 프리셋 자동 생성'); // 프리셋으로 생성된 것만 삭제

  if (deleteError) throw deleteError;

  // 2. 새로운 데이터 삽입
  if (batchData.length === 0) return;

  const { error: insertError } = await supabase
    .from('schedules')
    .insert(batchData);

  if (insertError) throw insertError;

  return true;
};
