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
  View,
} from "react-native";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { supabase } from "../../../services/supabase";
import { colors } from "../../../theme";

/* =========================================================
   HELPER
========================================================= */

const getLocalDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateIndonesia = () => {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
};

const normalizeStatus = (status) => {
  if (!status) return "";

  return String(status)
    .trim()
    .toLowerCase();
};

const getInitials = (name = "Administrator") => {
  const cleanName = String(name).trim();

  if (!cleanName) return "AD";

  const parts = cleanName.split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

/* =========================================================
   MENU ADMIN
========================================================= */

const MAIN_MENUS = [
  {
    title: "Data Pegawai",
    description:
      "Kelola data, akun, dan informasi pegawai",
    icon: "people-outline",
    route: "/admin/employees",
  },

  {
    title: "Jobdesk",
    description:
      "Kelola pekerjaan dan tugas pegawai",
    icon: "briefcase-outline",
    route: "/admin/jobdesk",
  },

  {
    title: "Meeting",
    description:
      "Kelola agenda dan jadwal meeting",
    icon: "videocam-outline",
    route: "/admin/meetings",
  },

  {
    title: "Absensi",
    description:
      "Pantau kehadiran pegawai",
    icon: "calendar-outline",
    route: "/admin/attendance",
  },
];

const SECONDARY_MENUS = [
  {
    title: "Pengajuan Surat",
    description:
      "Kelola pengajuan pegawai",
    icon: "document-text-outline",
    route: "/admin/requests",
  },

  {
    title: "Notifikasi",
    description:
      "Lihat pemberitahuan sistem",
    icon: "notifications-outline",
    route: "/admin/notifications",
  },

  {
    title: "Laporan",
    description:
      "Lihat ringkasan dan laporan",
    icon: "bar-chart-outline",
    route: "/admin/reports",
  },
];

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [adminName, setAdminName] =
    useState("Administrator");

  const [stats, setStats] = useState({
    employees: 0,
    jobs: 0,
    meetings: 0,
    requests: 0,
    attendance: 0,
  });

  /* =======================================================
     LOAD ADMIN PROFILE
  ======================================================= */

  const loadAdminProfile =
    useCallback(async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setAdminName(
            "Administrator"
          );
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const metadata =
          user.user_metadata || {};

        const name =
          profile?.nama ||
          profile?.name ||
          profile?.full_name ||
          metadata?.nama ||
          metadata?.name ||
          metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Administrator";

        setAdminName(name);
      } catch (error) {
        console.log(
          "PROFILE ERROR:",
          error
        );

        setAdminName(
          "Administrator"
        );
      }
    }, []);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard =
    useCallback(async () => {
      try {
        const today =
          getLocalDate();

        const [
          profilesResult,
          jobsResult,
          meetingsResult,
          requestsResult,
          attendanceResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, role"),

          supabase
            .from("jobs")
            .select("id", {
              count: "exact",
              head: true,
            }),

          supabase
            .from("meetings")
            .select("id", {
              count: "exact",
              head: true,
            }),

          supabase
            .from("surat_requests")
            .select(
              "id, status"
            ),

          supabase
            .from("attendance")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "tanggal_absen",
              today
            ),
        ]);

        /* =================================================
           PEGAWAI
        ================================================= */

        let employeeCount = 0;

        if (
          !profilesResult.error
        ) {
          const profiles =
            profilesResult.data || [];

          employeeCount =
            profiles.filter(
              (profile) => {
                const role =
                  normalizeStatus(
                    profile.role
                  );

                return (
                  role !== "admin" &&
                  role !==
                    "administrator"
                );
              }
            ).length;
        }

        /* =================================================
           JOB
        ================================================= */

        const jobCount =
          jobsResult.error
            ? 0
            : jobsResult.count || 0;

        /* =================================================
           MEETING
        ================================================= */

        const meetingCount =
          meetingsResult.error
            ? 0
            : meetingsResult.count || 0;

        /* =================================================
           REQUEST
        ================================================= */

        let pendingRequestCount = 0;

        if (
          !requestsResult.error
        ) {
          const requests =
            requestsResult.data || [];

          pendingRequestCount =
            requests.filter(
              (item) => {
                const status =
                  normalizeStatus(
                    item.status
                  );

                return [
                  "pending",
                  "menunggu",
                  "diajukan",
                ].includes(status);
              }
            ).length;
        }

        /* =================================================
           ATTENDANCE
        ================================================= */

        const attendanceCount =
          attendanceResult.error
            ? 0
            : attendanceResult.count ||
              0;

        setStats({
          employees:
            employeeCount,
          jobs: jobCount,
          meetings:
            meetingCount,
          requests:
            pendingRequestCount,
          attendance:
            attendanceCount,
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

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadAdminProfile();
    loadDashboard();
  }, [
    loadAdminProfile,
    loadDashboard,
  ]);

  /* =======================================================
     SCREEN FOCUS
  ======================================================= */

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    useCallback(async () => {
      try {
        setRefreshing(true);

        await Promise.all([
          loadAdminProfile(),
          loadDashboard(),
        ]);
      } catch (error) {
        console.log(
          "REFRESH ERROR:",
          error
        );
      } finally {
        setRefreshing(false);
      }
    }, [
      loadAdminProfile,
      loadDashboard,
    ]);

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    Alert.alert(
      "Keluar dari Akun",
      "Apakah Anda yakin ingin keluar dari akun admin?",
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

              const {
                error,
              } =
                await supabase.auth.signOut();

              if (error) {
                throw error;
              }

              router.replace("/");
            } catch (error) {
              console.log(
                "LOGOUT ERROR:",
                error
              );

              Alert.alert(
                "Logout Gagal",
                "Tidak dapat keluar dari akun."
              );
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigate = (route) => {
    router.push(route);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <View style={styles.loadingIcon}>
          <Ionicons
            name="grid-outline"
            size={30}
            color={colors.primary}
          />
        </View>

        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={{
            marginTop: 18,
          }}
        />

        <Text
          style={styles.loadingTitle}
        >
          Memuat Dashboard
        </Text>

        <Text
          style={styles.loadingText}
        >
          Menyiapkan informasi administrasi
        </Text>
      </SafeAreaView>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingBottom:
            30 + insets.bottom,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[
              colors.primary,
            ]}
            tintColor={
              colors.primary
            }
            title="Memuat ulang..."
          />
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View
              style={
                styles.headerTextContainer
              }
            >
              <Text
                style={
                  styles.headerGreeting
                }
              >
                Dashboard Admin
              </Text>

              <Text
                style={
                  styles.headerSubGreeting
                }
              >
                Selamat datang kembali
              </Text>
            </View>

            <View
              style={styles.headerActions}
            >
              {/* NOTIFICATION */}

              <Pressable
                onPress={() =>
                  navigate(
                    "/admin/notifications"
                  )
                }
                style={({ pressed }) => [
                  styles.headerActionButton,
                  pressed &&
                    styles.headerActionPressed,
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={
                    colors.surface
                  }
                />

                {stats.requests >
                  0 && (
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
                      {stats.requests >
                      9
                        ? "9+"
                        : stats.requests}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* LOGOUT */}

              <Pressable
                onPress={
                  handleLogout
                }
                disabled={
                  loggingOut
                }
                style={({ pressed }) => [
                  styles.headerActionButton,
                  pressed &&
                    styles.headerActionPressed,
                ]}
              >
                {loggingOut ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      colors.surface
                    }
                  />
                ) : (
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color={
                      colors.surface
                    }
                  />
                )}
              </Pressable>
            </View>
          </View>

          {/* PROFILE */}

          <View style={styles.profileRow}>
            <View
              style={styles.profileAvatar}
            >
              <Text
                style={
                  styles.profileAvatarText
                }
              >
                {getInitials(
                  adminName
                )}
              </Text>
            </View>

            <View
              style={styles.profileInfo}
            >
              <Text
                style={styles.profileName}
                numberOfLines={1}
              >
                {adminName}
              </Text>

              <View
                style={styles.profileMeta}
              >
                <Text
                  style={
                    styles.profileRole
                  }
                >
                  Administrator
                </Text>

                <View
                  style={styles.profileDot}
                />

                <Text
                  style={
                    styles.profileStatus
                  }
                >
                  Aktif
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            CONTENT
        ================================================= */}

        <View style={styles.content}>
          {/* DATE */}

          <View
            style={styles.dateContainer}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
            />

            <Text
              style={styles.dateText}
            >
              {formatDateIndonesia()}
            </Text>
          </View>

          {/* =================================================
              OVERVIEW
          ================================================= */}

          <SectionTitle
            title="Ringkasan Sistem"
          />

          <View
            style={styles.summaryCard}
          >
            <View
              style={styles.summaryHeader}
            >
              <View>
                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  Kondisi sistem
                </Text>

                <Text
                  style={
                    styles.summarySubtitle
                  }
                >
                  Ringkasan aktivitas administrasi
                </Text>
              </View>

              <View
                style={styles.systemBadge}
              >
                <View
                  style={styles.systemDot}
                />

                <Text
                  style={
                    styles.systemBadgeText
                  }
                >
                  Sistem Aktif
                </Text>
              </View>
            </View>

            <View
              style={styles.summaryGrid}
            >
              <SummaryItem
                icon="people-outline"
                label="Pegawai"
                value={
                  stats.employees
                }
              />

              <SummaryItem
                icon="briefcase-outline"
                label="Jobdesk"
                value={stats.jobs}
              />

              <SummaryItem
                icon="videocam-outline"
                label="Meeting"
                value={
                  stats.meetings
                }
              />

              <SummaryItem
                icon="calendar-outline"
                label="Hadir Hari Ini"
                value={
                  stats.attendance
                }
              />
            </View>
          </View>

          {/* =================================================
              REQUEST
          ================================================= */}

          {stats.requests > 0 ? (
            <Pressable
              onPress={() =>
                navigate(
                  "/admin/requests"
                )
              }
              style={({ pressed }) => [
                styles.requestCard,
                pressed &&
                  styles.cardPressed,
              ]}
            >
              <View
                style={
                  styles.requestIcon
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={
                    colors.warningDark ||
                    "#B54708"
                  }
                />
              </View>

              <View
                style={
                  styles.requestContent
                }
              >
                <Text
                  style={
                    styles.requestTitle
                  }
                >
                  Pengajuan menunggu
                </Text>

                <Text
                  style={
                    styles.requestDescription
                  }
                >
                  Ada {stats.requests} pengajuan
                  yang perlu diperiksa.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={
                  colors.textGray
                }
              />
            </Pressable>
          ) : (
            <View
              style={
                styles.requestEmptyCard
              }
            >
              <View
                style={
                  styles.requestEmptyIcon
                }
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color={
                    colors.successDark ||
                    "#039855"
                  }
                />
              </View>

              <View
                style={
                  styles.requestContent
                }
              >
                <Text
                  style={
                    styles.requestTitle
                  }
                >
                  Tidak ada pengajuan pending
                </Text>

                <Text
                  style={
                    styles.requestDescription
                  }
                >
                  Semua pengajuan sudah ditangani.
                </Text>
              </View>
            </View>
          )}

          {/* =================================================
              ATTENDANCE
          ================================================= */}

          <SectionTitle
            title="Kehadiran Hari Ini"
            action="Lihat Detail"
            onPress={() =>
              navigate(
                "/admin/attendance"
              )
            }
          />

          <View
            style={styles.attendanceCard}
          >
            <View
              style={
                styles.attendanceIcon
              }
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={28}
                color={colors.primary}
              />
            </View>

            <View
              style={
                styles.attendanceInfo
              }
            >
              <Text
                style={
                  styles.attendanceValue
                }
              >
                {stats.attendance}
              </Text>

              <Text
                style={
                  styles.attendanceLabel
                }
              >
                Pegawai hadir hari ini
              </Text>
            </View>

            <View
              style={
                styles.attendanceArrow
              }
            >
              <Ionicons
                name="chevron-forward"
                size={19}
                color={
                  colors.textGray
                }
              />
            </View>
          </View>

          {/* =================================================
              MAIN MENU
          ================================================= */}

          <SectionTitle
            title="Menu Administrasi"
          />

          <View
            style={styles.menuContainer}
          >
            {MAIN_MENUS.map(
              (menu) => (
                <AdminMenuCard
                  key={menu.title}
                  menu={menu}
                  onPress={() =>
                    navigate(
                      menu.route
                    )
                  }
                />
              )
            )}
          </View>

          {/* =================================================
              QUICK ACCESS
          ================================================= */}

          <SectionTitle
            title="Akses Cepat"
          />

          <View
            style={styles.quickContainer}
          >
            <QuickAction
              icon="person-add-outline"
              title="Tambah Pegawai"
              onPress={() =>
                navigate(
                  "/admin/employees/create"
                )
              }
            />

            <QuickAction
              icon="add-circle-outline"
              title="Buat Jobdesk"
              onPress={() =>
                navigate(
                  "/admin/jobdesk/create"
                )
              }
            />

            <QuickAction
              icon="calendar-number-outline"
              title="Buat Meeting"
              onPress={() =>
                navigate(
                  "/admin/meetings/create"
                )
              }
            />
          </View>

          {/* =================================================
              OTHER MENU
          ================================================= */}

          <SectionTitle
            title="Menu Lainnya"
          />

          <View
            style={styles.otherMenuContainer}
          >
            {SECONDARY_MENUS.map(
              (menu) => (
                <OtherMenu
                  key={menu.title}
                  menu={menu}
                  onPress={() =>
                    navigate(
                      menu.route
                    )
                  }
                />
              )
            )}
          </View>

          {/* =================================================
              INFORMATION
          ================================================= */}

          <View
            style={styles.infoCard}
          >
            <View
              style={styles.infoIcon}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View
              style={styles.infoContent}
            >
              <Text
                style={styles.infoTitle}
              >
                Informasi Dashboard
              </Text>

              <Text
                style={styles.infoText}
              >
                Gunakan dashboard ini untuk
                memantau aktivitas pegawai,
                pekerjaan, meeting, absensi,
                dan pengajuan secara terpusat.
              </Text>
            </View>
          </View>

          {/* =================================================
              FOOTER
          ================================================= */}

          <View
            style={styles.footer}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={
                colors.textLight
              }
            />

            <Text
              style={styles.footerText}
            >
              Admin Dashboard • Senvra
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  title,
  action,
  onPress,
}) {
  return (
    <View
      style={styles.sectionTitleContainer}
    >
      <Text
        style={styles.sectionTitle}
      >
        {title}
      </Text>

      {action && (
        <Pressable
          onPress={onPress}
          hitSlop={8}
        >
          <Text
            style={styles.sectionAction}
          >
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/* =========================================================
   SUMMARY ITEM
========================================================= */

function SummaryItem({
  icon,
  label,
  value,
}) {
  return (
    <View
      style={styles.summaryItem}
    >
      <View
        style={styles.summaryItemIcon}
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View
        style={styles.summaryItemContent}
      >
        <Text
          style={styles.summaryItemValue}
        >
          {value}
        </Text>

        <Text
          style={styles.summaryItemLabel}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

/* =========================================================
   ADMIN MENU CARD
========================================================= */

function AdminMenuCard({
  menu,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.adminMenuCard,
        pressed &&
          styles.cardPressed,
      ]}
    >
      <View
        style={styles.adminMenuIcon}
      >
        <Ionicons
          name={menu.icon}
          size={24}
          color={colors.primary}
        />
      </View>

      <View
        style={styles.adminMenuContent}
      >
        <Text
          style={styles.adminMenuTitle}
        >
          {menu.title}
        </Text>

        <Text
          style={
            styles.adminMenuDescription
          }
          numberOfLines={2}
        >
          {menu.description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={colors.textLight}
      />
    </Pressable>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  icon,
  title,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed &&
          styles.cardPressed,
      ]}
    >
      <View
        style={styles.quickActionIcon}
      >
        <Ionicons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <Text
        style={styles.quickActionText}
        numberOfLines={1}
      >
        {title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={17}
        color={colors.textLight}
      />
    </Pressable>
  );
}

/* =========================================================
   OTHER MENU
========================================================= */

function OtherMenu({
  menu,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.otherMenu,
        pressed &&
          styles.cardPressed,
      ]}
    >
      <View
        style={styles.otherMenuIcon}
      >
        <Ionicons
          name={menu.icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View
        style={styles.otherMenuContent}
      >
        <Text
          style={styles.otherMenuTitle}
        >
          {menu.title}
        </Text>

        <Text
          style={
            styles.otherMenuDescription
          }
          numberOfLines={1}
        >
          {menu.description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textLight}
      />
    </Pressable>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  /* =======================================================
     BASE
  ======================================================= */

  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  container: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  /* =======================================================
     LOADING
  ======================================================= */

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      colors.background,
    paddingHorizontal: 30,
  },

  loadingIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor:
      colors.infoBackground,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingTitle: {
    marginTop: 17,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textDark,
  },

  loadingText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textGray,
    textAlign: "center",
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    backgroundColor:
      colors.primary,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerTop: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  headerTextContainer: {
    flex: 1,
  },

  headerGreeting: {
    color: "rgba(255,255,255,0.96)",
    fontSize: 20,
    fontWeight: "700",
  },

  headerSubGreeting: {
    marginTop: 4,
    color:
      "rgba(255,255,255,0.76)",
    fontSize: 12,
    fontWeight: "500",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerActionButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor:
      "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  headerActionPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  notificationBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor:
      colors.danger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor:
      colors.primary,
  },

  notificationBadgeText: {
    color: colors.surface,
    fontSize: 8,
    fontWeight: "900",
  },

  /* =======================================================
     PROFILE
  ======================================================= */

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },

  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor:
      colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor:
      "rgba(255,255,255,0.28)",
  },

  profileAvatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 13,
  },

  profileName: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },

  profileMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  profileRole: {
    color:
      "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "500",
  },

  profileDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor:
      "rgba(255,255,255,0.6)",
    marginHorizontal: 7,
  },

  profileStatus: {
    color:
      "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: "700",
  },

  /* =======================================================
     DATE
  ======================================================= */

  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  dateText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.textGray,
    fontWeight: "600",
  },

  /* =======================================================
     SECTION
  ======================================================= */

  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 11,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
  },

  sectionAction: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },

  /* =======================================================
     SUMMARY
  ======================================================= */

  summaryCard: {
    backgroundColor:
      colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor:
      colors.border,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 15,
  },

  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textDark,
  },

  summarySubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textGray,
  },

  systemBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor:
      colors.successLight,
  },

  systemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      colors.successDark,
    marginRight: 5,
  },

  systemBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color:
      colors.successDark,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    paddingTop: 14,
  },

  summaryItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  summaryItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:
      colors.infoBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  summaryItemContent: {
    flex: 1,
  },

  summaryItemValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textDark,
  },

  summaryItemLabel: {
    marginTop: 1,
    fontSize: 10,
    color: colors.textGray,
    fontWeight: "500",
  },

  /* =======================================================
     REQUEST
  ======================================================= */

  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      colors.warningLight,
    borderRadius: 17,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor:
      colors.warning,
  },

  requestEmptyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      colors.successLight,
    borderRadius: 17,
    padding: 14,
    marginBottom: 22,
  },

  requestIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor:
      "rgba(255,255,255,0.65)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  requestEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor:
      "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  requestContent: {
    flex: 1,
  },

  requestTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDark,
  },

  requestDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textGray,
  },

  /* =======================================================
     ATTENDANCE
  ======================================================= */

  attendanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      colors.border,
    padding: 15,
    marginBottom: 22,
  },

  attendanceIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor:
      colors.infoBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  attendanceInfo: {
    flex: 1,
  },

  attendanceValue: {
    fontSize: 23,
    fontWeight: "900",
    color: colors.textDark,
  },

  attendanceLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textGray,
  },

  attendanceArrow: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor:
      colors.background,
    justifyContent: "center",
    alignItems: "center",
  },

  /* =======================================================
     ADMIN MENU
  ======================================================= */

  menuContainer: {
    marginBottom: 22,
  },

  adminMenuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor:
      colors.border,
    padding: 13,
    marginBottom: 9,
  },

  adminMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor:
      colors.infoBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  adminMenuContent: {
    flex: 1,
  },

  adminMenuTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textDark,
  },

  adminMenuDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textGray,
  },

  /* =======================================================
     QUICK ACCESS
  ======================================================= */

  quickContainer: {
    marginBottom: 22,
  },

  quickAction: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      colors.border,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  quickActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor:
      colors.infoBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  quickActionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textDark,
  },

  /* =======================================================
     OTHER MENU
  ======================================================= */

  otherMenuContainer: {
    marginBottom: 22,
  },

  otherMenu: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      colors.border,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  otherMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:
      colors.infoBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  otherMenuContent: {
    flex: 1,
  },

  otherMenuTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDark,
  },

  otherMenuDescription: {
    marginTop: 2,
    fontSize: 10,
    color: colors.textGray,
  },

  /* =======================================================
     INFORMATION
  ======================================================= */

  infoCard: {
    flexDirection: "row",
    backgroundColor:
      colors.infoBackground,
    borderRadius: 17,
    padding: 14,
    marginBottom: 22,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:
      colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDark,
  },

  infoText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textGray,
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  footerText: {
    marginLeft: 5,
    fontSize: 10,
    color: colors.textLight,
  },

  /* =======================================================
     PRESS
  ======================================================= */

  cardPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});