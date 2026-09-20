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

import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../components/UI';

import { supabase } from '../../lib/supabase';

export default function Meeting() {
  const router = useRouter();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMeetings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.log('Gagal mengambil meeting:', error);
        return;
      }

      setMeetings(data || []);
    } catch (error) {
      console.log('Error meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';

    return timeString.slice(0, 5);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Meeting
      </Text>

      <Text style={styles.subtitle}>
        Jadwal rapat dan meeting kamu.
      </Text>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#175CD3"
          />

          <Text style={styles.loadingText}>
            Memuat jadwal meeting...
          </Text>
        </View>
      ) : meetings.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="calendar-outline"
              size={32}
              color="#98A2B3"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Belum ada jadwal meeting
          </Text>

          <Text style={styles.emptyText}>
            Jadwal meeting yang dibuat admin akan muncul di sini.
          </Text>
        </View>
      ) : (
        meetings.map((meeting) => (
          <Pressable
            key={meeting.id}
            onPress={() =>
              router.push(`/meeting/${meeting.id}`)
            }
          >
            <Card>
              <View style={styles.row}>

                <View style={styles.icon}>
                  <Ionicons
                    name="videocam-outline"
                    size={25}
                    color="#175CD3"
                  />
                </View>

                <View style={styles.contentBox}>
                  <Text style={styles.meetingTitle}>
                    {meeting.title}
                  </Text>

                  <Text style={styles.info}>
                    {formatDate(meeting.meeting_date)}
                  </Text>

                  <Text style={styles.info}>
                    {formatTime(meeting.start_time)}
                    {meeting.end_time
                      ? ` - ${formatTime(meeting.end_time)}`
                      : ''}
                  </Text>

                  {meeting.location ? (
                    <Text style={styles.location}>
                      {meeting.location}
                    </Text>
                  ) : meeting.meeting_link ? (
                    <Text style={styles.location}>
                      Online Meeting
                    </Text>
                  ) : null}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#98A2B3"
                />

              </View>
            </Card>
          </Pressable>
        ))
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

  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },

  loadingText: {
    color: '#667085',
    fontSize: 13,
    marginTop: 10,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
  },

  emptyText: {
    color: '#667085',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  icon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentBox: {
    flex: 1,
  },

  meetingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#101828',
  },

  info: {
    fontSize: 12,
    color: '#667085',
    marginTop: 4,
  },

  location: {
    fontSize: 12,
    fontWeight: '700',
    color: '#175CD3',
    marginTop: 5,
  },
});