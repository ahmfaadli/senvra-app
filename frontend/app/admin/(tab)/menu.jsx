import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "../../../theme";

const MENU_ITEMS = [
  {
    title: "Jobdesk",
    description: "Kelola pekerjaan dan tugas pegawai",
    icon: "briefcase-outline",
    color: "#EC4899",
    background: "#FCE7F3",
    route: "/admin/jobdesk/jobdesk",
  },
  {
    title: "Meeting",
    description: "Kelola jadwal dan agenda meeting",
    icon: "videocam-outline",
    color: "#0891B2",
    background: "#CFFAFE",
    route: "/admin/meetings/meetings",
  },
  {
    title: "Pengajuan Surat",
    description: "Kelola pengajuan dari pegawai",
    icon: "document-text-outline",
    color: "#D97706",
    background: "#FEF3C7",
    route: "/admin/request/requests",
  },
  {
    title: "Notifikasi",
    description: "Lihat pemberitahuan sistem",
    icon: "notifications-outline",
    color: "#DC2626",
    background: "#FEE2E2",
    route: "/admin/notifications",
  },
  {
    title: "Laporan",
    description: "Lihat laporan administrasi",
    icon: "bar-chart-outline",
    color: "#7C3AED",
    background: "#EDE9FE",
    route: "/admin/reports",
  },
];

export default function AdminMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  /*
   * =======================================================
   * RESPONSIVE
   * =======================================================
   */

  const isSmallScreen = width < 360;
  const isTablet = width >= 600;

  const horizontalPadding = isTablet
    ? 32
    : isSmallScreen
      ? 14
      : 20;

  /*
   * =======================================================
   * SAFE AREA
   * =======================================================
   *
   * SafeAreaView sudah menangani area status bar.
   * Bottom padding mengikuti inset perangkat agar
   * konten terakhir tidak tertutup navigation/tab bar.
   */

  const safeBottom = 30 + insets.bottom;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: safeBottom,
          },
        ]}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={[
            styles.header,
            {
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >

          <View style={styles.headerText}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: isSmallScreen
                    ? 21
                    : isTablet
                      ? 28
                      : 28,
                },
              ]}
            >
              Menu Lainnya
            </Text>

            <Text style={styles.subtitle}>
              Kelola fitur administrasi lainnya
            </Text>
          </View>
        </View>

        {/* =================================================
            MENU
        ================================================= */}

        <View
          style={[
            styles.menuContainer,
            {
              marginHorizontal: horizontalPadding,
            },
          ]}
        >
          {MENU_ITEMS.map((item, index) => {
            const isLast = index === MENU_ITEMS.length - 1;

            return (
              <Pressable
                key={item.route}
                onPress={() => router.push(item.route)}
                style={({ pressed }) => [
                  styles.menuItem,
                  !isLast && styles.menuItemBorder,
                  pressed && styles.menuItemPressed,
                ]}
              >
                {/* ICON */}

                <View
                  style={[
                    styles.menuIcon,
                    {
                      backgroundColor: item.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={23}
                    color={item.color}
                  />
                </View>

                {/* TEXT */}

                <View style={styles.menuInfo}>
                  <Text
                    style={styles.menuTitle}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={styles.menuDescription}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                </View>

                {/* ARROW */}

                <View style={styles.arrow}>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textLight}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* =================================================
            ADMIN INFORMATION
        ================================================= */}

        <View
          style={[
            styles.infoCard,
            {
              marginHorizontal: horizontalPadding,
            },
          ]}
        >
          <View style={styles.infoIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Admin Dashboard
            </Text>

            <Text style={styles.infoDescription}>
              Gunakan menu ini untuk mengakses fitur administrasi
              yang tidak ditampilkan pada navigasi utama.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /*
   * =======================================================
   * SAFE AREA
   * =======================================================
   */

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
  },

  /*
   * =======================================================
   * HEADER
   * =======================================================
   */

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#101828",
  },

  subtitle: {
    color: "#667085",
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
  },

  /*
   * =======================================================
   * MENU
   * =======================================================
   */

  menuContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  menuItem: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  menuItemPressed: {
    backgroundColor: colors.surfaceMuted,
  },

  menuIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  menuInfo: {
    flex: 1,
    marginLeft: spacing.md,
    paddingRight: spacing.sm,
    minWidth: 0,
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textMedium,
  },

  menuDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textLight,
  },

  arrow: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  /*
   * =======================================================
   * INFORMATION CARD
   * =======================================================
   */

  infoCard: {
    marginTop: spacing.xl,
    padding: 15,
    borderRadius: radius.lg,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    flexDirection: "row",
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  infoContent: {
    flex: 1,
    marginLeft: 16,
    minWidth: 0,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E3A8A",
  },

  infoDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: "#475467",
  },
});