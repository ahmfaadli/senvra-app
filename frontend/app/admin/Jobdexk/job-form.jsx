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
import { supabase } from "../../../services/supabase";

const priorities = [
  {
    value: "rendah",
    label: "Rendah",
  },
  {
    value: "normal",
    label: "Sedang",
  },
  {
    value: "tinggi",
    label: "Tinggi",
  },
];

export default function JobForm() {
  const router = useRouter();

  /*
   * Jika id tersedia:
   * => MODE EDIT
   *
   * Jika id tidak tersedia:
   * => MODE TAMBAH
   */
  const { id } = useLocalSearchParams();

  const jobId = Array.isArray(id) ? id[0] : id;
  const isEditMode = Boolean(jobId);

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("sedang");
  const [deadline, setDeadline] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  /*
   * Progress dan status TIDAK diedit dari admin.
   *
   * Nilainya hanya digunakan ketika update agar
   * data lama tidak berubah.
   */
  const [existingProgress, setExistingProgress] = useState(0);
  const [existingStatus, setExistingStatus] =
    useState("belum_dimulai");

  useEffect(() => {
    loadData();
  }, [jobId]);

  /*
   * ==========================================
   * LOAD DATA
   * ==========================================
   */
  const loadData = async () => {
    try {
      setLoading(true);

      /*
       * Ambil pegawai aktif.
       */
      const employeeQuery = supabase
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
        });

      /*
       * MODE TAMBAH
       *
       * Tidak perlu mengambil data job.
       */
      if (!isEditMode) {
        const { data, error } =
          await employeeQuery;

        if (error) {
          throw error;
        }

        setEmployees(data || []);
        return;
      }

      /*
       * MODE EDIT
       *
       * Ambil:
       * - job
       * - pegawai aktif
       */
      const [jobResult, employeeResult] =
        await Promise.all([
          supabase
            .from("jobs")
            .select(`
              id,
              employee_id,
              title,
              description,
              priority,
              deadline,
              start_time,
              end_time,
              status,
              progress,
              created_at,
              updated_at,
              profiles!jobs_employee_id_fkey (
                id,
                nama,
                email,
                jabatan,
                divisi,
                status,
                role
              )
            `)
            .eq("id", jobId)
            .single(),

          employeeQuery,
        ]);

      if (jobResult.error) {
        throw jobResult.error;
      }

      if (employeeResult.error) {
        throw employeeResult.error;
      }

      const job = jobResult.data;

      if (!job) {
        throw new Error(
          "Data jobdesk tidak ditemukan."
        );
      }

      let employeeList =
        employeeResult.data || [];

      /*
       * Jika pegawai yang menerima jobdesk
       * sudah tidak aktif, tetap masukkan ke list.
       *
       * Ini supaya ketika edit:
       * employee_id lama tidak hilang.
       */
      if (
        job.profiles &&
        !employeeList.some(
          (employee) =>
            employee.id === job.profiles.id
        )
      ) {
        employeeList = [
          job.profiles,
          ...employeeList,
        ];
      }

      setEmployees(employeeList);

      /*
       * Isi form dengan data job lama.
       */
      setEmployeeId(job.employee_id || "");
      setTitle(job.title || "");
      setDescription(job.description || "");
      setPriority(job.priority || "sedang");

      setDeadline(
        job.deadline
          ? String(job.deadline)
          : ""
      );

      setStartTime(
        job.start_time
          ? String(job.start_time).substring(
              0,
              8
            )
          : ""
      );

      setEndTime(
        job.end_time
          ? String(job.end_time).substring(
              0,
              8
            )
          : ""
      );

      /*
       * Simpan progress dan status lama.
       *
       * Admin tidak boleh mengubah progress.
       */
      setExistingProgress(
        Number(job.progress) || 0
      );

      setExistingStatus(
        job.status || "belum_dimulai"
      );
    } catch (error) {
      console.error(
        "LOAD JOB FORM ERROR:",
        error
      );

      Alert.alert(
        "Gagal",
        error?.message ||
          "Gagal mengambil data jobdesk."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==========================================
   * VALIDASI
   * ==========================================
   */
  const validateForm = () => {
    if (!employeeId) {
      Alert.alert(
        "Validasi",
        "Silakan pilih pegawai."
      );

      return false;
    }

    if (!title.trim()) {
      Alert.alert(
        "Validasi",
        "Judul jobdesk wajib diisi."
      );

      return false;
    }

    if (!description.trim()) {
      Alert.alert(
        "Validasi",
        "Deskripsi jobdesk wajib diisi."
      );

      return false;
    }

    if (!deadline.trim()) {
      Alert.alert(
        "Validasi",
        "Deadline wajib diisi. Format: YYYY-MM-DD"
      );

      return false;
    }

    /*
     * Validasi format deadline sederhana.
     */
    const deadlineRegex =
      /^\d{4}-\d{2}-\d{2}$/;

    if (!deadlineRegex.test(deadline.trim())) {
      Alert.alert(
        "Validasi",
        "Format deadline harus YYYY-MM-DD."
      );

      return false;
    }

    /*
     * Validasi jam jika diisi.
     */
    if (
      startTime.trim() &&
      !/^\d{2}:\d{2}(:\d{2})?$/.test(
        startTime.trim()
      )
    ) {
      Alert.alert(
        "Validasi",
        "Format jam mulai harus HH:MM atau HH:MM:SS."
      );

      return false;
    }

    if (
      endTime.trim() &&
      !/^\d{2}:\d{2}(:\d{2})?$/.test(
        endTime.trim()
      )
    ) {
      Alert.alert(
        "Validasi",
        "Format jam selesai harus HH:MM atau HH:MM:SS."
      );

      return false;
    }

    return true;
  };

  /*
   * ==========================================
   * SUBMIT
   * ==========================================
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      /*
       * Ambil user yang sedang login.
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
       * Pastikan pegawai yang dipilih benar-benar ada.
       */
      const selectedEmployee =
        employees.find(
          (item) =>
            item.id === employeeId
        );

      if (!selectedEmployee) {
        Alert.alert(
          "Error",
          "Data pegawai tidak ditemukan."
        );

        return;
      }

      /*
       * ========================================
       * MODE EDIT
       * ========================================
       *
       * PENTING:
       * Tidak menggunakan INSERT.
       *
       * Menggunakan UPDATE berdasarkan id job.
       */
      if (isEditMode) {
        const updateData = {
          employee_id: employeeId,
          title: title.trim(),
          description: description.trim(),
          priority,
          deadline: deadline.trim(),
          start_time:
            startTime.trim() || null,
          end_time:
            endTime.trim() || null,

          /*
           * Status tetap menggunakan status lama.
           */
          status: existingStatus,

          /*
           * Progress tetap menggunakan
           * progress lama.
           *
           * Admin tidak dapat mengubahnya.
           */
          progress: existingProgress,

          updated_at:
            new Date().toISOString(),
        };

        const {
          data,
          error,
        } = await supabase
          .from("jobs")
          .update(updateData)
          .eq("id", jobId)
          .select(`
            id,
            employee_id,
            title,
            description,
            priority,
            deadline,
            start_time,
            end_time,
            status,
            progress,
            created_at,
            updated_at
          `)
          .single();

        if (error) {
          console.error(
            "UPDATE JOB ERROR:",
            error
          );

          throw error;
        }

        console.log(
          "JOB BERHASIL DIPERBARUI:",
          data
        );

        Alert.alert(
          "Berhasil",
          `Jobdesk "${data.title}" berhasil diperbarui.`,
          [
            {
              text: "OK",
              onPress: () => {
                /*
                 * Kembali ke detail job
                 * yang baru saja diedit.
                 */
                router.replace({
                  pathname:
                    "/admin/job-detail",
                  params: {
                    id: data.id,
                  },
                });
              },
            },
          ]
        );

        return;
      }

      /*
       * ========================================
       * MODE TAMBAH
       * ========================================
       *
       * Hanya bagian ini yang menggunakan INSERT.
       */
      const jobData = {
        employee_id: employeeId,
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline.trim(),
        start_time:
          startTime.trim() || null,
        end_time:
          endTime.trim() || null,

        /*
         * Job baru selalu dimulai dari
         * belum dimulai dan progress 0.
         */
        status: "belum_dimulai",
        progress: 0,
      };

      const {
        data,
        error,
      } = await supabase
        .from("jobs")
        .insert(jobData)
        .select(`
          id,
          employee_id,
          title,
          description,
          priority,
          deadline,
          start_time,
          end_time,
          status,
          progress,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        console.error(
          "INSERT JOB ERROR:",
          error
        );

        throw error;
      }

      console.log(
        "JOB BERHASIL DIBUAT:",
        data
      );

      Alert.alert(
        "Berhasil",
        `Jobdesk berhasil diberikan kepada ${selectedEmployee.nama}.`,
        [
          {
            text: "OK",
            onPress: () => {
              router.replace(
                "/admin/jobdesk"
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "SAVE JOB ERROR:",
        error
      );

      Alert.alert(
        "Gagal",
        error?.message ||
          (
            isEditMode
              ? "Jobdesk gagal diperbarui."
              : "Jobdesk gagal dibuat."
          )
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#4F46E5"
        />

        <Text style={styles.loadingText}>
          {isEditMode
            ? "Memuat jobdesk..."
            : "Memuat data pegawai..."}
        </Text>
      </View>
    );
  }

  /*
   * ==========================================
   * FORM
   * ==========================================
   */
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
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {isEditMode
            ? "Edit Jobdesk"
            : "Tambah Jobdesk"}
        </Text>

        <Text style={styles.subtitle}>
          {isEditMode
            ? "Perbarui informasi jobdesk yang sudah dibuat"
            : "Berikan tugas kepada pegawai"}
        </Text>

        {/* =================================
            MODE EDIT INFO
        ================================== */}
        {isEditMode && (
          <View style={styles.editInfoBox}>
            <Text style={styles.editInfoTitle}>
              Mode Edit
            </Text>

            <Text style={styles.editInfoText}>
              Perubahan hanya berlaku pada
              informasi jobdesk. Progress
              pekerjaan tetap mengikuti
              pembaruan dari pegawai.
            </Text>
          </View>
        )}

        {/* =================================
            PEGAWAI
        ================================== */}
        <Text style={styles.label}>
          Pilih Pegawai *
        </Text>

        {employees.length === 0 ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Tidak ada pegawai aktif.
            </Text>
          </View>
        ) : (
          <View style={styles.employeeList}>
            {employees.map(
              (employee) => {
                const selected =
                  employeeId ===
                  employee.id;

                return (
                  <Pressable
                    key={employee.id}
                    style={[
                      styles.employeeCard,
                      selected &&
                        styles.employeeCardSelected,
                    ]}
                    onPress={() =>
                      setEmployeeId(
                        employee.id
                      )
                    }
                    disabled={saving}
                  >
                    <View
                      style={
                        styles.employeeInfo
                      }
                    >
                      <View
                        style={
                          styles.employeeNameRow
                        }
                      >
                        <Text
                          style={[
                            styles.employeeName,
                            selected &&
                              styles.employeeNameSelected,
                          ]}
                        >
                          {employee.nama}
                        </Text>

                        {isEditMode &&
                          employee.status !==
                            "aktif" && (
                            <View
                              style={
                                styles.inactiveBadge
                              }
                            >
                              <Text
                                style={
                                  styles.inactiveBadgeText
                                }
                              >
                                Tidak Aktif
                              </Text>
                            </View>
                          )}
                      </View>

                      <Text
                        style={[
                          styles.employeeDetail,
                          selected &&
                            styles.employeeDetailSelected,
                        ]}
                      >
                        {employee.jabatan ||
                          employee.divisi ||
                          employee.email}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.radio,
                        selected &&
                          styles.radioSelected,
                      ]}
                    >
                      {selected && (
                        <View
                          style={
                            styles.radioInner
                          }
                        />
                      )}
                    </View>
                  </Pressable>
                );
              }
            )}
          </View>
        )}

        {/* =================================
            JUDUL
        ================================== */}
        <Text style={styles.label}>
          Judul Jobdesk *
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Contoh: Membuat laporan bulanan"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          editable={!saving}
        />

        {/* =================================
            DESKRIPSI
        ================================== */}
        <Text style={styles.label}>
          Deskripsi *
        </Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Masukkan detail pekerjaan..."
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          style={[
            styles.input,
            styles.textArea,
          ]}
          editable={!saving}
        />

        {/* =================================
            PRIORITAS
        ================================== */}
        <Text style={styles.label}>
          Prioritas
        </Text>

        <View
          style={styles.priorityContainer}
        >
          {priorities.map((item) => {
            const selected =
              priority === item.value;

            return (
              <Pressable
                key={item.value}
                style={[
                  styles.priorityButton,
                  selected &&
                    styles.priorityButtonSelected,
                ]}
                onPress={() =>
                  setPriority(
                    item.value
                  )
                }
                disabled={saving}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    selected &&
                      styles.priorityButtonTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* =================================
            DEADLINE
        ================================== */}
        <Text style={styles.label}>
          Deadline *
        </Text>

        <TextInput
          value={deadline}
          onChangeText={setDeadline}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="none"
          editable={!saving}
        />

        <Text style={styles.helper}>
          Contoh: 2026-10-05
        </Text>

        {/* =================================
            JAM MULAI
        ================================== */}
        <Text style={styles.label}>
          Jam Mulai
        </Text>

        <TextInput
          value={startTime}
          onChangeText={setStartTime}
          placeholder="HH:MM:SS"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="none"
          editable={!saving}
        />

        <Text style={styles.helper}>
          Contoh: 08:00:00
        </Text>

        {/* =================================
            JAM SELESAI
        ================================== */}
        <Text style={styles.label}>
          Jam Selesai
        </Text>

        <TextInput
          value={endTime}
          onChangeText={setEndTime}
          placeholder="HH:MM:SS"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="none"
          editable={!saving}
        />

        <Text style={styles.helper}>
          Contoh: 17:00:00
        </Text>

        {/* =================================
            PROGRESS INFO SAAT EDIT
        ================================== */}
        {isEditMode && (
          <View style={styles.progressInfoBox}>
            <View
              style={styles.progressInfoHeader}
            >
              <View
                style={
                  styles.progressInfoContent
                }
              >
                <Text
                  style={
                    styles.progressInfoTitle
                  }
                >
                  Progress Pekerjaan
                </Text>

                <Text
                  style={
                    styles.progressInfoSubtitle
                  }
                >
                  Progress hanya dapat diperbarui
                  oleh pegawai.
                </Text>
              </View>

              <Text
                style={styles.progressNumber}
              >
                {Math.min(
                  Math.max(
                    Number(
                      existingProgress
                    ) || 0,
                    0
                  ),
                  100
                )}
                %
              </Text>
            </View>

            <View
              style={
                styles.progressBackground
              }
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      Math.max(
                        Number(
                          existingProgress
                        ) || 0,
                        0
                      ),
                      100
                    )}%`,
                  },
                ]}
              />
            </View>

            <Text
              style={
                styles.progressReadOnly
              }
            >
              Progress bersifat read-only untuk
              admin.
            </Text>
          </View>
        )}

        {/* =================================
            BUTTON
        ================================== */}
        <Pressable
          style={[
            styles.submitButton,
            saving &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={styles.submitText}
            >
              {isEditMode
                ? "Simpan Perubahan"
                : "Kirim Jobdesk ke Pegawai"}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() =>
            router.back()
          }
          disabled={saving}
        >
          <Text
            style={styles.cancelText}
          >
            Batal
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 20,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },

  editInfoBox: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },

  editInfoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3730A3",
  },

  editInfoText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#4F46E5",
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#111827",
  },

  textArea: {
    minHeight: 120,
  },

  helper: {
    marginTop: 5,
    color: "#9CA3AF",
    fontSize: 11,
  },

  employeeList: {
    gap: 10,
  },

  employeeCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  employeeCardSelected: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },

  employeeInfo: {
    flex: 1,
    paddingRight: 10,
  },

  employeeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  employeeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  employeeNameSelected: {
    color: "#3730A3",
  },

  employeeDetail: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  employeeDetailSelected: {
    color: "#4F46E5",
  },

  inactiveBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  inactiveBadgeText: {
    color: "#6B7280",
    fontSize: 9,
    fontWeight: "700",
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: "#4F46E5",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4F46E5",
  },

  priorityContainer: {
    flexDirection: "row",
    gap: 8,
  },

  priorityButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  priorityButtonSelected: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },

  priorityButtonText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },

  priorityButtonTextSelected: {
    color: "#FFFFFF",
  },

  warningBox: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
  },

  warningText: {
    color: "#92400E",
    fontSize: 13,
  },

  progressInfoBox: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 15,
  },

  progressInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressInfoContent: {
    flex: 1,
    paddingRight: 10,
  },

  progressInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },

  progressInfoSubtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: "#9CA3AF",
  },

  progressNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4F46E5",
  },

  progressBackground: {
    height: 9,
    marginTop: 14,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#4F46E5",
  },

  progressReadOnly: {
    marginTop: 7,
    fontSize: 10,
    color: "#9CA3AF",
  },

  submitButton: {
    marginTop: 28,
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  cancelButton: {
    marginTop: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  cancelText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7FB",
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 14,
  },
});