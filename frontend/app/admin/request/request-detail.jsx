import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../../services/supabase";

export default function RequestDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const isSmallScreen = width < 380;

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadRequest = async () => {
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
            no_hp,
            status
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      console.log("REQUEST DETAIL:", data);

      setRequest(data);
    } catch (error) {
      console.error("LOAD REQUEST ERROR:", error);

      Alert.alert(
        "Gagal",
        error?.message ||
          "Gagal mengambil data pengajuan."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // NORMALIZE STATUS
  // =========================================================

  const currentStatus = String(
    request?.status || ""
  )
    .trim()
    .toLowerCase();

  const isWaiting = currentStatus === "menunggu";
  const isApproved = currentStatus === "disetujui";
  const isRejected = currentStatus === "ditolak";

  // =========================================================
  // STATUS LABEL
  // =========================================================

  const getStatusLabel = () => {
    if (isWaiting) {
      return "MENUNGGU";
    }

    if (isApproved) {
      return "DISETUJUI";
    }

    if (isRejected) {
      return "DITOLAK";
    }

    return "TIDAK DIKENAL";
  };

  // =========================================================
  // STATUS COLOR
  // =========================================================

  const getStatusStyle = () => {
    if (isApproved) {
      return {
        backgroundColor: "#ECFDF3",
        color: "#027A48",
      };
    }

    if (isRejected) {
      return {
        backgroundColor: "#FEF3F2",
        color: "#D92D20",
      };
    }

    return {
      backgroundColor: "#FFFAEB",
      color: "#B54708",
    };
  };

  const statusStyle = getStatusStyle();

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parts = String(date).split("-");

    if (parts.length !== 3) {
      return String(date);
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // =========================================================
  // DATETIME
  // =========================================================

  const formatDateTime = (date) => {
    if (!date) {
      return "-";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "-";
    }

    return value.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // ADMIN MEMILIH KEPUTUSAN
  // =========================================================

  const handleDecision = (newStatus) => {
    if (!request) {
      return;
    }

    // Hanya pengajuan menunggu yang boleh diproses
    if (!isWaiting) {
      Alert.alert(
        "Tidak Dapat Diproses",
        "Pengajuan ini sudah memiliki keputusan."
      );

      return;
    }

    if (
      newStatus !== "disetujui" &&
      newStatus !== "ditolak"
    ) {
      return;
    }

    const approve = newStatus === "disetujui";

    Alert.alert(
      approve
        ? "Setujui Pengajuan"
        : "Tolak Pengajuan",

      approve
        ? "Apakah kamu yakin ingin menyetujui pengajuan ini?"
        : "Apakah kamu yakin ingin menolak pengajuan ini?",

      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: approve
            ? "Ya, Setujui"
            : "Ya, Tolak",

          style: approve
            ? "default"
            : "destructive",

          onPress: () => {
            updateStatus(newStatus);
          },
        },
      ]
    );
  };

  // =========================================================
  // UPDATE STATUS DATABASE
  // =========================================================

  const updateStatus = async (newStatus) => {
    try {
      setProcessing(true);

      // -----------------------------------------------------
      // CEK USER LOGIN
      // -----------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          "Sesi admin tidak ditemukan."
        );
      }

      // -----------------------------------------------------
      // CEK DATA TERBARU
      // -----------------------------------------------------

      const {
        data: latestRequest,
        error: latestError,
      } = await supabase
        .from("surat_requests")
        .select("id, status")
        .eq("id", request.id)
        .single();

      if (latestError) {
        throw latestError;
      }

      const latestStatus = String(
        latestRequest?.status || ""
      )
        .trim()
        .toLowerCase();

      // -----------------------------------------------------
      // PASTIKAN MASIH MENUNGGU
      // -----------------------------------------------------

      if (latestStatus !== "menunggu") {
        Alert.alert(
          "Sudah Diproses",
          "Pengajuan ini sudah diproses sebelumnya."
        );

        await loadRequest();

        return;
      }

      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------

      const now = new Date().toISOString();

      const updateData = {
        status: newStatus,
        processed_by: user.id,
        processed_at: now,
        updated_at: now,
      };

      console.log(
        "UPDATE SURAT:",
        updateData
      );

      const {
        data: updatedData,
        error: updateError,
      } = await supabase
        .from("surat_requests")
        .update(updateData)
        .eq("id", request.id)
        .eq("status", "menunggu")
        .select(`
          id,
          employee_id,
          type,
          subject,
          description,
          start_date,
          end_date,
          status,
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
            no_hp,
            status
          )
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      if (!updatedData) {
        throw new Error(
          "Pengajuan tidak berhasil diperbarui."
        );
      }

      // -----------------------------------------------------
      // UPDATE TAMPILAN
      // -----------------------------------------------------

      setRequest(updatedData);

      // -----------------------------------------------------
      // HASIL
      // -----------------------------------------------------

      Alert.alert(
        "Berhasil",
        newStatus === "disetujui"
          ? "Pengajuan berhasil disetujui."
          : "Pengajuan berhasil ditolak."
      );
    } catch (error) {
      console.error(
        "UPDATE STATUS ERROR:",
        error
      );

      Alert.alert(
        "Gagal",
        error?.message ||
          "Status pengajuan gagal diperbarui."
      );
    } finally {
      setProcessing(false);
    }
  };

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
          Memuat pengajuan...
        </Text>
      </View>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!request) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          Pengajuan tidak ditemukan
        </Text>

        <Text style={styles.emptyText}>
          Data pengajuan surat tidak tersedia.
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

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        isSmallScreen && styles.contentSmall,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ===================================================
          HEADER
      ==================================================== */}

      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            isSmallScreen && styles.titleSmall,
          ]}
        >
          Detail Pengajuan Surat
        </Text>

        <Text style={styles.subtitle}>
          Periksa data pengajuan sebelum menentukan
          keputusan.
        </Text>
      </View>

      {/* ===================================================
          STATUS
      ==================================================== */}

      <View style={styles.statusCard}>
        <View style={styles.statusContent}>
          <Text style={styles.statusLabel}>
            STATUS PENGAJUAN
          </Text>

          <Text style={styles.statusDescription}>
            {isWaiting
              ? "Pengajuan menunggu keputusan Admin."
              : isApproved
              ? "Pengajuan telah disetujui Admin."
              : isRejected
              ? "Pengajuan telah ditolak Admin."
              : "Status pengajuan tidak dikenali."}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                statusStyle.backgroundColor,
            },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              {
                color: statusStyle.color,
              },
            ]}
          >
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      {/* ===================================================
          DATA PEGAWAI
      ==================================================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Data Pegawai
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Nama
          </Text>

          <Text style={styles.value}>
            {request.employee?.nama || "-"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Email
          </Text>

          <Text style={styles.value}>
            {request.employee?.email || "-"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Jabatan
          </Text>

          <Text style={styles.value}>
            {request.employee?.jabatan || "-"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Divisi
          </Text>

          <Text style={styles.value}>
            {request.employee?.divisi || "-"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            No. HP
          </Text>

          <Text style={styles.value}>
            {request.employee?.no_hp || "-"}
          </Text>
        </View>
      </View>

      {/* ===================================================
          DETAIL PENGAJUAN
      ==================================================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Detail Pengajuan
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Jenis Surat
          </Text>

          <Text style={styles.value}>
            {request.type || "-"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Subjek
          </Text>

          <Text style={styles.value}>
            {request.subject || "-"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Tanggal Mulai
          </Text>

          <Text style={styles.value}>
            {formatDate(request.start_date)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Tanggal Selesai
          </Text>

          <Text style={styles.value}>
            {formatDate(request.end_date)}
          </Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>
            Keterangan
          </Text>

          <View style={styles.descriptionBox}>
            <Text style={styles.description}>
              {request.description ||
                "Tidak ada keterangan."}
            </Text>
          </View>
        </View>
      </View>

      {/* ===================================================
          INFORMASI PENGAJUAN
      ==================================================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Informasi Pengajuan
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Diajukan
          </Text>

          <Text style={styles.value}>
            {formatDateTime(request.created_at)}
          </Text>
        </View>

        {request.processed_at ? (
          <>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.label}>
                Diproses
              </Text>

              <Text style={styles.value}>
                {formatDateTime(
                  request.processed_at
                )}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      {/* ===================================================
          KONTROL ADMIN
      ==================================================== */}

      {isWaiting ? (
        <View style={styles.controlCard}>
          <Text style={styles.controlTitle}>
            Keputusan Admin
          </Text>

          <Text style={styles.controlDescription}>
            Pilih keputusan untuk pengajuan ini.
            Status akan berubah setelah keputusan
            dikonfirmasi.
          </Text>

          {/* SETUJUI */}

          <Pressable
            disabled={processing}
            onPress={() =>
              handleDecision("disetujui")
            }
            style={({ pressed }) => [
              styles.approveButton,
              pressed &&
                !processing &&
                styles.pressedApprove,
              processing &&
                styles.disabledButton,
            ]}
          >
            {processing ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text style={styles.approveText}>
                ✓  Setujui Pengajuan
              </Text>
            )}
          </Pressable>

          {/* TOLAK */}

          <Pressable
            disabled={processing}
            onPress={() =>
              handleDecision("ditolak")
            }
            style={({ pressed }) => [
              styles.rejectButton,
              pressed &&
                !processing &&
                styles.pressedReject,
              processing &&
                styles.disabledButton,
            ]}
          >
            <Text style={styles.rejectText}>
              ✕  Tolak Pengajuan
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* ===================================================
          HASIL DISETUJUI
      ==================================================== */}

      {isApproved ? (
        <View style={styles.approvedBox}>
          <Text style={styles.approvedTitle}>
            ✓ Pengajuan Disetujui
          </Text>

          <Text style={styles.resultText}>
            Pengajuan ini telah disetujui oleh Admin.
          </Text>
        </View>
      ) : null}

      {/* ===================================================
          HASIL DITOLAK
      ==================================================== */}

      {isRejected ? (
        <View style={styles.rejectedBox}>
          <Text style={styles.rejectedTitle}>
            ✕ Pengajuan Ditolak
          </Text>

          <Text style={styles.resultText}>
            Pengajuan ini telah ditolak oleh Admin.
          </Text>
        </View>
      ) : null}

      {/* ===================================================
          KEMBALI
      ==================================================== */}

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={processing}
      >
        <Text style={styles.backText}>
          Kembali
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// =============================================================
// STYLE
// =============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  contentSmall: {
    paddingHorizontal: 15,
    paddingTop: 16,
  },

  // HEADER
  header: {
    marginBottom: 16,
  },

  title: {
    color: "#101828",
    fontSize: 26,
    fontWeight: "900",
  },

  titleSmall: {
    fontSize: 23,
  },

  subtitle: {
    marginTop: 5,
    color: "#667085",
    fontSize: 13,
    lineHeight: 19,
  },

  // STATUS
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },

  statusContent: {
    flex: 1,
    paddingRight: 10,
  },

  statusLabel: {
    color: "#98A2B3",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  statusDescription: {
    marginTop: 5,
    color: "#101828",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },

  // CARD
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 8,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 7,
  },

  label: {
    width: 105,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
  },

  value: {
    flex: 1,
    color: "#101828",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: "#F2F4F7",
  },

  // DESCRIPTION
  descriptionContainer: {
    paddingTop: 10,
  },

  descriptionLabel: {
    color: "#667085",
    fontSize: 12,
    marginBottom: 7,
  },

  descriptionBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F2F4F7",
    borderRadius: 10,
    padding: 12,
  },

  description: {
    color: "#344054",
    fontSize: 13,
    lineHeight: 19,
  },

  // CONTROL
  controlCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },

  controlTitle: {
    color: "#101828",
    fontSize: 16,
    fontWeight: "900",
  },

  controlDescription: {
    marginTop: 5,
    marginBottom: 16,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
  },

  approveButton: {
    minHeight: 52,
    backgroundColor: "#027A48",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },

  approveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  rejectButton: {
    minHeight: 52,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D92D20",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },

  rejectText: {
    color: "#D92D20",
    fontSize: 14,
    fontWeight: "800",
  },

  pressedApprove: {
    opacity: 0.85,
  },

  pressedReject: {
    backgroundColor: "#FEF3F2",
  },

  disabledButton: {
    opacity: 0.55,
  },

  // RESULT
  approvedBox: {
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#ABEFC6",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
  },

  approvedTitle: {
    color: "#027A48",
    fontSize: 14,
    fontWeight: "900",
  },

  rejectedBox: {
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FECDCA",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
  },

  rejectedTitle: {
    color: "#D92D20",
    fontSize: 14,
    fontWeight: "900",
  },

  resultText: {
    marginTop: 5,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
  },

  // BACK
  backButton: {
    paddingVertical: 15,
    alignItems: "center",
  },

  backText: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "700",
  },

  // LOADING
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
  },

  // EMPTY
  emptyContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    color: "#101828",
    fontSize: 17,
    fontWeight: "800",
  },

  emptyText: {
    marginTop: 6,
    color: "#667085",
    fontSize: 13,
  },
});