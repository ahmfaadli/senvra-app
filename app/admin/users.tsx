import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

export default function AdminUsers() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Users
      </Text>

      <Text style={styles.text}>
        Halaman manajemen pengguna.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>
          Kembali
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#f5f7fb",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  text: {
    marginTop: 10,
    fontSize: 16,
    color: "#6b7280",
  },

  button: {
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#111827",
  },

  buttonText: {
    textAlign: "center",
    color: "#ffffff",
    fontWeight: "700",
  },
});