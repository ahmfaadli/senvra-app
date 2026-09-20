import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { StatusBadge } from "../components/UI";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function Surat() {
  const { user, session, profile } = useAuth();

  const [type, setType] = useState("");
  const [reason, setReason] = useState("");
  const [submissions, setSubmissions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // ==========================================
  // AMBIL USER ID
  // ==========================================
  const getUserId = () => {
    return (
      user?.id ||
      session?.user?.id ||
      profile?.id ||
      null
    );
  };

  // ==========================================
  // FORMAT STATUS DATABASE
  // ==========================================
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

  // ==========================================
  // AMBIL RIWAYAT PENGAJUAN
  // ==========================================
  useEffect(() => {
    loadSubmissions();
  }, [user, session, profile]);

  const loadSubmissions = async () => {
    try {
      setLoadingData(true);

      // Ambil user yang benar-benar sedang login
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log("Get user error:", userError);

        setSubmissions([]);
        return;
      }

      if (!currentUser) {
        setSubmissions([]);
        return;
      }

      const userId = currentUser.id;

      // Ambil pengajuan milik user
      const { data, error } = await supabase
        .from("surat_requests")
        .select("*")
        .eq("employee_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.log("Load surat error:", error);

        Alert.alert(
          "Gagal memuat data",
          error.message || "Riwayat pengajuan tidak dapat dimuat."
        );

        return;
      }

      setSubmissions(data || []);
    } catch (error) {
      console.log("Load submissions error:", error);

      Alert.alert(
        "Gagal",
        "Terjadi kesalahan saat mengambil riwayat pengajuan."
      );
    } finally {
      setLoadingData(false);
    }
  };

  // ==========================================
  // KIRIM PENGAJUAN
  // ==========================================
  const submit = async () => {
    // Validasi jenis surat
    if (!type) {
      Alert.alert(
        "Form belum lengkap",
        "Silakan pilih jenis surat terlebih dahulu."
      );

      return;
    }

    // Validasi alasan
    if (!reason.trim()) {
      Alert.alert(
        "Form belum lengkap",
        "Silakan isi alasan atau keterangan pengajuan."
      );

      return;
    }

    try {
      setLoading(true);

      // ==========================================
      // AMBIL USER YANG BENAR-BENAR LOGIN
      // ==========================================
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log("Get current user error:", userError);

        Alert.alert(
          "Sesi bermasalah",
          "Tidak dapat mengambil data akun. Silakan login kembali."
        );

        return;
      }

      if (!currentUser) {
        Alert.alert(
          "Sesi tidak ditemukan",
          "Silakan login kembali."
        );

        return;
      }

      const userId = currentUser.id;

      console.log("User ID:", userId);
      console.log("Jenis surat:", type);

      // ==========================================
      // SIMPAN KE DATABASE
      // ==========================================
      const { data, error } = await supabase
        .from("surat_requests")
        .insert({
          employee_id: userId,
          type: type,
          description: reason.trim(),
          status: "menunggu",
        })
        .select()
        .single();

      // ==========================================
      // HANDLE ERROR
      // ==========================================
      if (error) {
        console.log("Submit surat error:", error);

        Alert.alert(
          "Gagal mengirim",
          error.message || "Pengajuan surat gagal dikirim."
        );

        return;
      }

      console.log("Pengajuan berhasil:", data);

      // ==========================================
      // TAMBAHKAN DATA KE RIWAYAT
      // ==========================================
      setSubmissions((prev) => [data, ...prev]);

      // ==========================================
      // RESET FORM
      // ==========================================
      setType("");
      setReason("");

      // ==========================================
      // NOTIFIKASI BERHASIL
      // ==========================================
      Alert.alert(
        "Berhasil",
        "Pengajuan surat berhasil dikirim dan sedang menunggu proses."
      );
    } catch (error) {
      console.log("Submit error:", error);

      Alert.alert(
        "Gagal",
        "Terjadi kesalahan saat mengirim pengajuan."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FORMAT TANGGAL
  // ==========================================
  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ==========================================
          HEADER
      ========================================== */}

      <Text style={styles.title}>
        Pengajuan Surat
      </Text>

      <Text style={styles.subtitle}>
        Ajukan kebutuhan administrasi melalui aplikasi.
      </Text>

      {/* ==========================================
          JENIS SURAT
      ========================================== */}

      <Text style={styles.label}>
        Jenis Surat
      </Text>

      <View style={styles.types}>
        {[
          "Surat Izin",
          "Surat Keterangan",
          "Surat Cuti",
        ].map((item) => {
          const isActive = type === item;

          return (
            <Pressable
              key={item}
              style={[
                styles.typeButton,
                isActive && styles.typeButtonActive,
              ]}
              onPress={() => setType(item)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.typeText,
                  isActive && styles.typeTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ==========================================
          ALASAN / KETERANGAN
      ========================================== */}

      <Text style={styles.label}>
        Alasan / Keterangan
      </Text>

      <TextInput
        style={styles.textarea}
        placeholder="Masukkan keterangan..."
        placeholderTextColor="#98A2B3"
        value={reason}
        onChangeText={setReason}
        multiline
        textAlignVertical="top"
        editable={!loading}
      />

      {/* ==========================================
          BUTTON KIRIM
      ========================================== */}

      <Pressable
        style={[
          styles.button,
          loading && styles.buttonDisabled,
        ]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator
              color="#FFFFFF"
              size="small"
            />

            <Text style={styles.buttonLoadingText}>
              Mengirim...
            </Text>
          </>
        ) : (
          <Text style={styles.buttonText}>
            Kirim Pengajuan
          </Text>
        )}
      </Pressable>

      {/* ==========================================
          RIWAYAT PENGAJUAN
      ========================================== */}

      <Text style={styles.sectionTitle}>
        Riwayat Pengajuan
      </Text>

      {loadingData ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator
            size="small"
            color="#175CD3"
          />

          <Text style={styles.loadingText}>
            Memuat pengajuan...
          </Text>
        </View>
      ) : submissions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>
            Belum ada pengajuan
          </Text>

          <Text style={styles.emptyText}>
            Pengajuan surat yang kamu kirim akan muncul
            di sini.
          </Text>
        </View>
      ) : (
        submissions.map((item) => (
          <View
            key={item.id}
            style={styles.statusBox}
          >
            {/* HEADER RIWAYAT */}

            <View style={styles.statusHeader}>
              <View style={styles.statusInfo}>
                {/* Database: type */}
                <Text style={styles.statusTitle}>
                  {item.type || "-"}
                </Text>

                {/* Database: created_at */}
                <Text style={styles.date}>
                  {formatDate(item.created_at)}
                </Text>
              </View>

              {/* Database:
                  menunggu
                  diproses
                  disetujui
                  ditolak
              */}

              <StatusBadge
                status={formatStatus(item.status)}
              />
            </View>

            {/* DESCRIPTION */}

            <Text style={styles.reason}>
              {item.description || "-"}
            </Text>

            {/* CATATAN ADMIN */}

            {item.admin_note ? (
              <View style={styles.adminNoteBox}>
                <Text style={styles.adminNoteLabel}>
                  Catatan Admin
                </Text>

                <Text style={styles.adminNoteText}>
                  {item.admin_note}
                </Text>
              </View>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ======================================================
// STYLE
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  // HEADER
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#101828",
  },

  subtitle: {
    color: "#667085",
    marginTop: 5,
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 21,
  },

  // LABEL
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#344054",
    marginBottom: 9,
    marginTop: 15,
  },

  // JENIS SURAT
  types: {
    gap: 9,
  },

  typeButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    padding: 14,
    borderRadius: 12,
  },

  typeButtonActive: {
    borderColor: "#175CD3",
    backgroundColor: "#EAF2FF",
  },

  typeText: {
    color: "#344054",
    fontWeight: "600",
  },

  typeTextActive: {
    color: "#175CD3",
    fontWeight: "800",
  },

  // TEXTAREA
  textarea: {
    height: 130,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    padding: 14,
    color: "#101828",
    fontSize: 14,
  },

  // BUTTON
  button: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#175CD3",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 25,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  buttonLoadingText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 8,
  },

  // SECTION
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#101828",
    marginTop: 30,
    marginBottom: 12,
  },

  // RIWAYAT
  statusBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },

  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusInfo: {
    flex: 1,
    paddingRight: 10,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#101828",
  },

  date: {
    color: "#667085",
    fontSize: 12,
    marginTop: 5,
  },

  reason: {
    color: "#475467",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },

  // CATATAN ADMIN
  adminNoteBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#F8F9FC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },

  adminNoteLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#344054",
    marginBottom: 5,
  },

  adminNoteText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#667085",
  },

  // LOADING
  loadingBox: {
    alignItems: "center",
    paddingVertical: 25,
  },

  loadingText: {
    color: "#667085",
    fontSize: 13,
    marginTop: 8,
  },

  // EMPTY
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#101828",
  },

  emptyText: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
});