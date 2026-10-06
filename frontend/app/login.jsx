import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
        router.replace("/pegawai/home");
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
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* =======================================================
            BACKGROUND SEN VRA
        ======================================================== */}
        <View style={styles.bg}>
          {/* Base navy */}
          <View style={styles.bgNavy} />

          {/* Turquoise large curved shape */}
          <View style={styles.bgShapeOne} />

          {/* Navy inner cut */}
          <View style={styles.bgShapeTwo} />

          {/* Turquoise right shape */}
          <View style={styles.bgShapeThree} />

          {/* Small decorative circle */}
          <View style={styles.bgCircleOne} />

          {/* Bottom turquoise curve */}
          <View style={styles.bgBottomShape} />

          {/* Bottom navy cut */}
          <View style={styles.bgBottomCut} />

          {/* Subtle overlay */}
          <View style={styles.bgOverlay} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.content}>

            {/* ===================================================
                HEADER
            ==================================================== */}
            <View style={styles.header}>

              {/* LOGO PNG */}
              <View style={styles.logoBadge}>
                <Image
                  source={require("../assets/images/senvra-logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.welcomeTitle}>
                Selamat Datang
              </Text>

              <Text style={styles.welcomeSubtitle}>
                Sign in to continue
              </Text>
            </View>

            {/* ===================================================
                LOGIN CARD
            ==================================================== */}
            <View style={styles.card}>

              {/* EMAIL */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email
                </Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan email"
                    placeholderTextColor="#8A98A8"
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

              {/* PASSWORD */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Password
                </Text>

                <View style={styles.inputRow}>
                  <View style={styles.passwordWrap}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Masukkan password"
                      placeholderTextColor="#8A98A8"
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
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eyeText}>
                        {showPassword ? "Hide" : "Show"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* LOGIN BUTTON */}
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

              {/* DIVIDER */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />

                <Text style={styles.dividerText}>
                  or continue with
                </Text>

                <View style={styles.dividerLine} />
              </View>

              {/* GOOGLE */}
              <View style={styles.bottomTextRow}>
                <Text style={styles.bottomText}>
                  Don't have an account?
                </Text>

                <TouchableOpacity
                  onPress={() => {}}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.signupLink}>
                    Login Google
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ===================================================
                FOOTER
            ==================================================== */}
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
  /* ============================================================
     SAFE AREA & CONTAINER
  ============================================================ */

  safeArea: {
    flex: 1,
    backgroundColor: "#F5F9FC",
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

  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    justifyContent: "center",
  },

  /* ============================================================
     SENVRA BACKGROUND
  ============================================================ */

  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    backgroundColor: "#123F68",
  },

  bgNavy: {
    position: "absolute",
    top: -120,
    left: -110,
    width: 430,
    height: 530,
    borderRadius: 240,
    backgroundColor: "#0F355A",
    transform: [
      {
        rotate: "-16deg",
      },
    ],
  },

  bgShapeOne: {
    position: "absolute",
    top: -170,
    right: -165,
    width: 520,
    height: 650,
    borderRadius: 280,
    backgroundColor: "#28B8C0",
    transform: [
      {
        rotate: "-24deg",
      },
    ],
  },

  bgShapeTwo: {
    position: "absolute",
    top: -70,
    right: -75,
    width: 330,
    height: 480,
    borderRadius: 200,
    backgroundColor: "#164D78",
    transform: [
      {
        rotate: "-25deg",
      },
    ],
  },

  bgShapeThree: {
    position: "absolute",
    top: 85,
    right: -190,
    width: 420,
    height: 440,
    borderRadius: 210,
    backgroundColor: "#2ABAC1",
    transform: [
      {
        rotate: "-12deg",
      },
    ],
  },

  bgCircleOne: {
    position: "absolute",
    top: 210,
    left: -65,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(42, 186, 193, 0.85)",
  },

  bgBottomShape: {
    position: "absolute",
    bottom: -310,
    left: -90,
    width: 580,
    height: 500,
    borderRadius: 290,
    backgroundColor: "#28B8C0",
    transform: [
      {
        rotate: "-18deg",
      },
    ],
  },

  bgBottomCut: {
    position: "absolute",
    bottom: -220,
    left: 70,
    width: 340,
    height: 300,
    borderRadius: 180,
    backgroundColor: "#123F68",
    transform: [
      {
        rotate: "-18deg",
      },
    ],
  },

  bgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 440,
    backgroundColor: "rgba(10, 45, 78, 0.08)",
  },

  /* ============================================================
     HEADER
  ============================================================ */

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  /*
   * Container logo.
   * PNG akan tampil di dalam area ini.
   */
  logoBadge: {
    width: 150,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    paddingHorizontal: 0,
  },

  /*
   * LOGO PNG
   *
   * Ganti file:
   * ../assets/images/senvra-logo.png
   *
   * jika nama/path file PNG Anda berbeda.
   */
  logoImage: {
    width: 140,
    height: 80,
  },

  welcomeTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 0,
  },

  welcomeSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.86)",
    fontWeight: "600",
    textAlign: "center",
  },

  /* ============================================================
     LOGIN CARD
  ============================================================ */

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#0B3558",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 10,
  },

  /* ============================================================
     INPUT
  ============================================================ */

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#25435F",
    marginBottom: 8,
  },

  inputRow: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: "#D9E3EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "#F7FAFC",
    justifyContent: "center",
  },

  input: {
    width: "100%",
    paddingVertical: 0,
    fontSize: 15,
    color: "#122D45",
  },

  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 28,
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: "#122D45",
    paddingVertical: 0,
  },

  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 4,
  },

  eyeText: {
    color: "#17608A",
    fontSize: 13,
    fontWeight: "800",
  },

  /* ============================================================
     LOGIN BUTTON
  ============================================================ */

  loginButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#17608A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#17608A",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  /* ============================================================
     DIVIDER
  ============================================================ */

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 17,
    marginBottom: 12,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E1E8EE",
  },

  dividerText: {
    paddingHorizontal: 10,
    color: "#728396",
    fontWeight: "700",
    fontSize: 12,
  },

  /* ============================================================
     GOOGLE
  ============================================================ */

  bottomTextRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
    gap: 6,
  },

  bottomText: {
    color: "#718295",
    fontSize: 12,
    fontWeight: "700",
  },

  signupLink: {
    color: "#17608A",
    fontSize: 12,
    fontWeight: "900",
  },

  /* ============================================================
     FOOTER
  ============================================================ */

  footer: {
    alignItems: "center",
    marginTop: 16,
  },

  footerText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "700",
  },

  footerVersion: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "700",
    marginTop: 4,
  },
});