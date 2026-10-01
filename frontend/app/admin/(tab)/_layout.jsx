import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  const bottomSpace = insets.bottom;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,

        // =================================================
        // WARNA TAB — SAMA DENGAN PEGAWAI
        // =================================================
        tabBarActiveTintColor: "#175CD3",
        tabBarInactiveTintColor: "#98A2B3",

        tabBarShowLabel: true,

        // =================================================
        // FONT — SAMA DENGAN PEGAWAI
        // =================================================
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },

        // =================================================
        // ICON — SAMA DENGAN PEGAWAI
        // =================================================
        tabBarIconStyle: {
          marginBottom: -2,
        },

        // =================================================
        // TAB BAR — MENGIKUTI SAFE AREA PEGAWAI
        // =================================================
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
      }}
    >
      {/* =================================================
          BERANDA
      ================================================= */}
      <Tabs.Screen
        name="index"
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

      {/* =================================================
          PEGAWAI
      ================================================= */}
      <Tabs.Screen
        name="employees"
        options={{
          title: "Pegawai",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="people-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* =================================================
          AKTIVITAS
      ================================================= */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Aktivitas",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* =================================================
          LAINNYA
      ================================================= */}
      <Tabs.Screen
        name="menu"
        options={{
          title: "Lainnya",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="grid-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* =================================================
          HIDDEN ADMIN PAGES
          Tetap bisa dipanggil menggunakan:
          router.push("/admin/jobdesk")
          router.push("/admin/meetings")
          dst.
      ================================================= */}

      <Tabs.Screen
        name="jobdesk"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="meetings"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="employee-detail"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="employee-form"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="job-detail"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="job-form"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="meeting-detail"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="meeting-form"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="request-detail"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}