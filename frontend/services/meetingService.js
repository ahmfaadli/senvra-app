import { supabase } from './supabase';

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

