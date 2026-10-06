import React, { useCallback, useState } from "react";
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
import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/UI";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user, session, profile } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // AMBIL ID PEGAWAI
  // =========================================================
  const getUserId = () => {
    return (
      user?.id ||
      session?.user?.id ||
      profile?.id ||
      null
    );
  };

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================
  const loadNotifications = async () => {
    try {
      setLoading(true);

      const employeeId = getUserId();

      console.log("=================================");
      console.log("MENGAMBIL NOTIFIKASI");
      console.log("EMPLOYEE ID:", employeeId);

      if (!employeeId) {
        console.log(
          "ID employee tidak ditemukan"
        );

        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          employee_id,
          type,
          title,
          message,
          reference_id,
          is_read,
          created_at
        `)
        .eq("employee_id", employeeId)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.log(
          "NOTIFICATION ERROR:",
          error
        );

        return;
      }

      console.log(
        "JUMLAH NOTIFIKASI:",
        data?.length || 0
      );

      console.log(
        "DATA NOTIFIKASI:",
        data
      );

      setNotifications(data || []);
    } catch (error) {
      console.log(
        "LOAD NOTIFICATION ERROR:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // LOAD SAAT HALAMAN DIBUKA / KEMBALI KE HALAMAN
  // =========================================================
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [
      user?.id,
      session?.user?.id,
      profile?.id,
    ])
  );

  // =========================================================
  // REFRESH
  // =========================================================
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  // =========================================================
  // ICON NOTIFIKASI
  // =========================================================
  const getIcon = (type) => {
    switch (type) {
      case "meeting":
        return "videocam-outline";

      case "job":
      case "jobdesk":
        return "briefcase-outline";

      case "surat":
        return "document-text-outline";

      case "attendance":
      case "absensi":
        return "time-outline";

      case "leave":
      case "cuti":
        return "calendar-outline";

      default:
        return "notifications-outline";
    }
  };

  // =========================================================
  // WARNA BACKGROUND ICON
  // =========================================================
  const getIconBackground = (type) => {
    switch (type) {
      case "meeting":
        return "#EAF2FF";

      case "job":
      case "jobdesk":
        return "#EEF4FF";

      case "surat":
        return "#FFF4E5";

      case "attendance":
      case "absensi":
        return "#ECFDF3";

      case "leave":
      case "cuti":
        return "#F4EBFF";

      default:
        return "#F2F4F7";
    }
  };

  // =========================================================
  // WARNA ICON
  // =========================================================
  const getIconColor = (type) => {
    switch (type) {
      case "meeting":
        return "#175CD3";

      case "job":
      case "jobdesk":
        return "#6941C6";

      case "surat":
        return "#DC6803";

      case "attendance":
      case "absensi":
        return "#027A48";

      case "leave":
      case "cuti":
        return "#7F56D9";

      default:
        return "#667085";
    }
  };

  // =========================================================
  // FORMAT WAKTU
  // =========================================================
  const formatTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // RENDER
  // =========================================================
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
            onRefresh={onRefresh}
            tintColor="#175CD3"
            colors={["#175CD3"]}
          />
        }
      >
        {/* =====================================================
            HEADER
        ===================================================== */}
        <View style={styles.pageHeader}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.back,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#344054"
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text
              style={styles.pageTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Notifikasi
            </Text>

            <Text
              style={styles.pageSubtitle}
              numberOfLines={1}
            >
              Informasi terbaru untuk kamu
            </Text>
          </View>
        </View>

        {/* =====================================================
            LOADING
        ===================================================== */}
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color="#175CD3"
            />

            <Text style={styles.loadingText}>
              Memuat notifikasi...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          /* ===================================================
             EMPTY STATE
          =================================================== */
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="notifications-off-outline"
                size={32}
                color="#98A2B3"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Belum ada notifikasi
            </Text>

            <Text style={styles.emptyMessage}>
              Notifikasi terbaru seperti jobdesk,
              meeting, dan informasi lainnya akan
              muncul di sini.
            </Text>
          </View>
        ) : (
          /* ===================================================
             LIST NOTIFIKASI
          =================================================== */
          <View style={styles.notificationList}>
            {notifications.map((item) => (
              <Card
                key={item.id}
                style={[
                  styles.card,
                  !item.is_read &&
                    styles.unreadCard,
                ]}
              >
                <View style={styles.row}>
                  {/* ICON */}
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor:
                          getIconBackground(
                            item.type
                          ),
                      },
                    ]}
                  >
                    <Ionicons
                      name={getIcon(item.type)}
                      size={21}
                      color={getIconColor(item.type)}
                    />
                  </View>

                  {/* CONTENT */}
                  <View style={styles.textBox}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.title,
                          !item.is_read &&
                            styles.unreadTitle,
                        ]}
                      >
                        {item.title}
                      </Text>

                      {!item.is_read && (
                        <View
                          style={styles.unreadDot}
                        />
                      )}
                    </View>

                    <Text style={styles.message}>
                      {item.message}
                    </Text>

                    <Text style={styles.time}>
                      {formatTime(
                        item.created_at
                      )}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // =========================================================
  // BASE
  // =========================================================
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
    paddingTop: 18,
  },

  // =========================================================
  // HEADER
  // =========================================================
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#EAECF0",
    flexShrink: 0,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#101828",
  },

  pageSubtitle: {
    fontSize: 13,
    color: "#667085",
    marginTop: 3,
  },

  // =========================================================
  // LOADING
  // =========================================================
  loading: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },

  loadingText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
  },

  // =========================================================
  // EMPTY
  // =========================================================
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#101828",
    textAlign: "center",
  },

  emptyMessage: {
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 320,
  },

  // =========================================================
  // NOTIFICATION LIST
  // =========================================================
  notificationList: {
    width: "100%",
  },

  card: {
    marginBottom: 12,
  },

  unreadCard: {
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },

  icon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
    flexShrink: 0,
  },

  textBox: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },

  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "800",
    color: "#101828",
    lineHeight: 20,
  },

  unreadTitle: {
    fontWeight: "900",
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#175CD3",
    marginLeft: 8,
    flexShrink: 0,
  },

  message: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  time: {
    color: "#98A2B3",
    fontSize: 11,
    marginTop: 7,
  },

  // =========================================================
  // PRESS
  // =========================================================
  buttonPressed: {
    opacity: 0.7,
  },
});