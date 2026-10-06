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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../services/supabase";

export default function MeetingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const meetingId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  // MODE:
  // false = View Only
  // true  = Edit
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (meetingId) {
      loadData();
    }
  }, [meetingId]);

  // ==========================================
  // LOAD MEETING + EMPLOYEES
  // ==========================================
  const loadData = async () => {
    try {
      setLoading(true);

      console.log("=================================");
      console.log("LOAD DETAIL MEETING");
      console.log("MEETING ID:", meetingId);

      const [meetingResult, employeesResult] = await Promise.all([
        supabase
          .from("meetings")
          .select(`
            id,
            title,
            description,
            meeting_date,
            start_time,
            end_time,
            location,
            meeting_link,
            created_by,
            created_at,
            updated_at,
            meeting_participants (
              id,
              employee_id,
              status,
              employee:profiles (
                id,
                nama,
                email,
                jabatan,
                divisi,
                status
              )
            )
          `)
          .eq("id", meetingId)
          .single(),

        supabase
          .from("profiles")
          .select(`
            id,
            nama,
            email,
            jabatan,
            divisi,
            status,
            role
          `)
          .eq("role", "pegawai")
          .eq("status", "aktif")
          .order("nama", {
            ascending: true,
          }),
      ]);

      if (meetingResult?.error) {
        console.log(
          "MEETING DETAIL ERROR:",
          meetingResult.error
        );
        throw meetingResult.error;
      }

      if (employeesResult?.error) {
        console.log(
          "EMPLOYEE ERROR:",
          employeesResult.error
        );
        throw employeesResult.error;
      }

      const meeting = meetingResult?.data;

      console.log("MEETING:", meeting);

      setTitle(meeting?.title || "");
      setDescription(meeting?.description || "");

      setMeetingDate(
        meeting?.meeting_date || ""
      );

      setStartTime(
        meeting?.start_time
          ? String(meeting.start_time).substring(0, 5)
          : ""
      );

      setEndTime(
        meeting?.end_time
          ? String(meeting.end_time).substring(0, 5)
          : ""
      );

      setLocation(meeting?.location || "");

      setMeetingLink(
        meeting?.meeting_link || ""
      );

      setEmployees(
        employeesResult?.data || []
      );

      const participantIds =
        (meeting?.meeting_participants || []).map(
          (participant) => participant.employee_id
        );

      setSelectedEmployees(participantIds);

      console.log(
        "SELECTED PARTICIPANTS:",
        participantIds
      );
    } catch (error) {
      console.log(
        "LOAD DETAIL ERROR:",
        error
      );

      Alert.alert(
        "Gagal",
        error?.message ||
          "Gagal mengambil detail meeting."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SELECT / UNSELECT EMPLOYEE
  // ==========================================
  const toggleEmployee = (employeeId) => {
    setSelectedEmployees((current) => {
      if (current.includes(employeeId)) {
        return current.filter(
          (id) => id !== employeeId
        );
      }

      return [...current, employeeId];
    });
  };

  // ==========================================
  // VALIDATION
  // ==========================================
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert(
        "Validasi",
        "Judul meeting wajib diisi."
      );
      return false;
    }

    if (!meetingDate.trim()) {
      Alert.alert(
        "Validasi",
        "Tanggal meeting wajib diisi."
      );
      return false;
    }

    if (!startTime.trim()) {
      Alert.alert(
        "Validasi",
        "Jam mulai wajib diisi."
      );
      return false;
    }

    if (!endTime.trim()) {
      Alert.alert(
        "Validasi",
        "Jam selesai wajib diisi."
      );
      return false;
    }

    if (selectedEmployees.length === 0) {
      Alert.alert(
        "Validasi",
        "Pilih minimal satu pegawai sebagai peserta meeting."
      );
      return false;
    }

    return true;
  };

  // ==========================================
  // UPDATE MEETING
  // ==========================================
  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      console.log("=================================");
      console.log("UPDATE MEETING");
      console.log("MEETING ID:", meetingId);

      // ----------------------------------------
      // 1. UPDATE DATA MEETING
      // ----------------------------------------
      const {
        data: updatedMeeting,
        error: meetingError,
      } = await supabase
        .from("meetings")
        .update({
          title: title.trim(),

          description:
            description.trim() || null,

          meeting_date:
            meetingDate.trim(),

          start_time:
            startTime.trim() || null,

          end_time:
            endTime.trim() || null,

          location:
            location.trim() || null,

          meeting_link:
            meetingLink.trim() || null,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", meetingId)
        .select()
        .single();

      if (meetingError) {
        console.log(
          "UPDATE MEETING ERROR:",
          meetingError
        );
        throw meetingError;
      }

      console.log(
        "UPDATED MEETING:",
        updatedMeeting
      );

      // ----------------------------------------
      // 2. HAPUS PESERTA LAMA
      // ----------------------------------------
      const {
        error: deleteParticipantsError,
      } = await supabase
        .from("meeting_participants")
        .delete()
        .eq("meeting_id", meetingId);

      if (deleteParticipantsError) {
        console.log(
          "DELETE OLD PARTICIPANTS ERROR:",
          deleteParticipantsError
        );

        throw deleteParticipantsError;
      }

      // ----------------------------------------
      // 3. MASUKKAN PESERTA BARU
      // ----------------------------------------
      const participantsToInsert =
        selectedEmployees.map(
          (employeeId) => ({
            meeting_id: meetingId,
            employee_id: employeeId,
            status: "diundang",
          })
        );

      const {
        data: insertedParticipants,
        error: insertParticipantsError,
      } = await supabase
        .from("meeting_participants")
        .insert(participantsToInsert)
        .select();

      if (insertParticipantsError) {
        console.log(
          "INSERT PARTICIPANTS ERROR:",
          insertParticipantsError
        );

        throw insertParticipantsError;
      }

      console.log(
        "NEW PARTICIPANTS:",
        insertedParticipants
      );

      Alert.alert(
        "Berhasil",
        "Meeting berhasil diperbarui dan peserta meeting sudah diperbarui.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace(
                "/admin/meetings/meetings"
              );
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        "UPDATE MEETING ERROR:",
        error
      );

      Alert.alert(
        "Gagal",
        error?.message ||
          "Meeting gagal diperbarui."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE MEETING
  // ==========================================
  const handleDelete = () => {
    Alert.alert(
      "Hapus Meeting",
      "Apakah kamu yakin ingin menghapus meeting ini? Data peserta meeting juga akan dihapus.",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);

              console.log(
                "================================="
              );

              console.log(
                "DELETE MEETING"
              );

              console.log(
                "MEETING ID:",
                meetingId
              );

              // --------------------------------
              // 1. HAPUS PESERTA
              // --------------------------------
              const {
                error:
                  deleteParticipantsError,
              } = await supabase
                .from("meeting_participants")
                .delete()
                .eq(
                  "meeting_id",
                  meetingId
                );

              if (deleteParticipantsError) {
                throw deleteParticipantsError;
              }

              // --------------------------------
              // 2. HAPUS MEETING
              // --------------------------------
              const {
                error: deleteMeetingError,
              } = await supabase
                .from("meetings")
                .delete()
                .eq("id", meetingId);

              if (deleteMeetingError) {
                throw deleteMeetingError;
              }

              Alert.alert(
                "Berhasil",
                "Meeting berhasil dihapus.",
                [
                  {
                    text: "OK",
                    onPress: () =>
                      router.replace(
                        "/admin/meetings/meetings"
                      ),
                  },
                ]
              );
            } catch (error) {
              console.log(
                "DELETE MEETING ERROR:",
                error
              );

              Alert.alert(
                "Gagal",
                error?.message ||
                  "Meeting gagal dihapus."
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(
      `${value}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#175CD3"
          />

          <Text style={styles.loadingText}>
            Memuat detail meeting...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
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
          style={styles.scrollView}
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* =================================
              HEADER
          ================================= */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerBackButton,
                  pressed &&
                    styles.headerBackButtonPressed,
                ]}
                onPress={() =>
                  router.back()
                }
                disabled={saving}
              >
                <Ionicons
                  name="arrow-back"
                  size={21}
                  color="#101828"
                />
              </Pressable>

              <View
                style={
                  styles.headerTextContainer
                }
              >
                <Text
                  style={styles.headerTitle}
                >
                  Detail Meeting
                </Text>

                <Text
                  style={
                    styles.headerSubtitle
                  }
                >
                  {isEditing
                    ? "Edit informasi dan peserta meeting"
                    : "Informasi lengkap meeting dan peserta"}
                </Text>
              </View>
            </View>
          </View>

          {/* =================================
              INFORMASI MEETING
          ================================= */}
          <View style={styles.card}>
            <View
              style={styles.sectionHeader}
            >
              <View
                style={styles.sectionIcon}
              >
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color="#175CD3"
                />
              </View>

              <Text
                style={styles.sectionTitle}
              >
                INFORMASI MEETING
              </Text>
            </View>

            {/* JUDUL */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                Judul Meeting
              </Text>

              {isEditing ? (
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Contoh: Meeting Mingguan IT"
                  placeholderTextColor="#98A2B3"
                  style={styles.input}
                />
              ) : (
                <Text
                  style={styles.fieldValueLarge}
                >
                  {title || "-"}
                </Text>
              )}
            </View>

            {/* DESKRIPSI */}
            <View style={styles.infoDivider} />

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                Deskripsi
              </Text>

              {isEditing ? (
                <TextInput
                  value={description}
                  onChangeText={
                    setDescription
                  }
                  placeholder="Masukkan deskripsi meeting..."
                  placeholderTextColor="#98A2B3"
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.input,
                    styles.textArea,
                  ]}
                />
              ) : (
                <Text
                  style={styles.description}
                >
                  {description ||
                    "Tidak ada deskripsi."}
                </Text>
              )}
            </View>

            {/* TANGGAL */}
            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View
                style={styles.infoLabelRow}
              >
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color="#667085"
                />

                <Text
                  style={styles.infoLabel}
                >
                  Tanggal
                </Text>
              </View>

              {isEditing ? (
                <TextInput
                  value={meetingDate}
                  onChangeText={
                    setMeetingDate
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#98A2B3"
                  style={[
                    styles.input,
                    styles.inlineInput,
                  ]}
                  autoCapitalize="none"
                />
              ) : (
                <Text
                  style={styles.infoValue}
                >
                  {formatDate(
                    meetingDate
                  )}
                </Text>
              )}
            </View>

            {/* JAM MULAI */}
            <View style={styles.infoRow}>
              <View
                style={styles.infoLabelRow}
              >
                <Ionicons
                  name="time-outline"
                  size={15}
                  color="#667085"
                />

                <Text
                  style={styles.infoLabel}
                >
                  Jam Mulai
                </Text>
              </View>

              {isEditing ? (
                <TextInput
                  value={startTime}
                  onChangeText={
                    setStartTime
                  }
                  placeholder="08:00"
                  placeholderTextColor="#98A2B3"
                  style={[
                    styles.input,
                    styles.inlineInput,
                  ]}
                  autoCapitalize="none"
                />
              ) : (
                <Text
                  style={styles.infoValue}
                >
                  {startTime || "-"}
                </Text>
              )}
            </View>

            {/* JAM SELESAI */}
            <View style={styles.infoRow}>
              <View
                style={styles.infoLabelRow}
              >
                <Ionicons
                  name="time-outline"
                  size={15}
                  color="#667085"
                />

                <Text
                  style={styles.infoLabel}
                >
                  Jam Selesai
                </Text>
              </View>

              {isEditing ? (
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:00"
                  placeholderTextColor="#98A2B3"
                  style={[
                    styles.input,
                    styles.inlineInput,
                  ]}
                  autoCapitalize="none"
                />
              ) : (
                <Text
                  style={styles.infoValue}
                >
                  {endTime || "-"}
                </Text>
              )}
            </View>

            {/* LOKASI */}
            <View style={styles.infoRow}>
              <View
                style={styles.infoLabelRow}
              >
                <Ionicons
                  name="location-outline"
                  size={15}
                  color="#667085"
                />

                <Text
                  style={styles.infoLabel}
                >
                  Lokasi
                </Text>
              </View>

              {isEditing ? (
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Ruang Meeting A"
                  placeholderTextColor="#98A2B3"
                  style={[
                    styles.input,
                    styles.inlineInput,
                  ]}
                />
              ) : (
                <Text
                  style={styles.infoValue}
                  numberOfLines={3}
                >
                  {location || "-"}
                </Text>
              )}
            </View>

            {/* LINK */}
            <View style={styles.infoRow}>
              <View
                style={styles.infoLabelRow}
              >
                <Ionicons
                  name="link-outline"
                  size={15}
                  color="#667085"
                />

                <Text
                  style={styles.infoLabel}
                >
                  Link Meeting
                </Text>
              </View>

              {isEditing ? (
                <TextInput
                  value={meetingLink}
                  onChangeText={
                    setMeetingLink
                  }
                  placeholder="https://meet.google.com/..."
                  placeholderTextColor="#98A2B3"
                  style={[
                    styles.input,
                    styles.inlineInput,
                  ]}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              ) : (
                <Text
                  style={[
                    styles.infoValue,
                    styles.linkValue,
                  ]}
                  numberOfLines={3}
                >
                  {meetingLink || "-"}
                </Text>
              )}
            </View>
          </View>

          {/* =================================
              PESERTA MEETING
          ================================= */}
          <View style={styles.card}>
            <View
              style={styles.participantHeader}
            >
              <View
                style={styles.participantTitleRow}
              >
                <View
                  style={styles.sectionIcon}
                >
                  <Ionicons
                    name="people-outline"
                    size={17}
                    color="#175CD3"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    PESERTA MEETING
                  </Text>

                  <Text
                    style={
                      styles.participantSubtitle
                    }
                  >
                    {isEditing
                      ? "Pilih pegawai yang mengikuti meeting"
                      : `${selectedEmployees.length} pegawai mengikuti meeting`}
                  </Text>
                </View>

                <View
                  style={styles.countBadge}
                >
                  <Text
                    style={styles.countText}
                  >
                    {selectedEmployees.length}
                  </Text>
                </View>
              </View>
            </View>

            {employees.length === 0 ? (
              <View
                style={styles.emptyEmployee}
              >
                <Ionicons
                  name="people-outline"
                  size={28}
                  color="#98A2B3"
                />

                <Text
                  style={
                    styles.emptyEmployeeText
                  }
                >
                  Tidak ada pegawai aktif.
                </Text>
              </View>
            ) : (
              <View
                style={styles.employeeList}
              >
                {employees.map(
                  (employee) => {
                    const selected =
                      selectedEmployees.includes(
                        employee.id
                      );

                    /*
                     * VIEW ONLY
                     * --------------------------------
                     * Tidak bisa memilih/unselect.
                     */
                    if (!isEditing) {
                      if (!selected) {
                        return null;
                      }

                      return (
                        <View
                          key={employee.id}
                          style={
                            styles.employeeCard
                          }
                        >
                          <View
                            style={
                              styles.avatar
                            }
                          >
                            <Text
                              style={
                                styles.avatarText
                              }
                            >
                              {(
                                employee?.nama ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.employeeInfo
                            }
                          >
                            <Text
                              style={
                                styles.employeeName
                              }
                              numberOfLines={1}
                            >
                              {employee.nama ||
                                "-"}
                            </Text>

                            <Text
                              style={
                                styles.employeeDetail
                              }
                              numberOfLines={1}
                            >
                              {employee.jabatan ||
                                employee.divisi ||
                                "-"}
                            </Text>

                            <Text
                              style={
                                styles.employeeEmail
                              }
                              numberOfLines={1}
                            >
                              {employee.email ||
                                "-"}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.checkbox,
                              styles.checkboxSelected,
                            ]}
                          >
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#FFFFFF"
                            />
                          </View>
                        </View>
                      );
                    }

                    /*
                     * EDIT MODE
                     * --------------------------------
                     * Fungsi select/unselect tetap sama.
                     */
                    return (
                      <Pressable
                        key={employee.id}
                        style={[
                          styles.employeeCard,
                          selected &&
                            styles.employeeCardSelected,
                        ]}
                        onPress={() =>
                          toggleEmployee(
                            employee.id
                          )
                        }
                      >
                        <View
                          style={[
                            styles.avatar,
                            selected &&
                              styles.avatarSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.avatarText,
                              selected &&
                                styles.avatarTextSelected,
                            ]}
                          >
                            {(
                              employee?.nama ||
                              "?"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.employeeInfo
                          }
                        >
                          <Text
                            style={
                              styles.employeeName
                            }
                            numberOfLines={1}
                          >
                            {employee.nama}
                          </Text>

                          <Text
                            style={
                              styles.employeeDetail
                            }
                            numberOfLines={1}
                          >
                            {employee.jabatan ||
                              employee.divisi ||
                              "-"}
                          </Text>

                          <Text
                            style={
                              styles.employeeEmail
                            }
                            numberOfLines={1}
                          >
                            {employee.email ||
                              "-"}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.checkbox,
                            selected &&
                              styles.checkboxSelected,
                          ]}
                        >
                          {selected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#FFFFFF"
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  }
                )}
              </View>
            )}
          </View>

          {/* =================================
              ACTION
          ================================= */}
          <View
            style={styles.actionContainer}
          >
            {!isEditing ? (
              <>
                {/* EDIT */}
                <Pressable
                  style={({ pressed }) => [
                    styles.editButton,
                    pressed &&
                      styles.buttonPressed,
                    saving &&
                      styles.disabledButton,
                  ]}
                  onPress={() =>
                    setIsEditing(true)
                  }
                  disabled={saving}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.editButtonText
                    }
                  >
                    Edit Meeting
                  </Text>
                </Pressable>

                {/* DELETE */}
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed &&
                      styles.deleteButtonPressed,
                    saving &&
                      styles.disabledButton,
                  ]}
                  onPress={handleDelete}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator
                      color="#D92D20"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#D92D20"
                      />

                      <Text
                        style={
                          styles.deleteButtonText
                        }
                      >
                        Hapus Meeting
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                {/* SAVE */}
                <Pressable
                  style={({ pressed }) => [
                    styles.editButton,
                    pressed &&
                      styles.buttonPressed,
                    saving &&
                      styles.disabledButton,
                  ]}
                  onPress={handleUpdate}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="save-outline"
                        size={18}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.editButtonText
                        }
                      >
                        Simpan Perubahan
                      </Text>
                    </>
                  )}
                </Pressable>

                {/* DELETE */}
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed &&
                      styles.deleteButtonPressed,
                    saving &&
                      styles.disabledButton,
                  ]}
                  onPress={handleDelete}
                  disabled={saving}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#D92D20"
                  />

                  <Text
                    style={
                      styles.deleteButtonText
                    }
                  >
                    Hapus Meeting
                  </Text>
                </Pressable>

                {/* CANCEL EDIT */}
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelEditButton,
                    pressed &&
                      styles.cancelEditButtonPressed,
                  ]}
                  onPress={() => {
                    setIsEditing(false);
                    loadData();
                  }}
                  disabled={saving}
                >
                  <Ionicons
                    name="close-outline"
                    size={18}
                    color="#667085"
                  />

                  <Text
                    style={
                      styles.cancelEditButtonText
                    }
                  >
                    Batal Edit
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <View
            style={styles.bottomSpace}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // BASE
  // ==========================================
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

  // ==========================================
  // HEADER
  // Mengikuti patokan JobDetail
  // ==========================================
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 5,
    flexDirection: "row",
    alignItems: "center",
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

  headerBackButtonPressed: {
    opacity: 0.7,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#101828",
  },

  headerSubtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  // ==========================================
  // CARD
  // ==========================================
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

  // ==========================================
  // SECTION
  // ==========================================
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

  // ==========================================
  // FIELD
  // ==========================================
  fieldBlock: {
    marginTop: 16,
  },

  fieldLabel: {
    fontSize: 12,
    color: "#667085",
    fontWeight: "600",
    marginBottom: 7,
  },

  fieldValueLarge: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
    color: "#101828",
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
    color: "#667085",
  },

  // ==========================================
  // INFORMATION
  // ==========================================
  infoDivider: {
    height: 1,
    backgroundColor: "#F2F4F7",
    marginVertical: 14,
  },

  infoRow: {
    minHeight: 42,
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
  },

  linkValue: {
    color: "#175CD3",
  },

  // ==========================================
  // INPUT
  // Hanya muncul di posisi field yang sama
  // saat Edit
  // ==========================================
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#101828",
    fontSize: 14,
  },

  inlineInput: {
    flex: 1.5,
    textAlign: "right",
    paddingVertical: 9,
  },

  textArea: {
    minHeight: 105,
    textAlignVertical: "top",
  },

  // ==========================================
  // PARTICIPANTS
  // ==========================================
  participantHeader: {
    marginBottom: 14,
  },

  participantTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  participantSubtitle: {
    marginTop: 5,
    color: "#98A2B3",
    fontSize: 12,
    lineHeight: 18,
  },

  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  countText: {
    color: "#175CD3",
    fontWeight: "900",
    fontSize: 13,
  },

  employeeList: {
    gap: 9,
  },

  employeeCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 14,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  employeeCardSelected: {
    borderColor: "#175CD3",
    backgroundColor: "#F0F6FF",
  },

  avatar: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarSelected: {
    backgroundColor: "#DCEBFF",
  },

  avatarText: {
    color: "#175CD3",
    fontWeight: "900",
    fontSize: 16,
  },

  avatarTextSelected: {
    color: "#175CD3",
  },

  employeeInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
  },

  employeeName: {
    color: "#101828",
    fontWeight: "800",
    fontSize: 13,
  },

  employeeDetail: {
    marginTop: 3,
    color: "#475467",
    fontSize: 11,
  },

  employeeEmail: {
    marginTop: 2,
    color: "#98A2B3",
    fontSize: 10,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#D0D5DD",
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxSelected: {
    backgroundColor: "#175CD3",
    borderColor: "#175CD3",
  },

  emptyEmployee: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 14,
    padding: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyEmployeeText: {
    marginTop: 8,
    color: "#98A2B3",
    fontSize: 13,
  },

  // ==========================================
  // ACTION
  // ==========================================
  actionContainer: {
    marginHorizontal: 20,
    marginTop: 2,
  },

  editButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#175CD3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  deleteButton: {
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

  deleteButtonPressed: {
    opacity: 0.7,
  },

  deleteButtonText: {
    color: "#D92D20",
    fontSize: 13,
    fontWeight: "800",
  },

  cancelEditButton: {
    minHeight: 46,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  cancelEditButtonPressed: {
    opacity: 0.7,
  },

  cancelEditButtonText: {
    color: "#667085",
    fontSize: 13,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.85,
  },

  disabledButton: {
    opacity: 0.6,
  },

  bottomSpace: {
    height: 5,
  },

  // ==========================================
  // LOADING
  // ==========================================
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#667085",
  },
});