import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../services/supabase";

const STATUS_LABEL = {
  Pending: "Menunggu",
  Approved: "Disetujui",
  Rejected: "Ditolak",
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export default function Requests() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter aktif pada summary
  const [selectedStatus, setSelectedStatus] = useState("all");

  const loadRequests = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
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
          employee:profiles!surat_requests_employee_id_fkey (
            id,
            nama,
            email,
            jabatan,
            divisi,
            no_hp
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("LOAD REQUESTS ERROR:", error);
        throw error;
      }

      setRequests(data || []);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Gagal",
        error?.message || "Gagal mengambil pengajuan surat."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    const parts = String(date).split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const normalizeStatus = (status) => {
    return String(status || "")
      .trim()
      .toLowerCase();
  };

  const getStatusStyle = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "approved") {
      return styles.approved;
    }

    if (normalized === "rejected") {
      return styles.rejected;
    }

    return styles.pending;
  };

  const getStatusText = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "pending") {
      return "Menunggu";
    }

    if (normalized === "approved") {
      return "Disetujui";
    }

    if (normalized === "rejected") {
      return "Ditolak";
    }

    return (
      STATUS_LABEL[status] ||
      status ||
      "Menunggu"
    );
  };

  // =========================
  // HITUNG DATA SUMMARY
  // =========================

  const allCount = requests.length;

  const pendingCount = useMemo(() => {
    return requests.filter(
      (item) =>
        normalizeStatus(item.status) === "pending"
    ).length;
  }, [requests]);

  const approvedCount = useMemo(() => {
    return requests.filter(
      (item) =>
        normalizeStatus(item.status) === "approved"
    ).length;
  }, [requests]);

  // =========================
  // FILTER DATA
  // =========================

  const filteredRequests = useMemo(() => {
    if (selectedStatus === "all") {
      return requests;
    }

    return requests.filter(
      (item) =>
        normalizeStatus(item.status) === selectedStatus
    );
  }, [requests, selectedStatus]);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loading}
        edges={["top", "bottom"]}
      >
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text style={styles.loadingText}>
          Memuat pengajuan surat...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(
              45,
              insets.bottom + 35
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
            progressViewOffset={8}
          />
        }
      >
        {/* =========================
            HEADER
        ========================= */}

        <View style={styles.header}>
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

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Pengajuan Surat
            </Text>

            <Text style={styles.subtitle}>
              Kelola pengajuan surat dari pegawai.
            </Text>
          </View>
        </View>

        {/* =========================
            SUMMARY
        ========================= */}

        <View style={styles.summaryCard}>
          <Pressable
            style={[
              styles.summaryItem,
              selectedStatus === "all" &&
                styles.summaryItemActive,
            ]}
            onPress={() => setSelectedStatus("all")}
          >
            <View
              style={[
                styles.summaryIcon,
                selectedStatus === "all" &&
                  styles.summaryIconActive,
              ]}
            >
              <Ionicons
                name="documents-outline"
                size={16}
                color={
                  selectedStatus === "all"
                    ? "#FFFFFF"
                    : "#175CD3"
                }
              />
            </View>

            <Text
              style={[
                styles.summaryNumber,
                selectedStatus === "all" &&
                  styles.summaryNumberActive,
              ]}
            >
              {allCount}
            </Text>

            <Text
              style={[
                styles.summaryLabel,
                selectedStatus === "all" &&
                  styles.summaryLabelActive,
              ]}
            >
              Semua
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.summaryItem,
              selectedStatus === "pending" &&
                styles.summaryItemActivePending,
            ]}
            onPress={() => setSelectedStatus("pending")}
          >
            <View
              style={[
                styles.summaryIcon,
                styles.summaryIconPending,
                selectedStatus === "pending" &&
                  styles.summaryIconPendingActive,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={
                  selectedStatus === "pending"
                    ? "#FFFFFF"
                    : "#B54708"
                }
              />
            </View>

            <Text
              style={[
                styles.summaryNumber,
                styles.summaryNumberPending,
                selectedStatus === "pending" &&
                  styles.summaryNumberPendingActive,
              ]}
            >
              {pendingCount}
            </Text>

            <Text
              style={[
                styles.summaryLabel,
                selectedStatus === "pending" &&
                  styles.summaryLabelPendingActive,
              ]}
            >
              Menunggu
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.summaryItem,
              styles.summaryItemLast,
              selectedStatus === "approved" &&
                styles.summaryItemActiveApproved,
            ]}
            onPress={() =>
              setSelectedStatus("approved")
            }
          >
            <View
              style={[
                styles.summaryIcon,
                styles.summaryIconApproved,
                selectedStatus === "approved" &&
                  styles.summaryIconApprovedActive,
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={
                  selectedStatus === "approved"
                    ? "#FFFFFF"
                    : "#027A48"
                }
              />
            </View>

            <Text
              style={[
                styles.summaryNumber,
                styles.summaryNumberApproved,
                selectedStatus === "approved" &&
                  styles.summaryNumberApprovedActive,
              ]}
            >
              {approvedCount}
            </Text>

            <Text
              style={[
                styles.summaryLabel,
                selectedStatus === "approved" &&
                  styles.summaryLabelApprovedActive,
              ]}
            >
              Disetujui
            </Text>
          </Pressable>
        </View>

        {/* =========================
            FILTER INFO
        ========================= */}

        {selectedStatus !== "all" && (
          <View style={styles.filterInfo}>
            <View style={styles.filterInfoLeft}>
              <Ionicons
                name="filter-outline"
                size={15}
                color="#175CD3"
              />

              <Text style={styles.filterInfoText}>
                Menampilkan{" "}
                <Text style={styles.filterInfoBold}>
                  {selectedStatus === "pending"
                    ? "pengajuan menunggu"
                    : "pengajuan disetujui"}
                </Text>
              </Text>
            </View>

            <Pressable
              onPress={() => setSelectedStatus("all")}
              hitSlop={8}
            >
              <Text style={styles.resetFilter}>
                Tampilkan Semua
              </Text>
            </Pressable>
          </View>
        )}

        {/* =========================
            REQUEST LIST
        ========================= */}

        {filteredRequests.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() =>
              router.push(
                `/admin/request/request-detail?id=${item.id}`
              )
            }
          >
            {/* Employee */}

            <View style={styles.employeeHeader}>
              <View style={styles.employeeAvatar}>
                <Text style={styles.employeeAvatarText}>
                  {(item.employee?.nama || "P")
                    .substring(0, 1)
                    .toUpperCase()}
                </Text>
              </View>

              <View style={styles.employeeInfo}>
                <Text style={styles.employee}>
                  {item.employee?.nama || "Pegawai"}
                </Text>

                <Text style={styles.position}>
                  {item.employee?.jabatan ||
                    item.employee?.divisi ||
                    "Pegawai"}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  getStatusStyle(item.status),
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    normalizeStatus(item.status) ===
                      "approved" &&
                      styles.statusDotApproved,
                    normalizeStatus(item.status) ===
                      "rejected" &&
                      styles.statusDotRejected,
                    normalizeStatus(item.status) !==
                      "approved" &&
                      normalizeStatus(item.status) !==
                        "rejected" &&
                      styles.statusDotPending,
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    normalizeStatus(item.status) ===
                      "approved" &&
                      styles.statusTextApproved,
                    normalizeStatus(item.status) ===
                      "rejected" &&
                      styles.statusTextRejected,
                    normalizeStatus(item.status) !==
                      "approved" &&
                      normalizeStatus(item.status) !==
                        "rejected" &&
                      styles.statusTextPending,
                  ]}
                >
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Request Type */}

            <View style={styles.requestTypeRow}>
              <View style={styles.requestTypeIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={17}
                  color="#175CD3"
                />
              </View>

              <Text style={styles.type}>
                {item.type || "Pengajuan Surat"}
              </Text>
            </View>

            <Text style={styles.subject}>
              {item.subject || "Tanpa subjek"}
            </Text>

            {item.description ? (
              <Text
                style={styles.description}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}

            {/* Dates */}

            <View style={styles.dateContainer}>
              <View style={styles.dateItem}>
                <View style={styles.dateIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color="#667085"
                  />
                </View>

                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>
                    Mulai
                  </Text>

                  <Text style={styles.dateValue}>
                    {formatDate(item.start_date)}
                  </Text>
                </View>
              </View>

              <View style={styles.dateItem}>
                <View style={styles.dateIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color="#667085"
                  />
                </View>

                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>
                    Selesai
                  </Text>

                  <Text style={styles.dateValue}>
                    {formatDate(item.end_date)}
                  </Text>
                </View>
              </View>

              <View style={styles.dateItem}>
                <View style={styles.dateIcon}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color="#667085"
                  />
                </View>

                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>
                    Diajukan
                  </Text>

                  <Text style={styles.dateValue}>
                    {formatDate(
                      item.created_at?.substring(0, 10)
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* Detail */}

            <View style={styles.detailButton}>
              <Text style={styles.detailButtonText}>
                Lihat Detail
              </Text>

              <View style={styles.detailIcon}>
                <Ionicons
                  name="arrow-forward-outline"
                  size={16}
                  color="#175CD3"
                />
              </View>
            </View>
          </Pressable>
        ))}

        {/* =========================
            EMPTY
        ========================= */}

        {filteredRequests.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  selectedStatus === "pending"
                    ? "time-outline"
                    : selectedStatus === "approved"
                    ? "checkmark-circle-outline"
                    : "document-text-outline"
                }
                size={28}
                color="#175CD3"
              />
            </View>

            <Text style={styles.emptyTitle}>
              {selectedStatus === "pending"
                ? "Tidak ada pengajuan menunggu"
                : selectedStatus === "approved"
                ? "Belum ada pengajuan disetujui"
                : "Belum ada pengajuan"}
            </Text>

            <Text style={styles.emptyText}>
              {selectedStatus === "pending"
                ? "Pengajuan dengan status menunggu akan muncul di sini."
                : selectedStatus === "approved"
                ? "Pengajuan yang telah disetujui akan muncul di sini."
                : "Pengajuan surat dari pegawai akan muncul di halaman ini."}
            </Text>

            {selectedStatus !== "all" && (
              <Pressable
                style={styles.emptyButton}
                onPress={() =>
                  setSelectedStatus("all")
                }
              >
                <Text style={styles.emptyButtonText}>
                  Tampilkan Semua
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingTop: 16,
    paddingBottom: 45,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
  },

  // =========================
  // HEADER
  // =========================

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 5,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  backButtonPressed: {
    opacity: 0.75,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#101828",
  },

  subtitle: {
    marginTop: 5,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },

  // =========================
  // SUMMARY
  // =========================

  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    overflow: "hidden",

    shadowColor: "#101828",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: "#EAECF0",
  },

  summaryItemLast: {
    borderRightWidth: 0,
  },

  summaryItemActive: {
    backgroundColor: "#EFF4FF",
  },

  summaryItemActivePending: {
    backgroundColor: "#FFFAEB",
  },

  summaryItemActiveApproved: {
    backgroundColor: "#ECFDF3",
  },

  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  summaryIconActive: {
    backgroundColor: "#175CD3",
  },

  summaryIconPending: {
    backgroundColor: "#FFFAEB",
  },

  summaryIconPendingActive: {
    backgroundColor: "#B54708",
  },

  summaryIconApproved: {
    backgroundColor: "#ECFDF3",
  },

  summaryIconApprovedActive: {
    backgroundColor: "#027A48",
  },

  summaryNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: "#175CD3",
  },

  summaryNumberActive: {
    color: "#175CD3",
  },

  summaryNumberPending: {
    color: "#B54708",
  },

  summaryNumberPendingActive: {
    color: "#B54708",
  },

  summaryNumberApproved: {
    color: "#027A48",
  },

  summaryNumberApprovedActive: {
    color: "#027A48",
  },

  summaryLabel: {
    marginTop: 2,
    color: "#667085",
    fontSize: 11,
    fontWeight: "600",
  },

  summaryLabelActive: {
    color: "#175CD3",
    fontWeight: "800",
  },

  summaryLabelPendingActive: {
    color: "#B54708",
    fontWeight: "800",
  },

  summaryLabelApprovedActive: {
    color: "#027A48",
    fontWeight: "800",
  },

  // =========================
  // FILTER INFO
  // =========================

  filterInfo: {
    minHeight: 42,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6E4FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  filterInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  filterInfoText: {
    marginLeft: 7,
    color: "#667085",
    fontSize: 11,
  },

  filterInfoBold: {
    color: "#101828",
    fontWeight: "800",
  },

  resetFilter: {
    color: "#175CD3",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 8,
  },

  // =========================
  // REQUEST CARD
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

  cardPressed: {
    opacity: 0.94,
  },

  // =========================
  // EMPLOYEE
  // =========================

  employeeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  employeeAvatarText: {
    color: "#175CD3",
    fontSize: 19,
    fontWeight: "800",
  },

  employeeInfo: {
    flex: 1,
    paddingRight: 8,
  },

  employee: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
    lineHeight: 22,
  },

  position: {
    marginTop: 4,
    color: "#667085",
    fontSize: 13,
    lineHeight: 18,
  },

  // =========================
  // STATUS
  // =========================

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  pending: {
    backgroundColor: "#FFFAEB",
  },

  approved: {
    backgroundColor: "#ECFDF3",
  },

  rejected: {
    backgroundColor: "#FEF3F2",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusDotPending: {
    backgroundColor: "#DC6803",
  },

  statusDotApproved: {
    backgroundColor: "#039855",
  },

  statusDotRejected: {
    backgroundColor: "#D92D20",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  statusTextPending: {
    color: "#DC6803",
  },

  statusTextApproved: {
    color: "#039855",
  },

  statusTextRejected: {
    color: "#D92D20",
  },

  // =========================
  // DIVIDER
  // =========================

  divider: {
    height: 1,
    backgroundColor: "#F2F4F7",
    marginVertical: 14,
  },

  // =========================
  // REQUEST TYPE
  // =========================

  requestTypeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  requestTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  type: {
    flex: 1,
    color: "#667085",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  subject: {
    marginTop: 10,
    color: "#101828",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
  },

  description: {
    color: "#667085",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },

  // =========================
  // DATE
  // =========================

  dateContainer: {
    flexDirection: "row",
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
  },

  dateItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 6,
  },

  dateIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  dateTextContainer: {
    flex: 1,
  },

  dateLabel: {
    color: "#98A2B3",
    fontSize: 10,
    marginBottom: 3,
    fontWeight: "600",
  },

  dateValue: {
    color: "#344054",
    fontSize: 11,
    fontWeight: "700",
  },

  // =========================
  // DETAIL
  // =========================

  detailButton: {
    minHeight: 40,
    marginTop: 14,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  detailButtonText: {
    color: "#175CD3",
    fontSize: 12,
    fontWeight: "800",
  },

  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  // =========================
  // EMPTY
  // =========================

  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    marginHorizontal: 20,
    marginTop: 4,
    alignItems: "center",
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

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 7,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
  },

  emptyButton: {
    minHeight: 42,
    marginTop: 16,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    color: "#175CD3",
    fontSize: 12,
    fontWeight: "800",
  },
});