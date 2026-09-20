import React, {
  useState,
} from 'react';

import {
  Alert,
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

import {
  jobs,
} from '../../data/mock';

import {
  Card,
  ProgressBar,
  StatusBadge,
} from '../../components/UI';

export default function JobDetail() {
  const { id } = useLocalSearchParams();

  const router = useRouter();

  const job = jobs.find(
    (item) => item.id === String(id)
  );

  const [progress, setProgress] = useState(
    job?.progress ?? 0
  );

  if (!job) {
    return (
      <View style={styles.empty}>
        <Text>Jobdesk tidak ditemukan.</Text>
      </View>
    );
  }

  const increaseProgress = () => {
    if (progress >= 100) {
      return;
    }

    setProgress(
      Math.min(progress + 10, 100)
    );
  };

  const saveProgress = () => {
    Alert.alert(
      'Berhasil',
      `Progress berhasil diperbarui menjadi ${progress}%.`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      <Card>

        <View style={styles.header}>
          <Text style={styles.title}>
            {job.title}
          </Text>

          <StatusBadge
            status={job.status}
          />
        </View>

        <Text style={styles.description}>
          {job.description}
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.label}>
            Deadline
          </Text>

          <Text style={styles.value}>
            {job.deadline}
          </Text>
        </View>

      </Card>

      <Card>

        <Text style={styles.sectionTitle}>
          Progress Pekerjaan
        </Text>

        <View style={styles.progressHeader}>
          <Text style={styles.progressValue}>
            {progress}%
          </Text>

          <Text style={styles.progressLabel}>
            dari target pekerjaan
          </Text>
        </View>

        <ProgressBar
          progress={progress}
        />

        <Pressable
          style={styles.updateButton}
          onPress={increaseProgress}
        >
          <Text style={styles.buttonText}>
            + 10% Progress
          </Text>
        </Pressable>

        <Pressable
          style={styles.saveButton}
          onPress={saveProgress}
        >
          <Text style={styles.buttonText}>
            Simpan Progress
          </Text>
        </Pressable>

      </Card>

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
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  title: {
    flex: 1,
    fontSize: 21,
    fontWeight: '900',
    color: '#101828',
  },

  description: {
    color: '#667085',
    lineHeight: 21,
    marginTop: 15,
  },

  infoBox: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    marginTop: 18,
  },

  label: {
    fontSize: 12,
    color: '#98A2B3',
  },

  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#344054',
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 20,
  },

  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },

  progressValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#175CD3',
  },

  progressLabel: {
    color: '#667085',
  },

  updateButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  saveButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#175CD3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});