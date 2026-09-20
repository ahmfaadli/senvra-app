import React from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/UI";

export default function Profile() {
  const {
    profile,
    loading,
    logout,
  } = useAuth();

  const router = useRouter();

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Apakah kamu yakin ingin keluar?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();

              router.replace("/login");
            } catch (error) {
              console.log("Logout error:", error);

              Alert.alert(
                "Logout Gagal",
                "Terjadi kesalahan saat logout."
              );
            }
          },
        },
      ]
    );
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />

        <Text style={styles.loadingText}>
          Memuat data profile...
        </Text>
      </View>
    );
  }

  // =========================
  // PROFILE BELUM ADA
  // =========================

  if (!profile) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="person-circle-outline"
          size={70}
          color="#98A2B3"
        />

        <Text style={styles.emptyTitle}>
          Data profile tidak ditemukan
        </Text>

        <Text style={styles.emptyText}>
          Data pengguna belum tersedia di database.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.backButtonText}>
            Kembali ke Login
          </Text>
        </Pressable>
      </View>
    );
  }

  // =========================
  // DATA PROFILE
  // =========================

  const nama = profile.nama || "-";
  const email = profile.email || "-";
  const jabatan = profile.jabatan || "-";
  const divisi = profile.divisi || "-";
  const noHp = profile.no_hp || "-";
  const role = profile.role || "-";
  const status = profile.status || "-";
  const idPegawai = profile.id || "-";

  // Inisial nama untuk avatar
  const avatarText = getInitials(nama);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* =========================
          PROFILE HEADER
      ========================= */}

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {avatarText}
          </Text>
        </View>

        <Text style={styles.name}>
          {nama}
        </Text>

        <Text style={styles.position}>
          {jabatan}
        </Text>

        {/* STATUS */}
        <View
          style={[
            styles.statusBadge,
            status.toLowerCase() === "aktif"
              ? styles.statusActive
              : styles.statusInactive,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              status.toLowerCase() === "aktif"
                ? styles.statusDotActive
                : styles.statusDotInactive,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              status.toLowerCase() === "aktif"
                ? styles.statusTextActive
                : styles.statusTextInactive,
            ]}
          >
            {capitalize(status)}
          </Text>
        </View>
      </View>

      {/* =========================
          DATA PROFILE
      ========================= */}

      <Card>
        <Text style={styles.sectionTitle}>
          Informasi Pribadi
        </Text>

        <ProfileItem
          icon="person-outline"
          label="Nama"
          value={nama}
        />

        <ProfileItem
          icon="mail-outline"
          label="Email"
          value={email}
        />

        <ProfileItem
          icon="briefcase-outline"
          label="Jabatan"
          value={jabatan}
        />

        <ProfileItem
          icon="business-outline"
          label="Divisi"
          value={divisi}
        />

        <ProfileItem
          icon="call-outline"
          label="No. HP"
          value={noHp}
        />

        <ProfileItem
          icon="shield-checkmark-outline"
          label="Role"
          value={role}
        />

        <ProfileItem
          icon="card-outline"
          label="ID Pegawai"
          value={idPegawai}
          last
        />
      </Card>

      {/* =========================
          LOGOUT
      ========================= */}

      <Pressable
        style={styles.logout}
        onPress={handleLogout}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#B42318"
        />

        <Text style={styles.logoutText}>
          Logout
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// =====================================================
// PROFILE ITEM
// =====================================================

function ProfileItem({
  icon,
  label,
  value,
  last = false,
}) {
  return (
    <View
      style={[
        styles.item,
        last && styles.lastItem,
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon}
          size={21}
          color="#175CD3"
        />
      </View>

      <View style={styles.itemText}>
        <Text style={styles.label}>
          {label}
        </Text>

        <Text style={styles.value}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// =====================================================
// HELPER
// =====================================================

function getInitials(name) {
  if (!name) return "U";

  const words = name
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

function capitalize(value) {
  if (!value) return "-";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
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

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  // =========================
  // LOADING
  // =========================

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#667085",
    fontSize: 14,
  },

  // =========================
  // EMPTY
  // =========================

  emptyContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#667085",
    textAlign: "center",
    lineHeight: 21,
  },

  backButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#175CD3",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // =========================
  // HEADER
  // =========================

  profileHeader: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 25,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#175CD3",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },

  name: {
    fontSize: 22,
    fontWeight: "900",
    color: "#101828",
    marginTop: 12,
  },

  position: {
    color: "#667085",
    marginTop: 4,
    fontSize: 14,
  },

  // =========================
  // STATUS
  // =========================

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },

  statusActive: {
    backgroundColor: "#ECFDF3",
  },

  statusInactive: {
    backgroundColor: "#FEF3F2",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },

  statusDotActive: {
    backgroundColor: "#12B76A",
  },

  statusDotInactive: {
    backgroundColor: "#F04438",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  statusTextActive: {
    color: "#027A48",
  },

  statusTextInactive: {
    color: "#B42318",
  },

  // =========================
  // CARD
  // =========================

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
    marginBottom: 4,
  },

  // =========================
  // PROFILE ITEM
  // =========================

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
    gap: 12,
  },

  lastItem: {
    borderBottomWidth: 0,
  },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  itemText: {
    flex: 1,
  },

  label: {
    color: "#98A2B3",
    fontSize: 11,
  },

  value: {
    color: "#344054",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },

  // =========================
  // LOGOUT
  // =========================

  logout: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#FEF3F2",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },

  logoutText: {
    color: "#B42318",
    fontWeight: "800",
  },
});