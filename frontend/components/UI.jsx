import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
  radius,
  spacing,
  typography,
} from "../theme";

export function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ title, action, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {action && (
        <Pressable onPress={onPress}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function StatusBadge({ status }) {
  let background = colors.infoBackground;
  let color = colors.info;

  if (status === "Completed" || status === "Hadir") {
    background = colors.successBackground;
    color = colors.success;
  }

  if (status === "Pending" || status === "Terlambat") {
    background = colors.warningBackground;
    color = colors.warning;
  }

  if (status === "Rejected" || status === "Tidak Hadir") {
    background = colors.dangerBackground;
    color = colors.danger;
  }

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.badgeText, { color }]}>
        {status}
      </Text>
    </View>
  );
}

export function ProgressBar({ progress }) {
  return (
    <View style={styles.progressContainer}>
      <View
        style={[
          styles.progress,
          {
            width: `${progress}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  sectionTitle: {
    ...typography.subheading,
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },

  action: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  progressContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
});