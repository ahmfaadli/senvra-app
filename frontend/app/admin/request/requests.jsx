import React, { useCallback, useState } from "react";
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
  useFocusEffect,
  useRouter,
} from "expo-router";
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

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        console.error(
          "LOAD REQUESTS ERROR:",
          error
        );

        throw error;
      }

      setRequests(data || []);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Gagal",
        error?.message ||
          "Gagal mengambil pengajuan surat."
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

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parts = String(date).split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const getStatusStyle = (status) => {
    const normalized = String(
      status || ""
    ).toLowerCase();

    if (normalized === "approved") {
      return styles.approved;
    }

    if (normalized === "rejected") {
      return styles.rejected;
    }

    return styles.pending;
  };

  const getStatusText = (status) => {
    return (
      STATUS_LABEL[status] ||
      STATUS_LABEL[String(status || "Pending")] ||
      status ||
      "Pending"
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text style={styles.loadingText}>
          Memuat pengajuan surat...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <Text style={styles.title}>
        Pengajuan Surat
      </Text>

      <Text style={styles.subtitle}>
        Kelola pengajuan surat dari pegawai.
      </Text>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {requests.length}
          </Text>

          <Text style={styles.summaryLabel}>
            Semua
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text
            style={[
              styles.summaryNumber,
              { color: "#B54708" },
            ]}
          >
            {
              requests.filter(
                (item) =>
                  String(item.status).toLowerCase() ===
                  "pending"
              ).length
            }
          </Text>

          <Text style={styles.summaryLabel}>
            Menunggu
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text
            style={[
              styles.summaryNumber,
              { color: "#027A48" },
            ]}
          >
            {
              requests.filter(
                (item) =>
                  String(item.status).toLowerCase() ===
                  "approved"
              ).length
            }
          </Text>

          <Text style={styles.summaryLabel}>
            Disetujui
          </Text>
        </View>
      </View>

      {requests.map((item) => (
        <Pressable
          key={item.id}
          style={styles.card}
          onPress={() =>
            router.push(
              `/admin/request-detail?id=${item.id}`
            )
          }
        >
          <View style={styles.topRow}>
            <View style={styles.info}>
              <Text style={styles.employee}>
                {item.employee?.nama ||
                  "Pegawai"}
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
              <Text style={styles.statusText}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.type}>
            {item.type || "Pengajuan Surat"}
          </Text>

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

          <View style={styles.dateContainer}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>
                Mulai
              </Text>

              <Text style={styles.dateValue}>
                {formatDate(item.start_date)}
              </Text>
            </View>

            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>
                Selesai
              </Text>

              <Text style={styles.dateValue}>
                {formatDate(item.end_date)}
              </Text>
            </View>

            <View style={styles.dateItem}>
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

          <View style={styles.detailButton}>
            <Text style={styles.detailButtonText}>
              Lihat Detail →
            </Text>
          </View>
        </Pressable>
      ))}

      {requests.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Belum ada pengajuan
          </Text>

          <Text style={styles.emptyText}>
            Pengajuan surat dari pegawai akan muncul
            di halaman ini.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    padding: 20,
    paddingBottom: 100,
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
  },

  summary: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EAECF0",
    marginBottom: 16,
    paddingVertical: 15,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#EAECF0",
  },

  summaryNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: "#175CD3",
  },

  summaryLabel: {
    marginTop: 3,
    color: "#667085",
    fontSize: 11,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  info: {
    flex: 1,
    paddingRight: 10,
  },

  employee: {
    fontSize: 16,
    fontWeight: "900",
    color: "#101828",
  },

  position: {
    marginTop: 3,
    color: "#667085",
    fontSize: 12,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  pending: {
    backgroundColor: "#FEF0C7",
  },

  approved: {
    backgroundColor: "#ECFDF3",
  },

  rejected: {
    backgroundColor: "#FEF3F2",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#344054",
  },

  divider: {
    height: 1,
    backgroundColor: "#EAECF0",
    marginVertical: 13,
  },

  type: {
    color: "#175CD3",
    fontSize: 12,
    fontWeight: "800",
  },

  subject: {
    marginTop: 4,
    color: "#101828",
    fontSize: 15,
    fontWeight: "800",
  },

  description: {
    color: "#667085",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },

  dateContainer: {
    flexDirection: "row",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
  },

  dateItem: {
    flex: 1,
  },

  dateLabel: {
    color: "#98A2B3",
    fontSize: 10,
    marginBottom: 3,
  },

  dateValue: {
    color: "#344054",
    fontSize: 11,
    fontWeight: "700",
  },

  detailButton: {
    marginTop: 14,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
  },

  detailButtonText: {
    color: "#175CD3",
    fontSize: 12,
    fontWeight: "800",
  },

  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAECF0",
    marginTop: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 7,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
  },
});