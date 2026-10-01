import React, { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Card } from "../../../components/UI";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../context/AuthContext";

export default function SuratForm() {
  const router = useRouter();
  const { user, session, profile } = useAuth();

  // ======================================================
  // FORM
  // ======================================================

  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);

  // ======================================================
  // USER ID
  // ======================================================

  const getUserId = () => {
    return (
      user?.id ||
      session?.user?.id ||
      profile?.id ||
      null
    );
  };

  // ======================================================
  // VALIDATE DATE
  // ======================================================

  const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [year, month, day] = value
      .split("-")
      .map(Number);

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  // ======================================================
  // SUBMIT
  // ======================================================

  const submit = async () => {
    // ----------------------------------------------------
    // TYPE
    // ----------------------------------------------------

    if (!type) {
      Alert.alert(
        "Form belum lengkap",
        "Silakan pilih jenis surat terlebih dahulu."
      );
      return;
    }

    // ----------------------------------------------------
    // SUBJECT
    // ----------------------------------------------------

    if (!subject.trim()) {
      Alert.alert(
        "Form belum lengkap",
        "Silakan isi subjek pengajuan."
      );
      return;
    }

    // ----------------------------------------------------
    // DESCRIPTION
    // ----------------------------------------------------

    if (!description.trim()) {
      Alert.alert(
        "Form belum lengkap",
        "Silakan isi deskripsi atau keterangan pengajuan."
      );
      return;
    }

    // ----------------------------------------------------
    // START DATE
    // ----------------------------------------------------

    if (!startDate.trim()) {
      Alert.alert(
        "Form belum lengkap",
        "Silakan isi tanggal mulai."
      );
      return;
    }

    if (!isValidDate(startDate.trim())) {
      Alert.alert(
        "Format tanggal salah",
        "Tanggal mulai harus menggunakan format YYYY-MM-DD.\nContoh: 2026-10-01"
      );
      return;
    }

    // ----------------------------------------------------
    // END DATE
    // ----------------------------------------------------

    if (!endDate.trim()) {
      Alert.alert(
        "Form belum lengkap",
        "Silakan isi tanggal selesai."
      );
      return;
    }

    if (!isValidDate(endDate.trim())) {
      Alert.alert(
        "Format tanggal salah",
        "Tanggal selesai harus menggunakan format YYYY-MM-DD.\nContoh: 2026-10-03"
      );
      return;
    }

    // ----------------------------------------------------
    // RANGE
    // ----------------------------------------------------

    if (endDate.trim() < startDate.trim()) {
      Alert.alert(
        "Tanggal tidak valid",
        "Tanggal selesai tidak boleh lebih awal dari tanggal mulai."
      );
      return;
    }

    try {
      setLoading(true);

      const currentUserId = getUserId();

      if (!currentUserId) {
        Alert.alert(
          "Sesi bermasalah",
          "Silakan login kembali."
        );
        return;
      }

      // --------------------------------------------------
      // PAYLOAD
      // --------------------------------------------------

      const payload = {
        employee_id: currentUserId,
        type: type.trim(),
        subject: subject.trim(),
        description: description.trim(),
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        status: "menunggu",
      };

      console.log("Submit surat payload:", payload);

      const {
        data,
        error,
      } = await supabase
        .from("surat_requests")
        .insert(payload)
        .select(
          `
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
          `
        )
        .single();

      if (error) {
        console.log("Submit surat error:", error);

        Alert.alert(
          "Gagal mengirim",
          error.message ||
            "Pengajuan surat gagal dikirim."
        );

        return;
      }

      console.log("Surat berhasil dibuat:", data);

      // --------------------------------------------------
      // RESET FORM
      // --------------------------------------------------

      setType("");
      setSubject("");
      setDescription("");
      setStartDate("");
      setEndDate("");

      Alert.alert(
        "Berhasil",
        "Pengajuan surat berhasil dikirim dan sedang menunggu proses admin.",
        [
          {
            text: "Lihat Riwayat",
            onPress: () => {
              router.replace("/surat");
            },
          },
        ]
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

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
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
          showsVerticalScrollIndicator={false}
        >
          {/* ==================================================
              HEADER
          ================================================== */}

          <View style={styles.pageHeader}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.back,
                pressed && styles.buttonPressed,
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
                Pengajuan Surat
              </Text>

              <Text
                style={styles.pageSubtitle}
                numberOfLines={2}
              >
                Ajukan kebutuhan administrasi
              </Text>
            </View>
          </View>

          {/* ==================================================
              FORM CARD
          ================================================== */}

          <Card>
            <View style={styles.cardHeader}>
              <View style={styles.iconLarge}>
                <Ionicons
                  name="document-text-outline"
                  size={32}
                  color="#175CD3"
                />
              </View>

              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>
                  Form Pengajuan
                </Text>

                <Text style={styles.cardSubtitle}>
                  Lengkapi informasi pengajuan surat.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* ==================================================
                JENIS SURAT
            ================================================== */}

            <View style={styles.section}>
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
                        isActive &&
                          styles.typeButtonActive,
                      ]}
                      onPress={() => setType(item)}
                      disabled={loading}
                    >
                      <View
                        style={[
                          styles.typeIcon,
                          isActive &&
                            styles.typeIconActive,
                        ]}
                      >
                        <Ionicons
                          name="document-outline"
                          size={19}
                          color={
                            isActive
                              ? "#175CD3"
                              : "#667085"
                          }
                        />
                      </View>

                      <Text
                        style={[
                          styles.typeText,
                          isActive &&
                            styles.typeTextActive,
                        ]}
                      >
                        {item}
                      </Text>

                      <View
                        style={[
                          styles.radio,
                          isActive &&
                            styles.radioActive,
                        ]}
                      >
                        {isActive && (
                          <View
                            style={styles.radioInner}
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ==================================================
                SUBJECT
            ================================================== */}

            <View style={styles.section}>
              <Text style={styles.label}>
                Subjek Pengajuan
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Contoh: Pengajuan cuti tahunan"
                placeholderTextColor="#98A2B3"
                value={subject}
                onChangeText={setSubject}
                editable={!loading}
                maxLength={150}
              />

              <Text style={styles.helper}>
                Masukkan judul atau subjek dari pengajuan surat.
              </Text>
            </View>

            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <View style={styles.section}>
              <Text style={styles.label}>
                Deskripsi
              </Text>

              <TextInput
                style={styles.textarea}
                placeholder="Masukkan detail atau keterangan pengajuan..."
                placeholderTextColor="#98A2B3"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                editable={!loading}
                maxLength={1000}
              />

              <Text style={styles.helper}>
                Jelaskan alasan atau informasi yang diperlukan untuk pengajuan.
              </Text>
            </View>

            {/* ==================================================
                START DATE
            ================================================== */}

            <View style={styles.section}>
              <Text style={styles.label}>
                Tanggal Mulai
              </Text>

              <View style={styles.dateInputWrapper}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#667085"
                />

                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#98A2B3"
                  value={startDate}
                  onChangeText={setStartDate}
                  editable={!loading}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>

              <Text style={styles.helper}>
                Format tanggal: YYYY-MM-DD, contoh 2026-10-01.
              </Text>
            </View>

            {/* ==================================================
                END DATE
            ================================================== */}

            <View style={styles.section}>
              <Text style={styles.label}>
                Tanggal Selesai
              </Text>

              <View style={styles.dateInputWrapper}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#667085"
                />

                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#98A2B3"
                  value={endDate}
                  onChangeText={setEndDate}
                  editable={!loading}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>

              <Text style={styles.helper}>
                Format tanggal: YYYY-MM-DD, contoh 2026-10-03.
              </Text>
            </View>

            {/* ==================================================
                BUTTON
            ================================================== */}

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

                  <Text style={styles.buttonText}>
                    Mengirim...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="send-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text style={styles.buttonText}>
                    Kirim Pengajuan
                  </Text>
                </>
              )}
            </Pressable>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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

  // ====================================================
  // CARD
  // ====================================================

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  cardHeaderText: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#101828",
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#667085",
    marginTop: 4,
    lineHeight: 19,
  },

  divider: {
    height: 1,
    backgroundColor: "#EAECF0",
    marginVertical: 20,
  },

  section: {
    marginBottom: 18,
  },

  label: {
    fontSize: 11,
    color: "#98A2B3",
    fontWeight: "700",
    marginBottom: 7,
  },

  // ====================================================
  // TYPE
  // ====================================================

  types: {
    gap: 9,
  },

  typeButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 14,
    padding: 11,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
  },

  typeButtonActive: {
    borderColor: "#175CD3",
    backgroundColor: "#F0F6FF",
  },

  typeIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    alignItems: "center",
  },

  typeIconActive: {
    backgroundColor: "#DCEBFF",
  },

  typeText: {
    flex: 1,
    marginLeft: 11,
    color: "#344054",
    fontSize: 13,
    fontWeight: "700",
  },

  typeTextActive: {
    color: "#175CD3",
    fontWeight: "800",
  },

  radio: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D0D5DD",
    justifyContent: "center",
    alignItems: "center",
  },

  radioActive: {
    borderColor: "#175CD3",
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#175CD3",
  },

  // ====================================================
  // INPUT
  // ====================================================

  input: {
    minHeight: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#101828",
    fontSize: 14,
  },

  textarea: {
    minHeight: 110,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#101828",
    fontSize: 14,
    textAlignVertical: "top",
  },

  helper: {
    marginTop: 5,
    color: "#98A2B3",
    fontSize: 11,
    lineHeight: 16,
  },

  // ====================================================
  // DATE
  // ====================================================

  dateInputWrapper: {
    minHeight: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  dateInput: {
    flex: 1,
    marginLeft: 10,
    color: "#101828",
    fontSize: 14,
    paddingVertical: 12,
  },

  // ====================================================
  // BUTTON
  // ====================================================

  button: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#175CD3",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 6,
    gap: 8,
    paddingHorizontal: 16,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});