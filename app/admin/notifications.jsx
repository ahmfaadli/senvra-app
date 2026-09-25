import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

export default function AdminNotifications() {
  const [employees, setEmployees] =
    useState([]);

  const [employeeId, setEmployeeId] =
    useState('');

  const [title, setTitle] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const { data, error } =
      await supabase
        .from('profiles')
        .select('id,name')
        .eq('role', 'pegawai')
        .order('name');

    if (error) {
      console.log(error);
      return;
    }

    setEmployees(data || []);
  };

  const sendNotification = async () => {
    if (!employeeId) {
      Alert.alert(
        'Form belum lengkap',
        'Pilih penerima.'
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(
        'Form belum lengkap',
        'Judul notifikasi wajib diisi.'
      );
      return;
    }

    if (!message.trim()) {
      Alert.alert(
        'Form belum lengkap',
        'Pesan wajib diisi.'
      );
      return;
    }

    try {
      setSaving(true);

      const { error } =
        await supabase
          .from('notifications')
          .insert({
            employee_id: employeeId,
            type: 'admin',
            title: title.trim(),
            message: message.trim(),
            reference_id: null,
            is_read: false,
          });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Berhasil',
        'Notifikasi berhasil dikirim.'
      );

      setEmployeeId('');
      setTitle('');
      setMessage('');
    } catch (error) {
      Alert.alert(
        'Gagal',
        error.message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Kelola Notifikasi
      </Text>

      <Text style={styles.subtitle}>
        Kirim pemberitahuan kepada pegawai.
      </Text>

      <Text style={styles.label}>
        Pilih Penerima
      </Text>

      {employees.map((employee) => (
        <Pressable
          key={employee.id}
          style={[
            styles.employee,
            employeeId === employee.id &&
              styles.employeeActive,
          ]}
          onPress={() =>
            setEmployeeId(employee.id)
          }
        >
          <Text
            style={[
              styles.employeeText,
              employeeId === employee.id &&
                styles.employeeTextActive,
            ]}
          >
            {employee.name}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.label}>
        Judul
      </Text>

      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Judul pemberitahuan"
        placeholderTextColor="#98A2B3"
      />

      <Text style={styles.label}>
        Isi Pesan
      </Text>

      <TextInput
        style={styles.textarea}
        value={message}
        onChangeText={setMessage}
        placeholder="Tulis pesan..."
        placeholderTextColor="#98A2B3"
        multiline
        textAlignVertical="top"
      />

      <Pressable
        style={styles.button}
        onPress={sendNotification}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Kirim Notifikasi
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#101828',
  },

  subtitle: {
    color: '#667085',
    marginTop: 5,
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#344054',
    marginTop: 15,
    marginBottom: 8,
  },

  employee: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    marginBottom: 8,
  },

  employeeActive: {
    backgroundColor: '#EAF2FF',
    borderColor: '#175CD3',
  },

  employeeText: {
    color: '#344054',
    fontWeight: '700',
  },

  employeeTextActive: {
    color: '#175CD3',
  },

  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#101828',
  },

  textarea: {
    height: 130,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    padding: 14,
    color: '#101828',
  },

  button: {
    height: 52,
    backgroundColor: '#175CD3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});