import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../services/supabase';

export default function Reports() {
  const [loading, setLoading] = useState(true);

  const [attendance, setAttendance] =
    useState(0);

  const [jobs, setJobs] =
    useState(0);

  const [completedJobs, setCompletedJobs] =
    useState(0);

  const [requests, setRequests] =
    useState(0);

  const loadReports = async () => {
    try {
      const attendanceResult =
        await supabase
          .from('attendance')
          .select('id', {
            count: 'exact',
            head: true,
          });

      const jobsResult =
        await supabase
          .from('jobs')
          .select('id', {
            count: 'exact',
            head: true,
          });

      const completedResult =
        await supabase
          .from('jobs')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('status', 'Selesai');

      const requestsResult =
        await supabase
          .from('surat_requests')
          .select('id', {
            count: 'exact',
            head: true,
          });

      setAttendance(
        attendanceResult.count || 0
      );

      setJobs(jobsResult.count || 0);

      setCompletedJobs(
        completedResult.count || 0
      );

      setRequests(
        requestsResult.count || 0
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Laporan
      </Text>

      <Text style={styles.subtitle}>
        Ringkasan data aplikasi.
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />
      ) : (
        <>
          <ReportCard
            icon="time-outline"
            title="Laporan Kehadiran"
            value={attendance}
            description="Total data absensi"
          />

          <ReportCard
            icon="briefcase-outline"
            title="Laporan Jobdesk"
            value={jobs}
            description="Total pekerjaan"
          />

          <ReportCard
            icon="checkmark-circle-outline"
            title="Laporan Progress"
            value={completedJobs}
            description="Jobdesk selesai"
          />

          <ReportCard
            icon="document-text-outline"
            title="Laporan Pengajuan Surat"
            value={requests}
            description="Total pengajuan"
          />
        </>
      )}
    </ScrollView>
  );
}

function ReportCard({
  icon,
  title,
  value,
  description,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons
          name={icon}
          size={25}
          color="#175CD3"
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.cardTitle}>
          {title}
        </Text>

        <Text style={styles.value}>
          {value}
        </Text>

        <Text style={styles.description}>
          {description}
        </Text>
      </View>
    </View>
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

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },

  icon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  info: {
    flex: 1,
  },

  cardTitle: {
    fontWeight: '800',
    color: '#101828',
  },

  value: {
    fontSize: 25,
    fontWeight: '900',
    color: '#101828',
    marginTop: 4,
  },

  description: {
    fontSize: 12,
    color: '#667085',
  },
});