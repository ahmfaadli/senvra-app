import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Login", "Email wajib diisi.");
      return;
    }

    if (!password) {
      Alert.alert("Login", "Password wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      console.log("=================================");
      console.log("LOGIN");
      console.log("Email:", email.trim());

      const result = await login(
        email.trim(),
        password
      );

      console.log("Login result:", result);

      if (!result) {
        Alert.alert(
          "Login Gagal",
          "Email atau password salah."
        );
        return;
      }

      /*
       * Tunggu AuthContext menyelesaikan
       * pengambilan profile.
       */
      setTimeout(() => {
        if (result.profile?.role === "admin") {
          console.log("Role: ADMIN");
          router.replace("/admin");
          return;
        }

        if (result.profile?.role === "pegawai") {
          console.log("Role: PEGAWAI");
          router.replace("/(tabs)/home");
          return;
        }

        Alert.alert(
          "Akses Ditolak",
          "Role akun belum terdaftar."
        );
      }, 300);

    } catch (error) {
      console.log("LOGIN ERROR:", error);

      Alert.alert(
        "Login Gagal",
        error?.message || "Terjadi kesalahan saat login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.content}>

          {/* LOGO */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>
                HR
              </Text>
            </View>

            <Text style={styles.title}>
              Sign in to your Account
            </Text>

            <Text style={styles.subtitle}>
              Masuk untuk mengakses aplikasi kepegawaian
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>

            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Masukkan email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Password
              </Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Masukkan password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={loading}
                  style={styles.showButton}
                >
                  <Text style={styles.showText}>
                    {showPassword
                      ? "Sembunyikan"
                      : "Lihat"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* LOGIN */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.loginButtonText}>
                  Login
                </Text>
              )}
            </TouchableOpacity>

          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Aplikasi Kepegawaian
            </Text>

            <Text style={styles.footerVersion}>
              HR Management System
            </Text>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  header: {
    alignItems: "center",
    marginBottom: 40,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
  },

  form: {
    width: "100%",
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },

  passwordContainer: {
    height: 54,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
  },

  showButton: {
    paddingHorizontal: 14,
  },

  showText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },

  loginButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  footer: {
    alignItems: "center",
    marginTop: 40,
  },

  footerText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },

  footerVersion: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
});