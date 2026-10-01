import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Card,
  StatusBadge,
} from '../../../components/UI';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

export default function AttendanceHistory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user, session, profile } = useAuth();

  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({
    workDays: 0,
    present: 0,
    late: 0,
    permission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadAttendance();
  }, [user, session, profile]);

  const getUserId = () => {
    return (
      user?.id ||
      session?.user?.id ||
      profile?.id
    );
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const userId = getUserId();

      if (!userId) {
        setErrorMessage('User belum ditemukan.');
        return;
      }

      // Ambil tanggal awal dan akhir bulan ini
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      const startDate = `${year}-${String(month + 1).padStart(
        2,
        '0'
      )}-01`;

      const lastDay = new Date(
        year,
        month + 1,
        0
      ).getDate();

      const endDate =
        `${year}-${String(month + 1).padStart(2, '0')}-${String(
          lastDay
        ).padStart(2, '0')}`;

      // Ambil data absensi user bulan ini
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .gte('tanggal_absen', startDate)
        .lte('tanggal_absen', endDate)
        .order('tanggal_absen', {
          ascending: false,
        });

      if (error) {
        console.log('Error attendance:', error);
        setErrorMessage('Gagal mengambil data absensi.');
        return;
      }

      const attendance = data || [];

      setAttendanceData(attendance);

      // Hitung rekap
      const present = attendance.filter(
        item =>
          item.status?.toLowerCase() === 'hadir'
      ).length;

      const late = attendance.filter(
        item =>
          item.status?.toLowerCase() === 'terlambat'
      ).length;

      const permission = attendance.filter(
        item =>
          item.status?.toLowerCase() === 'izin'
      ).length;

      setSummary({
        workDays: attendance.length,
        present,
        late,
        permission,
      });
    } catch (error) {
      console.log('Load attendance error:', error);
      setErrorMessage(
        'Terjadi kesalahan saat mengambil data.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return '-';

    const date = new Date(
      `${dateString}T00:00:00`
    );

    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatMonth = () => {
    return new Date().toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = time => {
    if (!time) return '-';

    return time.substring(0, 5);
  };

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(
              50,
              insets.bottom + 30
            ),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backCircle,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.backArrow}>
              ‹
            </Text>
          </Pressable>

          <View style={styles.headerTextArea}>
            <Text style={styles.headerTitle}>
              Riwayat Absensi
            </Text>

            <Text style={styles.headerSubtitle}>
              Rekap dan riwayat kehadiran kamu.
            </Text>
          </View>
        </View>

        {/* REKAP */}
        <Card>
          <Text style={styles.month}>
            {formatMonth()}
          </Text>

          <Text style={styles.title}>
            Rekap Kehadiran
          </Text>

          <View style={styles.grid}>
            <Summary
              label="Hari Absen"
              value={summary.workDays}
            />

            <Summary
              label="Hadir"
              value={summary.present}
            />

            <Summary
              label="Terlambat"
              value={summary.late}
            />

            <Summary
              label="Izin"
              value={summary.permission}
            />
          </View>
        </Card>

        {/* JUDUL */}
        <Text style={styles.sectionTitle}>
          Riwayat Absensi
        </Text>

        {/* LOADING */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color="#175CD3"
            />

            <Text style={styles.loadingText}>
              Memuat riwayat absensi...
            </Text>
          </View>
        )}

        {/* ERROR */}
        {!loading &&
          errorMessage !== '' && (
            <Card>
              <Text style={styles.emptyTitle}>
                Data tidak dapat dimuat
              </Text>

              <Text style={styles.emptyText}>
                {errorMessage}
              </Text>
            </Card>
          )}

        {/* KOSONG */}
        {!loading &&
          errorMessage === '' &&
          attendanceData.length === 0 && (
            <Card>
              <Text style={styles.emptyTitle}>
                Belum ada riwayat absensi
              </Text>

              <Text style={styles.emptyText}>
                Data absensi kamu akan muncul di sini
                setelah melakukan absensi.
              </Text>
            </Card>
          )}

        {/* DATA ABSENSI */}
        {!loading &&
          errorMessage === '' &&
          attendanceData.map(item => (
            <Card key={item.id}>
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text style={styles.date}>
                    {formatDate(
                      item.tanggal_absen
                    )}
                  </Text>

                  <Text style={styles.time}>
                    Masuk:{' '}
                    {formatTime(
                      item.jam_masuk
                    )}
                  </Text>
                </View>

                <StatusBadge
                  status={item.status}
                />
              </View>
            </Card>
          ))}
      </ScrollView>
    </View>
  );
}

function Summary({
  label,
  value,
}) {
  return (
    <View style={styles.summary}>
      <Text style={styles.value}>
        {value}
      </Text>

      <Text style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  backArrow: {
    fontSize: 29,
    lineHeight: 30,
    color: '#344054',
    marginTop: -2,
  },

  headerTextArea: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#101828',
  },

  headerSubtitle: {
    color: '#667085',
    fontSize: 13,
    marginTop: 3,
  },

  /* =========================
     REKAP
  ========================= */

  month: {
    color: '#175CD3',
    fontWeight: '700',
    fontSize: 13,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
    marginTop: 4,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
  },

  summary: {
    width: '50%',
    marginBottom: 16,
  },

  value: {
    fontSize: 22,
    fontWeight: '900',
    color: '#101828',
  },

  label: {
    color: '#667085',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },

  /* =========================
     SECTION
  ========================= */

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 9,
    marginTop: 18,
  },

  /* =========================
     DATA ROW
  ========================= */

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  info: {
    flex: 1,
    paddingRight: 10,
    minWidth: 0,
  },

  date: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: '#101828',
  },

  time: {
    color: '#667085',
    fontSize: 12,
    marginTop: 5,
  },

  /* =========================
     LOADING
  ========================= */

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    color: '#667085',
    fontSize: 13,
    marginTop: 10,
  },

  /* =========================
     EMPTY / ERROR
  ========================= */

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#101828',
  },

  emptyText: {
    fontSize: 13,
    color: '#667085',
    marginTop: 6,
    lineHeight: 20,
  },

  /* =========================
     BUTTON / PRESS
  ========================= */

  buttonPressed: {
    opacity: 0.7,
  },
});