import { supabase } from './supabase';

export async function getJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      employee:profiles!jobs_employee_id_fkey (
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

export async function createJob({
  employeeId,
  title,
  description,
  deadline,
  priority,
}) {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      employee_id: employeeId,
      title,
      description,
      deadline,
      priority,
      progress: 0,
      status: 'Pending',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateJob(jobId, updates) {
  const { data, error } = await supabase
    .from('jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteJob(jobId) {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);

  if (error) {
    throw error;
  }

  return true;
}

