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

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../services/supabase";

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

    const progress = Math.min(
      Math.max(Number(item.progress || 0), 0),
      100
    );

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={() =>
          router.push(`/admin/jobdesk/job-detail?id=${item.id}`)
        }
      >
        {/* Header Card */}
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>

            <View style={styles.employeeRow}>
              <View style={styles.employeeIcon}>
                <Ionicons
                  name="person-outline"
                  size={14}
                  color="#175CD3"
                />
              </View>

              <Text style={styles.employee} numberOfLines={1}>
                {employee?.nama || "Pegawai tidak ditemukan"}
              </Text>
            </View>
          </View>

          {/* Priority */}
          <View
            style={[
              styles.priorityBadge,
              item.priority === "tinggi" &&
                styles.priorityHigh,
              item.priority === "sedang" &&
                styles.priorityMedium,
              item.priority === "rendah" &&
                styles.priorityLow,
            ]}
          >
            <Text style={styles.priorityText}>
              {PRIORITY_LABEL[item.priority] || item.priority}
            </Text>
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Information */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={styles.infoIconRow}>
              <Ionicons
                name="calendar-outline"
                size={15}
                color="#667085"
              />

              <Text style={styles.infoLabel}>
                Deadline
              </Text>
            </View>

            <Text style={styles.infoValue}>
              {item.deadline || "-"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconRow}>
              <Ionicons
                name="stats-chart-outline"
                size={15}
                color="#667085"
              />

              <Text style={styles.infoLabel}>
                Progress
              </Text>
            </View>

            <Text style={styles.infoValue}>
              {progress}%
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        {/* Bottom */}
        <View style={styles.bottomRow}>
          <View
            style={[
              styles.statusBadge,
              item.status === "selesai" &&
                styles.statusDone,
              item.status === "sedang_berjalan" &&
                styles.statusProgress,
              item.status === "belum_dimulai" &&
                styles.statusPending,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                item.status === "selesai" &&
                  styles.statusDotDone,
                item.status === "sedang_berjalan" &&
                  styles.statusDotProgress,
                item.status === "belum_dimulai" &&
                  styles.statusDotPending,
              ]}
            />

            <Text style={styles.statusText}>
              {STATUS_LABEL[item.status] || item.status}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            onPress={(event) => {
              event.stopPropagation();
              handleDelete(item);
            }}
          >
            <Ionicons
              name="trash-outline"
              size={17}
              color="#D92D20"
            />

            <Text style={styles.deleteText}>
              Hapus
            </Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#175CD3"
          />

          <Text style={styles.loadingText}>
            Memuat jobdesk...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color="#101828"
              />
            </Pressable>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                Daftar Jobdesk
              </Text>

              <Text style={styles.headerSubtitle}>
                Kelola pekerjaan pegawai
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() =>
              router.push("/admin/jobdesk/job-form")
            }
          >
            <Ionicons
              name="add"
              size={20}
              color="#FFFFFF"
            />

          </Pressable>
        </View>

        {/* List */}
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJob}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            jobs.length === 0
              ? styles.emptyContainer
              : styles.listContainer
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#175CD3"
              colors={["#175CD3"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="briefcase-outline"
                  size={30}
                  color="#175CD3"
                />
              </View>

              <Text style={styles.emptyTitle}>
                Belum ada jobdesk
              </Text>

              <Text style={styles.emptyText}>
                Tambahkan jobdesk baru untuk pegawai.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && styles.emptyButtonPressed,
                ]}
                onPress={() =>
                  router.push("/admin/jobdesk/job-form")
                }
              >
                <Ionicons
                  name="add"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.emptyButtonText}>
                  Tambah Jobdesk
                </Text>
              </Pressable>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  // =========================
  // HEADER
  // =========================

  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: "center",
    flex: 1,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECF0',
    marginRight: 11,
  },

  backButtonPressed: {
    opacity: 0.7,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#101828",
  },

  headerSubtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  addButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#175CD3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  addButtonPressed: {
    opacity: 0.8,
  },


  // =========================
  // LIST
  // =========================

  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAECF0",
    shadowColor: "#101828",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  cardPressed: {
    opacity: 0.96,
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
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
    lineHeight: 22,
  },

  employeeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  employeeIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  employee: {
    flex: 1,
    fontSize: 13,
    color: "#175CD3",
    fontWeight: "700",
  },

  priorityBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
  },

  priorityHigh: {
    backgroundColor: "#FEF3F2",
  },

  priorityMedium: {
    backgroundColor: "#FFFAEB",
  },

  priorityLow: {
    backgroundColor: "#ECFDF3",
  },

  priorityText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#344054",
  },

  description: {
    marginTop: 13,
    color: "#667085",
    fontSize: 13,
    lineHeight: 19,
  },

  // =========================
  // INFO
  // =========================

  infoRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
  },

  infoItem: {
    flex: 1,
  },

  infoIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  infoLabel: {
    marginLeft: 5,
    fontSize: 11,
    color: "#98A2B3",
    fontWeight: "600",
  },

  infoValue: {
    fontSize: 13,
    color: "#344054",
    fontWeight: "700",
  },

  // =========================
  // PROGRESS
  // =========================

  progressBackground: {
    height: 7,
    backgroundColor: "#EAECF0",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 13,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#175CD3",
    borderRadius: 10,
  },

  // =========================
  // BOTTOM
  // =========================

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
    backgroundColor: "#F2F4F7",
    flexDirection: "row",
    alignItems: "center",
  },

  statusPending: {
    backgroundColor: "#F2F4F7",
  },

  statusProgress: {
    backgroundColor: "#EFF8FF",
  },

  statusDone: {
    backgroundColor: "#ECFDF3",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#98A2B3",
    marginRight: 6,
  },

  statusDotPending: {
    backgroundColor: "#98A2B3",
  },

  statusDotProgress: {
    backgroundColor: "#175CD3",
  },

  statusDotDone: {
    backgroundColor: "#039855",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#344054",
  },

  deleteButton: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3F2",
  },

  deleteButtonPressed: {
    opacity: 0.7,
  },

  deleteText: {
    marginLeft: 5,
    color: "#D92D20",
    fontSize: 12,
    fontWeight: "700",
  },

  // =========================
  // LOADING
  // =========================

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
  },

  // =========================
  // EMPTY
  // =========================

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  empty: {
    alignItems: "center",
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#101828",
  },

  emptyText: {
    marginTop: 7,
    color: "#667085",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },

  emptyButton: {
    marginTop: 18,
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius: 11,
    backgroundColor: "#175CD3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  emptyButtonPressed: {
    opacity: 0.8,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});