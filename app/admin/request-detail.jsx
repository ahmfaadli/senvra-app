import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { supabase } from "../../lib/supabase";

export default function RequestDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

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
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      setRequest(data);
      setAdminNote(data.admin_note || "");
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

  const formatDate = (date) => {
    if (!date) return "-";

    const parts = String(date).split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  /**
   * Membuat notifikasi untuk pegawai.
   *
   * BAGIAN INI menggunakan struktur notifications:
   *
   * employee_id
   * title
   * message
   * type
   * is_read
   *
   * Jika kolom notifications kamu berbeda,
   * kirim struktur tabelnya dan bagian ini
   * tinggal disesuaikan.
   */
  const createNotification = async (
    status,
    employeeId,
    subject,
    note
  ) => {
    const isApproved =
      status === "Approved";

    const title = isApproved
      ? "Pengajuan Surat Disetujui"
      : "Pengajuan Surat Ditolak";

    const message = isApproved
      ? `Pengajuan surat "${subject}" telah disetujui oleh admin.${
          note ? ` Catatan: ${note}` : ""
        }`
      : `Pengajuan surat "${subject}" ditolak oleh admin.${
          note ? ` Alasan: ${note}` : ""
        }`;

    const { error } = await supabase
      .from("notifications")
      .insert({
        employee_id: employeeId,
        title,
        message,
        type: "surat",
        is_read: false,
      });

    if (error) {
      console.error(
        "CREATE NOTIFICATION ERROR:",
        error
      );

      throw error;
    }
  };

  const processRequest = async (newStatus) => {
    if (!request) {
      return;
    }

    if (
      newStatus === "Rejected" &&
      !adminNote.trim()
    ) {
      Alert.alert(
        "Catatan diperlukan",
        "Masukkan alasan penolakan terlebih dahulu."
      );

      return;
    }

    const isApproved =
      newStatus === "Approved";

    Alert.alert(
      isApproved
        ? "Terima Pengajuan"
        : "Tolak Pengajuan",

      isApproved
        ? "Apakah kamu yakin ingin menerima pengajuan surat ini?"
        : "Apakah kamu yakin ingin menolak pengajuan surat ini?",

      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: isApproved
            ? "Terima"
            : "Tolak",

          style: isApproved
            ? "default"
            : "destructive",

          onPress: async () => {
            try {
              setProcessing(true);

              /*
               * Ambil admin yang sedang login
               */
              const {
                data: { user },
                error: authError,
              } = await supabase.auth.getUser();

              if (authError) {
                throw authError;
              }

              if (!user) {
                Alert.alert(
                  "Error",
                  "Sesi admin tidak ditemukan."
                );

                return;
              }

              /*
               * 1. UPDATE SURAT REQUEST
               */
              const updateData = {
                status: newStatus,
                admin_note:
                  adminNote.trim() || null,
                processed_by: user.id,
                processed_at:
                  new Date().toISOString(),
                updated_at:
                  new Date().toISOString(),
              };

              const { data, error } =
                await supabase
                  .from("surat_requests")
                  .update(updateData)
                  .eq("id", request.id)
                  .select()
                  .single();

              if (error) {
                throw error;
              }

              /*
               * 2. BUAT NOTIFIKASI PEGAWAI
               */
              await createNotification(
                newStatus,
                request.employee_id,
                request.subject ||
                  request.type ||
                  "Pengajuan Surat",
                adminNote.trim()
              );

              /*
               * 3. UPDATE UI
               */
              setRequest((current) => ({
                ...current,
                ...data,
              }));

              Alert.alert(
                "Berhasil",
                isApproved
                  ? "Pengajuan diterima dan pemberitahuan telah dikirim ke pegawai."
                  : "Pengajuan ditolak dan pemberitahuan telah dikirim ke pegawai."
              );
            } catch (error) {
              console.error(
                "PROCESS REQUEST ERROR:",
                error
              );

              Alert.alert(
                "Gagal",
                error?.message ||
                  "Pengajuan gagal diproses."
              );
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
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
          Memuat pengajuan...
        </Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.loading}>
        <Text style={styles.notFound}>
          Pengajuan tidak ditemukan.
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

  const currentStatus = String(
    request.status || ""
  ).toLowerCase();

  const isPending =
    currentStatus === "pending";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          Detail Pengajuan Surat
        </Text>

        <Text style={styles.subtitle}>
          Periksa pengajuan sebelum memberikan keputusan.
        </Text>

        {/* DATA PEGAWAI */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Data Pegawai
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Nama
            </Text>

            <Text style={styles.value}>
              {request.employee?.nama ||
                "Pegawai"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Email
            </Text>

            <Text style={styles.value}>
              {request.employee?.email ||
                "-"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Jabatan
            </Text>

            <Text style={styles.value}>
              {request.employee?.jabatan ||
                "-"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Divisi
            </Text>

            <Text style={styles.value}>
              {request.employee?.divisi ||
                "-"}
            </Text>
          </View>
        </View>

        {/* DETAIL PENGAJUAN */}

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

          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Subjek
            </Text>

            <Text style={styles.value}>
              {request.subject || "-"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Tanggal
            </Text>

            <Text style={styles.value}>
              {formatDate(request.start_date)}
              {request.end_date
                ? ` s/d ${formatDate(
                    request.end_date
                  )}`
                : ""}
            </Text>
          </View>

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

        {/* STATUS */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Status Pengajuan
          </Text>

          <View
            style={[
              styles.statusBadge,
              currentStatus === "pending" &&
                styles.statusPending,
              currentStatus === "approved" &&
                styles.statusApproved,
              currentStatus === "rejected" &&
                styles.statusRejected,
            ]}
          >
            <Text style={styles.statusText}>
              {currentStatus === "approved"
                ? "DITERIMA"
                : currentStatus ===
                    "rejected"
                  ? "DITOLAK"
                  : "MENUNGGU"}
            </Text>
          </View>
        </View>

        {/* CATATAN ADMIN */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Catatan Admin
          </Text>

          <TextInput
            value={adminNote}
            onChangeText={setAdminNote}
            editable={isPending}
            multiline
            textAlignVertical="top"
            placeholder={
              isPending
                ? "Tambahkan catatan..."
                : "Tidak dapat diubah"
            }
            placeholderTextColor="#98A2B3"
            style={[
              styles.input,
              !isPending &&
                styles.inputDisabled,
            ]}
          />
        </View>

        {/* TOMBOL */}

        {isPending && (
          <View style={styles.actions}>
            <Pressable
              style={[
                styles.acceptButton,
                processing &&
                  styles.disabledButton,
              ]}
              onPress={() =>
                processRequest("Approved")
              }
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={styles.acceptText}
                >
                  ✓ Terima Pengajuan
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.rejectButton,
                processing &&
                  styles.disabledButton,
              ]}
              onPress={() =>
                processRequest("Rejected")
              }
              disabled={processing}
            >
              <Text style={styles.rejectText}>
                ✕ Tolak Pengajuan
              </Text>
            </Pressable>
          </View>
        )}

        {!isPending && (
          <View style={styles.processedBox}>
            <Text style={styles.processedTitle}>
              Pengajuan Sudah Diproses
            </Text>

            <Text style={styles.processedText}>
              {currentStatus === "approved"
                ? "Pengajuan telah diterima dan pegawai telah mendapatkan pemberitahuan."
                : "Pengajuan telah ditolak dan pegawai telah mendapatkan pemberitahuan."}
            </Text>

            {request.admin_note ? (
              <Text style={styles.noteText}>
                Catatan: {request.admin_note}
              </Text>
            ) : null}
          </View>
        )}

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
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
  },

  notFound: {
    fontSize: 16,
    fontWeight: "700",
    color: "#101828",
  },

  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#101828",
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 18,
    color: "#667085",
    fontSize: 13,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EAECF0",
    padding: 16,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#101828",
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: "row",
    paddingVertical: 7,
  },

  label: {
    width: 110,
    color: "#667085",
    fontSize: 12,
  },

  value: {
    flex: 1,
    color: "#101828",
    fontSize: 12,
    fontWeight: "700",
  },

  descriptionLabel: {
    marginTop: 8,
    marginBottom: 6,
    color: "#667085",
    fontSize: 12,
  },

  descriptionBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
  },

  description: {
    color: "#344054",
    fontSize: 13,
    lineHeight: 19,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
  },

  statusPending: {
    backgroundColor: "#FEF0C7",
  },

  statusApproved: {
    backgroundColor: "#ECFDF3",
  },

  statusRejected: {
    backgroundColor: "#FEF3F2",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#344054",
  },

  input: {
    minHeight: 110,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    padding: 12,
    color: "#101828",
    fontSize: 13,
  },

  inputDisabled: {
    backgroundColor: "#F2F4F7",
    color: "#667085",
  },

  actions: {
    gap: 10,
  },

  acceptButton: {
    backgroundColor: "#027A48",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },

  acceptText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  rejectButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D92D20",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },

  rejectText: {
    color: "#D92D20",
    fontSize: 14,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.6,
  },

  processedBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 12,
    padding: 15,
  },

  processedTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#101828",
  },

  processedText: {
    marginTop: 6,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
  },

  noteText: {
    marginTop: 10,
    color: "#344054",
    fontSize: 12,
  },

  backButton: {
    paddingVertical: 15,
    alignItems: "center",
  },

  backText: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "700",
  },
});