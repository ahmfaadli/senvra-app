import { supabase } from './supabase';

export async function getRequests() {
  const { data, error } = await supabase
    .from('surat_requests')
    .select(`
      *,
      employee:profiles!surat_requests_employee_id_fkey (
        id,
        nama,
        email,
        jabatan,
        divisi
      )
    `)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function updateRequestStatus({
  requestId,
  status,
  adminNote,
  processedBy,
}) {
  const { data, error } = await supabase
    .from('surat_requests')
    .update({
      status,
      admin_note: adminNote || null,
      processed_by: processedBy || null,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

