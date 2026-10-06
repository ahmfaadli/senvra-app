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
  useWindowDimensions,
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

const getInitials = (
  name = "Administrator"
) => {
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
      "Kelola data dan informasi pegawai",
    icon: "people-outline",
    route: "/admin/employees",
  },
  {
    title: "Daftar Absensi",
    description:
      "Pantau kehadiran pegawai",
    icon: "calendar-outline",
    route: "/admin/(tab)/attendance",
  },
  {
    title: "Daftar Jobdesk",
    description:
      "Kelola pekerjaan dan tugas pegawai",
    icon: "briefcase-outline",
    route: "/admin/jobdesk/jobdesk",
  },
  {
    title: "Daftar Meeting",
    description:
      "Kelola agenda dan jadwal meeting",
    icon: "videocam-outline",
    route: "/admin/meetings/meetings",
  },
];

const SECONDARY_MENUS = [
  {
    title: "Pengajuan Surat",
    description:
      "Kelola pengajuan pegawai",
    icon: "document-text-outline",
    route: "/admin/request/requests",
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
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 360;

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
            .select("id, status"),

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

        if (!profilesResult.error) {
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
                  role !== "administrator"
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

        if (!requestsResult.error) {
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
            : attendanceResult.count || 0;

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

              const { error } =
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            32 + insets.bottom,
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
          <View
            style={styles.headerTop}
          >
            <View
              style={
                styles.headerIdentity
              }
            >
              <View
                style={styles.avatar}
              >
                <Text
                  style={
                    styles.avatarText
                  }
                >
                  {getInitials(
                    adminName
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.greetingContainer
                }
              >
                <Text
                  style={
                    styles.smallGreeting
                  }
                >
                  Halo, Selamat Datang
                </Text>

                <Text
                  style={
                    styles.adminName
                  }
                  numberOfLines={1}
                >
                  {adminName}!
                </Text>
              </View>
            </View>

            <View
              style={
                styles.headerActions
              }
            >
              {/* NOTIFICATION */}

              <Pressable
                onPress={() =>
                  navigate(
                    "/admin/notifications"
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.headerCircle,
                  pressed &&
                    styles.circlePressed,
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={
                    colors.textDark
                  }
                />

                {stats.requests >
                  0 && (
                  <View
                    style={
                      styles.notificationDot
                    }
                  >
                    <Text
                      style={
                        styles.notificationDotText
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
                style={({
                  pressed,
                }) => [
                  styles.headerCircle,
                  pressed &&
                    styles.circlePressed,
                ]}
              >
                {loggingOut ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      colors.primary
                    }
                  />
                ) : (
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color={
                      colors.textDark
                    }
                  />
                )}
              </Pressable>
            </View>
          </View>

          {/* DATE */}

          <View
            style={
              styles.headerDateRow
            }
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={
                colors.textGray
              }
            />

            <Text
              style={
                styles.headerDate
              }
            >
              {formatDateIndonesia()}
            </Text>
          </View>
        </View>

        {/* =================================================
            CONTENT
        ================================================= */}

        <View style={styles.content}>
          {/* =================================================
              SECTION TITLE
          ================================================= */}

          <View
            style={
              styles.overviewHeading
            }
          >
            <View>
              <Text
                style={
                  styles.pageTitle
                }
              >
                Dashboard Admin
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                Ringkasan aktivitas sistem
              </Text>
            </View>

            <View
              style={
                styles.activeBadge
              }
            >
              <View
                style={
                  styles.activeDot
                }
              />

              <Text
                style={
                  styles.activeBadgeText
                }
              >
                Aktif
              </Text>
            </View>
          </View>

          {/* =================================================
              HERO CARD
          ================================================= */}

          <Pressable
            onPress={() =>
              navigate(
                "/admin/reports"
              )
            }
            style={({
              pressed,
            }) => [
              styles.heroCard,
              pressed &&
                styles.heroPressed,
            ]}
          >
            <View
              style={
                styles.heroTopRow
              }
            >
              <View
                style={
                  styles.heroTitleContainer
                }
              >
                <Text
                  style={
                    styles.heroEyebrow
                  }
                >
                  SYSTEM OVERVIEW
                </Text>

                <Text
                  style={
                    styles.heroTitle
                  }
                >
                  Kelola sistem
                </Text>

                <Text
                  style={
                    styles.heroSubtitle
                  }
                >
                  Pantau aktivitas administrasi
                  dalam satu dashboard.
                </Text>
              </View>

              <View
                style={
                  styles.heroArrow
                }
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={21}
                  color={
                    colors.textDark
                  }
                />
              </View>
            </View>

            <View
              style={
                styles.heroBottom
              }
            >
              <View>
                <Text
                  style={
                    styles.heroNumber
                  }
                >
                  {stats.employees}
                </Text>

                <Text
                  style={
                    styles.heroNumberLabel
                  }
                >
                  Pegawai terdaftar
                </Text>
              </View>

              <View
                style={
                  styles.heroMiniStats
                }
              >
                <HeroMiniStat
                  icon="briefcase-outline"
                  value={stats.jobs}
                  label="Jobdesk"
                />

                <HeroMiniStat
                  icon="videocam-outline"
                  value={stats.meetings}
                  label="Meeting"
                />
              </View>
            </View>

            {/* Decorative circles */}

            <View
              style={
                styles.heroDecorationOne
              }
            />

            <View
              style={
                styles.heroDecorationTwo
              }
            />
          </Pressable>

          {/* =================================================
              SMALL STAT CARDS
          ================================================= */}

          <View
            style={
              styles.smallStatsRow
            }
          >
            <SmallStatCard
              icon="document-text-outline"
              title="Pengajuan"
              value={stats.requests}
              subtitle={
                stats.requests > 0
                  ? "Perlu diperiksa"
                  : "Tidak ada pending"
              }
              background={
                colors.warningLight ||
                "#F3FBC5"
              }
              iconBackground="#E8F6A7"
              iconColor={
                colors.warningDark ||
                "#8A6200"
              }
              onPress={() =>
                navigate(
                  "/admin/request/requests"
                )
              }
              width={
                isSmallScreen
                  ? "48.5%"
                  : "48.5%"
              }
            />

            <SmallStatCard
              icon="checkmark-circle-outline"
              title="Hadir Hari Ini"
              value={stats.attendance}
              subtitle="Pegawai hadir"
              background={
                colors.infoBackground ||
                "#F1F5FF"
              }
              iconBackground="#E4ECFF"
              iconColor={
                colors.primary
              }
              onPress={() =>
                navigate(
                  "/admin/attendance/attendance-detail"
                )
              }
              width={
                isSmallScreen
                  ? "48.5%"
                  : "48.5%"
              }
            />
          </View>

          {/* =================================================
              QUICK SUMMARY
          ================================================= */}

          <View
            style={
              styles.summaryCard
            }
          >
            <View
              style={
                styles.summaryHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  Ringkasan Sistem
                </Text>

                <Text
                  style={
                    styles.summarySubtitle
                  }
                >
                  Data utama dashboard
                </Text>
              </View>

              <Ionicons
                name="analytics-outline"
                size={21}
                color={
                  colors.primary
                }
              />
            </View>

            <View
              style={
                styles.summaryGrid
              }
            >
              <SummaryItem
                icon="people-outline"
                label="Pegawai"
                value={stats.employees}
              />

              <SummaryItem
                icon="briefcase-outline"
                label="Jobdesk"
                value={stats.jobs}
              />

              <SummaryItem
                icon="videocam-outline"
                label="Meeting"
                value={stats.meetings}
              />

              <SummaryItem
                icon="calendar-outline"
                label="Kehadiran"
                value={stats.attendance}
              />
            </View>
          </View>

          {/* =================================================
              MAIN MENU
          ================================================= */}

          <SectionTitle
            title="Menu Administrasi"
            action="Lihat semua"
          />

          <View
            style={
              styles.menuGrid
            }
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
            style={
              styles.quickGrid
            }
          >
            <QuickAction
              icon="person-add-outline"
              title="Tambah Pegawai"
              onPress={() =>
                navigate(
                  "/admin/employees/employee-form"
                )
              }
            />

            <QuickAction
              icon="add-circle-outline"
              title="Buat Jobdesk"
              onPress={() =>
                navigate(
                  "/admin/jobdesk/job-form"
                )
              }
            />

            <QuickAction
              icon="calendar-number-outline"
              title="Buat Meeting"
              onPress={() =>
                navigate(
                  "/admin/meetings/meeting-form"
                )
              }
            />
          </View>

          {/* =================================================
              SECONDARY MENU
          ================================================= */}

          <SectionTitle
            title="Menu Lainnya"
          />

          <View
            style={
              styles.secondaryContainer
            }
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
            style={
              styles.infoCard
            }
          >
            <View
              style={
                styles.infoIcon
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={21}
                color={
                  colors.primary
                }
              />
            </View>

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={
                  styles.infoTitle
                }
              >
                Informasi Dashboard
              </Text>

              <Text
                style={
                  styles.infoText
                }
              >
                Gunakan dashboard ini untuk
                memantau pegawai, jobdesk,
                meeting, absensi, dan
                pengajuan secara terpusat.
              </Text>
            </View>
          </View>

          {/* =================================================
              FOOTER
          ================================================= */}

          <View
            style={
              styles.footer
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={
                colors.textLight
              }
            />

            <Text
              style={
                styles.footerText
              }
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
   HERO MINI STAT
========================================================= */

function HeroMiniStat({
  icon,
  value,
  label,
}) {
  return (
    <View
      style={
        styles.heroMiniStat
      }
    >
      <View
        style={
          styles.heroMiniIcon
        }
      >
        <Ionicons
          name={icon}
          size={14}
          color="rgba(255,255,255,0.9)"
        />
      </View>

      <View>
        <Text
          style={
            styles.heroMiniValue
          }
        >
          {value}
        </Text>

        <Text
          style={
            styles.heroMiniLabel
          }
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

/* =========================================================
   SMALL STAT CARD
========================================================= */

function SmallStatCard({
  icon,
  title,
  value,
  subtitle,
  background,
  iconBackground,
  iconColor,
  onPress,
  width,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({
        pressed,
      }) => [
        styles.smallStatCard,
        {
          width,
          backgroundColor:
            background,
        },
        pressed &&
          styles.cardPressed,
      ]}
    >
      <View
        style={
          styles.smallStatTop
        }
      >
        <Text
          style={
            styles.smallStatTitle
          }
          numberOfLines={1}
        >
          {title}
        </Text>

        <View
          style={
            styles.smallStatArrow
          }
        >
          <Ionicons
            name="arrow-up-outline"
            size={15}
            color={
              colors.textDark
            }
          />
        </View>
      </View>

      <View
        style={
          styles.smallStatBottom
        }
      >
        <View
          style={[
            styles.smallStatIcon,
            {
              backgroundColor:
                iconBackground,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={iconColor}
          />
        </View>

        <View
          style={
            styles.smallStatValueContainer
          }
        >
          <Text
            style={
              styles.smallStatValue
            }
          >
            {value}
          </Text>

          <Text
            style={
              styles.smallStatSubtitle
            }
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </View>
    </Pressable>
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
      style={
        styles.sectionTitleContainer
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      {action && (
        <Pressable
          onPress={onPress}
          hitSlop={8}
        >
          <Text
            style={
              styles.sectionAction
            }
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
      style={
        styles.summaryItem
      }
    >
      <View
        style={
          styles.summaryItemIcon
        }
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            colors.primary
          }
        />
      </View>

      <View
        style={
          styles.summaryItemContent
        }
      >
        <Text
          style={
            styles.summaryItemValue
          }
        >
          {value}
        </Text>

        <Text
          style={
            styles.summaryItemLabel
          }
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
      style={({
        pressed,
      }) => [
        styles.adminMenuCard,
        pressed &&
          styles.cardPressed,
      ]}
    >
      <View
        style={
          styles.adminMenuTop
        }
      >
        <View
          style={
            styles.adminMenuIcon
          }
        >
          <Ionicons
            name={menu.icon}
            size={21}
            color={
              colors.primary
            }
          />
        </View>

        <View
          style={
            styles.menuArrow
          }
        >
          <Ionicons
            name="arrow-up-outline"
            size={14}
            color={
              colors.textDark
            }
          />
        </View>
      </View>

      <Text
        style={
          styles.adminMenuTitle
        }
        numberOfLines={1}
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
      style={({
        pressed,
      }) => [
        styles.quickAction,
        pressed &&
          styles.cardPressed,
      ]}
    >
      <View
        style={
          styles.quickActionIcon
        }
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            colors.primary
          }
        />
      </View>

      <Text
        style={
          styles.quickActionText
        }
        numberOfLines={2}
      >
        {title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={
          colors.textLight
        }
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
      style={({
        pressed,
      }) => [
        styles.otherMenu,
        pressed &&
          styles.cardPressed,
      ]}
    >
      <View
        style={
          styles.otherMenuIcon
        }
      >
        <Ionicons
          name={menu.icon}
          size={20}
          color={
            colors.primary
          }
        />
      </View>

      <View
        style={
          styles.otherMenuContent
        }
      >
        <Text
          style={
            styles.otherMenuTitle
          }
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

      <View
        style={
          styles.otherMenuArrow
        }
      >
        <Ionicons
          name="chevron-forward"
          size={17}
          color={
            colors.textLight
          }
        />
      </View>
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
      colors.surface,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  headerIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor:
      colors.infoBackground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor:
      colors.border,
  },

  avatarText: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.primary,
  },

  greetingContainer: {
    flex: 1,
    marginLeft: 11,
  },

  smallGreeting: {
    fontSize: 10,
    color: colors.textGray,
    fontWeight: "500",
  },

  adminName: {
    marginTop: 1,
    fontSize: 26,
    fontWeight: "800",
    color: colors.textDark,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },

  headerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor:
      colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
    borderWidth: 1,
    borderColor:
      colors.border,
  },

  circlePressed: {
    opacity: 0.6,
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  notificationDot: {
    position: "absolute",
    right: -1,
    top: -1,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor:
      colors.danger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor:
      colors.surface,
  },

  notificationDotText: {
    fontSize: 7,
    fontWeight: "900",
    color:
      colors.surface,
  },

  headerDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginLeft: 4,
  },

  headerDate: {
    marginLeft: 6,
    fontSize: 10,
    color: colors.textGray,
    fontWeight: "500",
  },

  /* =======================================================
     OVERVIEW HEADING
  ======================================================= */

  overviewHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 13,
  },

  pageTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
  },

  pageSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textGray,
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor:
      colors.successLight,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      colors.successDark,
    marginRight: 5,
  },

  activeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color:
      colors.successDark,
  },

  /* =======================================================
     HERO
  ======================================================= */

  heroCard: {
    minHeight: 190,
    backgroundColor:
      colors.primary,
    borderRadius: 21,
    padding: 17,
    marginBottom: 10,
    overflow: "hidden",
  },

  heroPressed: {
    opacity: 0.92,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  heroTopRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
  },

  heroTitleContainer: {
    flex: 1,
    paddingRight: 15,
  },

  heroEyebrow: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: "800",
    color:
      "rgba(255,255,255,0.68)",
  },

  heroTitle: {
    marginTop: 4,
    fontSize: 21,
    fontWeight: "800",
    color:
      colors.surface,
  },

  heroSubtitle: {
    marginTop: 4,
    maxWidth: 235,
    fontSize: 10,
    lineHeight: 15,
    color:
      "rgba(255,255,255,0.72)",
  },

  heroArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:
      "#E9F58D",
    alignItems: "center",
    justifyContent: "center",
  },

  heroBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent:
      "space-between",
    marginTop: 18,
    zIndex: 2,
  },

  heroNumber: {
    fontSize: 39,
    lineHeight: 42,
    fontWeight: "900",
    color:
      colors.surface,
  },

  heroNumberLabel: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: "600",
    color:
      "rgba(255,255,255,0.72)",
  },

  heroMiniStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  heroMiniStat: {
    minWidth: 72,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },

  heroMiniIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor:
      "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  heroMiniValue: {
    fontSize: 13,
    fontWeight: "900",
    color:
      colors.surface,
  },

  heroMiniLabel: {
    marginTop: 1,
    fontSize: 7,
    color:
      "rgba(255,255,255,0.68)",
  },

  heroDecorationOne: {
    position: "absolute",
    right: -25,
    bottom: -45,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor:
      "rgba(255,255,255,0.08)",
  },

  heroDecorationTwo: {
    position: "absolute",
    left: 85,
    bottom: -55,
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor:
      "rgba(255,255,255,0.06)",
  },

  /* =======================================================
     SMALL STAT
  ======================================================= */

  smallStatsRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    marginBottom: 21,
  },

  smallStatCard: {
    minHeight: 116,
    borderRadius: 17,
    padding: 12,
    borderWidth: 1,
    borderColor:
      "rgba(0,0,0,0.035)",
  },

  smallStatTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  smallStatTitle: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textDark,
    marginRight: 5,
  },

  smallStatArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor:
      "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },

  smallStatBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
  },

  smallStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  smallStatValueContainer: {
    flex: 1,
  },

  smallStatValue: {
    fontSize: 25,
    lineHeight: 27,
    fontWeight: "900",
    color: colors.textDark,
  },

  smallStatSubtitle: {
    marginTop: 2,
    fontSize: 8,
    color: colors.textGray,
    fontWeight: "500",
  },

  /* =======================================================
     SUMMARY
  ======================================================= */

  summaryCard: {
    backgroundColor:
      colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor:
      colors.border,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 13,
  },

  summaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDark,
  },

  summarySubtitle: {
    marginTop: 2,
    fontSize: 9,
    color: colors.textGray,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    paddingTop: 12,
  },

  summaryItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  summaryItemIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor:
      colors.infoBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  summaryItemContent: {
    flex: 1,
  },

  summaryItemValue: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.textDark,
  },

  summaryItemLabel: {
    marginTop: 1,
    fontSize: 9,
    color: colors.textGray,
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
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
  },

  sectionAction: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },

  /* =======================================================
     ADMIN MENU GRID
  ======================================================= */

  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent:
      "space-between",
    marginBottom: 22,
  },

  adminMenuCard: {
    width: "48.5%",
    minHeight: 137,
    backgroundColor:
      colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor:
      colors.border,
    padding: 12,
    marginBottom: 10,
  },

  adminMenuTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  adminMenuIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor:
      colors.infoBackground,
    justifyContent: "center",
    alignItems: "center",
  },

  menuArrow: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor:
      colors.background,
    justifyContent: "center",
    alignItems: "center",
  },

  adminMenuTitle: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDark,
  },

  adminMenuDescription: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 13,
    color: colors.textGray,
  },

  /* =======================================================
     QUICK ACCESS
  ======================================================= */

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent:
      "space-between",
    marginBottom: 22,
  },

  quickAction: {
    width: "31.5%",
    minHeight: 92,
    backgroundColor:
      colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      colors.border,
    padding: 10,
    marginBottom: 8,
    justifyContent:
      "space-between",
  },

  quickActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor:
      colors.infoBackground,
    justifyContent: "center",
    alignItems: "center",
  },

  quickActionText: {
    flex: 1,
    marginTop: 8,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "700",
    color: colors.textDark,
  },

  /* =======================================================
     SECONDARY MENU
  ======================================================= */

  secondaryContainer: {
    marginBottom: 22,
  },

  otherMenu: {
    minHeight: 59,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      colors.border,
    paddingHorizontal: 11,
    marginBottom: 8,
  },

  otherMenuIcon: {
    width: 39,
    height: 39,
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
    fontSize: 12,
    fontWeight: "800",
    color: colors.textDark,
  },

  otherMenuDescription: {
    marginTop: 2,
    fontSize: 9,
    color: colors.textGray,
  },

  otherMenuArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor:
      colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  /* =======================================================
     INFORMATION
  ======================================================= */

  infoCard: {
    flexDirection: "row",
    backgroundColor:
      colors.infoBackground,
    borderRadius: 17,
    padding: 13,
    marginBottom: 20,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textDark,
  },

  infoText: {
    marginTop: 4,
    fontSize: 9,
    lineHeight: 14,
    color: colors.textGray,
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  footerText: {
    marginLeft: 5,
    fontSize: 9,
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