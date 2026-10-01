import { supabase } from './supabase';

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

