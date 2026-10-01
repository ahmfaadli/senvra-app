import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../../services/supabase';

export default function MeetingDetail() {
  const router = useRouter();

  const { id } = useLocalSearchParams();

  const meetingId = Array.isArray(id) ? id[0] : id;

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

  useEffect(() => {
    if (meetingId) {
      loadData();
    }
  }, [meetingId]);

  // ==========================================
  // LOAD MEETING + EMPLOYEES
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true);

      console.log('=================================');
      console.log('LOAD DETAIL MEETING');
      console.log('MEETING ID:', meetingId);

      const [meetingResult, employeesResult] =
        await Promise.all([
          supabase
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
              created_by,
              created_at,
              updated_at,
              meeting_participants (
                id,
                employee_id,
                status,
                employee:profiles (
                  id,
                  nama,
                  email,
                  jabatan,
                  divisi,
                  status
                )
              )
            `)
            .eq('id', meetingId)
            .single(),

          supabase
            .from('profiles')
            .select(`
              id,
              nama,
              email,
              jabatan,
              divisi,
              status,
              role
            `)
            .eq('role', 'pegawai')
            .eq('status', 'aktif')
            .order('nama', {
              ascending: true,
            }),
        ]);

      if (meetingResult.error) {
        console.log(
          'MEETING DETAIL ERROR:',
          meetingResult.error
        );

        throw meetingResult.error;
      }

      if (employeesResult.error) {
        console.log(
          'EMPLOYEE ERROR:',
          employeesResult.error
        );

        throw employeesResult.error;
      }

      const meeting = meetingResult.data;

      console.log('MEETING:', meeting);

      setTitle(meeting.title || '');
      setDescription(meeting.description || '');

      setMeetingDate(
        meeting.meeting_date || ''
      );

      setStartTime(
        meeting.start_time
          ? String(meeting.start_time).substring(0, 5)
          : ''
      );

      setEndTime(
        meeting.end_time
          ? String(meeting.end_time).substring(0, 5)
          : ''
      );

      setLocation(meeting.location || '');

      setMeetingLink(
        meeting.meeting_link || ''
      );

      setEmployees(
        employeesResult.data || []
      );

      const participantIds =
        (meeting.meeting_participants || []).map(
          (participant) => participant.employee_id
        );

      setSelectedEmployees(participantIds);

      console.log(
        'SELECTED PARTICIPANTS:',
        participantIds
      );
    } catch (error) {
      console.log(
        'LOAD DETAIL ERROR:',
        error
      );

      Alert.alert(
        'Gagal',
        error?.message ||
          'Gagal mengambil detail meeting.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SELECT / UNSELECT EMPLOYEE
  // ==========================================

  const toggleEmployee = (employeeId) => {
    setSelectedEmployees((current) => {
      if (current.includes(employeeId)) {
        return current.filter(
          (id) => id !== employeeId
        );
      }

      return [...current, employeeId];
    });
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert(
        'Validasi',
        'Judul meeting wajib diisi.'
      );

      return false;
    }

    if (!meetingDate.trim()) {
      Alert.alert(
        'Validasi',
        'Tanggal meeting wajib diisi.'
      );

      return false;
    }

    if (!startTime.trim()) {
      Alert.alert(
        'Validasi',
        'Jam mulai wajib diisi.'
      );

      return false;
    }

    if (!endTime.trim()) {
      Alert.alert(
        'Validasi',
        'Jam selesai wajib diisi.'
      );

      return false;
    }

    if (selectedEmployees.length === 0) {
      Alert.alert(
        'Validasi',
        'Pilih minimal satu pegawai sebagai peserta meeting.'
      );

      return false;
    }

    return true;
  };

  // ==========================================
  // UPDATE MEETING
  // ==========================================

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      console.log('=================================');
      console.log('UPDATE MEETING');
      console.log('MEETING ID:', meetingId);

      // ----------------------------------------
      // 1. UPDATE DATA MEETING
      // ----------------------------------------

      const { data: updatedMeeting, error: meetingError } =
        await supabase
          .from('meetings')
          .update({
            title: title.trim(),
            description:
              description.trim() || null,

            meeting_date:
              meetingDate.trim(),

            start_time:
              startTime.trim() || null,

            end_time:
              endTime.trim() || null,

            location:
              location.trim() || null,

            meeting_link:
              meetingLink.trim() || null,

            updated_at:
              new Date().toISOString(),
          })
          .eq('id', meetingId)
          .select()
          .single();

      if (meetingError) {
        console.log(
          'UPDATE MEETING ERROR:',
          meetingError
        );

        throw meetingError;
      }

      console.log(
        'UPDATED MEETING:',
        updatedMeeting
      );

      // ----------------------------------------
      // 2. HAPUS PESERTA LAMA
      // ----------------------------------------

      const { error: deleteParticipantsError } =
        await supabase
          .from('meeting_participants')
          .delete()
          .eq('meeting_id', meetingId);

      if (deleteParticipantsError) {
        console.log(
          'DELETE OLD PARTICIPANTS ERROR:',
          deleteParticipantsError
        );

        throw deleteParticipantsError;
      }

      // ----------------------------------------
      // 3. MASUKKAN PESERTA BARU
      // ----------------------------------------

      const participantsToInsert =
        selectedEmployees.map((employeeId) => ({
          meeting_id: meetingId,
          employee_id: employeeId,
          status: 'diundang',
        }));

      const {
        data: insertedParticipants,
        error: insertParticipantsError,
      } = await supabase
        .from('meeting_participants')
        .insert(participantsToInsert)
        .select();

      if (insertParticipantsError) {
        console.log(
          'INSERT PARTICIPANTS ERROR:',
          insertParticipantsError
        );

        throw insertParticipantsError;
      }

      console.log(
        'NEW PARTICIPANTS:',
        insertedParticipants
      );

      Alert.alert(
        'Berhasil',
        'Meeting berhasil diperbarui dan peserta meeting sudah diperbarui.',
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
      console.log(
        'UPDATE MEETING ERROR:',
        error
      );

      Alert.alert(
        'Gagal',
        error?.message ||
          'Meeting gagal diperbarui.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE MEETING
  // ==========================================

  const handleDelete = () => {
    Alert.alert(
      'Hapus Meeting',
      'Apakah kamu yakin ingin menghapus meeting ini? Data peserta meeting juga akan dihapus.',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },

        {
          text: 'Hapus',
          style: 'destructive',

          onPress: async () => {
            try {
              setSaving(true);

              console.log('=================================');
              console.log('DELETE MEETING');
              console.log(
                'MEETING ID:',
                meetingId
              );

              // --------------------------------
              // 1. HAPUS PESERTA
              // --------------------------------

              const {
                error:
                  deleteParticipantsError,
              } = await supabase
                .from('meeting_participants')
                .delete()
                .eq(
                  'meeting_id',
                  meetingId
                );

              if (deleteParticipantsError) {
                throw deleteParticipantsError;
              }

              // --------------------------------
              // 2. HAPUS MEETING
              // --------------------------------

              const { error: deleteMeetingError } =
                await supabase
                  .from('meetings')
                  .delete()
                  .eq('id', meetingId);

              if (deleteMeetingError) {
                throw deleteMeetingError;
              }

              Alert.alert(
                'Berhasil',
                'Meeting berhasil dihapus.',
                [
                  {
                    text: 'OK',
                    onPress: () =>
                      router.replace(
                        '/admin/meetings'
                      ),
                  },
                ]
              );
            } catch (error) {
              console.log(
                'DELETE MEETING ERROR:',
                error
              );

              Alert.alert(
                'Gagal',
                error?.message ||
                  'Meeting gagal dihapus.'
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text style={styles.loadingText}>
          Memuat detail meeting...
        </Text>
      </View>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Detail Meeting
            </Text>

            <Text style={styles.subtitle}>
              Edit informasi dan peserta meeting.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#175CD3"
            />
          </View>
        </View>

        {/* TITLE */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Judul Meeting *
          </Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Contoh: Meeting Mingguan IT"
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />
        </View>

        {/* DESCRIPTION */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Deskripsi
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Masukkan deskripsi meeting..."
            placeholderTextColor="#98A2B3"
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.textArea,
            ]}
          />
        </View>

        {/* DATE */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Tanggal Meeting *
          </Text>

          <TextInput
            value={meetingDate}
            onChangeText={setMeetingDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#98A2B3"
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.helper}>
            Contoh: 2026-10-05
          </Text>
        </View>

        {/* TIME */}

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>
              Jam Mulai *
            </Text>

            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              placeholder="08:00"
              placeholderTextColor="#98A2B3"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.half}>
            <Text style={styles.label}>
              Jam Selesai *
            </Text>

            <TextInput
              value={endTime}
              onChangeText={setEndTime}
              placeholder="10:00"
              placeholderTextColor="#98A2B3"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* LOCATION */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Lokasi
          </Text>

          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Contoh: Ruang Meeting A"
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />
        </View>

        {/* LINK */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Link Meeting
          </Text>

          <TextInput
            value={meetingLink}
            onChangeText={setMeetingLink}
            placeholder="https://meet.google.com/..."
            placeholderTextColor="#98A2B3"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* EMPLOYEES */}

        <View style={styles.participantSection}>
          <View style={styles.participantHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Peserta Meeting
              </Text>

              <Text style={styles.sectionSubtitle}>
                Pilih pegawai yang mengikuti meeting.
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {selectedEmployees.length}
              </Text>
            </View>
          </View>

          {employees.length === 0 ? (
            <View style={styles.emptyEmployee}>
              <Ionicons
                name="people-outline"
                size={28}
                color="#98A2B3"
              />

              <Text style={styles.emptyEmployeeText}>
                Tidak ada pegawai aktif.
              </Text>
            </View>
          ) : (
            <View style={styles.employeeList}>
              {employees.map((employee) => {
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
                      toggleEmployee(
                        employee.id
                      )
                    }
                  >
                    {/* AVATAR */}

                    <View
                      style={[
                        styles.avatar,
                        selected &&
                          styles.avatarSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          selected &&
                            styles.avatarTextSelected,
                        ]}
                      >
                        {(
                          employee.nama || '?'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>

                    {/* INFO */}

                    <View
                      style={styles.employeeInfo}
                    >
                      <Text
                        style={
                          styles.employeeName
                        }
                        numberOfLines={1}
                      >
                        {employee.nama}
                      </Text>

                      <Text
                        style={
                          styles.employeeDetail
                        }
                        numberOfLines={1}
                      >
                        {employee.jabatan ||
                          employee.divisi ||
                          employee.email ||
                          '-'}
                      </Text>

                      <Text
                        style={
                          styles.employeeEmail
                        }
                        numberOfLines={1}
                      >
                        {employee.email || '-'}
                      </Text>
                    </View>

                    {/* CHECK */}

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
                          size={16}
                          color="#FFFFFF"
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* SAVE */}

        <Pressable
          style={[
            styles.saveButton,
            saving &&
              styles.buttonDisabled,
          ]}
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="save-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.saveButtonText}>
                Simpan Perubahan
              </Text>
            </>
          )}
        </Pressable>

        {/* DELETE */}

        <Pressable
          style={[
            styles.deleteButton,
            saving &&
              styles.buttonDisabled,
          ]}
          onPress={handleDelete}
          disabled={saving}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color="#D92D20"
          />

          <Text style={styles.deleteButtonText}>
            Hapus Meeting
          </Text>
        </Pressable>

        {/* BACK */}

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.backButtonText}>
            Kembali
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
    paddingRight: 15,
  },

  title: {
    fontSize: 27,
    fontWeight: '900',
    color: '#101828',
  },

  subtitle: {
    marginTop: 5,
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  section: {
    marginBottom: 4,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#344054',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#101828',
    fontSize: 14,
  },

  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },

  helper: {
    marginTop: 5,
    color: '#98A2B3',
    fontSize: 11,
  },

  row: {
    flexDirection: 'row',
    gap: 10,
  },

  half: {
    flex: 1,
  },

  participantSection: {
    marginTop: 25,
  },

  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#101828',
  },

  sectionSubtitle: {
    marginTop: 3,
    color: '#667085',
    fontSize: 12,
  },

  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  countText: {
    color: '#175CD3',
    fontWeight: '900',
    fontSize: 13,
  },

  employeeList: {
    gap: 9,
  },

  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 14,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  employeeCardSelected: {
    borderColor: '#175CD3',
    backgroundColor: '#F0F6FF',
  },

  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#F2F4F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarSelected: {
    backgroundColor: '#DCEBFF',
  },

  avatarText: {
    color: '#667085',
    fontWeight: '900',
    fontSize: 16,
  },

  avatarTextSelected: {
    color: '#175CD3',
  },

  employeeInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
  },

  employeeName: {
    color: '#101828',
    fontWeight: '800',
    fontSize: 13,
  },

  employeeDetail: {
    marginTop: 3,
    color: '#475467',
    fontSize: 11,
  },

  employeeEmail: {
    marginTop: 2,
    color: '#98A2B3',
    fontSize: 10,
  },

  checkbox: {
    width: 23,
    height: 23,
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

  emptyEmployee: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 14,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyEmployeeText: {
    marginTop: 8,
    color: '#98A2B3',
    fontSize: 13,
  },

  saveButton: {
    marginTop: 28,
    backgroundColor: '#175CD3',
    borderRadius: 13,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  deleteButton: {
    marginTop: 11,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 13,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  deleteButtonText: {
    color: '#D92D20',
    fontSize: 14,
    fontWeight: '900',
  },

  backButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },

  backButtonText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});