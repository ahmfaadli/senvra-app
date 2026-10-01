import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '../../../components/UI';
import { supabase } from '../../../services/supabase';

export default function MeetingDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams();

  const meetingId = Array.isArray(id)
    ? id[0]
    : id;

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (meetingId) {
      loadMeeting();
    }
  }, [meetingId]);

  const loadMeeting = async () => {
    try {
      console.log(
        '================================='
      );
      console.log(
        'MENGAMBIL DETAIL MEETING'
      );
      console.log(
        'Meeting ID:',
        meetingId
      );
      console.log(
        '================================='
      );

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          'User belum login.'
        );
      }

      console.log(
        'User ID:',
        user.id
      );

      /*
       * Ambil meeting hanya jika user
       * merupakan participant meeting tersebut.
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
        .eq('id', meetingId)
        .eq(
          'meeting_participants.employee_id',
          user.id
        )
        .maybeSingle();

      if (error) {
        console.log(
          'MEETING DETAIL ERROR:',
          error
        );

        throw error;
      }

      if (!data) {
        console.log(
          'Meeting tidak ditemukan untuk user ini.'
        );

        setMeeting(null);
        return;
      }

      console.log(
        'Meeting ditemukan:',
        data
      );

      setMeeting(data);
    } catch (error) {
      console.log(
        'LOAD MEETING DETAIL ERROR:',
        error
      );

      setMeeting(null);
    } finally {
      setLoading(false);
    }
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

  const openMeeting = async () => {
    if (!meeting?.meeting_link) {
      return;
    }

    const supported =
      await Linking.canOpenURL(
        meeting.meeting_link
      );

    if (!supported) {
      return;
    }

    await Linking.openURL(
      meeting.meeting_link
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loading,
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

        <Text style={styles.loadingText}>
          Memuat detail meeting...
        </Text>
      </View>
    );
  }

  if (!meeting) {
    return (
      <View
        style={[
          styles.empty,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View style={styles.emptyIcon}>
          <Ionicons
            name="calendar-outline"
            size={34}
            color="#98A2B3"
          />
        </View>

        <Text style={styles.emptyTitle}>
          Meeting tidak ditemukan
        </Text>

        <Text style={styles.emptyText}>
          Meeting ini tidak tersedia atau
          bukan merupakan meeting kamu.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Kembali
          </Text>
        </Pressable>
      </View>
    );
  }

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
      >
        {/* HEADER */}
        <View style={styles.pageHeader}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.back,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#344054"
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text
              style={styles.pageTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Detail Meeting
            </Text>

            <Text
              style={styles.pageSubtitle}
              numberOfLines={1}
            >
              Informasi lengkap jadwal meeting
            </Text>
          </View>
        </View>

        {/* MAIN CARD */}
        <Card>
          {/* ICON + JUDUL */}
          <View style={styles.titleRow}>
            <View style={styles.iconLarge}>
              <Ionicons
                name="videocam-outline"
                size={32}
                color="#175CD3"
              />
            </View>

            <View style={styles.titleContent}>
              <Text
                style={styles.title}
                numberOfLines={4}
              >
                {meeting.title}
              </Text>
            </View>
          </View>

          {/* DESKRIPSI */}
          {meeting.description ? (
            <Text style={styles.description}>
              {meeting.description}
            </Text>
          ) : null}

          <View style={styles.divider} />

          {/* DATE */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#175CD3"
              />
            </View>

            <View style={styles.detailContent}>
              <Text style={styles.label}>
                Tanggal
              </Text>

              <Text style={styles.value}>
                {formatDate(
                  meeting.meeting_date
                )}
              </Text>
            </View>
          </View>

          {/* TIME */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#175CD3"
              />
            </View>

            <View style={styles.detailContent}>
              <Text style={styles.label}>
                Waktu
              </Text>

              <Text style={styles.value}>
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
          </View>

          {/* LOCATION */}
          {meeting.location ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#175CD3"
                />
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.label}>
                  Lokasi
                </Text>

                <Text style={styles.value}>
                  {meeting.location}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ONLINE */}
          {meeting.meeting_link ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="link-outline"
                  size={20}
                  color="#175CD3"
                />
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.label}>
                  Meeting Online
                </Text>

                <Text
                  style={styles.onlineValue}
                  numberOfLines={1}
                >
                  Link tersedia
                </Text>
              </View>
            </View>
          ) : null}
        </Card>

        {/* BUTTON */}
        {meeting.meeting_link ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={openMeeting}
          >
            <Ionicons
              name="videocam-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.buttonText}>
              Buka Meeting
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
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

  /* =========================
     HEADER
     ========================= */

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    flexShrink: 0,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#101828',
  },

  pageSubtitle: {
    fontSize: 13,
    color: '#667085',
    marginTop: 3,
  },

  /* =========================
     TITLE MEETING
     ========================= */

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },

  iconLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
  },

  titleContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    minHeight: 64,
  },

  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#101828',
    lineHeight: 28,
  },

  description: {
    color: '#667085',
    lineHeight: 20,
    marginTop: 14,
    fontSize: 14,
  },

  divider: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 20,
  },

  /* =========================
     DETAIL
     ========================= */

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
    width: '100%',
  },

  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },

  detailContent: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 11,
    color: '#98A2B3',
    fontWeight: '700',
    marginBottom: 4,
  },

  value: {
    fontSize: 14,
    color: '#344054',
    fontWeight: '700',
    lineHeight: 20,
  },

  onlineValue: {
    fontSize: 14,
    color: '#175CD3',
    fontWeight: '800',
  },

  /* =========================
     BUTTON
     ========================= */

  button: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#175CD3',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
    paddingHorizontal: 16,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  buttonPressed: {
    opacity: 0.7,
  },

  /* =========================
     EMPTY
     ========================= */

  empty: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#101828',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 13,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 320,
  },

  backButton: {
    minHeight: 46,
    paddingHorizontal: 25,
    borderRadius: 12,
    backgroundColor: '#175CD3',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});