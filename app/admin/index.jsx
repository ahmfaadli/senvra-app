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
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [stats, setStats] = useState({
    employees: 0,
    jobs: 0,
    meetings: 0,
    requests: 0,
    attendance: 0,
  });

  // =====================================================
  // RESPONSIVE
  // =====================================================

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

  const gridGap = isTablet ? 16 : isVerySmall ? 8 : 12;

  const cardWidth =
    (width - horizontalPadding * 2 - gridGap) / 2;

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = useCallback(async () => {
    try {
      const today = new Date()
        .toISOString()
        .split("T")[0];

      // =================================================
      // TOTAL PEGAWAI
      // =================================================

      const profilesResult = await supabase
        .from("profiles")
        .select("id, nama, role, status");

      if (profilesResult.error) {
        console.log(
          "PROFILE ERROR:",
          profilesResult.error
        );
      }

      let employeeCount = 0;

      if (
        !profilesResult.error &&
        profilesResult.data
      ) {
        /*
          ADMIN TIDAK DIHITUNG SEBAGAI PEGAWAI.

          Semua profile yang role-nya bukan:
          - admin
          - administrator

          dianggap sebagai pegawai.

          Kita tidak menggunakan status di sini
          supaya total pegawai tidak salah hanya
          karena status profile salah isi.
        */

        employeeCount =
          profilesResult.data.filter((profile) => {
            const role = String(
              profile.role || ""
            )
              .trim()
              .toLowerCase();

            return (
              role !== "admin" &&
              role !== "administrator"
            );
          }).length;
      }

      console.log(
        "TOTAL PROFILE:",
        profilesResult.data?.length || 0
      );

      console.log(
        "TOTAL PEGAWAI:",
        employeeCount
      );

      console.log(
        "DATA PROFILE:",
        profilesResult.data
      );

      // =================================================
      // TOTAL JOBDESK
      // =================================================

      const jobsResult = await supabase
        .from("jobs")
        .select("id");

      const jobCount =
        !jobsResult.error &&
        jobsResult.data
          ? jobsResult.data.length
          : 0;

      // =================================================
      // TOTAL MEETING
      // =================================================

      const meetingsResult = await supabase
        .from("meetings")
        .select("id");

      const meetingCount =
        !meetingsResult.error &&
        meetingsResult.data
          ? meetingsResult.data.length
          : 0;

      // =================================================
      // PENGAJUAN PENDING
      // =================================================

      const requestsResult = await supabase
        .from("surat_requests")
        .select("id, status");

      let pendingRequestCount = 0;

      if (
        !requestsResult.error &&
        requestsResult.data
      ) {
        pendingRequestCount =
          requestsResult.data.filter(
            (request) => {
              const status = String(
                request.status || ""
              )
                .trim()
                .toLowerCase();

              return (
                status === "pending" ||
                status === "menunggu" ||
                status === "diajukan"
              );
            }
          ).length;
      }

      // =================================================
      // ABSENSI HARI INI
      // =================================================

      const attendanceResult = await supabase
        .from("attendance")
        .select("id, tanggal_absen");

      let attendanceCount = 0;

      if (
        !attendanceResult.error &&
        attendanceResult.data
      ) {
        attendanceCount =
          attendanceResult.data.filter(
            (attendance) =>
              attendance.tanggal_absen === today
          ).length;
      }

      // =================================================
      // SET DATA
      // =================================================

      setStats({
        employees: employeeCount,
        jobs: jobCount,
        meetings: meetingCount,
        requests: pendingRequestCount,
        attendance: attendanceCount,
      });
    } catch (error) {
      console.log(
        "DASHBOARD ERROR:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // =====================================================
  // RELOAD SAAT KEMBALI KE SCREEN
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  // =====================================================
  // REFRESH
  // =====================================================

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    Alert.alert(
      "Keluar",
      "Apakah Anda yakin ingin keluar dari akun?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Keluar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoggingOut(true);

              const { error } =
                await supabase.auth.signOut();

              if (error) {
                throw error;
              }

              // Bersihkan stack halaman admin
              router.replace("/login");
            } catch (error) {
              console.log(
                "LOGOUT ERROR:",
                error
              );

              Alert.alert(
                "Gagal",
                "Gagal keluar dari akun. Silakan coba lagi."
              );
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // =====================================================
  // MENU UTAMA
  // =====================================================

  const mainMenus = [
    {
      title: "Data Pegawai",
      icon: "people",
      route: "/admin/employees",
      accent: "#7C3AED",
      background: "#F3E8FF",
    },
    {
      title: "Jobdesk",
      icon: "briefcase",
      route: "/admin/jobdesk",
      accent: "#EC4899",
      background: "#FCE7F3",
    },
    {
      title: "Meeting",
      icon: "videocam",
      route: "/admin/meetings",
      accent: "#06B6D4",
      background: "#CFFAFE",
    },
    {
      title: "Absensi",
      icon: "calendar",
      route: "/admin/attendance",
      accent: "#10B981",
      background: "#D1FAE5",
    },
  ];

  // =====================================================
  // MENU LAINNYA
  // =====================================================

  const secondaryMenus = [
    {
      title: "Pengajuan Surat",
      icon: "document-text-outline",
      route: "/admin/requests",
      accent: "#F59E0B",
    },
    {
      title: "Notifikasi",
      icon: "notifications-outline",
      route: "/admin/notifications",
      accent: "#EF4444",
    },
    {
      title: "Laporan",
      icon: "bar-chart-outline",
      route: "/admin/reports",
      accent: "#8B5CF6",
    },
  ];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />
        </View>

        <Text style={styles.loadingTitle}>
          Memuat Dashboard
        </Text>

        <Text style={styles.loadingText}>
          Mengambil data terbaru...
        </Text>
      </View>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={{
          paddingBottom: isTablet ? 60 : 40,
        }}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View
          style={[
            styles.header,
            {
              paddingHorizontal:
                horizontalPadding,
              minHeight: isTablet ? 220 : 190,
            },
          ]}
        >
          {/* HEADER TOP */}

          <View style={styles.headerTop}>
            <View style={styles.headerActions}>
              {/* NOTIFICATION */}

              <Pressable
                style={({ pressed }) => [
                  styles.headerActionButton,
                  pressed &&
                    styles.headerActionPressed,
                ]}
                onPress={() =>
                  router.push(
                    "/admin/notifications"
                  )
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={21}
                  color="#FFFFFF"
                />

                {stats.requests > 0 && (
                  <View
                    style={
                      styles.notificationBadge
                    }
                  >
                    <Text
                      style={
                        styles.notificationBadgeText
                      }
                    >
                      {stats.requests > 9
                        ? "9+"
                        : stats.requests}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* LOGOUT */}

              <Pressable
                style={({ pressed }) => [
                  styles.headerActionButton,
                  pressed &&
                    styles.headerActionPressed,
                ]}
                onPress={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>
          </View>

          {/* HEADER CONTENT */}

          <View style={styles.headerContent}>
            <Text style={styles.headerSmallText}>
              Selamat datang,
            </Text>

            <Text
              style={[
                styles.headerTitle,
                {
                  fontSize: isTablet
                    ? 32
                    : isVerySmall
                    ? 24
                    : 27,
                },
              ]}
            >
              Admin
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Kelola aktivitas dan data pegawai
              dengan mudah.
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <View
          style={[
            styles.content,
            {
              paddingHorizontal:
                horizontalPadding,
            },
          ]}
        >
          {/* ================================================= */}
          {/* SUMMARY */}
          {/* ================================================= */}

          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryLabel}>
                Hadir Hari Ini
              </Text>

              <View
                style={styles.summaryNumberRow}
              >
                <Text
                  style={[
                    styles.summaryNumber,
                    {
                      fontSize: isTablet
                        ? 34
                        : 28,
                    },
                  ]}
                >
                  {stats.attendance}
                </Text>

                <Text
                  style={styles.summaryPeople}
                >
                  pegawai
                </Text>
              </View>

              <Text
                style={
                  styles.summaryDescription
                }
              >
                Data kehadiran hari ini
              </Text>
            </View>

            <View style={styles.summaryIcon}>
              <Ionicons
                name="checkmark-circle"
                size={32}
                color="#2563EB"
              />
            </View>
          </View>

          {/* ================================================= */}
          {/* MENU UTAMA */}
          {/* ================================================= */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Menu Utama
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Kelola kebutuhan administrasi
            </Text>
          </View>

          <View
            style={[
              styles.mainGrid,
              {
                columnGap: gridGap,
                rowGap: gridGap,
              },
            ]}
          >
            {mainMenus.map((menu) => (
              <Pressable
                key={menu.route}
                style={[
                  styles.mainMenuCard,
                  {
                    width: cardWidth,
                    borderLeftColor:
                      menu.accent,
                    minHeight: isTablet
                      ? 155
                      : 140,
                  },
                ]}
                onPress={() =>
                  router.push(menu.route)
                }
              >
                <View
                  style={[
                    styles.mainMenuIcon,
                    {
                      backgroundColor:
                        menu.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={menu.icon}
                    size={25}
                    color={menu.accent}
                  />
                </View>

                <Text
                  style={
                    styles.mainMenuTitle
                  }
                  numberOfLines={2}
                >
                  {menu.title}
                </Text>

                <View
                  style={[
                    styles.menuArrow,
                    {
                      backgroundColor:
                        menu.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color={menu.accent}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          {/* ================================================= */}
          {/* INFORMASI CEPAT */}
          {/* ================================================= */}

          <Text style={styles.sectionTitle}>
            Informasi Cepat
          </Text>

          <View
            style={[
              styles.quickInfoContainer,
              {
                columnGap: gridGap,
                rowGap: gridGap,
              },
            ]}
          >
            <QuickInfo
              icon="people-outline"
              label="Total Pegawai"
              value={stats.employees}
              accent="#7C3AED"
              width={cardWidth}
              onPress={() =>
                router.push(
                  "/admin/employees"
                )
              }
            />

            <QuickInfo
              icon="briefcase-outline"
              label="Total Jobdesk"
              value={stats.jobs}
              accent="#EC4899"
              width={cardWidth}
              onPress={() =>
                router.push(
                  "/admin/jobdesk"
                )
              }
            />

            <QuickInfo
              icon="videocam-outline"
              label="Total Meeting"
              value={stats.meetings}
              accent="#06B6D4"
              width={cardWidth}
              onPress={() =>
                router.push(
                  "/admin/meetings"
                )
              }
            />

            <QuickInfo
              icon="document-text-outline"
              label="Pengajuan Pending"
              value={stats.requests}
              accent="#F59E0B"
              width={cardWidth}
              onPress={() =>
                router.push(
                  "/admin/requests"
                )
              }
            />
          </View>

          {/* ================================================= */}
          {/* MENU LAINNYA */}
          {/* ================================================= */}

          <Text style={styles.sectionTitle}>
            Menu Lainnya
          </Text>

          <View
            style={styles.secondaryContainer}
          >
            {secondaryMenus.map(
              (menu, index) => (
                <Pressable
                  key={menu.route}
                  style={[
                    styles.secondaryMenu,
                    index ===
                      secondaryMenus.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                  onPress={() =>
                    router.push(menu.route)
                  }
                >
                  <View
                    style={[
                      styles.secondaryIcon,
                      {
                        backgroundColor:
                          `${menu.accent}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={menu.icon}
                      size={21}
                      color={menu.accent}
                    />
                  </View>

                  <Text
                    style={
                      styles.secondaryTitle
                    }
                    numberOfLines={1}
                  >
                    {menu.title}
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color="#98A2B3"
                  />
                </Pressable>
              )
            )}
          </View>

          {/* ================================================= */}
          {/* ABSENSI */}
          {/* ================================================= */}

          <Pressable
            style={styles.attendanceCard}
            onPress={() =>
              router.push(
                "/admin/attendance"
              )
            }
          >
            <View
              style={styles.attendanceIcon}
            >
              <Ionicons
                name="calendar-check-outline"
                size={25}
                color="#10B981"
              />
            </View>

            <View
              style={styles.attendanceInfo}
            >
              <Text
                style={
                  styles.attendanceTitle
                }
              >
                Lihat Absensi
              </Text>

              <Text
                style={
                  styles.attendanceSubtitle
                }
              >
                Cek siapa saja yang sudah hadir
                hari ini
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#98A2B3"
            />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// =====================================================
// QUICK INFO
// =====================================================

function QuickInfo({
  icon,
  label,
  value,
  accent,
  onPress,
  width,
}) {
  return (
    <Pressable
      style={[
        styles.quickInfo,
        {
          width,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.quickInfoIcon,
          {
            backgroundColor: `${accent}15`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={accent}
        />
      </View>

      <View style={styles.quickInfoText}>
        <Text
          style={styles.quickInfoValue}
          numberOfLines={1}
        >
          {value}
        </Text>

        <Text
          style={styles.quickInfoLabel}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
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

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    backgroundColor: "#4F7DF3",
    paddingTop: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTop: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",

    // DITURUNKAN DARI BAGIAN ATAS
    paddingTop: 8,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  headerActionButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerActionPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },

  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: "#4F7DF3",
  },

  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },

  headerContent: {
    marginTop: 27,
    paddingHorizontal: 2,
  },

  headerSmallText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 2,
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    maxWidth: 320,
  },

  // ===================================================
  // CONTENT
  // ===================================================

  content: {
    paddingTop: 18,
  },

  // ===================================================
  // SUMMARY
  // ===================================================

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EAECF0",
    marginBottom: 24,
  },

  summaryLeft: {
    flex: 1,
    paddingRight: 10,
  },

  summaryLabel: {
    fontSize: 13,
    color: "#667085",
    fontWeight: "600",
  },

  summaryNumberRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 3,
  },

  summaryNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: "#101828",
  },

  summaryPeople: {
    marginLeft: 6,
    fontSize: 12,
    color: "#667085",
  },

  summaryDescription: {
    marginTop: 2,
    fontSize: 11,
    color: "#98A2B3",
  },

  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  // ===================================================
  // SECTION
  // ===================================================

  sectionHeader: {
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#101828",
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#98A2B3",
  },

  // ===================================================
  // MAIN MENU
  // ===================================================

  mainGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 26,
  },

  mainMenuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderLeftWidth: 3,
    position: "relative",
  },

  mainMenuIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  mainMenuTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#344054",
    paddingRight: 5,
    lineHeight: 18,
  },

  menuArrow: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 25,
    height: 25,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  // ===================================================
  // QUICK INFO
  // ===================================================

  quickInfoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 7,
    marginBottom: 26,
  },

  quickInfo: {
    minHeight: 78,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAECF0",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  quickInfoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  quickInfoText: {
    flex: 1,
    marginLeft: 9,
  },

  quickInfoValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#101828",
  },

  quickInfoLabel: {
    marginTop: 2,
    fontSize: 10,
    color: "#667085",
    lineHeight: 13,
  },

  // ===================================================
  // SECONDARY
  // ===================================================

  secondaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EAECF0",
    overflow: "hidden",
    marginBottom: 20,
  },

  secondaryMenu: {
    minHeight: 64,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },

  secondaryIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    fontWeight: "700",
    color: "#344054",
  },

  // ===================================================
  // ATTENDANCE
  // ===================================================

  attendanceCard: {
    backgroundColor: "#FFFFFF",
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  attendanceIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
  },

  attendanceInfo: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 10,
  },

  attendanceTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#101828",
  },

  attendanceSubtitle: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 14,
    color: "#667085",
  },
});