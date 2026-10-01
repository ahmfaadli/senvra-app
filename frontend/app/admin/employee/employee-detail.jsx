import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../../services/supabase';

export default function EmployeeDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setEmployee(data);
    } catch (error) {
      console.log(error);

      Alert.alert(
        'Gagal',
        'Data pegawai tidak ditemukan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = () => {
    Alert.alert(
      'Hapus Pegawai',
      'Apakah kamu yakin ingin menghapus data pegawai ini?',
      [
        {
          text: 'Batal',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('profiles')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert(
                'Gagal',
                error.message
              );
              return;
            }

            Alert.alert(
              'Berhasil',
              'Data pegawai berhasil dihapus.'
            );

            router.replace('/admin/employees');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#175CD3"
        />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.center}>
        <Text>Data pegawai tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Pressable
        style={styles.back}
        onPress={() => router.back()}
      >
        <Ionicons
          name="arrow-back"
          size={22}
          color="#101828"
        />

        <Text style={styles.backText}>
          Detail Pegawai
        </Text>
      </Pressable>

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(employee.name || 'P')
              .substring(0, 2)
              .toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>
          {employee.name || '-'}
        </Text>

        <Text style={styles.position}>
          {employee.jabatan || '-'}
        </Text>

        <View style={styles.status}>
          <Text style={styles.statusText}>
            {employee.status || 'Aktif'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Informasi Pegawai
      </Text>

      <View style={styles.card}>
        <Info
          icon="person-outline"
          label="Nama"
          value={employee.name}
        />

        <Info
          icon="mail-outline"
          label="Email"
          value={employee.email}
        />

        <Info
          icon="call-outline"
          label="Nomor HP"
          value={employee.no_hp}
        />

        <Info
          icon="briefcase-outline"
          label="Jabatan"
          value={employee.jabatan}
        />

        <Info
          icon="business-outline"
          label="Divisi"
          value={employee.divisi}
        />

        <Info
          icon="shield-outline"
          label="Role"
          value={employee.role}
        />

        <Info
          icon="checkmark-circle-outline"
          label="Status"
          value={employee.status}
          last
        />
      </View>

      <Text style={styles.sectionTitle}>
        Aksi
      </Text>

      <Pressable
        style={styles.editButton}
        onPress={() =>
          router.push(
            `/admin/employee-form?id=${employee.id}`
          )
        }
      >
        <Ionicons
          name="create-outline"
          size={20}
          color="#175CD3"
        />

        <Text style={styles.editText}>
          Edit Data Pegawai
        </Text>
      </Pressable>

      <Pressable
        style={styles.deleteButton}
        onPress={deleteEmployee}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color="#B42318"
        />

        <Text style={styles.deleteText}>
          Hapus Data Pegawai
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Info({
  icon,
  label,
  value,
  last,
}) {
  return (
    <View
      style={[
        styles.info,
        last && styles.infoLast,
      ]}
    >
      <Ionicons
        name={icon}
        size={19}
        color="#175CD3"
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.label}>
          {label}
        </Text>

        <Text style={styles.value}>
          {value || '-'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },

  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },

  backText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#101828',
  },

  profile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 28,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#175CD3',
    fontSize: 25,
    fontWeight: '900',
  },

  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#101828',
    marginTop: 15,
  },

  position: {
    color: '#667085',
    marginTop: 5,
  },

  status: {
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },

  statusText: {
    color: '#027A48',
    fontWeight: '800',
    fontSize: 11,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#101828',
    marginTop: 22,
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  info: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },

  infoLast: {
    borderBottomWidth: 0,
  },

  label: {
    color: '#98A2B3',
    fontSize: 11,
  },

  value: {
    color: '#344054',
    fontWeight: '700',
    marginTop: 3,
  },

  editButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#175CD3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  editText: {
    color: '#175CD3',
    fontWeight: '800',
  },

  deleteButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FDA29B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },

  deleteText: {
    color: '#B42318',
    fontWeight: '800',
  },
});