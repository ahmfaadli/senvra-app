import React, { useCallback, useMemo, useState } from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../services/supabase";

const MONTH_NAMES = [
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

const DAY_NAMES = [
  "Min",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
];

export default function AdminAttendance() {
  const insets = useSafeAreaInsets();

  const now = new Date();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDate, setSelectedDate] = useState(
    formatDateLocal(now)
  );

  const [calendarMonth, setCalendarMonth] = useState(
    now.getMonth()
  );

  const [calendarYear, setCalendarYear] = useState(
    now.getFullYear()
  );

  const [search, setSearch] = useState("");

  // =========================================================
  // TANGGAL
  // =========================================================

  function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(dateString) {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");

    if (!year || !month || !day) {
      return dateString;
    }

    return `${day} ${MONTH_NAMES[Number(month) - 1]} ${year}`;
  }

  function formatTime(time) {
    if (!time) return "-";

    return String(time).substring(0, 5);
  }

  function getTodayDate() {
    return formatDateLocal(new Date());
  }

  function getYesterdayDate() {
    const date = new Date();

    date.setDate(date.getDate() - 1);

    return formatDateLocal(date);
  }

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadAttendance = async (
    year = calendarYear,
    month = calendarMonth
  ) => {
    try {
      setLoading(true);

      /*
       * Ambil tanggal pertama bulan
       *
       * month di JavaScript dimulai dari 0.
       * Januari = 0
       * September = 8
       */

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = formatDateLocal(firstDay);
      const endDate = formatDateLocal(lastDay);

      console.log("=================================");
      console.log("LOAD ATTENDANCE");
      console.log("START:", startDate);
      console.log("END:", endDate);

      // =====================================================
      // AMBIL DATA ABSENSI
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
        .gte("tanggal_absen", startDate)
        .lte("tanggal_absen", endDate)
        .order("tanggal_absen", {
          ascending: false,
        })
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
        "Jumlah attendance:",
        mergedData.length
      );

      setAttendance(mergedData);
    } catch (error) {
      console.error(
        "LOAD ATTENDANCE ERROR:",
        error
      );

      Alert.alert(
        "Gagal",
        error?.message ||
          "Gagal mengambil data absensi."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [calendarYear, calendarMonth])
  );

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadAttendance(
      calendarYear,
      calendarMonth
    );
  };

  // =========================================================
  // KALENDER
  // =========================================================

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      calendarYear,
      calendarMonth,
      1
    );

    const lastDay = new Date(
      calendarYear,
      calendarMonth + 1,
      0
    );

    const firstWeekDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    // Kotak kosong sebelum tanggal 1
    for (let i = 0; i < firstWeekDay; i++) {
      days.push(null);
    }

    // Semua tanggal
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(
        calendarYear,
        calendarMonth,
        day
      );

      days.push({
        day,
        date: formatDateLocal(date),
      });
    }

    return days;
  }, [calendarYear, calendarMonth]);

  // =========================================================
  // JUMLAH ABSEN PER TANGGAL
  // =========================================================

  const attendanceCountByDate = useMemo(() => {
    const result = {};

    attendance.forEach((item) => {
      const date = item.tanggal_absen;

      if (!date) return;

      result[date] = (result[date] || 0) + 1;
    });

    return result;
  }, [attendance]);

  // =========================================================
  // TOTAL ABSEN BULAN INI
  // =========================================================

  const totalMonthlyAttendance =
    attendance.length;

  // =========================================================
  // DATA UNTUK TANGGAL YANG DIPILIH
  // =========================================================

  const selectedAttendance = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return attendance.filter((item) => {
      if (
        item.tanggal_absen !== selectedDate
      ) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const name =
        item.employee?.nama?.toLowerCase() || "";

      const email =
        item.employee?.email?.toLowerCase() || "";

      const jabatan =
        item.employee?.jabatan?.toLowerCase() || "";

      return (
        name.includes(keyword) ||
        email.includes(keyword) ||
        jabatan.includes(keyword)
      );
    });
  }, [
    attendance,
    selectedDate,
    search,
  ]);

  // =========================================================
  // PINDAH BULAN
  // =========================================================

  const changeMonth = (direction) => {
    let newMonth = calendarMonth + direction;
    let newYear = calendarYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    setCalendarMonth(newMonth);
    setCalendarYear(newYear);

    /*
     * Pilih tanggal 1 ketika pindah bulan.
     */

    setSelectedDate(
      `${newYear}-${String(
        newMonth + 1
      ).padStart(2, "0")}-01`
    );
  };

  // =========================================================
  // HARI INI
  // =========================================================

  const handleToday = () => {
    const today = new Date();

    setCalendarYear(
      today.getFullYear()
    );

    setCalendarMonth(
      today.getMonth()
    );

    setSelectedDate(
      formatDateLocal(today)
    );

    setSearch("");
  };

  // =========================================================
  // KEMARIN
  // =========================================================

  const handleYesterday = () => {
    const yesterday = new Date();

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    setCalendarYear(
      yesterday.getFullYear()
    );

    setCalendarMonth(
      yesterday.getMonth()
    );

    setSelectedDate(
      formatDateLocal(yesterday)
    );

    setSearch("");
  };

  // =========================================================
  // APAKAH HARI INI?
  // =========================================================

  const todayDate = getTodayDate();

  const yesterdayDate =
    getYesterdayDate();

  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading &&
    attendance.length === 0
  ) {
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
          Memuat data absensi...
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
            paddingBottom:
              30 + insets.bottom,
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
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Rekap Absensi
            </Text>

            <Text style={styles.subtitle}>
              Pantau kehadiran pegawai.
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* SUMMARY */}
        {/* ================================================= */}

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                {
                  backgroundColor:
                    "#EAF2FF",
                },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={20}
                color="#175CD3"
              />
            </View>

            <Text style={styles.summaryValue}>
              {attendanceCountByDate[
                todayDate
              ] || 0}
            </Text>

            <Text style={styles.summaryLabel}>
              Hari Ini
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                {
                  backgroundColor:
                    "#F2F4F7",
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color="#667085"
              />
            </View>

            <Text style={styles.summaryValue}>
              {attendanceCountByDate[
                yesterdayDate
              ] || 0}
            </Text>

            <Text style={styles.summaryLabel}>
              Kemarin
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                {
                  backgroundColor:
                    "#ECFDF3",
                },
              ]}
            >
              <Ionicons
                name="stats-chart-outline"
                size={20}
                color="#027A48"
              />
            </View>

            <Text style={styles.summaryValue}>
              {totalMonthlyAttendance}
            </Text>

            <Text style={styles.summaryLabel}>
              Bulan Ini
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* QUICK DATE */}
        {/* ================================================= */}

        <View style={styles.quickDateRow}>
          <Pressable
            style={[
              styles.quickButton,
              selectedDate === todayDate &&
                styles.quickButtonActive,
            ]}
            onPress={handleToday}
          >
            <Ionicons
              name="today-outline"
              size={17}
              color={
                selectedDate === todayDate
                  ? "#FFFFFF"
                  : "#175CD3"
              }
            />

            <Text
              style={[
                styles.quickButtonText,
                selectedDate === todayDate &&
                  styles.quickButtonTextActive,
              ]}
            >
              Hari Ini
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.quickButton,
              selectedDate === yesterdayDate &&
                styles.quickButtonActive,
            ]}
            onPress={handleYesterday}
          >
            <Ionicons
              name="arrow-back-outline"
              size={17}
              color={
                selectedDate === yesterdayDate
                  ? "#FFFFFF"
                  : "#175CD3"
              }
            />

            <Text
              style={[
                styles.quickButtonText,
                selectedDate ===
                  yesterdayDate &&
                  styles.quickButtonTextActive,
              ]}
            >
              Kemarin
            </Text>
          </Pressable>
        </View>

        {/* ================================================= */}
        {/* CALENDAR */}
        {/* ================================================= */}

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable
              style={styles.monthButton}
              onPress={() =>
                changeMonth(-1)
              }
            >
              <Ionicons
                name="chevron-back"
                size={21}
                color="#344054"
              />
            </Pressable>

            <View
              style={
                styles.monthTitleContainer
              }
            >
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[
                  calendarMonth
                ]}{" "}
                {calendarYear}
              </Text>

              <Text
                style={styles.monthSubtitle}
              >
                {totalMonthlyAttendance} total
                absensi
              </Text>
            </View>

            <Pressable
              style={styles.monthButton}
              onPress={() =>
                changeMonth(1)
              }
            >
              <Ionicons
                name="chevron-forward"
                size={21}
                color="#344054"
              />
            </Pressable>
          </View>

          {/* NAMA HARI */}

          <View style={styles.weekRow}>
            {DAY_NAMES.map((day) => (
              <View
                key={day}
                style={styles.weekDay}
              >
                <Text
                  style={styles.weekDayText}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* TANGGAL */}

          <View style={styles.calendarGrid}>
            {calendarDays.map(
              (item, index) => {
                if (!item) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={styles.dayCell}
                    />
                  );
                }

                const count =
                  attendanceCountByDate[
                    item.date
                  ] || 0;

                const isSelected =
                  item.date ===
                  selectedDate;

                const isToday =
                  item.date ===
                  todayDate;

                return (
                  <Pressable
                    key={item.date}
                    style={[
                      styles.dayCell,
                      isSelected &&
                        styles.dayCellSelected,
                    ]}
                    onPress={() =>
                      setSelectedDate(
                        item.date
                      )
                    }
                  >
                    <View
                      style={[
                        styles.dayNumberContainer,
                        isToday &&
                          styles.todayCircle,
                        isSelected &&
                          styles.selectedDayCircle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          isToday &&
                            styles.todayText,
                          isSelected &&
                            styles.selectedDayText,
                        ]}
                      >
                        {item.day}
                      </Text>
                    </View>

                    {count > 0 ? (
                      <View
                        style={[
                          styles.countBadge,
                          isSelected &&
                            styles.countBadgeSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.countText,
                            isSelected &&
                              styles.countTextSelected,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={
                          styles.emptyCount
                        }
                      />
                    )}
                  </Pressable>
                );
              }
            )}
          </View>

          {/* LEGEND */}

          <View style={styles.legend}>
            <View
              style={styles.legendItem}
            >
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      "#175CD3",
                  },
                ]}
              />

              <Text
                style={styles.legendText}
              >
                Ada absensi
              </Text>
            </View>

            <View
              style={styles.legendItem}
            >
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      "#D0D5DD",
                  },
                ]}
              />

              <Text
                style={styles.legendText}
              >
                Tidak ada absensi
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================= */}
        {/* SELECTED DATE */}
        {/* ================================================= */}

        <View style={styles.selectedHeader}>
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Daftar Kehadiran
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              {formatDisplayDate(
                selectedDate
              )}
            </Text>
          </View>

          <View
            style={styles.totalBadge}
          >
            <Text
              style={styles.totalBadgeText}
            >
              {selectedAttendance.length}{" "}
              orang
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <View
          style={styles.searchContainer}
        >
          <Ionicons
            name="search-outline"
            size={20}
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
              onPress={() =>
                setSearch("")
              }
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#98A2B3"
              />
            </Pressable>
          )}
        </View>

        {/* ================================================= */}
        {/* ATTENDANCE LIST */}
        {/* ================================================= */}

        <View style={styles.list}>
          {selectedAttendance.length ===
          0 ? (
            <View style={styles.empty}>
              <View
                style={styles.emptyIcon}
              >
                <Ionicons
                  name="calendar-clear-outline"
                  size={32}
                  color="#98A2B3"
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                {search
                  ? "Pegawai tidak ditemukan"
                  : "Belum ada absensi"}
              </Text>

              <Text
                style={styles.emptyText}
              >
                {search
                  ? `Tidak ada pegawai dengan nama "${search}".`
                  : `Belum ada pegawai yang melakukan absensi pada ${formatDisplayDate(
                      selectedDate
                    )}.`}
              </Text>
            </View>
          ) : (
            selectedAttendance.map(
              (item) => {
                const employee =
                  item.employee;

                const initial =
                  employee?.nama
                    ?.charAt(0)
                    ?.toUpperCase() ||
                  "?";

                return (
                  <View
                    key={item.id}
                    style={
                      styles.attendanceCard
                    }
                  >
                    {/* AVATAR */}

                    <View
                      style={styles.avatar}
                    >
                      <Text
                        style={
                          styles.avatarText
                        }
                      >
                        {initial}
                      </Text>
                    </View>

                    {/* INFO */}

                    <View
                      style={
                        styles.employeeInfo
                      }
                    >
                      <Text
                        style={
                          styles.employeeName
                        }
                        numberOfLines={1}
                      >
                        {employee?.nama ||
                          "Pegawai"}
                      </Text>

                      <Text
                        style={
                          styles.employeePosition
                        }
                        numberOfLines={1}
                      >
                        {employee?.jabatan ||
                          employee?.divisi ||
                          "Pegawai"}
                      </Text>

                      <View
                        style={
                          styles.timeRow
                        }
                      >
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#667085"
                        />

                        <Text
                          style={
                            styles.timeText
                          }
                        >
                          Masuk{" "}
                          {formatTime(
                            item.jam_masuk
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* STATUS */}

                    <View
                      style={
                        styles.statusBadge
                      }
                    >
                      <View
                        style={
                          styles.statusDot
                        }
                      />

                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {item.status ||
                          "Hadir"}
                      </Text>
                    </View>
                  </View>
                );
              }
            )
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
    padding: 20,
    paddingBottom: 30,
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
    fontSize: 14,
  },

  // =======================================================
  // HEADER
  // =======================================================

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#101828",
  },

  subtitle: {
    marginTop: 5,
    color: "#667085",
    fontSize: 14,
  },


  // =======================================================
  // SUMMARY
  // =======================================================

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },

  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 9,
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#101828",
  },

  summaryLabel: {
    marginTop: 2,
    color: "#667085",
    fontSize: 11,
  },

  // =======================================================
  // QUICK BUTTON
  // =======================================================

  quickDateRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },

  quickButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  quickButtonActive: {
    backgroundColor: "#175CD3",
    borderColor: "#175CD3",
  },

  quickButtonText: {
    color: "#175CD3",
    fontSize: 13,
    fontWeight: "700",
  },

  quickButtonTextActive: {
    color: "#FFFFFF",
  },

  // =======================================================
  // CALENDAR
  // =======================================================

  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#EAECF0",
    marginBottom: 25,
  },

  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    alignItems: "center",
  },

  monthTitleContainer: {
    alignItems: "center",
  },

  monthTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#101828",
  },

  monthSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "#667085",
  },

  // =======================================================
  // WEEK
  // =======================================================

  weekRow: {
    flexDirection: "row",
    marginBottom: 5,
  },

  weekDay: {
    width: "14.285%",
    alignItems: "center",
    paddingVertical: 6,
  },

  weekDayText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#98A2B3",
  },

  // =======================================================
  // CALENDAR GRID
  // =======================================================

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCell: {
    width: "14.285%",
    minHeight: 55,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
  },

  dayNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  dayNumber: {
    fontSize: 13,
    color: "#344054",
    fontWeight: "600",
  },

  todayCircle: {
    borderWidth: 1.5,
    borderColor: "#175CD3",
  },

  todayText: {
    color: "#175CD3",
    fontWeight: "900",
  },

  selectedDayCircle: {
    backgroundColor: "#175CD3",
    borderColor: "#175CD3",
  },

  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  countBadge: {
    minWidth: 20,
    height: 16,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 3,
  },

  countBadgeSelected: {
    backgroundColor: "#EAF2FF",
  },

  countText: {
    color: "#175CD3",
    fontSize: 9,
    fontWeight: "900",
  },

  countTextSelected: {
    color: "#175CD3",
  },

  emptyCount: {
    height: 16,
    marginTop: 3,
  },

  // =======================================================
  // LEGEND
  // =======================================================

  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  legendText: {
    color: "#667085",
    fontSize: 10,
  },

  // =======================================================
  // SECTION
  // =======================================================

  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#101828",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#667085",
    fontSize: 12,
  },

  totalBadge: {
    backgroundColor: "#EAF2FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },

  totalBadgeText: {
    color: "#175CD3",
    fontSize: 11,
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
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 13,
    marginBottom: 13,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: "#101828",
    fontSize: 13,
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
    borderRadius: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#175CD3",
    fontSize: 16,
    fontWeight: "900",
  },

  employeeInfo: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  employeeName: {
    color: "#101828",
    fontSize: 14,
    fontWeight: "800",
  },

  employeePosition: {
    color: "#667085",
    fontSize: 11,
    marginTop: 3,
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
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#12B76A",
    marginRight: 5,
  },

  statusText: {
    color: "#027A48",
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
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#101828",
  },

  emptyText: {
    marginTop: 7,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});