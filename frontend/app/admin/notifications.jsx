import React, { useCallback, useState } from "react";

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
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";

export default function AdminNotifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // -------------------------------------------------------
      // Ambil profile admin
      // -------------------------------------------------------

      const {
        data: adminData,
        error: adminError,
      } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "administrator"]);

      if (adminError) {
        throw adminError;
      }

      const adminIds = (adminData || []).map(
        (item) => item.id
      );

      // -------------------------------------------------------
      // Ambil notifikasi
      // -------------------------------------------------------

      if (adminIds.length === 0) {
        setNotifications([]);
        return;
      }

      const {
        data: notificationData,
        error: notificationError,
      } = await supabase
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
        .in("employee_id", adminIds)
        .order("created_at", {
          ascending: false,
        });

      if (notificationError) {
        throw notificationError;
      }

      setNotifications(notificationData || []);
    } catch (error) {
      console.log(
        "LOAD NOTIFICATIONS ERROR:",
        error
      );

      Alert.alert(
        "Gagal",
        error?.message ||
          "Gagal mengambil data notifikasi."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatNotificationDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // MARK AS READ
  // =========================================================

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notificationId);

      if (error) {
        throw error;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );
    } catch (error) {
      console.log(
        "MARK READ ERROR:",
        error
      );

      Alert.alert(
        "Gagal",
        error?.message ||
          "Gagal memperbarui notifikasi."
      );
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((item) => !item.is_read)
        .map((item) => item.id);

      if (unreadIds.length === 0) {
        return;
      }

      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .in("id", unreadIds);

      if (error) {
        throw error;
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        }))
      );
    } catch (error) {
      console.log(
        "MARK ALL READ ERROR:",
        error
      );

      Alert.alert(
        "Gagal",
        error?.message ||
          "Gagal memperbarui notifikasi."
      );
    }
  };

  // =========================================================
  // UNREAD COUNT
  // =========================================================

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
        edges={["top", "bottom"]}
      >
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text style={styles.loadingText}>
          Memuat notifikasi...
        </Text>
      </SafeAreaView>
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#175CD3"]}
            tintColor="#175CD3"
            progressViewOffset={8}
          />
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(
              45,
              insets.bottom + 30
            ),
          },
        ]}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

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
              Notifikasi
            </Text>

            <Text style={styles.subtitle}>
              Pemberitahuan aktivitas dan pengajuan pegawai.
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* NOTIFICATION SUMMARY */}
        {/* ================================================= */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="notifications-outline"
              size={21}
              color="#175CD3"
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              Notifikasi Masuk
            </Text>

            <Text style={styles.summaryDescription}>
              {notifications.length} notifikasi
              {unreadCount > 0
                ? ` • ${unreadCount} belum dibaca`
                : " • Semua sudah dibaca"}
            </Text>
          </View>

          {unreadCount > 0 && (
            <Pressable
              style={styles.readAllButton}
              onPress={markAllAsRead}
            >
              <Text style={styles.readAllText}>
                Tandai semua
              </Text>
            </Pressable>
          )}
        </View>

        {/* ================================================= */}
        {/* INCOMING NOTIFICATIONS */}
        {/* ================================================= */}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons
              name="mail-unread-outline"
              size={17}
              color="#175CD3"
            />
          </View>

          <Text style={styles.sectionTitle}>
            NOTIFIKASI MASUK
          </Text>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="notifications-off-outline"
                size={28}
                color="#175CD3"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Belum ada notifikasi
            </Text>

            <Text style={styles.emptyDescription}>
              Notifikasi pengajuan surat dari pegawai
              akan muncul di sini secara otomatis.
            </Text>
          </View>
        ) : (
          notifications.map((item) => (
            <View
              key={item.id}
              style={[
                styles.notificationCard,
                !item.is_read &&
                  styles.notificationUnread,
              ]}
            >
              {/* NOTIFICATION HEADER */}

              <View style={styles.notificationTop}>
                <View
                  style={[
                    styles.notificationIcon,
                    !item.is_read &&
                      styles.notificationIconUnread,
                  ]}
                >
                  <Ionicons
                    name={
                      item.type === "surat_request"
                        ? "document-text-outline"
                        : "notifications-outline"
                    }
                    size={20}
                    color="#175CD3"
                  />
                </View>

                <View
                  style={
                    styles.notificationHeaderText
                  }
                >
                  <Text
                    style={styles.notificationTitle}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={styles.notificationDate}
                  >
                    {formatNotificationDate(
                      item.created_at
                    )}
                  </Text>
                </View>

                {!item.is_read && (
                  <View style={styles.unreadDot} />
                )}
              </View>

              {/* MESSAGE */}

              <Text style={styles.notificationMessage}>
                {item.message}
              </Text>

              {/* FOOTER */}

              <View
                style={styles.notificationFooter}
              >
                <View style={styles.typeBadge}>
                  <Text
                    style={styles.typeBadgeText}
                  >
                    {item.type === "surat_request"
                      ? "Pengajuan Surat"
                      : item.type === "surat_status"
                      ? "Status Surat"
                      : "Notifikasi"}
                  </Text>
                </View>

                {!item.is_read && (
                  <Pressable
                    style={styles.markReadButton}
                    onPress={() =>
                      markAsRead(item.id)
                    }
                  >
                    <Ionicons
                      name="checkmark-done-outline"
                      size={16}
                      color="#175CD3"
                    />

                    <Text
                      style={styles.markReadText}
                    >
                      Sudah dibaca
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const styles = StyleSheet.create({
  // =========================================================
  // CONTAINER
  // =========================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingTop: 16,
  },

  // =========================================================
  // HEADER
  // =========================================================

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingTop: 0,
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
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#101828",
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 5,
  },

  // =========================================================
  // SUMMARY
  // =========================================================

  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,

    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#101828",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#101828",
  },

  summaryDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#667085",
    marginTop: 3,
  },

  readAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#EFF4FF",
  },

  readAllText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#175CD3",
  },

  // =========================================================
  // SECTION
  // =========================================================

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 10,
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

  // =========================================================
  // NOTIFICATION CARD
  // =========================================================

  notificationCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,

    backgroundColor: "#FFFFFF",
    borderRadius: 16,
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

  notificationUnread: {
    borderColor: "#B2CCFF",
  },

  notificationTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  notificationIconUnread: {
    backgroundColor: "#EFF4FF",
  },

  notificationHeaderText: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: "#101828",
  },

  notificationDate: {
    fontSize: 11,
    color: "#98A2B3",
    marginTop: 3,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#175CD3",
    marginLeft: 8,
  },

  notificationMessage: {
    fontSize: 13,
    lineHeight: 20,
    color: "#667085",
    marginTop: 13,
  },

  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EFF4FF",
  },

  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#175CD3",
  },

  markReadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F5F7FB",
  },

  markReadText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#175CD3",
    marginLeft: 5,
  },

  // =========================================================
  // EMPTY
  // =========================================================

  emptyCard: {
    marginHorizontal: 20,
    padding: 30,

    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",

    alignItems: "center",

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

  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#667085",
    textAlign: "center",
    marginTop: 7,
  },

  // =========================================================
  // LOADING
  // =========================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontSize: 13,
    color: "#667085",
    marginTop: 10,
  },
});