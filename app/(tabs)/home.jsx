import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  Card,
  ProgressBar,
  SectionTitle,
  StatusBadge,
} from '../../components/UI';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Home() {
  const router = useRouter();

  const { user, profile, session } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // TANGGAL HARI INI
  // =========================================================

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const date = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      // Ambil user yang benar-benar sedang login
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('Gagal mengambil user:', authError);
        return;
      }

      if (!currentUser) {
        console.log('User belum login');
        return;
      }

      const userId = currentUser.id;

      console.log('=================================');
      console.log('LOAD DASHBOARD PEGAWAI');
      console.log('User ID:', userId);
      console.log('Profile ID:', profile?.id);
      console.log('Tanggal:', todayString);

      // =====================================================
      // 1. JOBDESK
      // =====================================================

      const {
        data: jobsData,
        error: jobsError,
      } = await supabase
        .from('jobs')
        .select(`
          id,
          employee_id,
          title,
          description,
          deadline,
          priority,
          progress,
          status,
          created_at,
          updated_at
        `)
        .eq('employee_id', userId)
        .order('created_at', {
          ascending: false,
        })
        .limit(2);

      if (jobsError) {
        console.error('Gagal mengambil jobdesk:', jobsError.message);
        setJobs([]);
      } else {
        console.log('Jobdesk:', jobsData);
        setJobs(jobsData || []);
      }

      // =====================================================
      // 2. MEETING
      // =====================================================

      const {
        data: participantData,
        error: participantError,
      } = await supabase
        .from('meeting_participants')
        .select(`
          id,
          meeting_id,
          employee_id,
          status,
          meetings (
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
            updated_at
          )
        `)
        .eq('employee_id', userId)
        .order('id', {
          ascending: false,
        })
        .limit(5);

      if (participantError) {
        console.error(
          'Gagal mengambil meeting:',
          participantError.message
        );

        setMeetings([]);
      } else {
        const meetingList = (participantData || [])
          .filter((item) => item.meetings)
          .map((item) => ({
            ...item.meetings,
            participant_status: item.status,
          }));

        console.log('Meeting:', meetingList);

        setMeetings(meetingList);
      }

      // =====================================================
      // 3. ABSENSI HARI INI
      //
      // SESUAI DENGAN TABLE:
      // id
      // user_id
      // tanggal_absen
      // jam_masuk
      // status
      // created_at
      // =====================================================

      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from('attendance')
        .select(`
          id,
          user_id,
          tanggal_absen,
          jam_masuk,
          status,
          created_at
        `)
        .eq('user_id', userId)
        .eq('tanggal_absen', todayString)
        .maybeSingle();

      if (attendanceError) {
        console.error(
          'Gagal mengambil absensi:',
          attendanceError.message
        );

        setAttendance(null);
      } else {
        console.log('Absensi hari ini:', attendanceData);

        setAttendance(attendanceData);
      }

      // =====================================================
      // 4. NOTIFIKASI
      // =====================================================

      const {
        count,
        error: notificationError,
      } = await supabase
        .from('notifications')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('employee_id', userId)
        .eq('is_read', false);

      if (notificationError) {
        console.error(
          'Gagal mengambil notifikasi:',
          notificationError.message
        );

        setNotificationCount(0);
      } else {
        console.log(
          'Jumlah notifikasi belum dibaca:',
          count
        );

        setNotificationCount(count || 0);
      }

      console.log('=================================');
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, user?.id, session?.user?.id, todayString]);

  // =========================================================
  // LOAD SAAT HALAMAN DIBUKA
  // =========================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text style={styles.loadingText}>
          Memuat data...
        </Text>
      </View>
    );
  }

  // =========================================================
  // NAMA PEGAWAI
  // =========================================================

  const employeeName =
    profile?.nama ||
    user?.name ||
    'Pegawai';

  // =========================================================
  // ABSENSI
  // =========================================================

  const attendanceStatus =
    attendance?.status || 'Belum Absen';

  const checkIn = attendance?.jam_masuk
    ? formatTime(attendance.jam_masuk)
    : '-';

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Selamat datang,
          </Text>

          <Text style={styles.name}>
            {employeeName}
          </Text>
        </View>

        <Pressable
          style={styles.notificationButton}
          onPress={() =>
            router.push('/notifications')
          }
        >
          <Ionicons
            name="notifications-outline"
            size={23}
            color="#101828"
          />

          {notificationCount > 0 && (
            <View style={styles.notificationDot}>
              <Text style={styles.notificationCount}>
                {notificationCount > 9
                  ? '9+'
                  : notificationCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* =====================================================
          DATE
      ====================================================== */}

      <View style={styles.dateCard}>
        <Ionicons
          name="calendar-outline"
          size={22}
          color="#175CD3"
        />

        <View>
          <Text style={styles.dateLabel}>
            Hari ini
          </Text>

          <Text style={styles.dateText}>
            {date}
          </Text>
        </View>
      </View>

      {/* =====================================================
          ATTENDANCE
      ====================================================== */}

      <Card style={styles.attendanceCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>
              Absensi Hari Ini
            </Text>

            <Text style={styles.cardSubtitle}>
              Status kehadiran kamu
            </Text>
          </View>

          <StatusBadge
            status={attendanceStatus}
          />
        </View>

        <View style={styles.attendanceRow}>
          <View>
            <Text style={styles.smallLabel}>
              Masuk
            </Text>

            <Text style={styles.time}>
              {checkIn}
            </Text>
          </View>

          <View>
            <Text style={styles.smallLabel}>
              Pulang
            </Text>

            <Text style={styles.time}>
              -
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.outlineButton}
          onPress={() =>
            router.push('/(tabs)/attendance')
          }
        >
          <Text style={styles.outlineButtonText}>
            Lihat Absensi
          </Text>
        </Pressable>
      </Card>

      {/* =====================================================
          QUICK MENU
      ====================================================== */}

      <SectionTitle title="Menu Cepat" />

      <View style={styles.menuGrid}>
        <QuickMenu
          icon="briefcase-outline"
          title="Jobdesk"
          onPress={() =>
            router.push('/(tabs)/jobdesk')
          }
        />

        <QuickMenu
          icon="videocam-outline"
          title="Meeting"
          onPress={() =>
            router.push('/(tabs)/meeting')
          }
        />

        <QuickMenu
          icon="document-text-outline"
          title="Pengajuan Surat"
          onPress={() =>
            router.push('/surat')
          }
        />

        <QuickMenu
          icon="notifications-outline"
          title="Notifikasi"
          onPress={() =>
            router.push('/notifications')
          }
        />
      </View>

      {/* =====================================================
          JOBDESK
      ====================================================== */}

      <SectionTitle
        title="Jobdesk Aktif"
        action="Lihat Semua"
        onPress={() =>
          router.push('/(tabs)/jobs')
        }
      />

      {jobs.length === 0 ? (
        <Card>
          <View style={styles.emptyContainer}>
            <Ionicons
              name="briefcase-outline"
              size={35}
              color="#98A2B3"
            />

            <Text style={styles.emptyText}>
              Belum ada jobdesk
            </Text>
          </View>
        </Card>
      ) : (
        jobs.map((job) => (
          <Pressable
            key={job.id}
            onPress={() =>
              router.push(`/job/${job.id}`)
            }
          >
            <Card>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>
                  {job.title}
                </Text>

                <StatusBadge
                  status={job.status}
                />
              </View>

              {job.deadline && (
                <Text style={styles.deadline}>
                  Deadline:{' '}
                  {formatDate(job.deadline)}
                </Text>
              )}

              <View style={styles.progressHeader}>
                <Text style={styles.smallLabel}>
                  Progress
                </Text>

                <Text style={styles.progressText}>
                  {job.progress || 0}%
                </Text>
              </View>

              <ProgressBar
                progress={job.progress || 0}
              />
            </Card>
          </Pressable>
        ))
      )}

      {/* =====================================================
          MEETING
      ====================================================== */}

      <SectionTitle
        title="Meeting Terdekat"
        action="Lihat Semua"
        onPress={() =>
          router.push('/(tabs)/meeting')
        }
      />

      {meetings.length === 0 ? (
        <Card>
          <View style={styles.emptyContainer}>
            <Ionicons
              name="videocam-outline"
              size={35}
              color="#98A2B3"
            />

            <Text style={styles.emptyText}>
              Belum ada meeting
            </Text>
          </View>
        </Card>
      ) : (
        meetings.slice(0, 1).map((meeting) => (
          <Pressable
            key={meeting.id}
            onPress={() =>
              router.push(
                `/meeting/${meeting.id}`
              )
            }
          >
            <Card>
              <View style={styles.meetingRow}>
                <View style={styles.meetingIcon}>
                  <Ionicons
                    name="videocam-outline"
                    size={22}
                    color="#175CD3"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>
                    {meeting.title}
                  </Text>

                  <Text style={styles.meetingInfo}>
                    {formatDate(
                      meeting.meeting_date
                    )}
                  </Text>

                  <Text style={styles.meetingInfo}>
                    {formatTime(
                      meeting.start_time
                    )}

                    {meeting.end_time
                      ? ` - ${formatTime(
                          meeting.end_time
                        )}`
                      : ''}
                  </Text>

                  {meeting.location && (
                    <Text
                      style={styles.meetingInfo}
                    >
                      📍 {meeting.location}
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

// =========================================================
// QUICK MENU
// =========================================================

function QuickMenu({
  icon,
  title,
  onPress,
}) {
  return (
    <Pressable
      style={styles.quickMenu}
      onPress={onPress}
    >
      <View style={styles.quickIcon}>
        <Ionicons
          name={icon}
          size={23}
          color="#175CD3"
        />
      </View>

      <Text style={styles.quickTitle}>
        {title}
      </Text>
    </Pressable>
  );
}

// =========================================================
// FORMAT JAM
// =========================================================

function formatTime(value) {
  if (!value) return '-';

  if (
    typeof value === 'string' &&
    value.length >= 5
  ) {
    return value.substring(0, 5);
  }

  try {
    return new Date(value).toLocaleTimeString(
      'id-ID',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  } catch {
    return '-';
  }
}

// =========================================================
// FORMAT TANGGAL
// =========================================================

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleDateString(
      'id-ID',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );
  } catch {
    return value;
  }
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#667085',
    fontSize: 14,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  greeting: {
    fontSize: 14,
    color: '#667085',
  },

  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#101828',
    marginTop: 3,
  },

  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  notificationDot: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D92D20',
    position: 'absolute',
    top: 3,
    right: 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },

  notificationCount: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  dateCard: {
    backgroundColor: '#EAF2FF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },

  dateLabel: {
    fontSize: 12,
    color: '#667085',
  },

  dateText: {
    fontSize: 14,
    color: '#175CD3',
    fontWeight: '800',
    marginTop: 2,
  },

  attendanceCard: {
    borderWidth: 0,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#101828',
  },

  cardSubtitle: {
    color: '#667085',
    marginTop: 4,
    fontSize: 13,
  },

  attendanceRow: {
    flexDirection: 'row',
    gap: 70,
    marginTop: 22,
    marginBottom: 18,
  },

  smallLabel: {
    color: '#667085',
    fontSize: 12,
  },

  time: {
    color: '#101828',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3,
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: '#175CD3',
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  outlineButtonText: {
    color: '#175CD3',
    fontWeight: '800',
  },

  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },

  quickMenu: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },

  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  jobTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#101828',
  },

  deadline: {
    color: '#667085',
    fontSize: 12,
    marginTop: 9,
    marginBottom: 14,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  progressText: {
    color: '#175CD3',
    fontWeight: '800',
    fontSize: 12,
  },

  meetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  meetingIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  meetingInfo: {
    color: '#667085',
    fontSize: 12,
    marginTop: 4,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 25,
  },

  emptyText: {
    color: '#98A2B3',
    fontSize: 13,
    marginTop: 8,
  },
});