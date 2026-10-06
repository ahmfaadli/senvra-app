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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";

export default function Reports() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [attendance, setAttendance] = useState(0);
  const [jobs, setJobs] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [requests, setRequests] = useState(0);

  // =========================================================
  // LOAD REPORTS
  // =========================================================

  const loadReports = async () => {
    try {
      setLoading(true);

      const attendanceResult = await supabase
        .from("attendance")
        .select("id", {
          count: "exact",
          head: true,
        });

      const jobsResult = await supabase
        .from("jobs")
        .select("id", {
          count: "exact",
          head: true,
        });

      const completedResult = await supabase
        .from("jobs")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "Selesai");

      const requestsResult = await supabase
        .from("surat_requests")
        .select("id", {
          count: "exact",
          head: true,
        });

      setAttendance(attendanceResult?.count || 0);
      setJobs(jobsResult?.count || 0);
      setCompletedJobs(completedResult?.count || 0);
      setRequests(requestsResult?.count || 0);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // LOAD WHEN SCREEN FOCUSED
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(
              45,
              insets.bottom + 35
            ),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#175CD3"]}
            tintColor="#175CD3"
            title="Memuat ulang..."
            progressViewOffset={8}
          />
        }
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
              Laporan
            </Text>

            <Text style={styles.subtitle}>
              Ringkasan data aplikasi.
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* SUMMARY INFO */}
        {/* ================================================= */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="analytics-outline"
              size={19}
              color="#175CD3"
            />
          </View>

          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>
              RINGKASAN SISTEM
            </Text>

            <Text style={styles.summaryText}>
              Pantau jumlah data kehadiran, jobdesk,
              progress, dan pengajuan surat.
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator
              size="large"
              color="#175CD3"
            />

            <Text style={styles.loadingText}>
              Memuat laporan...
            </Text>
          </View>
        ) : (
          <View style={styles.cards}>
            {/* KEHADIRAN */}

            <ReportCard
              icon="time-outline"
              iconBackground="#EFF4FF"
              iconColor="#175CD3"
              title="Laporan Kehadiran"
              value={attendance}
              description="Total data absensi"
            />

            {/* JOBDESK */}

            <ReportCard
              icon="briefcase-outline"
              iconBackground="#F4F3FF"
              iconColor="#6941C6"
              title="Laporan Jobdesk"
              value={jobs}
              description="Total pekerjaan"
            />

            {/* PROGRESS */}

            <ReportCard
              icon="checkmark-circle-outline"
              iconBackground="#ECFDF3"
              iconColor="#027A48"
              title="Laporan Progress"
              value={completedJobs}
              description="Jobdesk selesai"
            />

            {/* SURAT */}

            <ReportCard
              icon="document-text-outline"
              iconBackground="#FFF4ED"
              iconColor="#C4320A"
              title="Laporan Pengajuan Surat"
              value={requests}
              description="Total pengajuan"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================
// REPORT CARD
// =========================================================

function ReportCard({
  icon,
  iconBackground,
  iconColor,
  title,
  value,
  description,
}) {
  return (
    <View style={styles.card}>
      {/* ICON */}

      <View
        style={[
          styles.icon,
          {
            backgroundColor: iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={iconColor}
        />
      </View>

      {/* INFO */}

      <View style={styles.info}>
        <Text
          style={styles.cardTitle}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={styles.valueRow}>
          <Text style={styles.value}>
            {value}
          </Text>

          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: iconColor,
              },
            ]}
          />
        </View>

        <Text style={styles.description}>
          {description}
        </Text>
      </View>

      {/* CHEVRON */}

      <View style={styles.chevron}>
        <Ionicons
          name="chevron-forward"
          size={17}
          color="#98A2B3"
        />
      </View>
    </View>
  );
}

// =========================================================
// STYLE
// =========================================================

const styles = StyleSheet.create({
  // =======================================================
  // SAFE AREA
  // =======================================================

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
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#101828",
    letterSpacing: -0.4,
  },

  subtitle: {
    marginTop: 5,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },

  // =======================================================
  // SUMMARY
  // =======================================================

  summaryCard: {
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

  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryInfo: {
    flex: 1,
    marginLeft: 11,
  },

  summaryTitle: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  summaryText: {
    marginTop: 4,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
  },

  // =======================================================
  // CARDS
  // =======================================================

  cards: {
    gap: 12,
  },

  card: {
    minHeight: 96,
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

  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  info: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  cardTitle: {
    color: "#101828",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },

  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  value: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    color: "#101828",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 7,
  },

  description: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#667085",
  },

  chevron: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },

  // =======================================================
  // LOADING
  // =======================================================

  loadingCard: {
    minHeight: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,

    shadowColor: "#101828",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  loadingText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
  },
});