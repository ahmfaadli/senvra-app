import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { supabase } from "../../../services/supabase";

export default function AdminEmployees() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * =========================================================
   * LOAD EMPLOYEES
   * =========================================================
   */
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            id,
            nama,
            email,
            role,
            jabatan,
            divisi,
            status
          `
        )
        .eq("status", "aktif")
        .order("nama", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Gagal mengambil data pegawai:",
          error.message
        );

        setEmployees([]);
        return;
      }

      /**
       * Admin dan administrator tidak ditampilkan
       * pada halaman daftar pegawai.
       */
      const filteredEmployees = (data || []).filter(
        (employee) => {
          const role = String(
            employee?.role || ""
          )
            .trim()
            .toLowerCase();

          return (
            role !== "admin" &&
            role !== "administrator"
          );
        }
      );

      setEmployees(filteredEmployees);
    } catch (error) {
      console.error(
        "Load employees error:",
        error
      );

      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  /**
   * =========================================================
   * PULL TO REFRESH
   * =========================================================
   */
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      await loadEmployees();
    } catch (error) {
      console.error(
        "Refresh employees error:",
        error
      );
    } finally {
      setRefreshing(false);
    }
  }, [loadEmployees]);

  /**
   * =========================================================
   * GET INITIAL
   * =========================================================
   */
  const getInitial = (name) => {
    if (!name) {
      return "?";
    }

    return String(name)
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  /**
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text style={styles.loadingText}>
          Memuat data pegawai...
        </Text>
      </View>
    );
  }

  /**
   * =========================================================
   * MAIN PAGE
   * =========================================================
   */
  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(
              100,
              insets.bottom + 30
            ),
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#175CD3"]}
            tintColor="#175CD3"
          />
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Pegawai
          </Text>

          <Text style={styles.subtitle}>
            Daftar pegawai aktif yang terdaftar
            dalam sistem.
          </Text>
        </View>

        {/* =================================================
            SUMMARY
        ================================================= */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="people-outline"
              size={23}
              color="#175CD3"
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>
              TOTAL PEGAWAI AKTIF
            </Text>

            <Text style={styles.summaryValue}>
              {employees.length}
            </Text>
          </View>

          <View style={styles.activeIndicator}>
            <View style={styles.activeDot} />

            <Text style={styles.activeText}>
              Aktif
            </Text>
          </View>
        </View>

        {/* =================================================
            INFO
        ================================================= */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#175CD3"
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Informasi
            </Text>

            <Text style={styles.infoText}>
              Daftar ini hanya menampilkan pegawai
              dengan status aktif. Admin tidak
              ditampilkan dalam daftar.
            </Text>
          </View>
        </View>

        {/* =================================================
            SECTION HEADER
        ================================================= */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Daftar Pegawai
            </Text>

            <Text style={styles.sectionSubtitle}>
              Pilih pegawai untuk melihat detail.
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {employees.length}
            </Text>
          </View>
        </View>

        {/* =================================================
            EMPTY STATE
        ================================================= */}
        {employees.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={28}
                color="#175CD3"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Belum ada pegawai
            </Text>

            <Text style={styles.emptyText}>
              Belum terdapat pegawai aktif yang
              dapat ditampilkan.
            </Text>
          </View>
        ) : (
          /**
           * =================================================
           * EMPLOYEE LIST
           * =================================================
           */
          <View style={styles.list}>
            {employees.map((employee) => (
              <Pressable
                key={employee.id}
                onPress={() =>
                  router.push({
                    pathname:
                      "/admin/employee-detail",
                    params: {
                      id: employee.id,
                    },
                  })
                }
                style={({ pressed }) => [
                  styles.employeeWrapper,
                  pressed &&
                    styles.employeePressed,
                ]}
              >
                <View style={styles.employeeCard}>
                  {/* =================================================
                      TOP
                  ================================================= */}
                  <View style={styles.employeeTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {getInitial(
                          employee.nama
                        )}
                      </Text>
                    </View>

                    <View style={styles.employeeMain}>
                      <Text
                        style={styles.employeeName}
                        numberOfLines={1}
                      >
                        {employee.nama ||
                          "Nama tidak tersedia"}
                      </Text>

                      <Text
                        style={styles.employeeEmail}
                        numberOfLines={1}
                      >
                        {employee.email ||
                          "Email tidak tersedia"}
                      </Text>
                    </View>

                    <View style={styles.chevron}>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#98A2B3"
                      />
                    </View>
                  </View>

                  {/* =================================================
                      DIVIDER
                  ================================================= */}
                  <View
                    style={styles.divider}
                  />

                  {/* =================================================
                      INFORMATION
                  ================================================= */}
                  <View style={styles.employeeInfo}>
                    <View style={styles.infoItem}>
                      <View
                        style={styles.smallIcon}
                      >
                        <Ionicons
                          name="briefcase-outline"
                          size={14}
                          color="#667085"
                        />
                      </View>

                      <View
                        style={
                          styles.infoItemContent
                        }
                      >
                        <Text
                          style={
                            styles.infoItemLabel
                          }
                        >
                          JABATAN
                        </Text>

                        <Text
                          style={
                            styles.infoItemValue
                          }
                          numberOfLines={1}
                        >
                          {employee.jabatan ||
                            "-"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoItem}>
                      <View
                        style={styles.smallIcon}
                      >
                        <Ionicons
                          name="business-outline"
                          size={14}
                          color="#667085"
                        />
                      </View>

                      <View
                        style={
                          styles.infoItemContent
                        }
                      >
                        <Text
                          style={
                            styles.infoItemLabel
                          }
                        >
                          DIVISI
                        </Text>

                        <Text
                          style={
                            styles.infoItemValue
                          }
                          numberOfLines={1}
                        >
                          {employee.divisi ||
                            "-"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* =================================================
                      FOOTER
                  ================================================= */}
                  <View
                    style={styles.employeeFooter}
                  >
                    <View
                      style={styles.statusBadge}
                    >
                      <View
                        style={styles.statusDot}
                      />

                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        Aktif
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.detailText
                      }
                    >
                      Lihat detail
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Senvra • Manajemen Pegawai
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * =========================================================
 * STYLES
 * =========================================================
 */
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
    paddingTop: 20,
  },

  /**
   * =========================================================
   * LOADING
   * =========================================================
   */
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#667085",
    fontSize: 14,
    marginTop: 12,
  },

  /**
   * =========================================================
   * HEADER
   * =========================================================
   */
  header: {
    marginBottom: 20,
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

  /**
   * =========================================================
   * SUMMARY
   * =========================================================
   */
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  summaryContent: {
    flex: 1,
    minWidth: 0,
  },

  summaryLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#98A2B3",
    letterSpacing: 0.7,
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#101828",
    marginTop: 2,
  },

  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#12B76A",
    marginRight: 6,
  },

  activeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#027A48",
  },

  /**
   * =========================================================
   * INFO
   * =========================================================
   */
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EAECF0",
    padding: 14,
    flexDirection: "row",
    marginBottom: 24,
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#344054",
  },

  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#667085",
    marginTop: 3,
  },

  /**
   * =========================================================
   * SECTION
   * =========================================================
   */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#101828",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#98A2B3",
    marginTop: 3,
  },

  countBadge: {
    minWidth: 32,
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    justifyContent: "center",
    alignItems: "center",
  },

  countBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#344054",
  },

  /**
   * =========================================================
   * LIST
   * =========================================================
   */
  list: {
    width: "100%",
  },

  employeeWrapper: {
    marginBottom: 12,
  },

  employeePressed: {
    opacity: 0.9,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  employeeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",
    padding: 15,
  },

  /**
   * =========================================================
   * EMPLOYEE TOP
   * =========================================================
   */
  employeeTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 19,
    fontWeight: "900",
    color: "#175CD3",
  },

  employeeMain: {
    flex: 1,
    minWidth: 0,
  },

  employeeName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
  },

  employeeEmail: {
    fontSize: 12,
    color: "#667085",
    marginTop: 4,
  },

  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  /**
   * =========================================================
   * DIVIDER
   * =========================================================
   */
  divider: {
    height: 1,
    backgroundColor: "#EAECF0",
    marginVertical: 14,
  },

  /**
   * =========================================================
   * EMPLOYEE INFO
   * =========================================================
   */
  employeeInfo: {
    flexDirection: "row",
    gap: 10,
  },

  infoItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  smallIcon: {
    width: 29,
    height: 29,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  infoItemContent: {
    flex: 1,
    minWidth: 0,
  },

  infoItemLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#98A2B3",
    letterSpacing: 0.6,
  },

  infoItemValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#344054",
    marginTop: 2,
  },

  /**
   * =========================================================
   * EMPLOYEE FOOTER
   * =========================================================
   */
  employeeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#12B76A",
    marginRight: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#027A48",
  },

  detailText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#667085",
  },

  /**
   * =========================================================
   * EMPTY STATE
   * =========================================================
   */
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
  },

  emptyText: {
    color: "#667085",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 290,
  },

  /**
   * =========================================================
   * FOOTER
   * =========================================================
   */
  footer: {
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 10,
  },

  footerText: {
    fontSize: 10,
    color: "#98A2B3",
    fontWeight: "600",
  },
});