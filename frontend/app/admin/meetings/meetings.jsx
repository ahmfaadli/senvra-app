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

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../services/supabase";

export default function AdminMeetings() {
  const router = useRouter();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ==========================================
  // LOAD MEETINGS
  // ==========================================

  const loadMeetings = async () => {
    try {
      console.log("=================================");
      console.log("MENGAMBIL DATA MEETING ADMIN");
      console.log("=================================");

      const { data, error } = await supabase
        .from("meetings")
        .select(`
          id,
          title,
          description,
          meeting_date,
          start_time,
          end_time,
          location,
          meeting_link,
          created_by,
          created_at,
          updated_at,
          meeting_participants (
            id,
            employee_id,
            status,
            created_at,
            employee:profiles (
              id,
              nama,
              email,
              jabatan,
              divisi,
              status
            )
          )
        `)
        .order("meeting_date", {
          ascending: true,
        })
        .order("start_time", {
          ascending: true,
        });

      if (error) {
        console.log("MEETING ERROR:", error);
        throw error;
      }

      console.log(
        "Jumlah meeting:",
        data?.length || 0
      );

      setMeetings(data || []);
    } catch (error) {
      console.log("LOAD MEETING ERROR:", error);

      Alert.alert(
        "Gagal mengambil meeting",
        error?.message ||
          "Terjadi kesalahan saat mengambil data meeting."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // LOAD SAAT SCREEN FOCUS
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      loadMeetings();
    }, [])
  );

  // ==========================================
  // REFRESH
  // ==========================================

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeetings();
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    try {
      const d = new Date(`${date}T00:00:00`);

      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  // ==========================================
  // FORMAT SHORT DATE
  // ==========================================

  const formatShortDate = (date) => {
    if (!date) {
      return {
        day: "-",
        month: "-",
      };
    }

    try {
      const d = new Date(`${date}T00:00:00`);

      return {
        day: d.toLocaleDateString("id-ID", {
          day: "2-digit",
        }),
        month: d
          .toLocaleDateString("id-ID", {
            month: "short",
          })
          .toUpperCase(),
      };
    } catch {
      return {
        day: "-",
        month: "-",
      };
    }
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (time) => {
    if (!time) return "-";

    return String(time).substring(0, 5);
  };

  // ==========================================
  // CHECK TODAY
  // ==========================================

  const isToday = (date) => {
    if (!date) return false;

    const today = new Date();

    const todayString =
      `${today.getFullYear()}-` +
      `${String(today.getMonth() + 1).padStart(
        2,
        "0"
      )}-` +
      `${String(today.getDate()).padStart(2, "0")}`;

    return date === todayString;
  };

  // ==========================================
  // CHECK UPCOMING
  // ==========================================

  const isUpcoming = (date) => {
    if (!date) return false;

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const meetingDate = new Date(
      `${date}T00:00:00`
    );

    return meetingDate > today;
  };

  // ==========================================
  // MEETING STATUS
  // ==========================================

  const getMeetingStatus = (date) => {
    if (isToday(date)) {
      return {
        label: "Hari Ini",
        color: "#175CD3",
        background: "#EAF2FF",
      };
    }

    if (isUpcoming(date)) {
      return {
        label: "Akan Datang",
        color: "#027A48",
        background: "#ECFDF3",
      };
    }

    return {
      label: "Selesai",
      color: "#667085",
      background: "#F2F4F7",
    };
  };

  // ==========================================
  // PARTICIPANT AVATAR
  // ==========================================

  const getInitial = (name) => {
    if (!name) return "?";

    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.loading}>

          <ActivityIndicator
            size="small"
            color="#175CD3"
          />

          <Text style={styles.loadingText}>
            Memuat meeting...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#175CD3"
              colors={["#175CD3"]}
            />
          }
        >
          {/* =================================
              HEADER
          ================================= */}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="arrow-back"
                  size={21}
                  color="#101828"
                />
              </Pressable>

              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>
                  Daftar Meeting
                </Text>

                <Text style={styles.subtitle}>
                  Kelola jadwalmeeting pegawai
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push("/admin/meetings/meeting-form")
              }
            >
              <Ionicons
                name="add"
                size={23}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {/* =================================
              SUMMARY
          ================================= */}

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="calendar"
                size={23}
                color="#175CD3"
              />
            </View>

            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>
                Total Meeting
              </Text>

              <Text style={styles.summaryValue}>
                {meetings.length}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRight}>
              <Text style={styles.summarySmallLabel}>
                Akan Datang
              </Text>

              <Text style={styles.summarySmallValue}>
                {
                  meetings.filter((meeting) =>
                    isUpcoming(
                      meeting.meeting_date
                    )
                  ).length
                }
              </Text>
            </View>
          </View>

          {/* =================================
              EMPTY
          ================================= */}

          {meetings.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={38}
                  color="#98A2B3"
                />
              </View>

              <Text style={styles.emptyTitle}>
                Belum ada meeting
              </Text>

              <Text style={styles.emptyText}>
                Belum ada jadwal meeting yang dibuat.
                Tambahkan meeting baru untuk pegawai.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  router.push(
                    "/admin/meetings/meeting-form"
                  )
                }
              >
                <Ionicons
                  name="add"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.emptyButtonText}>
                  Tambah Meeting
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* =================================
                  SECTION TITLE
              ================================= */}

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Jadwal Meeting
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Daftar meeting yang telah dibuat
                  </Text>
                </View>
              </View>

              {/* =================================
                  MEETING LIST
              ================================= */}

              <View style={styles.meetingList}>
                {meetings.map((meeting) => {
                  const participants =
                    meeting.meeting_participants || [];

                  const date = formatShortDate(
                    meeting.meeting_date
                  );

                  const meetingStatus =
                    getMeetingStatus(
                      meeting.meeting_date
                    );

                  return (
                    <Pressable
                      key={meeting.id}
                      style={({ pressed }) => [
                        styles.card,
                        pressed &&
                          styles.cardPressed,
                      ]}
                      onPress={() =>
                        router.push(
                          `/admin/meetings/meeting-detail?id=${meeting.id}`
                        )
                      }
                    >
                      {/* CARD TOP */}

                      <View style={styles.cardTop}>
                        {/* DATE BOX */}

                        <View style={styles.dateBox}>
                          <Text style={styles.dateMonth}>
                            {date.month}
                          </Text>

                          <Text style={styles.dateDay}>
                            {date.day}
                          </Text>
                        </View>

                        {/* TITLE */}

                        <View
                          style={
                            styles.cardTitleContainer
                          }
                        >
                          <Text
                            style={styles.meetingTitle}
                            numberOfLines={2}
                          >
                            {meeting.title ||
                              "Tanpa judul"}
                          </Text>

                          <Text
                            style={styles.fullDate}
                            numberOfLines={1}
                          >
                            {formatDate(
                              meeting.meeting_date
                            )}
                          </Text>
                        </View>

                        {/* ARROW */}

                        <View style={styles.arrowButton}>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#98A2B3"
                          />
                        </View>
                      </View>

                      {/* STATUS */}

                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                meetingStatus.background,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor:
                                  meetingStatus.color,
                              },
                            ]}
                          />

                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  meetingStatus.color,
                              },
                            ]}
                          >
                            {meetingStatus.label}
                          </Text>
                        </View>
                      </View>

                      {/* MEETING INFO */}

                      <View style={styles.infoContainer}>
                        {/* TIME */}

                        <View style={styles.infoItem}>
                          <View style={styles.infoIcon}>
                            <Ionicons
                              name="time-outline"
                              size={17}
                              color="#475467"
                            />
                          </View>

                          <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>
                              Waktu
                            </Text>

                            <Text
                              style={styles.infoValue}
                              numberOfLines={1}
                            >
                              {formatTime(
                                meeting.start_time
                              )}

                              {meeting.end_time
                                ? ` - ${formatTime(
                                    meeting.end_time
                                  )}`
                                : ""}
                            </Text>
                          </View>
                        </View>

                        {/* LOCATION */}

                        <View style={styles.infoItem}>
                          <View style={styles.infoIcon}>
                            <Ionicons
                              name="location-outline"
                              size={17}
                              color="#475467"
                            />
                          </View>

                          <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>
                              Lokasi
                            </Text>

                            <Text
                              style={styles.infoValue}
                              numberOfLines={1}
                            >
                              {meeting.location ||
                                "Online"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* LINK */}

                      {meeting.meeting_link ? (
                        <View
                          style={styles.linkContainer}
                        >
                          <Ionicons
                            name="videocam-outline"
                            size={17}
                            color="#175CD3"
                          />

                          <Text
                            style={styles.linkText}
                            numberOfLines={1}
                          >
                            Meeting online tersedia
                          </Text>

                          <Ionicons
                            name="checkmark-circle"
                            size={17}
                            color="#12B76A"
                          />
                        </View>
                      ) : null}

                      {/* PARTICIPANTS */}

                      <View
                        style={
                          styles.participantSection
                        }
                      >
                        <View
                          style={
                            styles.participantHeader
                          }
                        >
                          <View
                            style={
                              styles.participantTitleRow
                            }
                          >
                            <Ionicons
                              name="people-outline"
                              size={18}
                              color="#175CD3"
                            />

                            <Text
                              style={
                                styles.participantTitle
                              }
                            >
                              Peserta
                            </Text>

                            <View
                              style={
                                styles.participantCount
                              }
                            >
                              <Text
                                style={
                                  styles.participantCountText
                                }
                              >
                                {participants.length}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={styles.detailText}
                          >
                            Lihat detail
                          </Text>
                        </View>

                        {/* PARTICIPANT PREVIEW */}

                        {participants.length === 0 ? (
                          <View
                            style={
                              styles.noParticipantBox
                            }
                          >
                            <Ionicons
                              name="person-outline"
                              size={18}
                              color="#98A2B3"
                            />

                            <Text
                              style={
                                styles.noParticipant
                              }
                            >
                              Belum ada peserta
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={
                              styles.participantPreview
                            }
                          >
                            {/* AVATARS */}

                            <View
                              style={styles.avatarStack}
                            >
                              {participants
                                .slice(0, 4)
                                .map(
                                  (
                                    participant,
                                    index
                                  ) => (
                                    <View
                                      key={
                                        participant.id
                                      }
                                      style={[
                                        styles.avatar,
                                        {
                                          marginLeft:
                                            index === 0
                                              ? 0
                                              : -9,
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={
                                          styles.avatarText
                                        }
                                      >
                                        {getInitial(
                                          participant
                                            .employee
                                            ?.nama
                                        )}
                                      </Text>
                                    </View>
                                  )
                                )}

                              {participants.length > 4 && (
                                <View
                                  style={[
                                    styles.avatar,
                                    styles.moreAvatar,
                                    {
                                      marginLeft: -9,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={
                                      styles.moreAvatarText
                                    }
                                  >
                                    +
                                    {participants.length -
                                      4}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* NAME PREVIEW */}

                            <View
                              style={
                                styles.participantNames
                              }
                            >
                              <Text
                                style={
                                  styles.participantNameText
                                }
                                numberOfLines={1}
                              >
                                {participants
                                  .slice(0, 2)
                                  .map(
                                    (participant) =>
                                      participant
                                        .employee
                                        ?.nama ||
                                      "Pegawai"
                                  )
                                  .join(", ")}

                                {participants.length >
                                2
                                  ? ` dan ${
                                      participants.length -
                                      2
                                    } lainnya`
                                  : ""}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

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
    paddingTop: 16,
  },

  // ==========================================
  // LOADING
  // ==========================================

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },


  loadingText: {
    marginTop: 10,
    color: "#667085",
    fontSize: 13,
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  headerTextContainer: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#101828",
  },

  subtitle: {
    marginTop: 3,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
  },

  addButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#175CD3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  pressed: {
    opacity: 0.8,
  },

  // ==========================================
  // SUMMARY
  // ==========================================

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EAECF0",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 23,
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryText: {
    marginLeft: 11,
    flex: 1,
  },

  summaryLabel: {
    color: "#667085",
    fontSize: 10,
    fontWeight: "600",
  },

  summaryValue: {
    marginTop: 2,
    color: "#101828",
    fontSize: 22,
    fontWeight: "900",
  },

  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#EAECF0",
    marginHorizontal: 14,
  },

  summaryRight: {
    minWidth: 70,
  },

  summarySmallLabel: {
    color: "#667085",
    fontSize: 10,
    fontWeight: "600",
  },

  summarySmallValue: {
    marginTop: 2,
    color: "#175CD3",
    fontSize: 19,
    fontWeight: "900",
  },

  // ==========================================
  // SECTION
  // ==========================================

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#101828",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#667085",
    fontSize: 11,
  },



  // ==========================================
  // MEETING LIST
  // ==========================================

  meetingList: {
    gap: 13,
  },

  // ==========================================
  // CARD
  // ==========================================

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: "#EAECF0",
    shadowColor: "#101828",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },

  cardPressed: {
    opacity: 0.92,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  // ==========================================
  // CARD TOP
  // ==========================================

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  dateBox: {
    width: 52,
    height: 57,
    borderRadius: 14,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  dateMonth: {
    color: "#175CD3",
    fontSize: 10,
    fontWeight: "900",
  },

  dateDay: {
    marginTop: 1,
    color: "#101828",
    fontSize: 21,
    fontWeight: "900",
  },

  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  meetingTitle: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },

  fullDate: {
    marginTop: 4,
    color: "#667085",
    fontSize: 10,
  },

  arrowButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },

  // ==========================================
  // STATUS
  // ==========================================

  statusRow: {
    marginTop: 12,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },

  // ==========================================
  // INFO
  // ==========================================

  infoContainer: {
    marginTop: 14,
    flexDirection: "row",
    gap: 9,
  },

  infoItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 11,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 7,
  },

  infoLabel: {
    color: "#98A2B3",
    fontSize: 9,
    fontWeight: "600",
  },

  infoValue: {
    marginTop: 2,
    color: "#344054",
    fontSize: 11,
    fontWeight: "800",
  },

  // ==========================================
  // ONLINE LINK
  // ==========================================

  linkContainer: {
    marginTop: 10,
    backgroundColor: "#F0F6FF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  linkText: {
    flex: 1,
    marginLeft: 7,
    marginRight: 7,
    color: "#175CD3",
    fontSize: 11,
    fontWeight: "700",
  },

  // ==========================================
  // PARTICIPANTS
  // ==========================================

  participantSection: {
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
  },

  participantHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  participantTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  participantTitle: {
    marginLeft: 6,
    color: "#344054",
    fontSize: 12,
    fontWeight: "900",
  },

  participantCount: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
    paddingHorizontal: 5,
  },

  participantCountText: {
    color: "#175CD3",
    fontSize: 10,
    fontWeight: "900",
  },

  detailText: {
    color: "#175CD3",
    fontSize: 10,
    fontWeight: "700",
  },

  participantPreview: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: "#EAF2FF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#175CD3",
    fontSize: 11,
    fontWeight: "900",
  },

  moreAvatar: {
    backgroundColor: "#F2F4F7",
  },

  moreAvatarText: {
    color: "#667085",
    fontSize: 10,
    fontWeight: "900",
  },

  participantNames: {
    flex: 1,
    marginLeft: 10,
  },

  participantNameText: {
    color: "#475467",
    fontSize: 11,
    fontWeight: "600",
  },

  noParticipantBox: {
    marginTop: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  noParticipant: {
    marginLeft: 7,
    color: "#98A2B3",
    fontSize: 11,
  },

  // ==========================================
  // EMPTY
  // ==========================================

  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#EAECF0",
    padding: 30,
    alignItems: "center",
  },

  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 17,
  },

  emptyTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 8,
    marginBottom: 20,
    color: "#667085",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  emptyButton: {
    backgroundColor: "#175CD3",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  // ==========================================
  // FLOATING BUTTON
  // ==========================================

  floatingButton: {
    position: "absolute",
    right: 18,
    bottom: 22,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#175CD3",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#101828",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 9,
    elevation: 7,
  },

  floatingPressed: {
    opacity: 0.8,
  },

  floatingText: {
    marginLeft: 7,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  bottomSpace: {
    height: 20,
  },
});