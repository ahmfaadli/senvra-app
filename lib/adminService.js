import { supabase } from './supabase';

/* =====================================================
   EMPLOYEE
===================================================== */

export async function getEmployees() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'employee')
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}


/* =====================================================
   JOBDESK
===================================================== */

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


/* =====================================================
   MEETING
===================================================== */

export async function getMeetings() {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      participants:meeting_participants (
        id,
        employee_id,
        status,
        employee:profiles (
          id,
          nama,
          email,
          jabatan,
          divisi
        )
      )
    `)
    .order('meeting_date', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}


export async function createMeeting({
  title,
  description,
  meetingDate,
  startTime,
  endTime,
  location,
  meetingLink,
  createdBy,
}) {
  const { data, error } = await supabase
    .from('meetings')
    .insert({
      title,
      description,
      meeting_date: meetingDate,
      start_time: startTime,
      end_time: endTime,
      location,
      meeting_link: meetingLink,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function addMeetingParticipant({
  meetingId,
  employeeId,
}) {
  const { data, error } = await supabase
    .from('meeting_participants')
    .insert({
      meeting_id: meetingId,
      employee_id: employeeId,
      status: 'Terdaftar',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function deleteMeeting(meetingId) {
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', meetingId);

  if (error) {
    throw error;
  }

  return true;
}


/* =====================================================
   SURAT / REQUEST
===================================================== */

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


/* =====================================================
   NOTIFICATION
===================================================== */

export async function sendNotification({
  employeeId,
  type,
  title,
  message,
  referenceId,
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      employee_id: employeeId,
      type,
      title,
      message,
      reference_id: referenceId || null,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}


/* =====================================================
   ATTENDANCE
===================================================== */

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