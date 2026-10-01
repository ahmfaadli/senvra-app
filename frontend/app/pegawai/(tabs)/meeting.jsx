import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Card } from '../../../components/UI';
import { supabase } from '../../../services/supabase';

export default function Meeting() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // LOAD MEETINGS
  // =========================================================

  const loadMeetings = useCallback(async () => {
    try {
      setLoading(true);

      console.log('=================================');
      console.log('MENGAMBIL MEETING PEGAWAI');
      console.log('=================================');

      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        console.log('User tidak ditemukan');

        setMeetings([]);

        return;
      }

      console.log('User ID:', user.id);
      console.log('Email:', user.email);

      const {
        data,
        error,
      } = await supabase
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
          created_at,
          meeting_participants!inner (
            id,
            employee_id,
            status
          )
        `)
        .eq(
          'meeting_participants.employee_id',
          user.id
        )
        .order('meeting_date', {
          ascending: true,
        })
        .order('start_time', {
          ascending: true,
        });

      if (error) {
        console.error(
          'Gagal mengambil meeting:',
          error
        );

        throw error;
      }

      console.log(
        'Jumlah meeting:',
        data?.length || 0
      );

      setMeetings(data || []);
    } catch (error) {
      console.error(
        'ERROR LOAD MEETINGS:',
        error
      );

      setMeetings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =========================================================
  // LOAD SAAT SCREEN FOCUS
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      loadMeetings();
    }, [loadMeetings])
  );

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = () => {
    setRefreshing(true);
    loadMeetings();
  };

  // =========================================================
  // FORMAT TANGGAL
  // =========================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return '-';
    }

    try {
      const date = new Date(
        `${dateString}T00:00:00`
      );

      return date.toLocaleDateString(
        'id-ID',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }
      );
    } catch {
      return dateString;
    }
  };

  // =========================================================
  // FORMAT JAM
  // =========================================================

  const formatTime = (timeString) => {
    if (!timeString) {
      return '-';
    }

    return String(timeString).slice(0, 5);
  };

  // =========================================================
  // STATUS MEETING
  // =========================================================

  const getMeetingStatus = (meeting) => {
    if (!meeting?.meeting_date) {
      return 'Terjadwal';
    }

    const today = new Date();

    const meetingDate = new Date(
      `${meeting.meeting_date}T00:00:00`
    );

    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (meetingDate < todayOnly) {
      return 'Selesai';
    }

    if (
      meetingDate.getTime() ===
      todayOnly.getTime()
    ) {
      return 'Hari ini';
    }

    return 'Terjadwal';
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading &&
    meetings.length === 0
  ) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text
          style={styles.loadingText}
        >
          Memuat jadwal meeting...
        </Text>
      </View>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

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
              100,
              insets.bottom + 30
            ),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#175CD3']}
            tintColor="#175CD3"
          />
        }
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <Text style={styles.title}>
          Meeting
        </Text>

        <Text style={styles.subtitle}>
          Jadwal meeting yang diberikan kepada kamu.
        </Text>

        {/* =====================================================
            EMPTY
        ===================================================== */}

        {meetings.length === 0 ? (
          <Card>
            <View
              style={styles.emptyContainer}
            >
              <View
                style={styles.emptyIcon}
              >
                <Ionicons
                  name="calendar-outline"
                  size={34}
                  color="#175CD3"
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                Belum ada meeting
              </Text>

              <Text
                style={styles.emptyText}
              >
                Meeting yang diberikan admin kepada
                kamu akan muncul di sini.
              </Text>
            </View>
          </Card>
        ) : (

          /* ===================================================
             DAFTAR MEETING
          =================================================== */

          meetings.map((meeting) => {
            const status =
              getMeetingStatus(meeting);

            return (
              <Pressable
                key={meeting.id}
                onPress={() =>
                  router.push(
                    `/pegawai/meeting/${meeting.id}`
                  )
                }
              >
                <Card>

                  {/* HEADER */}

                  <View
                    style={styles.header}
                  >
                    <View
                      style={styles.meetingIcon}
                    >
                      <Ionicons
                        name="videocam-outline"
                        size={24}
                        color="#175CD3"
                      />
                    </View>

                    <View
                      style={styles.headerContent}
                    >
                      <Text
                        style={styles.meetingTitle}
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        {meeting.title ||
                          'Meeting'}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          status === 'Hari ini' &&
                            styles.todayBadge,
                          status === 'Selesai' &&
                            styles.finishedBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            status === 'Hari ini' &&
                              styles.todayText,
                            status === 'Selesai' &&
                              styles.finishedText,
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#98A2B3"
                      style={styles.chevron}
                    />
                  </View>

                  {/* DIVIDER */}

                  <View
                    style={styles.divider}
                  />

                  {/* TANGGAL */}

                  <View
                    style={styles.infoRow}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#667085"
                    />

                    <Text
                      style={styles.info}
                    >
                      {formatDate(
                        meeting.meeting_date
                      )}
                    </Text>
                  </View>

                  {/* JAM */}

                  <View
                    style={styles.infoRow}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color="#667085"
                    />

                    <Text
                      style={styles.info}
                    >
                      {formatTime(
                        meeting.start_time
                      )}

                      {meeting.end_time
                        ? ` - ${formatTime(
                            meeting.end_time
                          )}`
                        : ''}
                    </Text>
                  </View>

                  {/* LOKASI */}

                  {meeting.location ? (
                    <View
                      style={styles.infoRow}
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#667085"
                      />

                      <Text
                        style={styles.info}
                        numberOfLines={2}
                      >
                        {meeting.location}
                      </Text>
                    </View>
                  ) : meeting.meeting_link ? (
                    <View
                      style={styles.infoRow}
                    >
                      <Ionicons
                        name="link-outline"
                        size={18}
                        color="#175CD3"
                      />

                      <Text
                        style={styles.onlineText}
                      >
                        Online Meeting
                      </Text>
                    </View>
                  ) : null}

                  {/* DESCRIPTION */}

                  {meeting.description ? (
                    <Text
                      style={styles.description}
                      numberOfLines={4}
                    >
                      {meeting.description}
                    </Text>
                  ) : null}

                </Card>
              </Pressable>
            );
          })
        )}

      </ScrollView>
    </View>
  );
}

// =========================================================
// STYLE
// =========================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  /*
   * SAMA DENGAN JOBDESK
   */
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#667085',
    fontSize: 14,
    marginTop: 12,
  },

  /*
   * HEADER SAMA DENGAN JOBDESK
   */

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#101828',
  },

  subtitle: {
    color: '#667085',
    marginTop: 5,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },

  /*
   * SUMMARY
   */

  /*
   * HEADER CARD
   * Mengikuti proporsi Jobdesk
   */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },

  meetingIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
  },

  meetingTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: '#101828',
    paddingRight: 2,
  },

  chevron: {
    flexShrink: 0,
    marginTop: 2,
  },

  /*
   * STATUS
   */

  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F4F7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },

  statusText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    color: '#667085',
  },

  todayBadge: {
    backgroundColor: '#EAF2FF',
  },

  todayText: {
    color: '#175CD3',
  },

  finishedBadge: {
    backgroundColor: '#ECFDF3',
  },

  finishedText: {
    color: '#027A48',
  },

  /*
   * DIVIDER
   */

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 14,
  },

  /*
   * INFO
   */

  infoRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    minWidth: 0,
  },

  info: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: '#475467',
    marginLeft: 9,
    lineHeight: 18,
  },

  onlineText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: '#175CD3',
    fontWeight: '700',
    marginLeft: 9,
    lineHeight: 18,
  },

  description: {
    width: '100%',
    fontSize: 13,
    color: '#667085',
    lineHeight: 19,
    marginTop: 12,
  },

  /*
   * EMPTY
   * Mengikuti ukuran empty state Jobdesk
   */

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 12,
  },

  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'center',
  },

  emptyText: {
    color: '#667085',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 280,
  },
});

