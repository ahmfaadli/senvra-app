import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

const STATUS_LABEL = {
  belum_dimulai: "Belum Dimulai",
  sedang_berjalan: "Sedang Berjalan",
  selesai: "Selesai",
};

const PRIORITY_LABEL = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
};

export default function JobdeskAdmin() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        Alert.alert("Error", "Sesi admin tidak ditemukan.");
        return;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select(`
          id,
          employee_id,
          title,
          description,
          priority,
          deadline,
          start_time,
          end_time,
          status,
          progress,
          created_at,
          updated_at,
          profiles!jobs_employee_id_fkey (
            id,
            nama,
            email,
            jabatan,
            divisi,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("FETCH JOB ERROR:", error);
        throw error;
      }

      setJobs(data || []);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Gagal",
        error?.message || "Gagal mengambil data jobdesk."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleDelete = (job) => {
    Alert.alert(
      "Hapus Jobdesk",
      `Apakah kamu yakin ingin menghapus "${job.title}"?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("jobs")
                .delete()
                .eq("id", job.id);

              if (error) {
                throw error;
              }

              setJobs((current) =>
                current.filter((item) => item.id !== job.id)
              );

              Alert.alert("Berhasil", "Jobdesk berhasil dihapus.");
            } catch (error) {
              console.error("DELETE JOB ERROR:", error);

              Alert.alert(
                "Gagal",
                error?.message || "Jobdesk gagal dihapus."
              );
            }
          },
        },
      ]
    );
  };

  const renderJob = ({ item }) => {
    const employee = item.profiles;

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push(`/admin/job-detail?id=${item.id}`)
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>

            <Text style={styles.employee}>
              {employee?.nama || "Pegawai tidak ditemukan"}
            </Text>
          </View>

          <View
            style={[
              styles.priorityBadge,
              item.priority === "tinggi" && styles.priorityHigh,
              item.priority === "sedang" && styles.priorityMedium,
              item.priority === "rendah" && styles.priorityLow,
            ]}
          >
            <Text style={styles.priorityText}>
              {PRIORITY_LABEL[item.priority] || item.priority}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Deadline</Text>
            <Text style={styles.infoValue}>
              {item.deadline || "-"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Progress</Text>
            <Text style={styles.infoValue}>
              {item.progress || 0}%
            </Text>
          </View>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  Math.max(Number(item.progress || 0), 0),
                  100
                )}%`,
              },
            ]}
          />
        </View>

        <View style={styles.bottomRow}>
          <View
            style={[
              styles.statusBadge,
              item.status === "selesai" && styles.statusDone,
              item.status === "sedang_berjalan" &&
                styles.statusProgress,
              item.status === "belum_dimulai" &&
                styles.statusPending,
            ]}
          >
            <Text style={styles.statusText}>
              {STATUS_LABEL[item.status] || item.status}
            </Text>
          </View>

          <Pressable
            style={styles.deleteButton}
            onPress={(event) => {
              event.stopPropagation();
              handleDelete(item);
            }}
          >
            <Text style={styles.deleteText}>Hapus</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Memuat jobdesk...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Jobdesk</Text>
          <Text style={styles.headerSubtitle}>
            Kelola pekerjaan pegawai
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/admin/job-form")}
        >
          <Text style={styles.addButtonText}>+ Tambah</Text>
        </Pressable>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={
          jobs.length === 0
            ? styles.emptyContainer
            : styles.listContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              Belum ada jobdesk
            </Text>

            <Text style={styles.emptyText}>
              Tambahkan jobdesk baru untuk pegawai.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/admin/job-form")}
            >
              <Text style={styles.emptyButtonText}>
                + Tambah Jobdesk
              </Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },

  addButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 10,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  titleContainer: {
    flex: 1,
    paddingRight: 10,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  employee: {
    marginTop: 6,
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "600",
  },

  priorityBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },

  priorityHigh: {
    backgroundColor: "#FEE2E2",
  },

  priorityMedium: {
    backgroundColor: "#FEF3C7",
  },

  priorityLow: {
    backgroundColor: "#DCFCE7",
  },

  priorityText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },

  description: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 19,
  },

  infoRow: {
    flexDirection: "row",
    marginTop: 15,
  },

  infoItem: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },

  progressBackground: {
    height: 7,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 12,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 10,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },

  statusPending: {
    backgroundColor: "#F3F4F6",
  },

  statusProgress: {
    backgroundColor: "#DBEAFE",
  },

  statusDone: {
    backgroundColor: "#DCFCE7",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },

  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  deleteText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7FB",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  empty: {
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  emptyText: {
    marginTop: 7,
    color: "#6B7280",
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 18,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});