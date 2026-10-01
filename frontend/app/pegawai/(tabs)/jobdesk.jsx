import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Card,
  ProgressBar,
  StatusBadge,
} from "../../../components/UI";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../services/supabase";

export default function Jobdesk() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, user, session } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // RefreshControl
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async () => {
    const employeeId =
      profile?.id ||
      user?.id ||
      session?.user?.id;

    if (!employeeId) {
      setJobs([]);
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
          deadline,
          priority,
          progress,
          status,
          created_at,
          updated_at
        `
        )
        .eq("employee_id", employeeId)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Gagal mengambil jobdesk:",
          error.message
        );
        setJobs([]);
        return;
      }

      setJobs(data || []);
    } catch (error) {
      console.error("Load jobdesk error:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [
    profile?.id,
    user?.id,
    session?.user?.id,
  ]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Pull to Refresh
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadJobs();
    } catch (error) {
      console.error(
        "Refresh jobdesk error:",
        error
      );
    } finally {
      setRefreshing(false);
    }
  }, [loadJobs]);

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
          Memuat jobdesk...
        </Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#175CD3"]}
            tintColor="#175CD3"
          />
        }
      >
        <Text style={styles.title}>
          Jobdesk
        </Text>

        <Text style={styles.subtitle}>
          Daftar pekerjaan yang diberikan kepada kamu.
        </Text>

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
                Saat ini belum ada pekerjaan yang diberikan kepada kamu.
              </Text>
            </View>
          </Card>
        ) : (
          jobs.map((job) => (
            <Pressable
              key={job.id}
              onPress={() =>
                router.push({
                  pathname: "/pegawai/job/[id]",
                  params: {
                    id: String(job.id),
                  },
                })
              }
              style={({ pressed }) => [
                styles.cardWrapper,
                pressed && styles.cardPressed,
              ]}
            >
              <Card>
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}>
                    <Text style={styles.iconText}>
                      ✓
                    </Text>
                  </View>

                  <View style={styles.titleArea}>
                    <Text
                      style={styles.jobTitle}
                      numberOfLines={2}
                    >
                      {job.title || "Jobdesk"}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.taskDot} />

                      <Text style={styles.taskText}>
                        Tugas pekerjaan
                      </Text>
                    </View>
                  </View>

                  <StatusBadge
                    status={job.status}
                  />
                </View>

                {job.description ? (
                  <Text
                    style={styles.description}
                    numberOfLines={2}
                  >
                    {job.description}
                  </Text>
                ) : (
                  <Text style={styles.noDescription}>
                    Tidak ada deskripsi pekerjaan.
                  </Text>
                )}

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <View style={styles.smallIcon}>
                      <Text style={styles.smallIconText}>
                        ⏱
                      </Text>
                    </View>

                    <View style={styles.infoTextArea}>
                      <Text style={styles.infoLabel}>
                        DEADLINE
                      </Text>

                      <Text
                        style={styles.infoValue}
                        numberOfLines={1}
                      >
                        {formatDate(job.deadline)}
                      </Text>
                    </View>
                  </View>

                  {job.priority && (
                    <View style={styles.infoItem}>
                      <View style={styles.smallIcon}>
                        <Text style={styles.smallIconText}>
                          !
                        </Text>
                      </View>

                      <View style={styles.infoTextArea}>
                        <Text style={styles.infoLabel}>
                          PRIORITAS
                        </Text>

                        <Text
                          style={[
                            styles.infoValue,
                            getPriorityStyle(
                              job.priority
                            ),
                          ]}
                        >
                          {formatPriority(
                            job.priority
                          )}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressTop}>
                    <View>
                      <Text style={styles.progressTitle}>
                        Progress
                      </Text>

                      <Text style={styles.progressStatus}>
                        {getProgressStatus(
                          job.progress || 0
                        )}
                      </Text>
                    </View>

                    <Text style={styles.progressValue}>
                      {job.progress || 0}%
                    </Text>
                  </View>

                  <ProgressBar
                    progress={job.progress || 0}
                  />
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Lihat detail pekerjaan
                  </Text>

                  <View style={styles.arrowCircle}>
                    <Text style={styles.arrow}>
                      ›
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

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

const styles = StyleSheet.create({
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
    paddingTop: 20,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#667085",
    fontSize: 14,
    marginTop: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#101828",
  },

  subtitle: {
    color: "#667085",
    marginTop: 5,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },

  cardWrapper: {
    marginBottom: 14,
  },

  cardPressed: {
    opacity: 0.9,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  iconText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#175CD3",
  },

  titleArea: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  jobTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    color: "#101828",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#98A2B3",
    marginRight: 6,
  },

  taskText: {
    fontSize: 10,
    color: "#98A2B3",
    fontWeight: "600",
  },

  description: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 15,
  },

  noDescription: {
    color: "#98A2B3",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 15,
    lineHeight: 19,
  },

  infoRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  infoItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  smallIcon: {
    width: 29,
    height: 29,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  smallIconText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#175CD3",
  },

  infoTextArea: {
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#98A2B3",
    letterSpacing: 0.6,
  },

  infoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#344054",
    marginTop: 2,
  },

  progressSection: {
    marginTop: 17,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
  },

  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  progressTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#344054",
  },

  progressStatus: {
    fontSize: 10,
    color: "#98A2B3",
    marginTop: 2,
  },

  progressValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#175CD3",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },

  footerText: {
    fontSize: 11,
    color: "#667085",
    fontWeight: "600",
  },

  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    alignItems: "center",
  },

  arrow: {
    fontSize: 19,
    lineHeight: 20,
    color: "#475467",
    marginTop: -2,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    paddingHorizontal: 12,
  },

  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyIconText: {
    fontSize: 25,
    fontWeight: "900",
    color: "#175CD3",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
  },

  emptyText: {
    color: "#667085",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 280,
  },
});