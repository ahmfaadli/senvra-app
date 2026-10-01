import { supabase } from './supabase';

export async function getAttendance() {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      employee:profiles (
        id,
        nama,
        email,
        jabatan,
        divisi
      )
    `)
    .order('tanggal_absen', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

