import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function AdminEmployees() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ==========================================
  // RESPONSIVE
  // ==========================================

  const isVerySmall = width < 340;
  const isSmall = width < 380;
  const isTablet = width >= 600;

  const horizontalPadding = isTablet
    ? 32
    : isVerySmall
    ? 14
    : isSmall
    ? 16
    : 20;

  // ==========================================
  // MENGAMBIL DATA PEGAWAI AKTIF
  // ==========================================

  const loadEmployees = useCallback(async () => {
    try {
      console.log("=================================");
      console.log("MENGAMBIL DATA PEGAWAI AKTIF");
      console.log("=================================");

      /*
       * Ambil semua profile yang status-nya aktif.
       *
       * Jangan langsung menggunakan:
       *
       * .eq("role", "pegawai")
       *
       * karena Dashboard menggunakan aturan:
       * semua profile selain admin dianggap pegawai.
       */

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          nama,
          email,
          role,
          jabatan,
          divisi,
          status
        `)
        .eq("status", "aktif")
        .order("nama", { ascending: true });

      if (error) {
        console.log("GAGAL MENGAMBIL DATA PROFILE:");
        console.log(error);

        Alert.alert(
          "Gagal",
          error.message || "Gagal mengambil data pegawai."
        );

        return;
      }

      console.log("=================================");
      console.log("SEMUA PROFILE AKTIF");
      console.log("JUMLAH:", data?.length || 0);
      console.log("DATA:", data);
      console.log("=================================");

      /*
       * Filter:
       *
       * Admin      -> tidak ditampilkan
       * Administrator -> tidak ditampilkan
       *
       * Selain itu -> dianggap sebagai pegawai.
       */

      const employeeData = (data || []).filter((profile) => {
        const role = String(profile.role || "")
          .trim()
          .toLowerCase();

        return role !== "admin" && role !== "administrator";
      });

      console.log("=================================");
      console.log("TOTAL PEGAWAI AKTIF:", employeeData.length);
      console.log("DATA PEGAWAI:", employeeData);
      console.log("=================================");

      setEmployees(employeeData);
    } catch (error) {
      console.log("ERROR LOAD EMPLOYEES:", error);

      Alert.alert(
        "Gagal",
        "Terjadi kesalahan saat mengambil data pegawai."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ==========================================
  // LOAD SAAT HALAMAN DIBUKA
  // ==========================================

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmployees();
  };

  // ==========================================
  // DETAIL PEGAWAI
  // ==========================================

  const handleEmployeePress = (employee) => {
    router.push({
      pathname: "/admin/employee-detail",
      params: {
        id: employee.id,
      },
    });
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator
            size="large"
            color="#175CD3"
          />
        </View>

        <Text style={styles.loadingTitle}>
          Memuat Data Pegawai
        </Text>

        <Text style={styles.loadingText}>
          Mengambil data dari database...
        </Text>
      </View>
    );
  }

  // ==========================================
  // HALAMAN UTAMA
  // ==========================================

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#175CD3"]}
            tintColor="#175CD3"
          />
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {/* ==========================================
            HEADER
        ========================================== */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: isTablet
                    ? 32
                    : isVerySmall
                    ? 24
                    : 28,
                },
              ]}
            >
              Pegawai
            </Text>

            <Text style={styles.subtitle}>
              Daftar pegawai aktif
            </Text>
          </View>

          <View style={styles.totalBox}>
            <Text
              style={[
                styles.totalNumber,
                {
                  fontSize: isTablet ? 24 : 22,
                },
              ]}
            >
              {employees.length}
            </Text>

            <Text style={styles.totalLabel}>
              Aktif
            </Text>
          </View>
        </View>

        {/* ==========================================
            INFO
        ========================================== */}

        <View style={styles.infoBox}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="people-outline"
              size={22}
              color="#175CD3"
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Pegawai Aktif
            </Text>

            <Text style={styles.infoText}>
              Data ditampilkan langsung dari database
              Supabase.
            </Text>
          </View>
        </View>

        {/* ==========================================
            SECTION TITLE
        ========================================== */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Daftar Pegawai
          </Text>

          <Text style={styles.sectionCount}>
            {employees.length} pegawai aktif
          </Text>
        </View>

        {/* ==========================================
            EMPTY
        ========================================== */}

        {employees.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={35}
                color="#98A2B3"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Belum ada pegawai aktif
            </Text>

            <Text style={styles.emptyText}>
              Belum ditemukan data pegawai dengan
              status aktif.
            </Text>
          </View>
        ) : (
          /* ==========================================
             LIST PEGAWAI
          ========================================== */

          <View style={styles.list}>
            {employees.map((employee) => (
              <Pressable
                key={employee.id}
                onPress={() =>
                  handleEmployeePress(employee)
                }
                style={({ pressed }) => [
                  styles.employeeCard,
                  pressed &&
                    styles.employeeCardPressed,
                ]}
              >
                {/* ==================================
                    AVATAR
                ================================== */}

                <View
                  style={[
                    styles.avatar,
                    {
                      width: isTablet ? 58 : 52,
                      height: isTablet ? 58 : 52,
                      borderRadius: isTablet ? 29 : 26,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      {
                        fontSize: isTablet ? 22 : 20,
                      },
                    ]}
                  >
                    {getInitial(employee.nama)}
                  </Text>
                </View>

                {/* ==================================
                    DATA PEGAWAI
                ================================== */}

                <View style={styles.employeeInfo}>
                  <Text
                    style={[
                      styles.employeeName,
                      {
                        fontSize: isTablet ? 16 : 15,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {employee.nama || "-"}
                  </Text>

                  <Text
                    style={styles.employeeEmail}
                    numberOfLines={1}
                  >
                    {employee.email || "-"}
                  </Text>

                  {/* JABATAN */}

                  <View style={styles.detailRow}>
                    <Ionicons
                      name="briefcase-outline"
                      size={14}
                      color="#667085"
                    />

                    <Text
                      style={styles.detailText}
                      numberOfLines={1}
                    >
                      {employee.jabatan || "-"}
                    </Text>
                  </View>

                  {/* DIVISI */}

                  <View style={styles.detailRow}>
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color="#667085"
                    />

                    <Text
                      style={styles.detailText}
                      numberOfLines={1}
                    >
                      {employee.divisi || "-"}
                    </Text>
                  </View>
                </View>

                {/* ==================================
                    RIGHT SIDE
                ================================== */}

                <View style={styles.rightSide}>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />

                    <Text style={styles.statusText}>
                      Aktif
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#98A2B3"
                    style={styles.arrow}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ==========================================
// FUNGSI INITIAL NAMA
// ==========================================

function getInitial(name) {
  if (!name) {
    return "?";
  }

  return name
    .trim()
    .charAt(0)
    .toUpperCase();
}

// ==========================================
// STYLE
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    paddingTop: 20,
    paddingBottom: 120,
  },

  // ========================================
  // LOADING
  // ========================================

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingTitle: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: "800",
    color: "#101828",
  },

  loadingText: {
    marginTop: 5,
    fontSize: 13,
    color: "#667085",
  },

  // ========================================
  // HEADER
  // ========================================

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#101828",
  },

  subtitle: {
    fontSize: 14,
    color: "#667085",
    marginTop: 5,
  },

  totalBox: {
    minWidth: 65,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
  },

  totalNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#175CD3",
  },

  totalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#175CD3",
    marginTop: 2,
  },

  // ========================================
  // INFO
  // ========================================

  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 25,
  },

  infoIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#101828",
  },

  infoText: {
    fontSize: 12,
    color: "#667085",
    marginTop: 4,
    lineHeight: 18,
  },

  // ========================================
  // SECTION
  // ========================================

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#101828",
  },

  sectionCount: {
    fontSize: 12,
    color: "#98A2B3",
    marginTop: 3,
  },

  // ========================================
  // LIST
  // ========================================

  list: {
    gap: 12,
  },

  employeeCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  employeeCardPressed: {
    opacity: 0.7,
  },

  // ========================================
  // AVATAR
  // ========================================

  avatar: {
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#175CD3",
  },

  // ========================================
  // EMPLOYEE INFO
  // ========================================

  employeeInfo: {
    flex: 1,
    marginLeft: 13,
    minWidth: 0,
  },

  employeeName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#101828",
  },

  employeeEmail: {
    fontSize: 12,
    color: "#667085",
    marginTop: 3,
    marginBottom: 7,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  detailText: {
    flex: 1,
    fontSize: 11,
    color: "#667085",
    marginLeft: 5,
  },

  // ========================================
  // RIGHT SIDE
  // ========================================

  rightSide: {
    alignItems: "flex-end",
    marginLeft: 8,
    flexShrink: 0,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#12B76A",
    marginRight: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#027A48",
  },

  arrow: {
    marginTop: 12,
  },

  // ========================================
  // EMPTY
  // ========================================

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
  },

  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#101828",
  },

  emptyText: {
    fontSize: 12,
    color: "#667085",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
});