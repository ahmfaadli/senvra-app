import React, { useCallback, useState } from 'react';

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

import { Card } from '../../components/UI';
import { supabase } from '../../lib/supabase';

export default function Meeting() {
  const router = useRouter();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMeetings = async () => {
    try {
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

      /*
       * Ambil meeting yang memiliki participant
       * dengan employee_id = user yang sedang login.
       */
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
        console.log(
          'Gagal mengambil meeting:',
          error
        );

        throw error;
      }

      console.log(
        'Jumlah meeting:',
        data?.length || 0
      );

      console.log(
        'Data meeting:',
        data || []
      );

      setMeetings(data || []);
    } catch (error) {
      console.log(
        'ERROR LOAD MEETINGS:',
        error
      );

      setMeetings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMeetings();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadMeetings();
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return '-';
    }

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
  };

  const formatTime = (timeString) => {
    if (!timeString) {
      return '-';
    }

    return timeString.slice(0, 5);
  };

  const getMeetingStatus = (meeting) => {
    if (!meeting.meeting_date) {
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

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text style={styles.loadingText}>
          Memuat jadwal meeting...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#175CD3']}
        />
      }
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons
            name="calendar-outline"
            size={26}
            color="#175CD3"
          />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>
            Meeting
          </Text>

          <Text style={styles.subtitle}>
            Jadwal meeting yang diberikan kepada kamu.
          </Text>
        </View>
      </View>

      {/* TOTAL */}

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons
            name="videocam-outline"
            size={22}
            color="#175CD3"
          />
        </View>

        <View>
          <Text style={styles.summaryNumber}>
            {meetings.length}
          </Text>

          <Text style={styles.summaryText}>
            Meeting kamu
          </Text>
        </View>
      </View>

      {/* EMPTY */}

      {meetings.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="calendar-outline"
              size={34}
              color="#98A2B3"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Belum ada meeting
          </Text>

          <Text style={styles.emptyText}>
            Meeting yang diberikan admin
            kepada kamu akan muncul di sini.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {meetings.map((meeting) => {
            const status =
              getMeetingStatus(meeting);

            return (
              <Pressable
                key={meeting.id}
                onPress={() =>
                  router.push(
                    `/meeting/${meeting.id}`
                  )
                }
                style={({ pressed }) => [
                  styles.cardWrapper,
                  pressed &&
                    styles.cardPressed,
                ]}
              >
                <Card>
                  {/* TOP */}

                  <View style={styles.cardTop}>
                    <View style={styles.meetingIcon}>
                      <Ionicons
                        name="videocam-outline"
                        size={25}
                        color="#175CD3"
                      />
                    </View>

                    <View
                      style={styles.cardTitleBox}
                    >
                      <Text
                        style={styles.meetingTitle}
                        numberOfLines={2}
                      >
                        {meeting.title}
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
                    />
                  </View>

                  {/* INFO */}

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#667085"
                    />

                    <Text style={styles.info}>
                      {formatDate(
                        meeting.meeting_date
                      )}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color="#667085"
                    />

                    <Text style={styles.info}>
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

                  {meeting.location ? (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#667085"
                      />

                      <Text style={styles.info}>
                        {meeting.location}
                      </Text>
                    </View>
                  ) : meeting.meeting_link ? (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="link-outline"
                        size={18}
                        color="#667085"
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
                      numberOfLines={2}
                    >
                      {meeting.description}
                    </Text>
                  ) : null}
                </Card>
              </Pressable>
            );
          })}
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
    paddingBottom: 110,
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
    fontSize: 13,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#101828',
  },

  subtitle: {
    color: '#667085',
    marginTop: 5,
    lineHeight: 18,
    fontSize: 13,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  summaryNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#101828',
  },

  summaryText: {
    fontSize: 12,
    color: '#667085',
    marginTop: 2,
  },

  list: {
    gap: 12,
  },

  cardWrapper: {
    marginBottom: 0,
  },

  cardPressed: {
    opacity: 0.8,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  meetingIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  cardTitleBox: {
    flex: 1,
  },

  meetingTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#101828',
    lineHeight: 21,
  },

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

  divider: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 14,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  info: {
    flex: 1,
    fontSize: 12,
    color: '#475467',
    marginLeft: 9,
  },

  onlineText: {
    fontSize: 12,
    color: '#175CD3',
    fontWeight: '700',
    marginLeft: 9,
  },

  description: {
    fontSize: 12,
    color: '#667085',
    lineHeight: 18,
    marginTop: 12,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 55,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#101828',
  },

  emptyText: {
    color: '#667085',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 20,
  },
});