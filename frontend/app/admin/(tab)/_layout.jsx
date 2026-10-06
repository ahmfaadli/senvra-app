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

        // Warna tab
        tabBarActiveTintColor: "#175CD3",
        tabBarInactiveTintColor: "#98A2B3",

        tabBarShowLabel: true,

        // Tampilan label
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },

        // Posisi icon
        tabBarIconStyle: {
          marginBottom: -2,
        },

        // Safe area dan tampilan tab bar
        tabBarStyle: {
          height: 62 + bottomSpace,
          paddingTop: 7,
          paddingBottom: bottomSpace > 0 ? bottomSpace + 4 : 8,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#EAECF0",
          elevation: 10,
          shadowOpacity: 0.08,
        },
      }}
    >
      {/* Beranda */}
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

      {/* Pegawai */}
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

      {/* Aktivitas */}
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

      {/* Lainnya */}
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
    </Tabs>
  );
}