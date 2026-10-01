import React from "react";

import { Tabs, Redirect } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../../context/AuthContext";

export default function TabsLayout() {
  const { session, profile, loading } = useAuth();

  const insets = useSafeAreaInsets();

  // Tunggu proses pengecekan session dan profile
  if (loading) {
    return null;
  }

  // Belum login
  if (!session) {
    return <Redirect href="/" />;
  }

  // Profile belum ditemukan
  if (!profile) {
    return <Redirect href="/" />;
  }

  // Jika admin mencoba masuk ke area pegawai
  if (profile.role === "admin") {
    return <Redirect href="/admin" />;
  }

  // Hanya pegawai yang boleh masuk ke tabs
  if (profile.role !== "pegawai") {
    return <Redirect href="/" />;
  }

  const bottomSpace = insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#175CD3",
        tabBarInactiveTintColor: "#98A2B3",

        tabBarStyle: {
          height: 62 + bottomSpace,

          paddingTop: 7,

          paddingBottom:
            bottomSpace > 0
              ? bottomSpace + 4
              : 8,

          backgroundColor: "#FFFFFF",

          borderTopWidth: 1,
          borderTopColor: "#EAECF0",

          elevation: 10,

          shadowOpacity: 0.08,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },

        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      {/* BERANDA */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Beranda",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* JOBDESK */}
      <Tabs.Screen
        name="jobdesk"
        options={{
          title: "Jobdesk",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="briefcase-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* ABSENSI */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Absensi",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* MEETING */}
      <Tabs.Screen
        name="meeting"
        options={{
          title: "Meeting",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="videocam-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}