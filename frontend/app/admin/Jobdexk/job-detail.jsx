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

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

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
        .select(
          `
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
          `
        )
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
        error?.message ||
          "Gagal mengambil detail jobdesk."
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
   * Penting:
   * - mode = edit
   * - id = ID jobdesk yang sudah ada
   *
   * Jadi job-form harus membaca kedua parameter ini
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
      pathname: "/admin/job-form",
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
              router.replace("/admin/jobdesk");
            },
          },
        ]
      );
    } catch (error) {
      console.error("DELETE JOB ERROR:", error);

      Alert.alert(
        "Gagal",
        error?.message ||
          "Jobdesk gagal dihapus."
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#4F46E5"
        />

        <Text style={styles.loadingText}>
          Memuat detail jobdesk...
        </Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>
          Jobdesk tidak ditemukan.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            Kembali
          </Text>
        </Pressable>
      </View>
    );
  }

  const employee = job.profiles;

  const progress = Math.min(
    Math.max(
      Number(job.progress) || 0,
      0
    ),
    100
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Detail Jobdesk
        </Text>

        <Text style={styles.subtitle}>
          Informasi pekerjaan yang diberikan kepada pegawai
        </Text>

        {/* ============================
            INFORMASI PEGAWAI
        ============================ */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            INFORMASI PEGAWAI
          </Text>

          <View style={styles.employeeHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(employee?.nama || "P")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <View style={styles.employeeHeaderInfo}>
              <Text style={styles.employeeName}>
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

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Email
            </Text>

            <Text style={styles.infoValue}>
              {employee?.email || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Jabatan
            </Text>

            <Text style={styles.infoValue}>
              {employee?.jabatan || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Divisi
            </Text>

            <Text style={styles.infoValue}>
              {employee?.divisi || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Status Akun
            </Text>

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

        {/* ============================
            INFORMASI JOBDESK
        ============================ */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            INFORMASI JOBDESK
          </Text>

          <Text style={styles.jobTitle}>
            {job.title || "-"}
          </Text>

          <Text style={styles.description}>
            {job.description ||
              "Tidak ada deskripsi."}
          </Text>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Prioritas
            </Text>

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
                {getPriorityLabel(
                  job.priority
                )}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Status
            </Text>

            <View
              style={[
                styles.statusBadge,
                job.status === "selesai" &&
                  styles.statusDone,
                job.status ===
                  "sedang_berjalan" &&
                  styles.statusRunning,
                job.status ===
                  "belum_dimulai" &&
                  styles.statusNotStarted,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  job.status === "selesai" &&
                    styles.statusDoneText,
                  job.status ===
                    "sedang_berjalan" &&
                    styles.statusRunningText,
                  job.status ===
                    "belum_dimulai" &&
                    styles.statusNotStartedText,
                ]}
              >
                {getStatusLabel(
                  job.status
                )}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Deadline
            </Text>

            <Text style={styles.infoValue}>
              {formatDate(job.deadline)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Jam Mulai
            </Text>

            <Text style={styles.infoValue}>
              {formatTime(job.start_time)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Jam Selesai
            </Text>

            <Text style={styles.infoValue}>
              {formatTime(job.end_time)}
            </Text>
          </View>
        </View>

        {/* ============================
            PROGRESS
            READ ONLY
        ============================ */}

        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                PROGRESS PEKERJAAN
              </Text>

              <Text style={styles.progressHint}>
                Progress diperbarui oleh pegawai
              </Text>
            </View>

            <Text style={styles.progressNumber}>
              {progress}%
            </Text>
          </View>

          <View
            style={styles.progressBackground}
          >
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

        {/* ============================
            ACTION
        ============================ */}

        <View style={styles.actionContainer}>
          <Pressable
            style={[
              styles.editButton,
              deleting &&
                styles.disabledButton,
            ]}
            onPress={handleEdit}
            disabled={deleting}
          >
            <Text style={styles.editButtonText}>
              Edit Jobdesk
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.deleteButton,
              deleting &&
                styles.disabledButton,
            ]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator
                color="#DC2626"
              />
            ) : (
              <Text
                style={styles.deleteButtonText}
              >
                Hapus Jobdesk
              </Text>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.backButton,
              deleting &&
                styles.disabledButton,
            ]}
            onPress={() => router.back()}
            disabled={deleting}
          >
            <Text style={styles.backText}>
              Kembali
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 20,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.5,
  },

  employeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#4F46E5",
  },

  employeeHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },

  employeeName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  employeeRole: {
    marginTop: 3,
    fontSize: 13,
    color: "#6B7280",
  },

  infoDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 15,
  },

  infoRow: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },

  infoLabel: {
    flex: 0.9,
    fontSize: 13,
    color: "#6B7280",
  },

  infoValue: {
    flex: 1.5,
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
    textAlign: "right",
  },

  activeText: {
    color: "#16A34A",
  },

  jobTitle: {
    marginTop: 14,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "700",
    color: "#111827",
  },

  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  highBadge: {
    backgroundColor: "#FEE2E2",
  },

  highBadgeText: {
    color: "#DC2626",
  },

  mediumBadge: {
    backgroundColor: "#FEF3C7",
  },

  mediumBadgeText: {
    color: "#D97706",
  },

  lowBadge: {
    backgroundColor: "#DCFCE7",
  },

  lowBadgeText: {
    color: "#16A34A",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  statusDone: {
    backgroundColor: "#DCFCE7",
  },

  statusDoneText: {
    color: "#16A34A",
  },

  statusRunning: {
    backgroundColor: "#DBEAFE",
  },

  statusRunningText: {
    color: "#2563EB",
  },

  statusNotStarted: {
    backgroundColor: "#F3F4F6",
  },

  statusNotStartedText: {
    color: "#6B7280",
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressHint: {
    marginTop: 5,
    fontSize: 12,
    color: "#9CA3AF",
  },

  progressNumber: {
    fontSize: 25,
    fontWeight: "800",
    color: "#4F46E5",
  },

  progressBackground: {
    height: 10,
    marginTop: 18,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#4F46E5",
  },

  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },

  progressStart: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  progressEnd: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  actionContainer: {
    marginTop: 2,
  },

  editButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  deleteButton: {
    marginTop: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.6,
  },

  backButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F6F7FB",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
  },

  notFound: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
});