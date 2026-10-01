import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
  Card,
  StatusBadge,
} from "../../../components/UI";

import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../context/AuthContext";

export default function Surat() {
  const router = useRouter();

  const {
    user,
    session,
    profile,
  } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ======================================================
  // USER ID
  // ======================================================

  const getUserId = useCallback(() => {
    return (
      user?.id ||
      session?.user?.id ||
      profile?.id ||
      null
    );
  }, [user, session, profile]);

  // ======================================================
  // FORMAT STATUS
  // ======================================================

  const formatStatus = (status) => {
    switch (status) {
      case "menunggu":
        return "Menunggu";

      case "diproses":
        return "Diproses";

      case "disetujui":
        return "Disetujui";

      case "ditolak":
        return "Ditolak";

      default:
        return status || "-";
    }
  };

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // ======================================================
  // FORMAT DATE TIME
  // ======================================================

  const formatDateTime = (dateString) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ======================================================
  // LOAD DATA
  // ======================================================

  const loadSubmissions = useCallback(async () => {
    try {
      setLoadingData(true);

      const currentUserId = getUserId();

      if (!currentUserId) {
        setSubmissions([]);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("surat_requests")
        .select(`
          id,
          employee_id,
          type,
          subject,
          description,
          start_date,
          end_date,
          status,
          admin_note,
          processed_by,
          processed_at,
          created_at,
          updated_at,
          started_at,
          completed_at
        `)
        .eq(
          "employee_id",
          currentUserId
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.log(
          "Load surat error:",
          error
        );

        return;
      }

      setSubmissions(data || []);
    } catch (error) {
      console.log(
        "Load submissions error:",
        error
      );
    } finally {
      setLoadingData(false);
    }
  }, [getUserId]);

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // ======================================================
  // OPEN DETAIL
  // ======================================================

  const openDetail = (item) => {
    router.push({
      pathname: "/pegawai/surat/surat-detail",
      params: {
        id: item.id,
      },
    });
  };

  // ======================================================
  // OPEN FORM
  // ======================================================

  const openForm = () => {
    router.push("/pegawai/surat/surat-form");
  };

  // ======================================================
  // TIMELINE
  // ======================================================

  const getTimeline = (item) => {
    const status = item?.status;

    return {
      submitted: {
        active: true,
        date: item?.created_at,
      },

      processed: {
        active:
          status === "diproses" ||
          status === "disetujui" ||
          status === "ditolak",

        date: item?.processed_at,
      },

      completed: {
        active:
          status === "disetujui" ||
          status === "ditolak",

        date:
          item?.completed_at ||
          null,
      },
    };
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (
    loadingData &&
    submissions.length === 0
  ) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={[
          "top",
          "left",
          "right",
        ]}
      >
        <View style={styles.loadingScreen}>
          <ActivityIndicator
            size="large"
            color="#175CD3"
          />

          <Text style={styles.loadingScreenText}>
            Memuat pengajuan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
        "left",
        "right",
      ]}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loadingData}
              onRefresh={loadSubmissions}
              colors={["#175CD3"]}
              tintColor="#175CD3"
            />
          }
        >
          {/* ==================================================
              HEADER
          ================================================== */}

          <View style={styles.pageHeader}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.back,
                pressed &&
                  styles.buttonPressed,
              ]}
              hitSlop={8}
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
                Riwayat Surat
              </Text>

              <Text
                style={styles.pageSubtitle}
                numberOfLines={2}
              >
                Lihat seluruh pengajuan administrasi kamu.
              </Text>
            </View>
          </View>

          {/* ==================================================
              FORM BUTTON
          ================================================== */}

          <Pressable
            style={({ pressed }) => [
              styles.newButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={openForm}
          >
            <View style={styles.newButtonIcon}>
              <Ionicons
                name="add"
                size={22}
                color="#175CD3"
              />
            </View>

            <View style={styles.newButtonText}>
              <Text style={styles.newButtonTitle}>
                Buat Pengajuan Baru
              </Text>

              <Text style={styles.newButtonSubtitle}>
                Ajukan surat administrasi baru
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#175CD3"
            />
          </Pressable>

          {/* ==================================================
              HISTORY HEADER
          ================================================== */}

          <View style={styles.historyHeader}>
            <View style={styles.historyText}>
              <Text style={styles.historyTitle}>
                Riwayat Pengajuan
              </Text>

              <Text style={styles.historySubtitle}>
                Ketuk surat untuk melihat detail dan perkembangan pengajuan.
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {submissions.length}
              </Text>
            </View>
          </View>

          {/* ==================================================
              EMPTY
          ================================================== */}

          {submissions.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={30}
                  color="#98A2B3"
                />
              </View>

              <Text style={styles.emptyTitle}>
                Belum ada pengajuan
              </Text>

              <Text style={styles.emptyText}>
                Pengajuan surat yang kamu kirim akan muncul di sini.
              </Text>

              <Pressable
                style={styles.emptyButton}
                onPress={openForm}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.emptyButtonText}>
                  Buat Pengajuan
                </Text>
              </Pressable>
            </View>
          ) : (
            submissions.map((item) => {
              const timeline =
                getTimeline(item);

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    openDetail(item)
                  }
                  style={({ pressed }) => [
                    pressed &&
                      styles.cardPressed,
                  ]}
                >
                  <Card>
                    {/* ========================================
                        HEADER
                    ======================================== */}

                    <View
                      style={
                        styles.statusHeader
                      }
                    >
                      <View
                        style={
                          styles.statusInfo
                        }
                      >
                        <Text
                          style={
                            styles.statusTitle
                          }
                          numberOfLines={2}
                        >
                          {item.subject ||
                            item.type ||
                            "-"}
                        </Text>

                        <Text
                          style={
                            styles.historyType
                          }
                        >
                          {item.type || "-"}
                        </Text>

                        <View
                          style={
                            styles.dateRow
                          }
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color="#98A2B3"
                          />

                          <Text
                            style={styles.date}
                          >
                            Diajukan{" "}
                            {formatDate(
                              item.created_at
                            )}
                          </Text>
                        </View>
                      </View>

                      <StatusBadge
                        status={formatStatus(
                          item.status
                        )}
                      />
                    </View>

                    <View
                      style={
                        styles.dividerSmall
                      }
                    />

                    {/* ========================================
                        PERIOD
                    ======================================== */}

                    <View
                      style={
                        styles.periodBox
                      }
                    >
                      <View
                        style={
                          styles.periodItem
                        }
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={17}
                          color="#175CD3"
                        />

                        <View
                          style={
                            styles.periodContent
                          }
                        >
                          <Text
                            style={
                              styles.periodLabel
                            }
                          >
                            Tanggal Mulai
                          </Text>

                          <Text
                            style={
                              styles.periodValue
                            }
                          >
                            {formatDate(
                              item.start_date
                            )}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.periodArrow
                        }
                      >
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color="#98A2B3"
                        />
                      </View>

                      <View
                        style={
                          styles.periodItem
                        }
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={17}
                          color="#175CD3"
                        />

                        <View
                          style={
                            styles.periodContent
                          }
                        >
                          <Text
                            style={
                              styles.periodLabel
                            }
                          >
                            Tanggal Selesai
                          </Text>

                          <Text
                            style={
                              styles.periodValue
                            }
                          >
                            {formatDate(
                              item.end_date
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View
                      style={
                        styles.dividerSmall
                      }
                    />

                    {/* ========================================
                        TIMELINE
                    ======================================== */}

                    <View
                      style={styles.timeline}
                    >
                      {/* STEP 1 */}

                      <View
                        style={
                          styles.timelineItem
                        }
                      >
                        <View
                          style={
                            styles.timelineLeft
                          }
                        >
                          <View
                            style={[
                              styles.timelineDot,
                              timeline.submitted
                                .active &&
                                styles.timelineDotActive,
                            ]}
                          >
                            <Ionicons
                              name="checkmark"
                              size={11}
                              color="#FFFFFF"
                            />
                          </View>

                          <View
                            style={[
                              styles.timelineLine,
                              timeline.processed
                                .active &&
                                styles.timelineLineActive,
                            ]}
                          />
                        </View>

                        <View
                          style={
                            styles.timelineContent
                          }
                        >
                          <Text
                            style={
                              styles.timelineTitle
                            }
                          >
                            Pengajuan dibuat
                          </Text>

                          <Text
                            style={
                              styles.timelineDate
                            }
                          >
                            {formatDateTime(
                              item.created_at
                            )}
                          </Text>
                        </View>
                      </View>

                      {/* STEP 2 */}

                      <View
                        style={
                          styles.timelineItem
                        }
                      >
                        <View
                          style={
                            styles.timelineLeft
                          }
                        >
                          <View
                            style={[
                              styles.timelineDot,
                              timeline.processed
                                .active &&
                                styles.timelineDotActive,
                            ]}
                          >
                            {timeline.processed
                              .active && (
                              <Ionicons
                                name="checkmark"
                                size={11}
                                color="#FFFFFF"
                              />
                            )}
                          </View>

                          <View
                            style={[
                              styles.timelineLine,
                              timeline.completed
                                .active &&
                                styles.timelineLineActive,
                            ]}
                          />
                        </View>

                        <View
                          style={
                            styles.timelineContent
                          }
                        >
                          <Text
                            style={
                              styles.timelineTitle
                            }
                          >
                            Mulai diproses
                          </Text>

                          <Text
                            style={
                              styles.timelineDate
                            }
                          >
                            {timeline.processed
                              .date
                              ? formatDateTime(
                                  timeline
                                    .processed
                                    .date
                                )
                              : "Menunggu proses admin"}
                          </Text>
                        </View>
                      </View>

                      {/* STEP 3 */}

                      <View
                        style={
                          styles.timelineItemLast
                        }
                      >
                        <View
                          style={
                            styles.timelineLeft
                          }
                        >
                          <View
                            style={[
                              styles.timelineDot,
                              timeline.completed
                                .active &&
                                styles.timelineDotActive,
                            ]}
                          >
                            {timeline.completed
                              .active && (
                              <Ionicons
                                name="checkmark"
                                size={11}
                                color="#FFFFFF"
                              />
                            )}
                          </View>
                        </View>

                        <View
                          style={
                            styles.timelineContent
                          }
                        >
                          <Text
                            style={
                              styles.timelineTitle
                            }
                          >
                            Pengajuan selesai
                          </Text>

                          <Text
                            style={
                              styles.timelineDate
                            }
                          >
                            {timeline.completed
                              .date
                              ? formatDateTime(
                                  timeline
                                    .completed
                                    .date
                                )
                              : "Belum selesai"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* ========================================
                        ADMIN NOTE
                    ======================================== */}

                    {item.admin_note ? (
                      <View
                        style={
                          styles.adminNoteBox
                        }
                      >
                        <View
                          style={
                            styles.adminNoteHeader
                          }
                        >
                          <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={17}
                            color="#175CD3"
                          />

                          <Text
                            style={
                              styles.adminNoteLabel
                            }
                          >
                            Catatan Admin
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.adminNoteText
                          }
                        >
                          {item.admin_note}
                        </Text>
                      </View>
                    ) : null}

                    {/* ========================================
                        DETAIL
                    ======================================== */}

                    <View
                      style={
                        styles.detailButton
                      }
                    >
                      <Text
                        style={
                          styles.detailButtonText
                        }
                      >
                        Lihat Detail
                      </Text>

                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#175CD3"
                      />
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ======================================================
// STYLE
// ======================================================

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
    paddingTop: 18,
    paddingBottom: 100,
  },

  // ====================================================
  // HEADER
  // ====================================================

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

  buttonPressed: {
    opacity: 0.7,
  },

  cardPressed: {
    opacity: 0.96,
  },

  // ====================================================
  // NEW BUTTON
  // ====================================================

  newButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCEBFF",
    borderRadius: 14,
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  newButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  newButtonText: {
    flex: 1,
    marginLeft: 12,
  },

  newButtonTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#101828",
  },

  newButtonSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "#667085",
  },

  // ====================================================
  // LOADING
  // ====================================================

  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingScreenText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
  },

  // ====================================================
  // HISTORY
  // ====================================================

  historyHeader: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  historyText: {
    flex: 1,
    paddingRight: 12,
  },

  historyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#101828",
  },

  historySubtitle: {
    marginTop: 4,
    color: "#667085",
    fontSize: 13,
    lineHeight: 19,
  },

  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  countText: {
    color: "#175CD3",
    fontWeight: "900",
    fontSize: 13,
  },

  // ====================================================
  // EMPTY
  // ====================================================

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 14,
    padding: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#101828",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 7,
    color: "#667085",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 320,
  },

  emptyButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#175CD3",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  // ====================================================
  // HISTORY CARD
  // ====================================================

  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusInfo: {
    flex: 1,
    paddingRight: 10,
    minWidth: 0,
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#101828",
  },

  historyType: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#175CD3",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  date: {
    color: "#667085",
    fontSize: 11,
  },

  dividerSmall: {
    height: 1,
    backgroundColor: "#EAECF0",
    marginVertical: 16,
  },

  // ====================================================
  // PERIOD
  // ====================================================

  periodBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FC",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 12,
    padding: 11,
  },

  periodItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  periodContent: {
    flex: 1,
    marginLeft: 8,
    minWidth: 0,
  },

  periodLabel: {
    fontSize: 9,
    color: "#98A2B3",
    fontWeight: "700",
  },

  periodValue: {
    marginTop: 2,
    color: "#344054",
    fontSize: 11,
    fontWeight: "800",
  },

  periodArrow: {
    paddingHorizontal: 8,
  },

  // ====================================================
  // TIMELINE
  // ====================================================

  timeline: {
    marginTop: 18,
  },

  timelineItem: {
    flexDirection: "row",
    minHeight: 56,
  },

  timelineItemLast: {
    flexDirection: "row",
    minHeight: 42,
  },

  timelineLeft: {
    width: 28,
    alignItems: "center",
  },

  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#D0D5DD",
    justifyContent: "center",
    alignItems: "center",
  },

  timelineDotActive: {
    backgroundColor: "#175CD3",
  },

  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#EAECF0",
    marginTop: 3,
    marginBottom: 3,
  },

  timelineLineActive: {
    backgroundColor: "#175CD3",
  },

  timelineContent: {
    flex: 1,
    marginLeft: 9,
    paddingBottom: 10,
  },

  timelineTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#344054",
  },

  timelineDate: {
    marginTop: 3,
    fontSize: 11,
    color: "#98A2B3",
    lineHeight: 16,
  },

  // ====================================================
  // ADMIN NOTE
  // ====================================================

  adminNoteBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F8F9FC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },

  adminNoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  adminNoteLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#344054",
  },

  adminNoteText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#667085",
  },

  // ====================================================
  // DETAIL
  // ====================================================

  detailButton: {
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
  },

  detailButtonText: {
    color: "#175CD3",
    fontSize: 12,
    fontWeight: "800",
  },
});