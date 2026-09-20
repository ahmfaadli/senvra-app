import React from 'react';

import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import {
  useLocalSearchParams,
} from 'expo-router';

import {
  meetings,
} from '../../data/mock';

import {
  Card,
} from '../../components/UI';

export default function MeetingDetail() {
  const { id } = useLocalSearchParams();

  const meeting = meetings.find(
    (item) => item.id === String(id)
  );

  if (!meeting) {
    return (
      <Text style={styles.empty}>
        Meeting tidak ditemukan.
      </Text>
    );
  }

  const openMeeting = () => {
    if (meeting.link) {
      Linking.openURL(meeting.link);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      <Card>

        <Text style={styles.title}>
          {meeting.title}
        </Text>

        <Text style={styles.description}>
          {meeting.description}
        </Text>

        <Text style={styles.label}>
          Tanggal
        </Text>

        <Text style={styles.value}>
          {meeting.date}
        </Text>

        <Text style={styles.label}>
          Waktu
        </Text>

        <Text style={styles.value}>
          {meeting.time}
        </Text>

        <Text style={styles.label}>
          Lokasi
        </Text>

        <Text style={styles.value}>
          {meeting.location}
        </Text>

      </Card>

      {meeting.link && (
        <Pressable
          style={styles.button}
          onPress={openMeeting}
        >
          <Text style={styles.buttonText}>
            Buka Meeting
          </Text>
        </Pressable>
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
  },

  title: {
    fontSize: 23,
    fontWeight: '900',
    color: '#101828',
  },

  description: {
    color: '#667085',
    lineHeight: 20,
    marginTop: 14,
    marginBottom: 20,
  },

  label: {
    color: '#98A2B3',
    fontSize: 12,
    marginTop: 13,
  },

  value: {
    color: '#344054',
    fontWeight: '700',
    marginTop: 4,
  },

  button: {
    height: 50,
    backgroundColor: '#175CD3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  empty: {
    flex: 1,
    textAlign: 'center',
    marginTop: 100,
  },
});