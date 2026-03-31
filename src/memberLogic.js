import { supabase } from './lib/supabase';

/**
 * DB에서 전체 구성원 목록을 가져옵니다.
 */
export const fetchMembers = async () => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }
  return data;
};

/**
 * 새로운 구성원을 추가합니다.
 */
export const addMember = async (name) => {
  const userEmail = localStorage.getItem('userEmail') || 'unknown';
  const { data, error } = await supabase
    .from('members')
    .insert([{ name, create_id: userEmail }])
    .select();

  if (error) throw error;
  return data[0];
};

/**
 * 구성원을 삭제합니다.
 */
export const deleteMember = async (id) => {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
