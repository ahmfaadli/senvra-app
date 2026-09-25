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

const statuses = [
  {
    value: "belum_dimulai",
    label: "Belum Dimulai",
  },
  {
    value: "sedang_berjalan",
    label: "Sedang Berjalan",
  },
  {
    value: "selesai",
    label: "Selesai",
  },
];

const priorities = [
  {
    value: "rendah",
    label: "Rendah",
  },
  {
    value: "sedang",
    label: "Sedang",
  },
  {
    value: "tinggi",
    label: "Tinggi",
  },
];

export default function JobDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [job, setJob] = useState(null);
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
  const [status, setStatus] = useState("belum_dimulai");
  const [progress, setProgress] = useState("0");

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

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
                status
              )
            `)
            .eq("id", id)
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
            .order("nama", { ascending: true }),
        ]);

      if (jobResult.error) {
        throw jobResult.error;
      }

      if (employeeResult.error) {
        throw employeeResult.error;
      }

      const jobData = jobResult.data;

      setJob(jobData);
      setEmployees(employeeResult.data || []);

      setEmployeeId(jobData.employee_id || "");
      setTitle(jobData.title || "");
      setDescription(jobData.description || "");
      setPriority(jobData.priority || "sedang");
      setDeadline(jobData.deadline || "");
      setStartTime(
        jobData.start_time
          ? String(jobData.start_time).substring(0, 8)
          : ""
      );
      setEndTime(
        jobData.end_time
          ? String(jobData.end_time).substring(0, 8)
          : ""
      );
      setStatus(
        jobData.status || "belum_dimulai"
      );
      setProgress(
        String(jobData.progress ?? 0)
      );
    } catch (error) {
      console.error("LOAD JOB DETAIL ERROR:", error);

      Alert.alert(
        "Gagal",
        error?.message ||
          "Gagal mengambil detail jobdesk."
      );
    } finally {
      setLoading(false);
    }
  };

  const validateProgress = () => {
    const number = Number(progress);

    if (
      Number.isNaN(number) ||
      number < 0 ||
      number > 100
    ) {
      Alert.alert(
        "Validasi",
        "Progress harus berupa angka 0 sampai 100."
      );

      return false;
    }

    return true;
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);

    if (newStatus === "selesai") {
      setProgress("100");
    }

    if (
      newStatus === "belum_dimulai" &&
      Number(progress) > 0
    ) {
      setProgress("0");
    }
  };

  const handleUpdate = async () => {
    if (!title.trim()) {
      Alert.alert(
        "Validasi",
        "Judul jobdesk wajib diisi."
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        "Validasi",
        "Deskripsi jobdesk wajib diisi."
      );
      return;
    }

    if (!employeeId) {
      Alert.alert(
        "Validasi",
        "Pegawai wajib dipilih."
      );
      return;
    }

    if (!deadline.trim()) {
      Alert.alert(
        "Validasi",
        "Deadline wajib diisi."
      );
      return;
    }

    if (!validateProgress()) {
      return;
    }

    try {
      setSaving(true);

      let finalProgress = Number(progress);

      if (status === "selesai") {
        finalProgress = 100;
      }

      if (status === "belum_dimulai") {
        finalProgress = 0;
      }

      const updateData = {
        employee_id: employeeId,
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline.trim(),
        start_time: startTime.trim() || null,
        end_time: endTime.trim() || null,
        status,
        progress: finalProgress,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", id)
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
        console.error("UPDATE JOB ERROR:", error);
        throw error;
      }

      setJob((current) => ({
        ...current,
        ...data,
      }));

      setProgress(String(finalProgress));

      Alert.alert(
        "Berhasil",
        "Jobdesk berhasil diperbarui. Perubahan akan terlihat pada akun pegawai yang menerima jobdesk ini."
      );
    } catch (error) {
      console.error("UPDATE JOB ERROR:", error);

      Alert.alert(
        "Gagal",
        error?.message ||
          "Jobdesk gagal diperbarui."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Hapus Jobdesk",
      "Apakah kamu yakin ingin menghapus jobdesk ini?",
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

              const { error } = await supabase
                .from("jobs")
                .delete()
                .eq("id", id);

              if (error) {
                throw error;
              }

              Alert.alert(
                "Berhasil",
                "Jobdesk berhasil dihapus.",
                [
                  {
                    text: "OK",
                    onPress: () =>
                      router.replace(
                        "/admin/jobdesk"
                      ),
                  },
                ]
              );
            } catch (error) {
              console.error(
                "DELETE JOB ERROR:",
                error
              );

              Alert.alert(
                "Gagal",
                error?.message ||
                  "Jobdesk gagal dihapus."
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Memuat detail jobdesk...
        </Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>
          Jobdesk tidak ditemukan.
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
          Detail Jobdesk
        </Text>

        <Text style={styles.subtitle}>
          Edit pekerjaan yang diberikan kepada pegawai
        </Text>

        <View style={styles.currentEmployeeBox}>
          <Text style={styles.currentEmployeeLabel}>
            Pegawai
          </Text>

          <Text style={styles.currentEmployeeName}>
            {job.profiles?.nama ||
              "Pegawai tidak ditemukan"}
          </Text>

          <Text style={styles.currentEmployeeDetail}>
            {job.profiles?.jabatan ||
              job.profiles?.divisi ||
              job.profiles?.email ||
              ""}
          </Text>
        </View>

        <Text style={styles.label}>
          Penerima Jobdesk
        </Text>

        <View style={styles.employeeList}>
          {employees.map((employee) => {
            const selected =
              employeeId === employee.id;

            return (
              <Pressable
                key={employee.id}
                style={[
                  styles.employeeCard,
                  selected &&
                    styles.employeeCardSelected,
                ]}
                onPress={() =>
                  setEmployeeId(employee.id)
                }
              >
                <View style={styles.employeeInfo}>
                  <Text
                    style={[
                      styles.employeeName,
                      selected &&
                        styles.employeeNameSelected,
                    ]}
                  >
                    {employee.nama}
                  </Text>

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
                      style={styles.radioInner}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>
          Judul Jobdesk
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholder="Judul jobdesk"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>
          Deskripsi
        </Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[
            styles.input,
            styles.textArea,
          ]}
          placeholder="Deskripsi pekerjaan"
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>
          Prioritas
        </Text>

        <View style={styles.optionRow}>
          {priorities.map((item) => {
            const selected =
              priority === item.value;

            return (
              <Pressable
                key={item.value}
                style={[
                  styles.optionButton,
                  selected &&
                    styles.optionButtonSelected,
                ]}
                onPress={() =>
                  setPriority(item.value)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    selected &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>
          Status
        </Text>

        <View style={styles.statusList}>
          {statuses.map((item) => {
            const selected =
              status === item.value;

            return (
              <Pressable
                key={item.value}
                style={[
                  styles.statusButton,
                  selected &&
                    styles.statusButtonSelected,
                ]}
                onPress={() =>
                  handleStatusChange(
                    item.value
                  )
                }
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    selected &&
                      styles.statusButtonTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>
          Progress
        </Text>

        <View style={styles.progressInputRow}>
          <TextInput
            value={progress}
            onChangeText={(value) => {
              const cleaned =
                value.replace(/[^0-9]/g, "");

              setProgress(cleaned);
            }}
            keyboardType="numeric"
            style={[
              styles.input,
              styles.progressInput,
            ]}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.percentText}>
            %
          </Text>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  Math.max(
                    Number(progress) || 0,
                    0
                  ),
                  100
                )}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.label}>
          Deadline
        </Text>

        <TextInput
          value={deadline}
          onChangeText={setDeadline}
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>
          Jam Mulai
        </Text>

        <TextInput
          value={startTime}
          onChangeText={setStartTime}
          style={styles.input}
          placeholder="HH:MM:SS"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>
          Jam Selesai
        </Text>

        <TextInput
          value={endTime}
          onChangeText={setEndTime}
          style={styles.input}
          placeholder="HH:MM:SS"
          placeholderTextColor="#9CA3AF"
        />

        <Pressable
          style={[
            styles.updateButton,
            saving &&
              styles.updateButtonDisabled,
          ]}
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.updateText}>
              Simpan Perubahan
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={saving}
        >
          <Text style={styles.deleteText}>
            Hapus Jobdesk
          </Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={saving}
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
    backgroundColor: "#F6F7FB",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 20,
  },

  currentEmployeeBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    padding: 15,
    marginBottom: 8,
  },

  currentEmployeeLabel: {
    fontSize: 11,
    color: "#6366F1",
    fontWeight: "600",
  },

  currentEmployeeName: {
    marginTop: 4,
    fontSize: 16,
    color: "#312E81",
    fontWeight: "700",
  },

  currentEmployeeDetail: {
    marginTop: 3,
    fontSize: 12,
    color: "#4F46E5",
  },

  label: {
    marginTop: 17,
    marginBottom: 8,
    fontSize: 14,
    color: "#374151",
    fontWeight: "700",
  },

  employeeList: {
    gap: 9,
  },

  employeeCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 13,
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
    marginTop: 3,
    color: "#6B7280",
    fontSize: 12,
  },

  employeeDetailSelected: {
    color: "#4F46E5",
  },

  radio: {
    width: 21,
    height: 21,
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
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#4F46E5",
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
    textAlignVertical: "top",
  },

  optionRow: {
    flexDirection: "row",
    gap: 8,
  },

  optionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  optionButtonSelected: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },

  optionText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },

  optionTextSelected: {
    color: "#FFFFFF",
  },

  statusList: {
    gap: 8,
  },

  statusButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  statusButtonSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },

  statusButtonText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },

  statusButtonTextSelected: {
    color: "#4F46E5",
  },

  progressInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  progressInput: {
    flex: 1,
  },

  percentText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },

  progressBackground: {
    marginTop: 10,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
  },

  updateButton: {
    marginTop: 30,
    backgroundColor: "#4F46E5",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  updateButtonDisabled: {
    opacity: 0.6,
  },

  updateText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  deleteButton: {
    marginTop: 12,
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  deleteText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 14,
  },

  backButton: {
    marginTop: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  backText: {
    color: "#6B7280",
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
  },

  notFound: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
});