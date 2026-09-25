import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
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

      const result = await login(email.trim(), password);
      const userProfile = result?.profile;

      if (!userProfile) {
        Alert.alert(
          "Login Gagal",
          "Profile pengguna tidak ditemukan."
        );
        return;
      }

      if (userProfile?.role === "admin") {
        router.replace("/admin");
        return;
      }

      if (userProfile?.role === "pegawai") {
        router.replace("/(tabs)/home");
        return;
      }

      Alert.alert(
        "Akses Ditolak",
        `Role "${userProfile?.role}" belum memiliki akses aplikasi.`
      );
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      let message = "Terjadi kesalahan saat login.";

      if (error?.message) {
        message = error.message;
      }

      Alert.alert("Login Gagal", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Background */}
        <View style={styles.bg} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.content}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <View style={styles.logoInner} />
              </View>

              <Text style={styles.welcomeTitle}>
                Welcome
              </Text>

              <Text style={styles.welcomeSubtitle}>
                Sign in to continue
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email
                </Text>

                <View style={styles.inputRow}>
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
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Password
                </Text>

                <View style={styles.inputRow}>
                  <View style={styles.passwordWrap}>
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
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />

                    <TouchableOpacity
                      onPress={() =>
                        setShowPassword((value) => !value)
                      }
                      disabled={loading}
                      style={styles.eyeButton}
                    >
                      <Text style={styles.eyeText}>
                        {showPassword ? "Hide" : "Show"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
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

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />

                <Text style={styles.dividerText}>
                  or continue with
                </Text>

                <View style={styles.dividerLine} />
              </View>

              {/* Google */}
              <View style={styles.bottomTextRow}>
                <Text style={styles.bottomText}>
                  Don't have an account?
                </Text>

                <TouchableOpacity
                  onPress={() => {}}
                  disabled={loading}
                >
                  <Text style={styles.signupLink}>
                    Login Google
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Aplikasi Kepegawaian
              </Text>

              <Text style={styles.footerVersion}>
                HR Management System
              </Text>
            </View>

          </View>
        </ScrollView>
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

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },

  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: "#7C3AED",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },

  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 18,
  },

  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  logoInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },

  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },

  welcomeSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    textAlign: "center",
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 8,
  },

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },

  inputRow: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
  },

  input: {
    paddingVertical: 0,
    fontSize: 15,
    color: "#111827",
  },

  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 28,
  },

  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
  },

  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 4,
  },

  eyeText: {
    color: "#6D28D9",
    fontSize: 13,
    fontWeight: "800",
  },

  loginButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#6D28D9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  dividerText: {
    paddingHorizontal: 10,
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 12,
  },

  bottomTextRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
    gap: 6,
  },

  bottomText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },

  signupLink: {
    color: "#6D28D9",
    fontSize: 12,
    fontWeight: "900",
  },

  footer: {
    alignItems: "center",
    marginTop: 16,
  },

  footerText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "700",
  },

  footerVersion: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "700",
    marginTop: 4,
  },
});