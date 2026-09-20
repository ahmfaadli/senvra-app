import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  let background = '#EAF2FF';
  let color = '#175CD3';

  if (status === 'Completed' || status === 'Hadir') {
    background = '#ECFDF3';
    color = '#027A48';
  }

  if (status === 'Pending' || status === 'Terlambat') {
    background = '#FFFAEB';
    color = '#B54708';
  }

  if (status === 'Rejected' || status === 'Tidak Hadir') {
    background = '#FEF3F2';
    color = '#B42318';
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
  },

  action: {
    color: '#175CD3',
    fontSize: 13,
    fontWeight: '700',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  progressContainer: {
    height: 8,
    backgroundColor: '#EAECF0',
    borderRadius: 20,
    overflow: 'hidden',
  },

  progress: {
    height: '100%',
    backgroundColor: '#175CD3',
    borderRadius: 20,
  },
});