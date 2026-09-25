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
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

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

export default function JobForm() {
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("sedang");
  const [deadline, setDeadline] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);

      const { data, error } = await supabase
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
        .order("nama", { ascending: true });

      if (error) {
        throw error;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error("FETCH EMPLOYEES ERROR:", error);

      Alert.alert(
        "Gagal",
        error?.message || "Gagal mengambil data pegawai."
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  const validateForm = () => {
    if (!employeeId) {
      Alert.alert("Validasi", "Silakan pilih pegawai.");
      return false;
    }

    if (!title.trim()) {
      Alert.alert("Validasi", "Judul jobdesk wajib diisi.");
      return false;
    }

    if (!description.trim()) {
      Alert.alert("Validasi", "Deskripsi jobdesk wajib diisi.");
      return false;
    }

    if (!deadline.trim()) {
      Alert.alert(
        "Validasi",
        "Deadline wajib diisi. Format: YYYY-MM-DD"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

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

      const selectedEmployee = employees.find(
        (item) => item.id === employeeId
      );

      if (!selectedEmployee) {
        Alert.alert(
          "Error",
          "Data pegawai tidak ditemukan."
        );
        return;
      }

      const jobData = {
        employee_id: employeeId,
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline.trim(),
        start_time: startTime.trim() || null,
        end_time: endTime.trim() || null,
        status: "belum_dimulai",
        progress: 0,
      };

      const { data, error } = await supabase
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
        console.error("INSERT JOB ERROR:", error);
        throw error;
      }

      console.log("JOB BERHASIL DIBUAT:", data);

      Alert.alert(
        "Berhasil",
        `Jobdesk berhasil diberikan kepada ${selectedEmployee.nama}.`,
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/admin/jobdesk");
            },
          },
        ]
      );
    } catch (error) {
      console.error("CREATE JOB ERROR:", error);

      Alert.alert(
        "Gagal",
        error?.message || "Jobdesk gagal dibuat."
      );
    } finally {
      setSaving(false);
    }
  };

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
          Tambah Jobdesk
        </Text>

        <Text style={styles.subtitle}>
          Berikan tugas kepada pegawai
        </Text>

        <Text style={styles.label}>
          Pilih Pegawai *
        </Text>

        {loadingEmployees ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>
              Memuat pegawai...
            </Text>
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Tidak ada pegawai aktif.
            </Text>
          </View>
        ) : (
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
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.label}>
          Judul Jobdesk *
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Contoh: Membuat laporan bulanan"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />

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
        />

        <Text style={styles.label}>
          Prioritas
        </Text>

        <View style={styles.priorityContainer}>
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
                  setPriority(item.value)
                }
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
        />

        <Text style={styles.helper}>
          Contoh: 2026-10-05
        </Text>

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
        />

        <Text style={styles.helper}>
          Contoh: 08:00:00
        </Text>

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
        />

        <Text style={styles.helper}>
          Contoh: 17:00:00
        </Text>

        <Pressable
          style={[
            styles.submitButton,
            saving && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>
              Kirim Jobdesk ke Pegawai
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.cancelText}>
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
    marginBottom: 24,
    color: "#6B7280",
    fontSize: 14,
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

  loadingBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 8,
    color: "#6B7280",
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

  submitButton: {
    marginTop: 28,
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
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
});