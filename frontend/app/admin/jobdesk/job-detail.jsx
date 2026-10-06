import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../services/supabase";

const getPriorityLabel = (value) => {
  switch (value) {
    case "rendah":
      return "Rendah";
    case "sedang":
      return "Sedang";
    case "tinggi":
      return "Tinggi";
    default:
      return value || "-";
  }
};

const getStatusLabel = (value) => {
  switch (value) {
    case "belum_dimulai":
      return "Belum Dimulai";
    case "sedang_berjalan":
      return "Sedang Berjalan";
    case "selesai":
      return "Selesai";
    default:
      return value || "-";
  }
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  return String(value).substring(0, 5);
};

export default function JobDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const id = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadJob = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

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
            status,
            role
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("LOAD JOB DETAIL ERROR:", error);
        throw error;
      }

      setJob(data);
    } catch (error) {
      console.error("LOAD JOB DETAIL ERROR:", error);

      Alert.alert(
        "Gagal",
        error?.message || "Gagal mengambil detail jobdesk."
      );

      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadJob();
    }, [loadJob])
  );

  /*
   * EDIT JOBDESK
   *
   * mode = edit
   * id = ID jobdesk yang sudah ada
   *
   * job-form akan membaca kedua parameter tersebut
   * dan melakukan UPDATE, bukan INSERT.
   */
  const handleEdit = () => {
    if (!job?.id) {
      Alert.alert(
        "Gagal",
        "ID jobdesk tidak ditemukan."
      );
      return;
    }

    router.push({
      pathname: "/admin/jobdesk/job-form",
      params: {
        mode: "edit",
        id: String(job.id),
      },
    });
  };

  const handleDelete = () => {
    if (!job?.id) {
      return;
    }

    Alert.alert(
      "Hapus Jobdesk",
      `Apakah kamu yakin ingin menghapus jobdesk "${job.title}"?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!id) {
      return;
    }

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("DELETE JOB ERROR:", error);
        throw error;
      }

      Alert.alert(
        "Berhasil",
        "Jobdesk berhasil dihapus.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/admin/jobdesk/jobdesk");
            },
          },
        ]
      );
    } catch (error) {
      console.error("DELETE JOB ERROR:", error);

      Alert.alert(
        "Gagal",
        error?.message || "Jobdesk gagal dihapus."
      );
    } finally {
      setDeleting(false);
    }
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
            Memuat detail jobdesk...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.center}>
          <View style={styles.notFoundIcon}>
            <Ionicons
              name="briefcase-outline"
              size={30}
              color="#175CD3"
            />
          </View>

          <Text style={styles.notFound}>
            Jobdesk tidak ditemukan.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const employee = job.profiles;

  const progress = Math.min(
    Math.max(Number(job.progress) || 0, 0),
    100
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <View style={styles.container}>

        {/* =====================================================
            SEMUA KONTEN SEKARANG BERADA DI DALAM SCROLLVIEW
            TERMASUK HEADER
        ===================================================== */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* =====================================================
              HEADER
          ===================================================== */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>

              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
                onPress={() => router.back()}
                disabled={deleting}
              >
                <Ionicons
                  name="arrow-back"
                  size={21}
                  color="#101828"
                />
              </Pressable>

              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>
                  Detail Jobdesk
                </Text>

                <Text style={styles.headerSubtitle}>
                  Informasi pekerjaan pegawai
                </Text>
              </View>

            </View>
          </View>

          {/* =====================================================
              INFORMASI PEGAWAI
          ===================================================== */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="person-outline"
                  size={17}
                  color="#175CD3"
                />
              </View>

              <Text style={styles.sectionTitle}>
                INFORMASI PEGAWAI
              </Text>
            </View>

            <View style={styles.employeeHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(employee?.nama || "P")
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>

              <View style={styles.employeeHeaderInfo}>
                <Text
                  style={styles.employeeName}
                  numberOfLines={2}
                >
                  {employee?.nama ||
                    "Pegawai tidak ditemukan"}
                </Text>

                <Text style={styles.employeeRole}>
                  {employee?.jabatan ||
                    employee?.divisi ||
                    "Pegawai"}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            {/* EMAIL */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="mail-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Email
                </Text>
              </View>

              <Text
                style={styles.infoValue}
                numberOfLines={2}
              >
                {employee?.email || "-"}
              </Text>
            </View>

            {/* JABATAN */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="briefcase-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Jabatan
                </Text>
              </View>

              <Text style={styles.infoValue}>
                {employee?.jabatan || "-"}
              </Text>
            </View>

            {/* DIVISI */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="business-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Divisi
                </Text>
              </View>

              <Text style={styles.infoValue}>
                {employee?.divisi || "-"}
              </Text>
            </View>

            {/* STATUS AKUN */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Status Akun
                </Text>
              </View>

              <Text
                style={[
                  styles.infoValue,
                  employee?.status === "aktif" &&
                    styles.activeText,
                ]}
              >
                {employee?.status || "-"}
              </Text>
            </View>
          </View>

          {/* =====================================================
              INFORMASI JOBDESK
          ===================================================== */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="briefcase-outline"
                  size={17}
                  color="#175CD3"
                />
              </View>

              <Text style={styles.sectionTitle}>
                INFORMASI JOBDESK
              </Text>
            </View>

            <Text style={styles.jobTitle}>
              {job.title || "-"}
            </Text>

            <Text style={styles.description}>
              {job.description ||
                "Tidak ada deskripsi."}
            </Text>

            <View style={styles.infoDivider} />

            {/* PRIORITAS */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="flag-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Prioritas
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  job.priority === "tinggi" &&
                    styles.highBadge,
                  job.priority === "sedang" &&
                    styles.mediumBadge,
                  job.priority === "rendah" &&
                    styles.lowBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    job.priority === "tinggi" &&
                      styles.highBadgeText,
                    job.priority === "sedang" &&
                      styles.mediumBadgeText,
                    job.priority === "rendah" &&
                      styles.lowBadgeText,
                  ]}
                >
                  {getPriorityLabel(job.priority)}
                </Text>
              </View>
            </View>

            {/* STATUS */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="pulse-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Status
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  job.status === "selesai" &&
                    styles.statusDone,
                  job.status === "sedang_berjalan" &&
                    styles.statusRunning,
                  job.status === "belum_dimulai" &&
                    styles.statusNotStarted,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    job.status === "selesai" &&
                      styles.statusDotDone,
                    job.status === "sedang_berjalan" &&
                      styles.statusDotRunning,
                    job.status === "belum_dimulai" &&
                      styles.statusDotNotStarted,
                  ]}
                />

                <Text
                  style={[
                    styles.statusBadgeText,
                    job.status === "selesai" &&
                      styles.statusDoneText,
                    job.status === "sedang_berjalan" &&
                      styles.statusRunningText,
                    job.status === "belum_dimulai" &&
                      styles.statusNotStartedText,
                  ]}
                >
                  {getStatusLabel(job.status)}
                </Text>
              </View>
            </View>

            {/* DEADLINE */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
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
                {formatDate(job.deadline)}
              </Text>
            </View>

            {/* JAM MULAI */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="time-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Jam Mulai
                </Text>
              </View>

              <Text style={styles.infoValue}>
                {formatTime(job.start_time)}
              </Text>
            </View>

            {/* JAM SELESAI */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="time-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Jam Selesai
                </Text>
              </View>

              <Text style={styles.infoValue}>
                {formatTime(job.end_time)}
              </Text>
            </View>
          </View>

          {/* =====================================================
              PROGRESS
          ===================================================== */}
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <View style={styles.progressTitleContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Ionicons
                      name="stats-chart-outline"
                      size={17}
                      color="#175CD3"
                    />
                  </View>

                  <Text style={styles.sectionTitle}>
                    PROGRESS PEKERJAAN
                  </Text>
                </View>

                <Text style={styles.progressHint}>
                  Progress diperbarui oleh pegawai
                </Text>
              </View>

              <Text style={styles.progressNumber}>
                {progress}%
              </Text>
            </View>

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

            <View style={styles.progressFooter}>
              <Text style={styles.progressStart}>
                0%
              </Text>

              <Text style={styles.progressEnd}>
                100%
              </Text>
            </View>
          </View>

          {/* =====================================================
              ACTION
          ===================================================== */}
          <View style={styles.actionContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.buttonPressed,
                deleting && styles.disabledButton,
              ]}
              onPress={handleEdit}
              disabled={deleting}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.editButtonText}>
                Edit Jobdesk
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
                deleting && styles.disabledButton,
              ]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#D92D20" />
              ) : (
                <>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#D92D20"
                  />

                  <Text style={styles.deleteButtonText}>
                    Hapus Jobdesk
                  </Text>
                </>
              )}
            </Pressable>
          </View>

        </ScrollView>
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

  scrollView: {
    flex: 1,
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
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAECF0",
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

  // =========================
  // CONTENT
  // =========================
  content: {
    paddingBottom: 45,
  },

  // =========================
  // CARD
  // =========================
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
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

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#667085",
    letterSpacing: 0.5,
  },

  // =========================
  // EMPLOYEE
  // =========================
  employeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#175CD3",
  },

  employeeHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },

  employeeName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
    lineHeight: 22,
  },

  employeeRole: {
    marginTop: 4,
    fontSize: 13,
    color: "#667085",
  },

  // =========================
  // INFORMATION
  // =========================
  infoDivider: {
    height: 1,
    backgroundColor: "#F2F4F7",
    marginVertical: 14,
  },

  infoRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.9,
  },

  infoLabel: {
    marginLeft: 6,
    fontSize: 12,
    color: "#667085",
    fontWeight: "600",
  },

  infoValue: {
    flex: 1.5,
    fontSize: 13,
    color: "#344054",
    fontWeight: "700",
    textAlign: "right",
  },

  activeText: {
    color: "#039855",
  },

  // =========================
  // JOB
  // =========================
  jobTitle: {
    marginTop: 15,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
    color: "#101828",
  },

  description: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#667085",
  },

  // =========================
  // PRIORITY
  // =========================
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#344054",
  },

  highBadge: {
    backgroundColor: "#FEF3F2",
  },

  highBadgeText: {
    color: "#D92D20",
  },

  mediumBadge: {
    backgroundColor: "#FFFAEB",
  },

  mediumBadgeText: {
    color: "#DC6803",
  },

  lowBadge: {
    backgroundColor: "#ECFDF3",
  },

  lowBadgeText: {
    color: "#039855",
  },

  // =========================
  // STATUS
  // =========================
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#344054",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 6,
    backgroundColor: "#98A2B3",
  },

  statusDotDone: {
    backgroundColor: "#039855",
  },

  statusDotRunning: {
    backgroundColor: "#175CD3",
  },

  statusDotNotStarted: {
    backgroundColor: "#98A2B3",
  },

  statusDone: {
    backgroundColor: "#ECFDF3",
  },

  statusDoneText: {
    color: "#039855",
  },

  statusRunning: {
    backgroundColor: "#EFF8FF",
  },

  statusRunningText: {
    color: "#175CD3",
  },

  statusNotStarted: {
    backgroundColor: "#F2F4F7",
  },

  statusNotStartedText: {
    color: "#667085",
  },

  // =========================
  // PROGRESS
  // =========================
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressTitleContainer: {
    flex: 1,
  },

  progressHint: {
    marginTop: 7,
    marginLeft: 41,
    fontSize: 12,
    color: "#98A2B3",
  },

  progressNumber: {
    fontSize: 25,
    fontWeight: "900",
    color: "#175CD3",
  },

  progressBackground: {
    height: 8,
    marginTop: 17,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#EAECF0",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#175CD3",
  },

  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },

  progressStart: {
    fontSize: 11,
    color: "#98A2B3",
  },

  progressEnd: {
    fontSize: 11,
    color: "#98A2B3",
  },

  // =========================
  // ACTION
  // =========================
  actionContainer: {
    marginHorizontal: 20,
    marginTop: 2,
  },

  editButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#175CD3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  deleteButton: {
    minHeight: 46,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#FEF3F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  deleteButtonPressed: {
    opacity: 0.7,
  },

  deleteButtonText: {
    color: "#D92D20",
    fontSize: 13,
    fontWeight: "800",
  },

  bottomBackButton: {
    minHeight: 44,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  // =========================
  // LOADING
  // =========================
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#667085",
  },

  // =========================
  // NOT FOUND
  // =========================
  notFoundIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  notFound: {
    fontSize: 17,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
  },

  notFoundBackButton: {
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
});