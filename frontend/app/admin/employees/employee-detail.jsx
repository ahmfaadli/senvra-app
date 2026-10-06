import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../services/supabase";

export default function EmployeeDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      setEmployee(data);
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Gagal",
        "Data pegawai tidak ditemukan."
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = () => {
    Alert.alert(
      "Hapus Pegawai",
      "Apakah kamu yakin ingin menghapus data pegawai ini?",
      [
        {
          text: "Batal",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("profiles")
              .delete()
              .eq("id", id);

            if (error) {
              Alert.alert(
                "Gagal",
                error?.message
              );
              return;
            }

            Alert.alert(
              "Berhasil",
              "Data pegawai berhasil dihapus."
            );

            router.replace("/admin/employees");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#175CD3"
          />

          <Text style={styles.loadingText}>
            Memuat detail pegawai...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.center}>
          <View style={styles.notFoundIcon}>
            <Ionicons
              name="person-outline"
              size={30}
              color="#175CD3"
            />
          </View>

          <Text style={styles.notFound}>
            Data pegawai tidak ditemukan.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.notFoundBackButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color="#344054"
            />

            <Text style={styles.notFoundBackText}>
              Kembali
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* =========================
              HEADER
          ========================= */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="arrow-back"
                  size={21}
                  color="#101828"
                />
              </Pressable>

              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>
                  Detail Pegawai
                </Text>

                <Text style={styles.headerSubtitle}>
                  Informasi lengkap data pegawai
                </Text>
              </View>
            </View>
          </View>

          {/* =========================
              PROFILE PEGAWAI
          ========================= */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(employee?.name || "P")
                    .substring(0, 2)
                    .toUpperCase()}
                </Text>
              </View>

              <View style={styles.profileInfo}>
                <Text
                  style={styles.name}
                  numberOfLines={2}
                >
                  {employee?.name || "-"}
                </Text>

                <Text style={styles.position}>
                  {employee?.jabatan || "-"}
                </Text>

                <View style={styles.status}>
                  <View style={styles.statusDot} />

                  <Text style={styles.statusText}>
                    {employee?.status || "Aktif"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* =========================
              INFORMASI PEGAWAI
          ========================= */}
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
                INFORMASI PEGAWAI
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <Info
              icon="person-outline"
              label="Nama"
              value={employee?.name}
            />

            <Info
              icon="mail-outline"
              label="Email"
              value={employee?.email}
            />

            <Info
              icon="call-outline"
              label="Nomor HP"
              value={employee?.no_hp}
            />

            <Info
              icon="briefcase-outline"
              label="Jabatan"
              value={employee?.jabatan}
            />

            <Info
              icon="business-outline"
              label="Divisi"
              value={employee?.divisi}
            />

            <Info
              icon="shield-outline"
              label="Role"
              value={employee?.role}
            />

            <Info
              icon="checkmark-circle-outline"
              label="Status"
              value={employee?.status}
              last
            />
          </View>

          {/* =========================
              AKSI
          ========================= */}
          <View style={styles.actionContainer}>

            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                router.push(
                  `/admin/employee-form?id=${employee?.id}`
                )
              }
            >
              <Ionicons
                name="create-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.editText}>
                Edit Data Pegawai
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}
              onPress={deleteEmployee}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="#D92D20"
              />

              <Text style={styles.deleteText}>
                Hapus Data Pegawai
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Info({
  icon,
  label,
  value,
  last,
}) {
  return (
    <View
      style={[
        styles.infoRow,
        last && styles.infoLast,
      ]}
    >
      <View style={styles.infoLabelRow}>
        <Ionicons
          name={icon}
          size={15}
          color="#667085"
        />

        <Text style={styles.label}>
          {label}
        </Text>
      </View>

      <Text
        style={[
          styles.value,
          label === "Status" &&
            value === "aktif" &&
            styles.activeText,
        ]}
        numberOfLines={3}
      >
        {value || "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // =========================
  // SAFE AREA
  // =========================
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

  // =========================
  // HEADER
  // =========================
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

  backButton: {
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

  backButtonPressed: {
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

  // =========================
  // PROFILE
  // =========================
  profileCard: {
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

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#175CD3",
    fontSize: 20,
    fontWeight: "900",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 13,
  },

  name: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: "#101828",
  },

  position: {
    marginTop: 4,
    fontSize: 13,
    color: "#667085",
  },

  status: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#ECFDF3",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#039855",
    marginRight: 6,
  },

  statusText: {
    color: "#039855",
    fontSize: 11,
    fontWeight: "800",
  },

  // =========================
  // CARD
  // =========================
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

  // =========================
  // SECTION
  // =========================
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

  // =========================
  // INFORMATION
  // =========================
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
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },

  infoLast: {
    borderBottomWidth: 0,
  },

  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.9,
  },

  label: {
    marginLeft: 6,
    fontSize: 12,
    color: "#667085",
    fontWeight: "600",
  },

  value: {
    flex: 1.5,
    fontSize: 13,
    color: "#344054",
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 19,
  },

  activeText: {
    color: "#039855",
  },

  // =========================
  // ACTION
  // =========================
  actionContainer: {
    marginHorizontal: 20,
    marginTop: 2,
  },

  editButton: {
    minHeight: 46,
    marginTop: 13,
    borderRadius: 12,
    backgroundColor: "#175CD3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  editText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  deleteButton: {
    minHeight: 46,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#FEF3F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  deleteText: {
    color: "#D92D20",
    fontSize: 13,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.7,
  },

  deleteButtonPressed: {
    opacity: 0.7,
  },

  // =========================
  // LOADING
  // =========================
  center: {
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

  // =========================
  // NOT FOUND
  // =========================
  notFoundIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  notFound: {
    fontSize: 17,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
  },

  notFoundBackButton: {
    marginTop: 18,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  notFoundBackText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#344054",
  },
});