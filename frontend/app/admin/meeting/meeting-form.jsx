import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../../services/supabase';

export default function MeetingForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const meetingId = Array.isArray(id) ? id[0] : id;
  const isEdit = !!meetingId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  /**
   * LOAD PEGAWAI
   */
  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nama, email, jabatan, divisi, role, status')
        .eq('role', 'pegawai')
        .eq('status', 'aktif')
        .order('nama', {
          ascending: true,
        });

      if (error) {
        console.log('LOAD EMPLOYEES ERROR:', error);
        throw error;
      }

      setEmployees(data || []);
    } catch (error) {
      Alert.alert(
        'Gagal',
        error?.message || 'Gagal mengambil data pegawai.'
      );
    }
  };

  /**
   * LOAD MEETING UNTUK EDIT
   */
  const loadMeeting = async () => {
    if (!meetingId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          id,
          title,
          description,
          meeting_date,
          start_time,
          end_time,
          location,
          meeting_link,
          meeting_participants (
            employee_id
          )
        `)
        .eq('id', meetingId)
        .single();

      if (error) {
        console.log('LOAD MEETING ERROR:', error);
        throw error;
      }

      setTitle(data?.title || '');
      setDescription(data?.description || '');
      setMeetingDate(data?.meeting_date || '');
      setStartTime(formatTime(data?.start_time));
      setEndTime(formatTime(data?.end_time));
      setLocation(data?.location || '');
      setMeetingLink(data?.meeting_link || '');

      const participantIds =
        data?.meeting_participants?.map(
          (item) => item.employee_id
        ) || [];

      setSelectedEmployees(participantIds);
    } catch (error) {
      Alert.alert(
        'Gagal',
        error?.message || 'Gagal mengambil data meeting.'
      );
    }
  };

  /**
   * LOAD SEMUA DATA
   */
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);

        await loadEmployees();

        if (meetingId) {
          await loadMeeting();
        }

        setLoading(false);
      };

      loadData();
    }, [meetingId])
  );

  /**
   * FORMAT TIME DATABASE
   */
  const formatTime = (time) => {
    if (!time) {
      return '';
    }

    return String(time).substring(0, 5);
  };

  /**
   * PILIH / BATAL PILIH PEGAWAI
   */
  const toggleEmployee = (employeeId) => {
    setSelectedEmployees((current) => {
      if (current.includes(employeeId)) {
        return current.filter((id) => id !== employeeId);
      }

      return [...current, employeeId];
    });
  };

  /**
   * VALIDASI
   */
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Validasi', 'Judul meeting wajib diisi.');
      return false;
    }

    if (!meetingDate.trim()) {
      Alert.alert(
        'Validasi',
        'Tanggal meeting wajib diisi.\nContoh: 2026-12-11'
      );
      return false;
    }

    if (!startTime.trim()) {
      Alert.alert(
        'Validasi',
        'Jam mulai wajib diisi.\nContoh: 08:00'
      );
      return false;
    }

    if (!endTime.trim()) {
      Alert.alert(
        'Validasi',
        'Jam selesai wajib diisi.\nContoh: 10:00'
      );
      return false;
    }

    if (selectedEmployees.length === 0) {
      Alert.alert(
        'Validasi',
        'Pilih minimal satu pegawai untuk mengikuti meeting.'
      );
      return false;
    }

    return true;
  };

  /**
   * SIMPAN MEETING
   */
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        meeting_date: meetingDate.trim(),
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        location: location.trim() || null,
        meeting_link: meetingLink.trim() || null,
      };

      console.log('=================================');
      console.log('SAVE MEETING');
      console.log('MODE:', isEdit ? 'EDIT' : 'CREATE');
      console.log('PAYLOAD:', payload);
      console.log('EMPLOYEES:', selectedEmployees);

      let savedMeetingId = meetingId;

      /**
       * CREATE
       */
      if (!isEdit) {
        const { data, error } = await supabase
          .from('meetings')
          .insert(payload)
          .select('id')
          .single();

        if (error) {
          console.log('CREATE MEETING ERROR:', error);
          throw error;
        }

        savedMeetingId = data.id;
      }

      /**
       * UPDATE
       */
      else {
        const { error } = await supabase
          .from('meetings')
          .update(payload)
          .eq('id', meetingId);

        if (error) {
          console.log('UPDATE MEETING ERROR:', error);
          throw error;
        }

        /**
         * Hapus peserta lama
         */
        const { error: deleteError } = await supabase
          .from('meeting_participants')
          .delete()
          .eq('meeting_id', meetingId);

        if (deleteError) {
          console.log(
            'DELETE OLD PARTICIPANTS ERROR:',
            deleteError
          );

          throw deleteError;
        }
      }

      /**
       * INSERT PESERTA
       */
      const participantPayload = selectedEmployees.map(
        (employeeId) => ({
          meeting_id: savedMeetingId,
          employee_id: employeeId,
          status: 'diundang',
        })
      );

      console.log(
        'PARTICIPANT PAYLOAD:',
        participantPayload
      );

      const { error: participantError } = await supabase
        .from('meeting_participants')
        .insert(participantPayload);

      if (participantError) {
        console.log(
          'INSERT PARTICIPANTS ERROR:',
          participantError
        );

        /**
         * Kalau meeting baru berhasil dibuat tetapi
         * peserta gagal dibuat, hapus meeting supaya
         * tidak meninggalkan data meeting kosong.
         */
        if (!isEdit && savedMeetingId) {
          await supabase
            .from('meetings')
            .delete()
            .eq('id', savedMeetingId);
        }

        throw participantError;
      }

      console.log('MEETING BERHASIL DISIMPAN');
      console.log('MEETING ID:', savedMeetingId);

      Alert.alert(
        'Berhasil',
        isEdit
          ? 'Meeting berhasil diperbarui.'
          : 'Meeting berhasil dibuat.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/admin/meetings');
            },
          },
        ]
      );
    } catch (error) {
      console.log('SAVE MEETING ERROR:', error);

      Alert.alert(
        'Gagal menyimpan meeting',
        error?.message ||
          'Terjadi kesalahan saat menyimpan meeting.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text style={styles.loadingText}>
          Memuat data meeting...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#101828"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>
            {isEdit ? 'Edit Meeting' : 'Tambah Meeting'}
          </Text>

          <Text style={styles.subtitle}>
            {isEdit
              ? 'Perbarui jadwal dan peserta meeting.'
              : 'Buat jadwal meeting untuk pegawai.'}
          </Text>
        </View>
      </View>

      {/* JUDUL */}

      <View style={styles.section}>
        <Text style={styles.label}>
          Judul Meeting
        </Text>

        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Contoh: Meeting Project Website"
          placeholderTextColor="#98A2B3"
        />
      </View>

      {/* DESKRIPSI */}

      <View style={styles.section}>
        <Text style={styles.label}>
          Deskripsi
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.textArea,
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder="Masukkan deskripsi meeting"
          placeholderTextColor="#98A2B3"
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* TANGGAL */}

      <View style={styles.section}>
        <Text style={styles.label}>
          Tanggal
        </Text>

        <TextInput
          style={styles.input}
          value={meetingDate}
          onChangeText={setMeetingDate}
          placeholder="2026-12-11"
          placeholderTextColor="#98A2B3"
          autoCapitalize="none"
        />

        <Text style={styles.helper}>
          Format: YYYY-MM-DD
        </Text>
      </View>

      {/* WAKTU */}

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>
            Jam Mulai
          </Text>

          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="08:00"
            placeholderTextColor="#98A2B3"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.half}>
          <Text style={styles.label}>
            Jam Selesai
          </Text>

          <TextInput
            style={styles.input}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="10:00"
            placeholderTextColor="#98A2B3"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      {/* LOKASI */}

      <View style={styles.section}>
        <Text style={styles.label}>
          Lokasi
        </Text>

        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Contoh: Ruang Meeting / Kantor"
          placeholderTextColor="#98A2B3"
        />
      </View>

      {/* LINK */}

      <View style={styles.section}>
        <Text style={styles.label}>
          Link Meeting
        </Text>

        <TextInput
          style={styles.input}
          value={meetingLink}
          onChangeText={setMeetingLink}
          placeholder="https://meet.google.com/..."
          placeholderTextColor="#98A2B3"
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      {/* PEGAWAI */}

      <View style={styles.section}>
        <Text style={styles.label}>
          Pilih Pegawai
        </Text>

        <Text style={styles.helper}>
          Pilih pegawai yang akan mengikuti meeting.
        </Text>

        <View style={styles.employeeList}>
          {employees.length === 0 ? (
            <View style={styles.noEmployee}>
              <Ionicons
                name="people-outline"
                size={30}
                color="#98A2B3"
              />

              <Text style={styles.noEmployeeText}>
                Belum ada pegawai aktif.
              </Text>
            </View>
          ) : (
            employees.map((employee) => {
              const selected =
                selectedEmployees.includes(
                  employee.id
                );

              return (
                <Pressable
                  key={employee.id}
                  style={[
                    styles.employeeCard,
                    selected &&
                      styles.employeeCardSelected,
                  ]}
                  onPress={() =>
                    toggleEmployee(employee.id)
                  }
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(employee.nama || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.employeeInfo}>
                    <Text
                      style={styles.employeeName}
                    >
                      {employee.nama ||
                        'Nama tidak tersedia'}
                    </Text>

                    <Text
                      style={styles.employeeEmail}
                    >
                      {employee.email || '-'}
                    </Text>

                    <Text
                      style={styles.employeePosition}
                    >
                      {employee.jabatan || '-'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      selected &&
                        styles.checkboxSelected,
                    ]}
                  >
                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </View>

      {/* BUTTON */}

      <Pressable
        style={[
          styles.saveButton,
          saving && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <>
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

            <Text style={styles.saveButtonText}>
              Menyimpan...
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name="save-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.saveButtonText}>
              {isEdit
                ? 'Simpan Perubahan'
                : 'Buat Meeting'}
            </Text>
          </>
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
    paddingBottom: 120,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },

  loadingText: {
    marginTop: 10,
    color: '#667085',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#101828',
  },

  subtitle: {
    marginTop: 4,
    color: '#667085',
    fontSize: 13,
  },

  section: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#344054',
    marginBottom: 8,
  },

  helper: {
    fontSize: 11,
    color: '#98A2B3',
    marginTop: 5,
  },

  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#101828',
    fontSize: 14,
  },

  textArea: {
    height: 110,
    paddingTop: 14,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },

  half: {
    flex: 1,
  },

  employeeList: {
    gap: 9,
    marginTop: 8,
  },

  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 14,
    padding: 10,
  },

  employeeCardSelected: {
    borderColor: '#175CD3',
    backgroundColor: '#F5F9FF',
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#175CD3',
  },

  employeeInfo: {
    flex: 1,
    marginLeft: 10,
  },

  employeeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101828',
  },

  employeeEmail: {
    fontSize: 11,
    color: '#667085',
    marginTop: 2,
  },

  employeePosition: {
    fontSize: 11,
    color: '#98A2B3',
    marginTop: 2,
  },

  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#D0D5DD',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxSelected: {
    backgroundColor: '#175CD3',
    borderColor: '#175CD3',
  },

  noEmployee: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 25,
  },

  noEmployeeText: {
    marginTop: 8,
    color: '#98A2B3',
    fontSize: 13,
  },

  saveButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: '#175CD3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});