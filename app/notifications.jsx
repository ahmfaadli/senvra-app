import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Card } from '../components/UI';

import { supabase } from '../lib/supabase';

import { useAuth } from '../context/AuthContext';

export default function Notifications() {
  const { user, session, profile } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const getUserId = () => {
    return user?.id || session?.user?.id || profile?.id;
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const userId = getUserId();

      if (!userId) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Gagal mengambil notifikasi:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.log('Error notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user, session, profile]);

  const getIcon = (type) => {
    switch (type) {
      case 'meeting':
        return 'videocam-outline';

      case 'job':
        return 'briefcase-outline';

      case 'surat':
        return 'document-text-outline';

      case 'attendance':
        return 'time-outline';

      default:
        return 'notifications-outline';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#175CD3" />
          <Text style={styles.loadingText}>
            Memuat notifikasi...
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="notifications-off-outline"
              size={32}
              color="#98A2B3"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Belum ada notifikasi
          </Text>

          <Text style={styles.emptyMessage}>
            Notifikasi terbaru akan muncul di sini.
          </Text>
        </View>
      ) : (
        notifications.map((item) => (
          <Card key={item.id}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <Ionicons
                  name={getIcon(item.type)}
                  size={21}
                  color="#175CD3"
                />
              </View>

              <View style={styles.textBox}>
                <Text style={styles.title}>
                  {item.title}
                </Text>

                <Text style={styles.message}>
                  {item.message}
                </Text>

                <Text style={styles.time}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  content: {
    padding: 20,
    paddingBottom: 30,
  },

  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },

  loadingText: {
    marginTop: 10,
    color: '#667085',
    fontSize: 13,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 70,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
  },

  emptyMessage: {
    fontSize: 13,
    color: '#667085',
    textAlign: 'center',
    marginTop: 6,
  },

  row: {
    flexDirection: 'row',
    gap: 13,
  },

  icon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  textBox: {
    flex: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101828',
  },

  message: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  time: {
    color: '#98A2B3',
    fontSize: 11,
    marginTop: 6,
  },
});