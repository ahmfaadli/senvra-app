import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../components/UI';

import { supabase } from '../../services/supabase';

import { useAuth } from '../../context/AuthContext';

import { useFocusEffect } from 'expo-router';

export default function Notifications() {
  const { user, session, profile } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // AMBIL ID PEGAWAI
  // =========================================================

  const getUserId = () => {
    return user?.id || session?.user?.id || profile?.id || null;
  };

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const employeeId = getUserId();

      console.log('=================================');
      console.log('MENGAMBIL NOTIFIKASI');
      console.log('EMPLOYEE ID:', employeeId);

      if (!employeeId) {
        console.log('ID employee tidak ditemukan');
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          employee_id,
          type,
          title,
          message,
          reference_id,
          is_read,
          created_at
        `)
        .eq('employee_id', employeeId)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.log('NOTIFICATION ERROR:', error);
        return;
      }

      console.log('JUMLAH NOTIFIKASI:', data?.length || 0);
      console.log('DATA NOTIFIKASI:', data);

      setNotifications(data || []);
    } catch (error) {
      console.log('LOAD NOTIFICATION ERROR:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // LOAD SAAT HALAMAN DIBUKA / KEMBALI KE HALAMAN
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [user?.id, session?.user?.id, profile?.id])
  );

  // =========================================================
  // REFRESH
  // =========================================================

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  // =========================================================
  // ICON NOTIFIKASI
  // =========================================================

  const getIcon = (type) => {
    switch (type) {
      case 'meeting':
        return 'videocam-outline';

      case 'job':
      case 'jobdesk':
        return 'briefcase-outline';

      case 'surat':
        return 'document-text-outline';

      case 'attendance':
      case 'absensi':
        return 'time-outline';

      case 'leave':
      case 'cuti':
        return 'calendar-outline';

      default:
        return 'notifications-outline';
    }
  };

  // =========================================================
  // WARNA ICON
  // =========================================================

  const getIconBackground = (type) => {
    switch (type) {
      case 'meeting':
        return '#EAF2FF';

      case 'job':
      case 'jobdesk':
        return '#EEF4FF';

      case 'surat':
        return '#FFF4E5';

      case 'attendance':
      case 'absensi':
        return '#ECFDF3';

      case 'leave':
      case 'cuti':
        return '#F4EBFF';

      default:
        return '#F2F4F7';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'meeting':
        return '#175CD3';

      case 'job':
      case 'jobdesk':
        return '#6941C6';

      case 'surat':
        return '#DC6803';

      case 'attendance':
      case 'absensi':
        return '#027A48';

      case 'leave':
      case 'cuti':
        return '#7F56D9';

      default:
        return '#667085';
    }
  };

  // =========================================================
  // FORMAT WAKTU
  // =========================================================

  const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.pageTitle}>
          Notifikasi
        </Text>

        <Text style={styles.subtitle}>
          Informasi terbaru untuk kamu.
        </Text>
      </View>

      {/* LOADING */}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#175CD3"
          />

          <Text style={styles.loadingText}>
            Memuat notifikasi...
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        /* EMPTY */

        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="notifications-off-outline"
              size={32}
              color="#98A2B3"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Belum ada notifikasi
          </Text>

          <Text style={styles.emptyMessage}>
            Notifikasi terbaru seperti jobdesk,
            meeting, dan informasi lainnya akan
            muncul di sini.
          </Text>
        </View>
      ) : (
        /* LIST */

        <View>
          {notifications.map((item) => (
            <Card
              key={item.id}
              style={[
                styles.card,
                !item.is_read && styles.unreadCard,
              ]}
            >
              <View style={styles.row}>

                {/* ICON */}

                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor:
                        getIconBackground(item.type),
                    },
                  ]}
                >
                  <Ionicons
                    name={getIcon(item.type)}
                    size={21}
                    color={getIconColor(item.type)}
                  />
                </View>

                {/* CONTENT */}

                <View style={styles.textBox}>

                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.title,
                        !item.is_read &&
                          styles.unreadTitle,
                      ]}
                    >
                      {item.title}
                    </Text>

                    {!item.is_read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>

                  <Text style={styles.message}>
                    {item.message}
                  </Text>

                  <Text style={styles.time}>
                    {formatTime(item.created_at)}
                  </Text>

                </View>

              </View>
            </Card>
          ))}
        </View>
      )}
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

  header: {
    marginBottom: 20,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#101828',
  },

  subtitle: {
    fontSize: 14,
    color: '#667085',
    marginTop: 5,
  },

  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },

  loadingText: {
    marginTop: 10,
    color: '#667085',
    fontSize: 13,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#101828',
  },

  emptyMessage: {
    fontSize: 13,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
  },

  card: {
    marginBottom: 12,
  },

  unreadCard: {
    borderWidth: 1,
    borderColor: '#D6E4FF',
  },

  row: {
    flexDirection: 'row',
    gap: 13,
  },

  icon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textBox: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#101828',
  },

  unreadTitle: {
    fontWeight: '900',
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#175CD3',
    marginLeft: 8,
  },

  message: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  time: {
    color: '#98A2B3',
    fontSize: 11,
    marginTop: 6,
  },
});
