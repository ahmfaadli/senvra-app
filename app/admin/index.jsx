import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const router = useRouter();

  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>

          <Text style={styles.subtitle}>
            Selamat datang, {profile?.nama || "Admin"}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Informasi Admin</Text>

        <Text style={styles.label}>Nama</Text>
        <Text style={styles.value}>
          {profile?.nama || "-"}
        </Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>
          {profile?.email || "-"}
        </Text>

        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>
          {profile?.role || "-"}
        </Text>

        <Text style={styles.label}>Jabatan</Text>
        <Text style={styles.value}>
          {profile?.jabatan || "-"}
        </Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push("/admin/users")}
        >
          <Text style={styles.menuIcon}>👥</Text>

          <View>
            <Text style={styles.menuTitle}>
              Users
            </Text>

            <Text style={styles.menuDescription}>
              Kelola pengguna
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push("/admin/profile")}
        >
          <Text style={styles.menuIcon}>👤</Text>

          <View>
            <Text style={styles.menuTitle}>
              Profile
            </Text>

            <Text style={styles.menuDescription}>
              Lihat profile admin
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push("/admin/settings")}
        >
          <Text style={styles.menuIcon}>⚙️</Text>

          <View>
            <Text style={styles.menuTitle}>
              Settings
            </Text>

            <Text style={styles.menuDescription}>
              Pengaturan aplikasi
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#111827",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#d1d5db",
  },

  infoCard: {
    margin: 20,
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111827",
  },

  label: {
    marginTop: 10,
    fontSize: 13,
    color: "#6b7280",
  },

  value: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  menuContainer: {
    paddingHorizontal: 20,
  },

  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
  },

  menuIcon: {
    fontSize: 26,
    marginRight: 15,
  },

  menuTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  menuDescription: {
    marginTop: 3,
    color: "#6b7280",
  },

  logoutButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    alignItems: "center",
  },

  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});