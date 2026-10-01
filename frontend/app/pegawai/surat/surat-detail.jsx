import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  Card,
  StatusBadge,
} from "../../../components/UI";

import { supabase } from "../../../services/supabase";

export default function SuratDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const id = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ======================================================
  // FORMAT STATUS
  // ======================================================

  const formatStatus = (status) => {
    switch (status) {
      case "menunggu":
        return "Menunggu";

      case "diajukan":
        return "Diajukan";

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
  // STATUS YANG BOLEH EDIT / HAPUS
  // ======================================================

  const canEditOrDelete =
    data &&
    ["menunggu", "diajukan"].includes(data.status);

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(`${dateString}T00:00:00`);

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
  // LOAD DETAIL
  // ======================================================

  const loadDetail = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          "Sesi tidak ditemukan",
          "Silakan login kembali."
        );

        setLoading(false);
        return;
      }

      const {
        data: surat,
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
        .eq("id", id)
        .eq("employee_id", user.id)
        .single();

      if (error) {
        console.log(
          "Load surat detail error:",
          error
        );

        Alert.alert(
          "Gagal memuat",
          error?.message ||
            "Detail pengajuan tidak dapat dimuat.",
          [
            {
              text: "Kembali",
              onPress: () => router.back(),
            },
          ]
        );

        return;
      }

      setData(surat);

      // Isi form edit
      setType(surat?.type || "");
      setSubject(surat?.subject || "");
      setDescription(surat?.description || "");
      setStartDate(surat?.start_date || "");
      setEndDate(surat?.end_date || "");
    } catch (error) {
      console.log(
        "Detail surat error:",
        error
      );

      Alert.alert(
        "Gagal",
        "Terjadi kesalahan saat mengambil detail pengajuan."
      );
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  // ======================================================
  // INITIAL
  // ======================================================

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // ======================================================
  // MULAI EDIT
  // ======================================================

  const handleStartEdit = () => {
    if (!data) {
      return;
    }

    if (
      !["menunggu", "diajukan"].includes(
        data.status
      )
    ) {
      Alert.alert(
        "Tidak dapat diedit",
        "Pengajuan hanya dapat diedit ketika status masih Menunggu atau Diajukan."
      );

      return;
    }

    setType(data.type || "");
    setSubject(data.subject || "");
    setDescription(data.description || "");
    setStartDate(data.start_date || "");
    setEndDate(data.end_date || "");

    setIsEditing(true);
  };

  // ======================================================
  // BATAL EDIT
  // ======================================================

  const handleCancelEdit = () => {
    if (data) {
      setType(data.type || "");
      setSubject(data.subject || "");
      setDescription(data.description || "");
      setStartDate(data.start_date || "");
      setEndDate(data.end_date || "");
    }

    setIsEditing(false);
  };

  // ======================================================
  // VALIDASI
  // ======================================================

  const validateForm = () => {
    if (!type.trim()) {
      Alert.alert(
        "Data belum lengkap",
        "Jenis surat wajib diisi."
      );

      return false;
    }

    if (!subject.trim()) {
      Alert.alert(
        "Data belum lengkap",
        "Subjek pengajuan wajib diisi."
      );

      return false;
    }

    if (!description.trim()) {
      Alert.alert(
        "Data belum lengkap",
        "Deskripsi pengajuan wajib diisi."
      );

      return false;
    }

    if (!startDate.trim()) {
      Alert.alert(
        "Data belum lengkap",
        "Tanggal mulai wajib diisi."
      );

      return false;
    }

    if (!endDate.trim()) {
      Alert.alert(
        "Data belum lengkap",
        "Tanggal selesai wajib diisi."
      );

      return false;
    }

    return true;
  };

  // ======================================================
  // SIMPAN EDIT
  // ======================================================

  const handleSaveEdit = async () => {
    if (!data) {
      return;
    }

    if (
      !["menunggu", "diajukan"].includes(
        data.status
      )
    ) {
      Alert.alert(
        "Tidak dapat diedit",
        "Status pengajuan sudah tidak memungkinkan untuk diedit."
      );

      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          "Sesi tidak ditemukan",
          "Silakan login kembali."
        );

        return;
      }

      const {
        data: updatedData,
        error,
      } = await supabase
        .from("surat_requests")
        .update({
          type: type.trim(),
          subject: subject.trim(),
          description: description.trim(),
          start_date: startDate.trim(),
          end_date: endDate.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .eq("employee_id", user.id)
        .in("status", [
          "menunggu",
          "diajukan",
        ])
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
        .single();

      if (error) {
        console.log(
          "Update surat error:",
          error
        );

        Alert.alert(
          "Gagal menyimpan",
          error?.message ||
            "Perubahan pengajuan tidak dapat disimpan."
        );

        return;
      }

      setData(updatedData);

      setType(updatedData?.type || "");
      setSubject(updatedData?.subject || "");
      setDescription(
        updatedData?.description || ""
      );
      setStartDate(
        updatedData?.start_date || ""
      );
      setEndDate(
        updatedData?.end_date || ""
      );

      setIsEditing(false);

      Alert.alert(
        "Berhasil",
        "Pengajuan surat berhasil diperbarui."
      );
    } catch (error) {
      console.log(
        "Save surat error:",
        error
      );

      Alert.alert(
        "Gagal",
        "Terjadi kesalahan saat menyimpan perubahan."
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // HAPUS SURAT
  // ======================================================

  const handleDelete = () => {
    if (!data) {
      return;
    }

    if (
      !["menunggu", "diajukan"].includes(
        data.status
      )
    ) {
      Alert.alert(
        "Tidak dapat dihapus",
        "Pengajuan hanya dapat dihapus ketika status masih Menunggu atau Diajukan."
      );

      return;
    }

    Alert.alert(
      "Hapus Pengajuan?",
      "Pengajuan surat ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  // ======================================================
  // CONFIRM DELETE
  // ======================================================

  const confirmDelete = async () => {
    if (!data) {
      return;
    }

    try {
      setDeleting(true);

      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          "Sesi tidak ditemukan",
          "Silakan login kembali."
        );

        return;
      }

      const {
        error,
      } = await supabase
        .from("surat_requests")
        .delete()
        .eq("id", data.id)
        .eq("employee_id", user.id)
        .in("status", [
          "menunggu",
          "diajukan",
        ]);

      if (error) {
        console.log(
          "Delete surat error:",
          error
        );

        Alert.alert(
          "Gagal menghapus",
          error?.message ||
            "Pengajuan surat tidak dapat dihapus."
        );

        return;
      }

      Alert.alert(
        "Berhasil",
        "Pengajuan surat berhasil dihapus.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.log(
        "Confirm delete error:",
        error
      );

      Alert.alert(
        "Gagal",
        "Terjadi kesalahan saat menghapus pengajuan."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ======================================================
  // TIMELINE
  // ======================================================

  const getTimeline = () => {
    if (!data) {
      return null;
    }

    const status = data.status;

    return {
      submitted: {
        active: true,
        date: data.created_at,
      },

      processed: {
        active:
          status === "diproses" ||
          status === "disetujui" ||
          status === "ditolak",

        date:
          data.processed_at ||
          data.started_at ||
          null,
      },

      completed: {
        active:
          status === "disetujui" ||
          status === "ditolak",

        date:
          data.completed_at ||
          null,
      },
    };
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading && !data) {
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

          <Text style={styles.loadingText}>
            Memuat detail surat...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ======================================================
  // DATA NOT FOUND
  // ======================================================

  if (!data) {
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
          <View style={styles.emptyIcon}>
            <Ionicons
              name="document-text-outline"
              size={30}
              color="#98A2B3"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Pengajuan tidak ditemukan
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
              Kembali
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const timeline = getTimeline();

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
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={
                loading && !isEditing
              }
              onRefresh={loadDetail}
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
                Detail Surat
              </Text>

              <Text
                style={styles.pageSubtitle}
                numberOfLines={2}
              >
                Informasi dan perkembangan administrasi
              </Text>
            </View>
          </View>

          {/* ==================================================
              MAIN INFORMATION
          ================================================== */}

          <Card>
            <View style={styles.detailHeader}>
              <View style={styles.iconLarge}>
                <Ionicons
                  name="document-text-outline"
                  size={32}
                  color="#175CD3"
                />
              </View>

              <View style={styles.detailHeaderText}>
                <Text
                  style={styles.detailTitle}
                  numberOfLines={3}
                >
                  {data.subject || "-"}
                </Text>

                <Text style={styles.detailType}>
                  {data.type || "-"}
                </Text>
              </View>

              <StatusBadge
                status={formatStatus(
                  data.status
                )}
              />
            </View>

            <View style={styles.divider} />

            {/* ==================================================
                EDIT FORM
            ================================================== */}

            {isEditing ? (
              <>
                <View style={styles.editNotice}>
                  <View
                    style={styles.editNoticeIcon}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color="#175CD3"
                    />
                  </View>

                  <View
                    style={
                      styles.editNoticeContent
                    }
                  >
                    <Text
                      style={
                        styles.editNoticeTitle
                      }
                    >
                      Edit Pengajuan
                    </Text>

                    <Text
                      style={
                        styles.editNoticeText
                      }
                    >
                      Perubahan hanya dapat dilakukan selama pengajuan belum diproses admin.
                    </Text>
                  </View>
                </View>

                {/* JENIS SURAT */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Jenis Surat
                  </Text>

                  <TextInput
                    value={type}
                    onChangeText={setType}
                    placeholder="Contoh: Surat Izin"
                    placeholderTextColor="#98A2B3"
                    style={styles.textInput}
                  />
                </View>

                {/* SUBJEK */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Subjek Pengajuan
                  </Text>

                  <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Masukkan subjek pengajuan"
                    placeholderTextColor="#98A2B3"
                    style={styles.textInput}
                  />
                </View>

                {/* PERIODE */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Periode Pengajuan
                  </Text>

                  <View
                    style={styles.dateInputRow}
                  >
                    <View
                      style={
                        styles.dateInputWrapper
                      }
                    >
                      <Text
                        style={
                          styles.dateInputLabel
                        }
                      >
                        Tanggal Mulai
                      </Text>

                      <TextInput
                        value={startDate}
                        onChangeText={
                          setStartDate
                        }
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#98A2B3"
                        style={
                          styles.dateInput
                        }
                      />
                    </View>

                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#98A2B3"
                      style={
                        styles.dateArrow
                      }
                    />

                    <View
                      style={
                        styles.dateInputWrapper
                      }
                    >
                      <Text
                        style={
                          styles.dateInputLabel
                        }
                      >
                        Tanggal Selesai
                      </Text>

                      <TextInput
                        value={endDate}
                        onChangeText={
                          setEndDate
                        }
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#98A2B3"
                        style={
                          styles.dateInput
                        }
                      />
                    </View>
                  </View>
                </View>

                {/* DESKRIPSI */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Deskripsi Pengajuan
                  </Text>

                  <TextInput
                    value={description}
                    onChangeText={
                      setDescription
                    }
                    placeholder="Masukkan deskripsi pengajuan"
                    placeholderTextColor="#98A2B3"
                    multiline
                    textAlignVertical="top"
                    style={[
                      styles.textInput,
                      styles.descriptionInput,
                    ]}
                  />
                </View>

                {/* ACTION EDIT */}
                <View
                  style={styles.editActions}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.cancelEditButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={
                      handleCancelEdit
                    }
                    disabled={saving}
                  >
                    <Ionicons
                      name="close-outline"
                      size={18}
                      color="#344054"
                    />

                    <Text
                      style={
                        styles.cancelEditText
                      }
                    >
                      Batal
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.saveEditButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={
                      handleSaveEdit
                    }
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />
                    ) : (
                      <Ionicons
                        name="checkmark-outline"
                        size={18}
                        color="#FFFFFF"
                      />
                    )}

                    <Text
                      style={
                        styles.saveEditText
                      }
                    >
                      {saving
                        ? "Menyimpan..."
                        : "Simpan Perubahan"}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {/* ==================================================
                    PERIOD
                ================================================== */}

                <View style={styles.section}>
                  <Text
                    style={styles.sectionTitle}
                  >
                    Periode Pengajuan
                  </Text>

                  <View
                    style={styles.periodBox}
                  >
                    <View
                      style={styles.periodItem}
                    >
                      <View
                        style={styles.periodIcon}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#175CD3"
                        />
                      </View>

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
                            data.start_date
                          )}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={styles.periodArrow}
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#98A2B3"
                      />
                    </View>

                    <View
                      style={styles.periodItem}
                    >
                      <View
                        style={styles.periodIcon}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#175CD3"
                        />
                      </View>

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
                            data.end_date
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ==================================================
                    DESCRIPTION
                ================================================== */}

                <View style={styles.section}>
                  <Text
                    style={styles.sectionTitle}
                  >
                    Deskripsi Pengajuan
                  </Text>

                  <View
                    style={
                      styles.descriptionBox
                    }
                  >
                    <Text
                      style={
                        styles.descriptionText
                      }
                    >
                      {data.description ||
                        "-"}
                    </Text>
                  </View>
                </View>

                {/* ==================================================
                    CREATED
                ================================================== */}

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color="#667085"
                    />
                  </View>

                  <View
                    style={styles.infoContent}
                  >
                    <Text
                      style={styles.infoLabel}
                    >
                      Diajukan pada
                    </Text>

                    <Text
                      style={styles.infoValue}
                    >
                      {formatDateTime(
                        data.created_at
                      )}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Card>

          {/* ==================================================
              ACTION CARD
          ================================================== */}

          {!isEditing &&
            canEditOrDelete && (
              <Card>
                <View
                  style={styles.actionHeader}
                >
                  <View
                    style={
                      styles.actionHeaderIcon
                    }
                  >
                    <Ionicons
                      name="settings-outline"
                      size={22}
                      color="#175CD3"
                    />
                  </View>

                  <View
                    style={
                      styles.actionHeaderText
                    }
                  >
                    <Text
                      style={
                        styles.actionTitle
                      }
                    >
                      Kelola Pengajuan
                    </Text>

                    <Text
                      style={
                        styles.actionSubtitle
                      }
                    >
                      Pengajuan masih dapat diubah atau dihapus.
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={
                      handleStartEdit
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={19}
                      color="#175CD3"
                    />

                    <Text
                      style={styles.editButtonText}
                    >
                      Edit Pengajuan
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator
                        size="small"
                        color="#D92D20"
                      />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={19}
                        color="#D92D20"
                      />
                    )}

                    <Text
                      style={
                        styles.deleteButtonText
                      }
                    >
                      {deleting
                        ? "Menghapus..."
                        : "Hapus Pengajuan"}
                    </Text>
                  </Pressable>
                </View>
              </Card>
            )}

          {/* ==================================================
              TIMELINE CARD
          ================================================== */}

          <Card>
            <View style={styles.cardHeader}>
              <View
                style={styles.timelineIcon}
              >
                <Ionicons
                  name="git-branch-outline"
                  size={25}
                  color="#175CD3"
                />
              </View>

              <View
                style={styles.cardHeaderText}
              >
                <Text
                  style={styles.cardTitle}
                >
                  Perkembangan Pengajuan
                </Text>

                <Text
                  style={styles.cardSubtitle}
                >
                  Pantau proses pengajuan surat kamu.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.timeline}>
              {/* STEP 1 */}

              <View
                style={styles.timelineItem}
              >
                <View
                  style={styles.timelineLeft}
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
                      data.created_at
                    )}
                  </Text>
                </View>
              </View>

              {/* STEP 2 */}

              <View
                style={styles.timelineItem}
              >
                <View
                  style={styles.timelineLeft}
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
                    {timeline.processed.date
                      ? formatDateTime(
                          timeline.processed
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
                  style={styles.timelineLeft}
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
                    {timeline.completed.date
                      ? formatDateTime(
                          timeline.completed
                            .date
                        )
                      : "Belum selesai"}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* ==================================================
              ADMIN NOTE
          ================================================== */}

          {data.admin_note ? (
            <Card>
              <View
                style={
                  styles.adminNoteHeader
                }
              >
                <View
                  style={
                    styles.adminNoteIcon
                  }
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={21}
                    color="#175CD3"
                  />
                </View>

                <View
                  style={
                    styles.adminNoteHeaderText
                  }
                >
                  <Text
                    style={
                      styles.adminNoteTitle
                    }
                  >
                    Catatan Admin
                  </Text>

                  <Text
                    style={
                      styles.adminNoteSubtitle
                    }
                  >
                    Informasi dari admin terkait pengajuan.
                  </Text>
                </View>
              </View>

              <View
                style={styles.adminNoteBox}
              >
                <Text
                  style={styles.adminNoteText}
                >
                  {data.admin_note}
                </Text>
              </View>
            </Card>
          ) : null}
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

  // ====================================================
  // DETAIL
  // ====================================================

  detailHeader: {
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

  detailHeaderText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
    minWidth: 0,
  },

  detailTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#101828",
    lineHeight: 23,
  },

  detailType: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#175CD3",
  },

  divider: {
    height: 1,
    backgroundColor: "#EAECF0",
    marginVertical: 20,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#344054",
    marginBottom: 9,
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

  periodIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
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
    paddingHorizontal: 7,
  },

  // ====================================================
  // DESCRIPTION
  // ====================================================

  descriptionBox: {
    backgroundColor: "#F8F9FC",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 12,
    padding: 13,
  },

  descriptionText: {
    color: "#344054",
    fontSize: 13,
    lineHeight: 20,
  },

  // ====================================================
  // INFO
  // ====================================================

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    alignItems: "center",
  },

  infoContent: {
    marginLeft: 10,
    flex: 1,
  },

  infoLabel: {
    fontSize: 10,
    color: "#98A2B3",
    fontWeight: "700",
  },

  infoValue: {
    marginTop: 2,
    color: "#344054",
    fontSize: 12,
    fontWeight: "800",
  },

  // ====================================================
  // EDIT
  // ====================================================

  editNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#D6E4FF",
    borderRadius: 13,
    padding: 12,
    marginBottom: 20,
  },

  editNoticeIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  editNoticeContent: {
    flex: 1,
    marginLeft: 10,
  },

  editNoticeTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#175CD3",
  },

  editNoticeText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    color: "#475467",
  },

  inputGroup: {
    marginBottom: 17,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#344054",
    marginBottom: 8,
  },

  textInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: "#101828",
    fontSize: 13,
  },

  descriptionInput: {
    minHeight: 120,
  },

  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  dateInputWrapper: {
    flex: 1,
    minWidth: 0,
  },

  dateInputLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#98A2B3",
    marginBottom: 6,
  },

  dateInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    color: "#101828",
    fontSize: 11,
    fontWeight: "700",
  },

  dateArrow: {
    marginHorizontal: 7,
    marginTop: 18,
  },

  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 3,
  },

  cancelEditButton: {
    flex: 0.8,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },

  cancelEditText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#344054",
  },

  saveEditButton: {
    flex: 1.5,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#175CD3",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },

  saveEditText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  // ====================================================
  // ACTION CARD
  // ====================================================

  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  actionHeaderText: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#101828",
  },

  actionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    color: "#667085",
  },

  actionButtons: {
    marginTop: 17,
    gap: 10,
  },

  editButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B2CCFF",
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },

  editButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#175CD3",
  },

  deleteButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDA29B",
    backgroundColor: "#FEF3F2",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },

  deleteButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#D92D20",
  },

  // ====================================================
  // TIMELINE CARD
  // ====================================================

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  timelineIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#101828",
  },

  cardSubtitle: {
    fontSize: 12,
    color: "#667085",
    marginTop: 3,
    lineHeight: 18,
  },

  // ====================================================
  // TIMELINE
  // ====================================================

  timeline: {
    marginTop: 2,
  },

  timelineItem: {
    flexDirection: "row",
    minHeight: 68,
  },

  timelineItemLast: {
    flexDirection: "row",
    minHeight: 45,
  },

  timelineLeft: {
    width: 30,
    alignItems: "center",
  },

  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    marginLeft: 10,
    paddingBottom: 12,
  },

  timelineTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#344054",
  },

  timelineDate: {
    marginTop: 4,
    fontSize: 11,
    color: "#98A2B3",
    lineHeight: 17,
  },

  // ====================================================
  // ADMIN NOTE
  // ====================================================

  adminNoteHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  adminNoteIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  adminNoteHeaderText: {
    flex: 1,
    marginLeft: 12,
  },

  adminNoteTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#101828",
  },

  adminNoteSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "#667085",
  },

  adminNoteBox: {
    marginTop: 15,
    padding: 13,
    backgroundColor: "#F8F9FC",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },

  adminNoteText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#344054",
  },

  // ====================================================
  // LOADING
  // ====================================================

  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
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

  backButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#175CD3",
    paddingHorizontal: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});