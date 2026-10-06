import React, { useCallback, useState } from "react";

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

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useFocusEffect, useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../../../services/supabase";

export default function AdminAttendance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // =========================================================
  // FORMAT TANGGAL
  // =========================================================

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");

    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    if (!year || !month || !day) {
      return dateString;
    }

    return `${day} ${monthNames[Number(month) - 1]} ${year}`;
  };

  const formatTime = (time) => {
    if (!time) return "-";

    return String(time).substring(0, 5);
  };

  // =========================================================
  // LOAD KEHADIRAN HARI INI
  // =========================================================

  const loadAttendance = async () => {
    try {
      setLoading(true);

      // Selalu gunakan tanggal hari ini
      const today = formatDateLocal(new Date());

      console.log("=================================");
      console.log("LOAD ATTENDANCE HARI INI");
      console.log("TANGGAL:", today);

      // =====================================================
      // AMBIL DATA ABSENSI HARI INI
      // =====================================================

      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          user_id,
          tanggal_absen,
          jam_masuk,
          status,
          created_at
        `)
        .eq("tanggal_absen", today)
        .order("jam_masuk", {
          ascending: false,
        });

      if (error) {
        console.error("ATTENDANCE ERROR:", error);
        throw error;
      }

      const attendanceData = data || [];

      // =====================================================
      // AMBIL ID PEGAWAI
      // =====================================================

      const userIds = [
        ...new Set(
          attendanceData
            .map((item) => item.user_id)
            .filter(Boolean)
        ),
      ];

      let profiles = [];

      // =====================================================
      // AMBIL DATA PROFILE
      // =====================================================

      if (userIds.length > 0) {
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            nama,
            email,
            jabatan,
            divisi,
            status
          `)
          .in("id", userIds);

        if (profileError) {
          console.error("PROFILE ERROR:", profileError);
          throw profileError;
        }

        profiles = profileData || [];
      }

      // =====================================================
      // GABUNG ATTENDANCE + PROFILE
      // =====================================================

      const mergedData = attendanceData.map((item) => {
        const employee = profiles.find(
          (profile) => profile.id === item.user_id
        );

        return {
          ...item,
          employee: employee || null,
        };
      });

      console.log(
        "Jumlah kehadiran hari ini:",
        mergedData.length
      );

      setAttendance(mergedData);
    } catch (error) {
      console.error("LOAD ATTENDANCE ERROR:", error);

      Alert.alert(
        "Gagal",
        error?.message ||
          "Gagal mengambil data kehadiran hari ini."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // LOAD SAAT SCREEN FOCUS
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [])
  );

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAttendance();
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredAttendance = attendance.filter((item) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    const name =
      item?.employee?.nama?.toLowerCase() || "";

    const email =
      item?.employee?.email?.toLowerCase() || "";

    const jabatan =
      item?.employee?.jabatan?.toLowerCase() || "";

    const divisi =
      item?.employee?.divisi?.toLowerCase() || "";

    return (
      name.includes(keyword) ||
      email.includes(keyword) ||
      jabatan.includes(keyword) ||
      divisi.includes(keyword)
    );
  });

  // =========================================================
  // LOADING
  // =========================================================

  if (loading && attendance.length === 0) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
        edges={[
          "top",
          "left",
          "right",
          "bottom",
        ]}
      >
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text style={styles.loadingText}>
          Memuat data kehadiran...
        </Text>
      </SafeAreaView>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: 45 + insets.bottom,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#175CD3"]}
            tintColor="#175CD3"
            title="Memuat ulang..."
          />
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#101828"
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Daftar Kehadiran
            </Text>

            <Text style={styles.subtitle}>
              Kehadiran pegawai hari ini.
            </Text>
          </View>
        </View>

        {/* =================================================
            DATE INFO
        ================================================= */}

        <View style={styles.dateCard}>
          <View style={styles.dateIcon}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#175CD3"
            />
          </View>

          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>
              Kehadiran Hari Ini
            </Text>

            <Text style={styles.dateValue}>
              {formatDisplayDate(
                formatDateLocal(new Date())
              )}
            </Text>
          </View>

          <View style={styles.todayBadge}>
            <View style={styles.todayDot} />

            <Text style={styles.todayText}>
              Hari Ini
            </Text>
          </View>
        </View>

        {/* =================================================
            SEARCH
        ================================================= */}

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={19}
            color="#98A2B3"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama pegawai..."
            placeholderTextColor="#98A2B3"
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch("")}
              hitSlop={8}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#98A2B3"
              />
            </Pressable>
          )}
        </View>

        {/* =================================================
            SECTION HEADER
        ================================================= */}

        <View style={styles.resultHeader}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="people-outline"
                size={16}
                color="#175CD3"
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                KEHADIRAN HARI INI
              </Text>

              <Text style={styles.sectionSubtitle}>
                {filteredAttendance.length} pegawai hadir
              </Text>
            </View>
          </View>

          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>
              {filteredAttendance.length}
            </Text>
          </View>
        </View>

        {/* =================================================
            ATTENDANCE LIST
        ================================================= */}

        <View style={styles.list}>
          {filteredAttendance.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={
                    search
                      ? "search-outline"
                      : "calendar-clear-outline"
                  }
                  size={28}
                  color="#175CD3"
                />
              </View>

              <Text style={styles.emptyTitle}>
                {search
                  ? "Pegawai tidak ditemukan"
                  : "Belum ada kehadiran"}
              </Text>

              <Text style={styles.emptyText}>
                {search
                  ? `Tidak ada pegawai dengan kata kunci "${search}".`
                  : "Belum ada pegawai yang melakukan absensi hari ini."}
              </Text>
            </View>
          ) : (
            filteredAttendance.map((item) => {
              const employee = item?.employee;

              const initial =
                employee?.nama
                  ?.charAt(0)
                  ?.toUpperCase() || "?";

              return (
                <View
                  key={item.id}
                  style={styles.attendanceCard}
                >
                  {/* AVATAR */}

                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {initial}
                    </Text>
                  </View>

                  {/* INFO PEGAWAI */}

                  <View style={styles.employeeInfo}>
                    <Text
                      style={styles.employeeName}
                      numberOfLines={1}
                    >
                      {employee?.nama || "Pegawai"}
                    </Text>

                    <Text
                      style={styles.employeePosition}
                      numberOfLines={1}
                    >
                      {employee?.jabatan ||
                        employee?.divisi ||
                        "Pegawai"}
                    </Text>

                    <View style={styles.timeRow}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color="#667085"
                      />

                      <Text style={styles.timeText}>
                        Masuk{" "}
                        {formatTime(item?.jam_masuk)}
                      </Text>
                    </View>
                  </View>

                  {/* STATUS */}

                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />

                    <Text style={styles.statusText}>
                      {item?.status || "Hadir"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================
// STYLE
// =========================================================

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
    paddingTop: 16,
  },

  // =======================================================
  // LOADING
  // =======================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
  },

  // =======================================================
  // HEADER
  // =======================================================

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 5,
    marginBottom: 16,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  headerText: {
    flex: 1,
    paddingTop: 1,
    paddingRight: 5,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#101828",
  },

  subtitle: {
    marginTop: 5,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },

  // =======================================================
  // DATE CARD
  // =======================================================

  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",
    marginBottom: 12,

    shadowColor: "#101828",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  dateIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  dateInfo: {
    flex: 1,
    marginLeft: 11,
  },

  dateLabel: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "600",
  },

  dateValue: {
    marginTop: 3,
    color: "#101828",
    fontSize: 14,
    fontWeight: "800",
  },

  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#039855",
    marginRight: 6,
  },

  todayText: {
    color: "#039855",
    fontSize: 10,
    fontWeight: "800",
  },

  // =======================================================
  // SEARCH
  // =======================================================

  searchContainer: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 12,
    paddingHorizontal: 13,
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: "#101828",
    fontSize: 13,
  },

  // =======================================================
  // SECTION
  // =======================================================

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#667085",
    letterSpacing: 0.5,
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#98A2B3",
    fontSize: 11,
    fontWeight: "600",
  },

  totalBadge: {
    minWidth: 34,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  totalBadgeText: {
    color: "#175CD3",
    fontSize: 12,
    fontWeight: "900",
  },

  // =======================================================
  // LIST
  // =======================================================

  list: {
    gap: 10,
  },

  attendanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
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

  // =======================================================
  // AVATAR
  // =======================================================

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#175CD3",
    fontSize: 18,
    fontWeight: "800",
  },

  // =======================================================
  // EMPLOYEE INFO
  // =======================================================

  employeeInfo: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  employeeName: {
    color: "#101828",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },

  employeePosition: {
    color: "#667085",
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  timeText: {
    marginLeft: 4,
    color: "#667085",
    fontSize: 11,
    fontWeight: "600",
  },

  // =======================================================
  // STATUS
  // =======================================================

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#039855",
    marginRight: 6,
  },

  statusText: {
    color: "#039855",
    fontSize: 10,
    fontWeight: "800",
  },

  // =======================================================
  // EMPTY
  // =======================================================

  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
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

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 7,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});