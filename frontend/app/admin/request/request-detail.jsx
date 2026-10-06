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
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
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
        error?.message || "Gagal mengambil data pengajuan."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // NORMALIZE STATUS
  // =========================================================

  const currentStatus = String(request?.status || "")
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

    if (newStatus !== "disetujui" && newStatus !== "ditolak") {
      return;
    }

    const approve = newStatus === "disetujui";

    Alert.alert(
      approve ? "Setujui Pengajuan" : "Tolak Pengajuan",
      approve
        ? "Apakah kamu yakin ingin menyetujui pengajuan ini?"
        : "Apakah kamu yakin ingin menolak pengajuan ini?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: approve ? "Ya, Setujui" : "Ya, Tolak",
          style: approve ? "default" : "destructive",
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
        throw new Error("Sesi admin tidak ditemukan.");
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

      const latestStatus = String(latestRequest?.status || "")
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

      console.log("UPDATE SURAT:", updateData);

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
      console.error("UPDATE STATUS ERROR:", error);

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
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#175CD3"
          />

          <Text style={styles.loadingText}>
            Memuat pengajuan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!request) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="document-text-outline"
              size={30}
              color="#175CD3"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Pengajuan tidak ditemukan
          </Text>

          <Text style={styles.emptyText}>
            Data pengajuan surat tidak tersedia.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            isSmallScreen && styles.contentSmall,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerBackButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.back()}
                disabled={processing}
              >
                <Ionicons
                  name="arrow-back"
                  size={21}
                  color="#101828"
                />
              </Pressable>

              <View style={styles.headerTextContainer}>
                <Text
                  style={[
                    styles.headerTitle,
                    isSmallScreen && styles.headerTitleSmall,
                  ]}
                  numberOfLines={2}
                >
                  Detail Pengajuan
                </Text>

                <Text style={styles.headerSubtitle}>
                  Informasi pengajuan surat pegawai
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              STATUS
          ================================================= */}

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={17}
                  color="#175CD3"
                />
              </View>

              <Text style={styles.sectionTitle}>
                STATUS PENGAJUAN
              </Text>
            </View>

            <View style={styles.statusContent}>
              <Text style={styles.statusDescription}>
                {isWaiting
                  ? "Pengajuan menunggu keputusan Admin."
                  : isApproved
                  ? "Pengajuan telah disetujui Admin."
                  : isRejected
                  ? "Pengajuan telah ditolak Admin."
                  : "Status pengajuan tidak dikenali."}
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      statusStyle.backgroundColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: statusStyle.color,
                    },
                  ]}
                />

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
          </View>

          {/* =================================================
              DATA PEGAWAI
          ================================================= */}

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
                DATA PEGAWAI
              </Text>
            </View>

            <View style={styles.employeeHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(request.employee?.nama || "P")
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>

              <View style={styles.employeeInfo}>
                <Text
                  style={styles.employeeName}
                  numberOfLines={2}
                >
                  {request.employee?.nama || "-"}
                </Text>

                <Text style={styles.employeeRole}>
                  {request.employee?.jabatan ||
                    request.employee?.divisi ||
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
                {request.employee?.email || "-"}
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
                {request.employee?.jabatan || "-"}
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
                {request.employee?.divisi || "-"}
              </Text>
            </View>

            {/* NO HP */}

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="call-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  No. HP
                </Text>
              </View>

              <Text style={styles.infoValue}>
                {request.employee?.no_hp || "-"}
              </Text>
            </View>
          </View>

          {/* =================================================
              DETAIL PENGAJUAN
          ================================================= */}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={17}
                  color="#175CD3"
                />
              </View>

              <Text style={styles.sectionTitle}>
                DETAIL PENGAJUAN
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="mail-open-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Jenis Surat
                </Text>
              </View>

              <Text style={styles.infoValue}>
                {request.type || "-"}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="text-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Subjek
                </Text>
              </View>

              <Text style={styles.infoValue}>
                {request.subject || "-"}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Tanggal Mulai
                </Text>
              </View>

              <Text style={styles.infoValue}>
                {formatDate(request.start_date)}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Tanggal Selesai
                </Text>
              </View>

              <Text style={styles.infoValue}>
                {formatDate(request.end_date)}
              </Text>
            </View>

            <View style={styles.descriptionContainer}>
              <View style={styles.descriptionHeader}>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.descriptionLabel}>
                  Keterangan
                </Text>
              </View>

              <View style={styles.descriptionBox}>
                <Text style={styles.description}>
                  {request.description ||
                    "Tidak ada keterangan."}
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              INFORMASI PENGAJUAN
          ================================================= */}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={17}
                  color="#175CD3"
                />
              </View>

              <Text style={styles.sectionTitle}>
                INFORMASI PENGAJUAN
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="time-outline"
                  size={15}
                  color="#667085"
                />

                <Text style={styles.infoLabel}>
                  Diajukan
                </Text>
              </View>

              <Text style={styles.infoValue}>
                {formatDateTime(request.created_at)}
              </Text>
            </View>

            {request.processed_at ? (
              <>
                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoLabelRow}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={15}
                      color="#667085"
                    />

                    <Text style={styles.infoLabel}>
                      Diproses
                    </Text>
                  </View>

                  <Text style={styles.infoValue}>
                    {formatDateTime(request.processed_at)}
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {/* =================================================
              KONTROL ADMIN
          ================================================= */}

          {isWaiting ? (
            <View style={styles.controlCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name="options-outline"
                    size={17}
                    color="#175CD3"
                  />
                </View>

                <Text style={styles.sectionTitle}>
                  KEPUTUSAN ADMIN
                </Text>
              </View>

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
                  processing && styles.disabledButton,
                ]}
              >
                {processing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#FFFFFF"
                    />

                    <Text style={styles.approveText}>
                      Setujui Pengajuan
                    </Text>
                  </>
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
                  processing && styles.disabledButton,
                ]}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color="#D92D20"
                />

                <Text style={styles.rejectText}>
                  Tolak Pengajuan
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* =================================================
              HASIL DISETUJUI
          ================================================= */}

          {isApproved ? (
            <View style={styles.approvedBox}>
              <View style={styles.resultHeader}>
                <View style={styles.resultIconApproved}>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color="#039855"
                  />
                </View>

                <Text style={styles.approvedTitle}>
                  Pengajuan Disetujui
                </Text>
              </View>

              <Text style={styles.resultText}>
                Pengajuan ini telah disetujui oleh Admin.
              </Text>
            </View>
          ) : null}

          {/* =================================================
              HASIL DITOLAK
          ================================================= */}

          {isRejected ? (
            <View style={styles.rejectedBox}>
              <View style={styles.resultHeader}>
                <View style={styles.resultIconRejected}>
                  <Ionicons
                    name="close"
                    size={18}
                    color="#D92D20"
                  />
                </View>

                <Text style={styles.rejectedTitle}>
                  Pengajuan Ditolak
                </Text>
              </View>

              <Text style={styles.resultText}>
                Pengajuan ini telah ditolak oleh Admin.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// =============================================================
// STYLE
// =============================================================

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

  content: {
    paddingBottom: 45,
  },

  contentSmall: {
    paddingBottom: 35,
  },

  // ===========================================================
  // HEADER
  // ===========================================================

  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 5,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  headerBackButton: {
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

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#101828",
  },

  headerTitleSmall: {
    fontSize: 24,
    lineHeight: 30,
  },

  headerSubtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },

  // ===========================================================
  // STATUS
  // ===========================================================

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
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

  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusContent: {
    marginTop: 14,
  },

  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  statusLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#667085",
    letterSpacing: 0.5,
  },

  statusDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#344054",
    fontWeight: "600",
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 6,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  // ===========================================================
  // CARD
  // ===========================================================

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

  // ===========================================================
  // EMPLOYEE
  // ===========================================================

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

  employeeInfo: {
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

  // ===========================================================
  // INFORMATION
  // ===========================================================

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
    lineHeight: 19,
  },

  // ===========================================================
  // DESCRIPTION
  // ===========================================================

  descriptionContainer: {
    marginTop: 12,
  },

  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  descriptionLabel: {
    marginLeft: 6,
    color: "#667085",
    fontSize: 12,
    fontWeight: "600",
  },

  descriptionBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 10,
    padding: 12,
  },

  description: {
    color: "#344054",
    fontSize: 13,
    lineHeight: 20,
  },

  // ===========================================================
  // CONTROL
  // ===========================================================

  controlCard: {
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

  controlDescription: {
    marginTop: 9,
    marginBottom: 16,
    color: "#667085",
    fontSize: 12,
    lineHeight: 19,
  },

  approveButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#039855",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  approveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  rejectButton: {
    minHeight: 46,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FECDCA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  rejectText: {
    color: "#D92D20",
    fontSize: 13,
    fontWeight: "800",
  },

  pressedApprove: {
    opacity: 0.7,
  },

  pressedReject: {
    opacity: 0.7,
  },

  disabledButton: {
    opacity: 0.55,
  },

  // ===========================================================
  // RESULT
  // ===========================================================

  approvedBox: {
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#ABEFC6",
    borderRadius: 14,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 12,
  },

  rejectedBox: {
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FECDCA",
    borderRadius: 14,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 12,
  },

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  resultIconApproved: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#D1FADF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  resultIconRejected: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#FEE4E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  approvedTitle: {
    color: "#027A48",
    fontSize: 14,
    fontWeight: "900",
  },

  rejectedTitle: {
    color: "#D92D20",
    fontSize: 14,
    fontWeight: "900",
  },

  resultText: {
    marginTop: 8,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
  },

  // ===========================================================
  // LOADING
  // ===========================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
  },

  // ===========================================================
  // EMPTY
  // ===========================================================

  emptyContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
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
    color: "#101828",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 6,
    color: "#667085",
    fontSize: 13,
    textAlign: "center",
  },

  emptyBackButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  emptyBackText: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "800",
  },
});