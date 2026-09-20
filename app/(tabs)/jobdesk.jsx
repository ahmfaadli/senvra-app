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

import {
  Card,
  ProgressBar,
  StatusBadge,
} from '../../components/UI';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Jobdesk() {
  const router = useRouter();

  const {
    profile,
    user,
    session,
  } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // AMBIL JOBDESK PEGAWAI
  // =========================================================

  const loadJobs = useCallback(async () => {
    const employeeId =
      profile?.id ||
      user?.id ||
      session?.user?.id;

    if (!employeeId) {
      console.log(
        'User ID belum tersedia untuk mengambil jobdesk'
      );

      setJobs([]);
      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      console.log('=================================');
      console.log('MENGAMBIL DATA JOBDESK');
      console.log('Employee ID:', employeeId);

      const {
        data,
        error,
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
        .eq('employee_id', employeeId)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Gagal mengambil jobdesk:',
          error.message
        );

        setJobs([]);
        return;
      }

      console.log(
        'Jumlah jobdesk:',
        data?.length || 0
      );

      console.log(
        'Data jobdesk:',
        data
      );

      setJobs(data || []);

    } catch (error) {
      console.error(
        'Load jobdesk error:',
        error
      );

      setJobs([]);

    } finally {
      setLoading(false);
    }
  }, [
    profile?.id,
    user?.id,
    session?.user?.id,
  ]);

  // =========================================================
  // LOAD SAAT HALAMAN DIBUKA
  // =========================================================

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

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
          Memuat jobdesk...
        </Text>
      </View>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.title}>
        Jobdesk
      </Text>

      <Text style={styles.subtitle}>
        Daftar pekerjaan yang diberikan kepada kamu.
      </Text>

      {/* =====================================================
          JIKA BELUM ADA JOBDESK
      ===================================================== */}

      {jobs.length === 0 ? (
        <Card>
          <View style={styles.emptyContainer}>

            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>
                ✓
              </Text>
            </View>

            <Text style={styles.emptyTitle}>
              Belum ada jobdesk
            </Text>

            <Text style={styles.emptyText}>
              Saat ini belum ada pekerjaan yang
              diberikan kepada kamu.
            </Text>

          </View>
        </Card>
      ) : (

        /* ===================================================
           DAFTAR JOBDESK
        =================================================== */

        jobs.map((job) => (

          <Pressable
            key={job.id}
            onPress={() =>
              router.push(`/job/${job.id}`)
            }
          >

            <Card>

              {/* HEADER */}

              <View style={styles.header}>

                <Text style={styles.jobTitle}>
                  {job.title}
                </Text>

                <StatusBadge
                  status={job.status}
                />

              </View>

              {/* DESCRIPTION */}

              {job.description ? (
                <Text style={styles.description}>
                  {job.description}
                </Text>
              ) : (
                <Text style={styles.noDescription}>
                  Tidak ada deskripsi pekerjaan.
                </Text>
              )}

              {/* PRIORITY */}

              {job.priority && (
                <View style={styles.priorityContainer}>

                  <Text style={styles.priorityLabel}>
                    Prioritas
                  </Text>

                  <Text style={styles.priorityValue}>
                    {formatPriority(job.priority)}
                  </Text>

                </View>
              )}

              {/* DEADLINE */}

              <View style={styles.info}>

                <Text style={styles.deadline}>
                  Deadline
                </Text>

                <Text style={styles.deadlineValue}>
                  {formatDate(job.deadline)}
                </Text>

              </View>

              {/* PROGRESS */}

              <View style={styles.progressHeader}>

                <Text style={styles.progressLabel}>
                  Progress
                </Text>

                <Text style={styles.progressValue}>
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

    </ScrollView>
  );
}

// =========================================================
// FORMAT TANGGAL
// =========================================================

function formatDate(value) {
  if (!value) {
    return '-';
  }

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
// FORMAT PRIORITY
// =========================================================

function formatPriority(value) {
  if (!value) {
    return '-';
  }

  const priority = String(value).toLowerCase();

  if (priority === 'high') {
    return 'Tinggi';
  }

  if (priority === 'medium') {
    return 'Sedang';
  }

  if (priority === 'low') {
    return 'Rendah';
  }

  if (priority === 'tinggi') {
    return 'Tinggi';
  }

  if (priority === 'sedang') {
    return 'Sedang';
  }

  if (priority === 'rendah') {
    return 'Rendah';
  }

  return value;
}

// =========================================================
// STYLE
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
    color: '#667085',
    fontSize: 14,
    marginTop: 12,
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  jobTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
  },

  description: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },

  noDescription: {
    color: '#98A2B3',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 12,
  },

  priorityContainer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  priorityLabel: {
    fontSize: 12,
    color: '#98A2B3',
  },

  priorityValue: {
    fontSize: 12,
    color: '#344054',
    fontWeight: '700',
  },

  info: {
    marginTop: 15,
  },

  deadline: {
    fontSize: 12,
    color: '#98A2B3',
  },

  deadlineValue: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 7,
  },

  progressLabel: {
    fontSize: 12,
    color: '#667085',
  },

  progressValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#175CD3',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
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

  emptyIconText: {
    fontSize: 25,
    fontWeight: '900',
    color: '#175CD3',
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

});