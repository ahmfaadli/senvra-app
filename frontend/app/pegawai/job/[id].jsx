import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Card,
  ProgressBar,
  StatusBadge,
} from "../../../components/UI";
import { supabase } from "../../../services/supabase";

export default function JobdeskDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadJob = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const jobId = Array.isArray(id)
        ? id[0]
        : id;

      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
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
        `
        )
        .eq("id", jobId)
        .single();

      if (error) {
        console.error(
          "Gagal mengambil detail jobdesk:",
          error.message
        );

        setJob(null);
        return;
      }

      setJob(data);
    } catch (error) {
      console.error(
        "Load detail jobdesk error:",
        error
      );

      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
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
          Memuat detail jobdesk...
        </Text>
      </View>
    );
  }

  /* =========================
     ERROR / NOT FOUND
  ========================= */

  if (!job) {
    return (
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={30}
              color="#D92D20"
            />
          </View>

          <Text style={styles.errorTitle}>
            Jobdesk tidak ditemukan
          </Text>

          <Text style={styles.errorText}>
            Data jobdesk yang kamu pilih tidak
            dapat ditemukan.
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.backButtonText}>
              Kembali
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(job.progress) || 0
    )
  );

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
        {/* =========================
            HEADER
        ========================= */}

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
              Detail Jobdesk
            </Text>

            <Text
              style={styles.pageSubtitle}
              numberOfLines={1}
            >
              Informasi lengkap pekerjaan kamu
            </Text>
          </View>
        </View>

        {/* =========================
            MAIN JOB CARD
        ========================= */}

        <Card>
          {/* ICON + JUDUL */}

          <View style={styles.titleRow}>
            <View style={styles.iconLarge}>
              <Ionicons
                name="briefcase-outline"
                size={32}
                color="#175CD3"
              />
            </View>

            <View style={styles.titleContent}>
              <Text
                style={styles.title}
                numberOfLines={4}
              >
                {job.title || "Jobdesk"}
              </Text>

              <View style={styles.metaRow}>
                <Ionicons
                  name="document-text-outline"
                  size={13}
                  color="#98A2B3"
                />

                <Text style={styles.metaText}>
                  Tugas pekerjaan
                </Text>
              </View>
            </View>
          </View>

          {/* DIVIDER */}

          <View style={styles.divider} />

          {/* STATUS */}

          <View style={styles.statusRow}>
            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>
                STATUS PEKERJAAN
              </Text>

              <Text style={styles.statusHint}>
                Kondisi pekerjaan saat ini
              </Text>
            </View>

            <StatusBadge status={job.status} />
          </View>
        </Card>

        {/* =========================
            DESCRIPTION
        ========================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Deskripsi pekerjaan
          </Text>

          <Card>
            {job.description ? (
              <Text style={styles.description}>
                {job.description}
              </Text>
            ) : (
              <View style={styles.emptyDescription}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color="#98A2B3"
                />

                <Text style={styles.noDescription}>
                  Tidak ada deskripsi pekerjaan.
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* =========================
            INFORMATION
        ========================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Informasi pekerjaan
          </Text>

          <Card>
            <View style={styles.infoList}>
              {/* DEADLINE */}

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
                    DEADLINE
                  </Text>

                  <Text
                    style={styles.value}
                    numberOfLines={2}
                  >
                    {formatDate(job.deadline)}
                  </Text>
                </View>
              </View>

              {/* PRIORITY */}

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="flag-outline"
                    size={20}
                    color={getPriorityColor(
                      job.priority
                    )}
                  />
                </View>

                <View style={styles.detailContent}>
                  <Text style={styles.label}>
                    PRIORITAS
                  </Text>

                  <Text
                    style={[
                      styles.value,
                      getPriorityStyle(
                        job.priority
                      ),
                    ]}
                    numberOfLines={1}
                  >
                    {formatPriority(
                      job.priority
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* =========================
            PROGRESS
        ========================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Progress pekerjaan
          </Text>

          <Card>
            <View style={styles.progressHeader}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressTitle}>
                  Progress
                </Text>

                <Text style={styles.progressStatus}>
                  {getProgressStatus(progress)}
                </Text>
              </View>

              <Text style={styles.progressValue}>
                {progress}%
              </Text>
            </View>

            <ProgressBar progress={progress} />

            <View style={styles.progressBottom}>
              <Text style={styles.progressMin}>
                0%
              </Text>

              <Text style={styles.progressMax}>
                100%
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

/* =========================
   FORMAT DATE
========================= */

function formatDate(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleDateString(
      "id-ID",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return value;
  }
}

/* =========================
   PRIORITY
========================= */

function formatPriority(value) {
  if (!value) {
    return "-";
  }

  const priority = String(value).toLowerCase();

  if (
    priority === "high" ||
    priority === "tinggi"
  ) {
    return "Tinggi";
  }

  if (
    priority === "medium" ||
    priority === "sedang"
  ) {
    return "Sedang";
  }

  if (
    priority === "low" ||
    priority === "rendah"
  ) {
    return "Rendah";
  }

  return value;
}

function getPriorityColor(value) {
  const priority = String(value).toLowerCase();

  if (
    priority === "high" ||
    priority === "tinggi"
  ) {
    return "#D92D20";
  }

  if (
    priority === "medium" ||
    priority === "sedang"
  ) {
    return "#B54708";
  }

  if (
    priority === "low" ||
    priority === "rendah"
  ) {
    return "#027A48";
  }

  return "#175CD3";
}

function getPriorityStyle(value) {
  const priority = String(value).toLowerCase();

  if (
    priority === "high" ||
    priority === "tinggi"
  ) {
    return {
      color: "#D92D20",
    };
  }

  if (
    priority === "medium" ||
    priority === "sedang"
  ) {
    return {
      color: "#B54708",
    };
  }

  if (
    priority === "low" ||
    priority === "rendah"
  ) {
    return {
      color: "#027A48",
    };
  }

  return {
    color: "#344054",
  };
}

/* =========================
   PROGRESS STATUS
========================= */

function getProgressStatus(progress) {
  const value = Number(progress) || 0;

  if (value === 0) {
    return "Belum dimulai";
  }

  if (value < 50) {
    return "Sedang dikerjakan";
  }

  if (value < 100) {
    return "Hampir selesai";
  }

  return "Selesai";
}

function getProgressIcon(progress) {
  const value = Number(progress) || 0;

  if (value === 0) {
    return "pause-circle-outline";
  }

  if (value < 50) {
    return "time-outline";
  }

  if (value < 100) {
    return "trending-up-outline";
  }

  return "checkmark-circle-outline";
}

function getStatusDescription(progress) {
  const value = Number(progress) || 0;

  if (value === 0) {
    return "Pekerjaan belum dimulai.";
  }

  if (value < 50) {
    return "Pekerjaan sedang dalam proses pengerjaan.";
  }

  if (value < 100) {
    return "Pekerjaan sudah hampir selesai.";
  }

  return "Pekerjaan telah selesai.";
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  /* =========================
     BASE
  ========================= */

  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  /* =========================
     LOADING
  ========================= */

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
  },

  /* =========================
     HEADER
     SAMA DENGAN MEETING DETAIL
  ========================= */

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#EAECF0",
    flexShrink: 0,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#101828",
  },

  pageSubtitle: {
    fontSize: 13,
    color: "#667085",
    marginTop: 3,
  },

  /* =========================
     MAIN CARD
     SAMA DENGAN MEETING DETAIL
  ========================= */

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },

  iconLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    flexShrink: 0,
  },

  titleContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    minHeight: 64,
    paddingTop: 1,
  },

  title: {
    fontSize: 21,
    fontWeight: "900",
    color: "#101828",
    lineHeight: 28,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  metaText: {
    marginLeft: 5,
    fontSize: 11,
    color: "#98A2B3",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#EAECF0",
    marginVertical: 20,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },

  statusContent: {
    flex: 1,
    minWidth: 0,
  },

  statusLabel: {
    fontSize: 11,
    color: "#98A2B3",
    fontWeight: "700",
    marginBottom: 4,
  },

  statusHint: {
    fontSize: 12,
    color: "#667085",
    lineHeight: 18,
  },


  /* =========================
     DESCRIPTION
  ========================= */

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475467",
  },

  emptyDescription: {
    flexDirection: "row",
    alignItems: "center",
  },

  noDescription: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    color: "#98A2B3",
    fontStyle: "italic",
  },

  /* =========================
     INFORMATION
     GAYA DETAIL MEETING
  ========================= */

  infoList: {
    width: "100%",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
    width: "100%",
  },

  detailRowLast: {
    marginBottom: 0,
  },

  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },

  detailContent: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 11,
    color: "#98A2B3",
    fontWeight: "700",
    marginBottom: 4,
  },

  value: {
    fontSize: 14,
    color: "#344054",
    fontWeight: "700",
    lineHeight: 20,
  },

  /* =========================
     PROGRESS
  ========================= */

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  progressInfo: {
    flex: 1,
    minWidth: 0,
  },

  progressTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#344054",
  },

  progressStatus: {
    marginTop: 3,
    fontSize: 11,
    color: "#98A2B3",
  },

  progressValue: {
    marginLeft: 10,
    fontSize: 21,
    fontWeight: "900",
    color: "#175CD3",
  },

  progressBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },

  progressMin: {
    fontSize: 10,
    color: "#98A2B3",
  },

  progressMax: {
    fontSize: 10,
    color: "#98A2B3",
  },

  /* =========================
     SUMMARY
  ========================= */

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },

  summaryContent: {
    flex: 1,
    minWidth: 0,
  },

  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#101828",
  },

  summaryDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: "#667085",
  },

  /* =========================
     ERROR
  ========================= */

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#FEF3F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#101828",
    textAlign: "center",
  },

  errorText: {
    marginTop: 7,
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },

  backButton: {
    minHeight: 46,
    paddingHorizontal: 25,
    borderRadius: 12,
    backgroundColor: "#175CD3",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  /* =========================
     PRESS
  ========================= */

  buttonPressed: {
    opacity: 0.7,
  },
});