import React, { useState } from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { useRouter } from 'expo-router';

import { supabase } from '../../../services/supabase';

export default function EmployeeForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [divisi, setDivisi] = useState('');
  const [noHp, setNoHp] = useState('');
  const [loading, setLoading] = useState(false);

  const saveEmployee = async () => {
    if (!email || !nama) {
      Alert.alert(
        'Form belum lengkap',
        'Nama dan email wajib diisi.'
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * Cari user berdasarkan email.
       *
       * User Auth harus sudah dibuat terlebih dahulu.
       */

      const { data: existingUser, error } =
        await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

      if (error) throw error;

      if (!existingUser) {
        Alert.alert(
          'User belum tersedia',
          'Buat akun user terlebih dahulu melalui Supabase Authentication, kemudian lengkapi profile pegawai.'
        );
        return;
      }

      const { error: updateError } =
        await supabase
          .from('profiles')
          .update({
            nama,
            jabatan,
            divisi,
            no_hp: noHp,
            role: 'employee',
            status: 'aktif',
          })
          .eq('id', existingUser.id);

      if (updateError) throw updateError;

      Alert.alert(
        'Berhasil',
        'Data pegawai berhasil disimpan.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace('/admin/employees/employees'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Gagal',
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Tambah Pegawai
      </Text>

      <Text style={styles.subtitle}>
        Lengkapi data pegawai.
      </Text>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="email@perusahaan.com"
        keyboardType="email-address"
      />

      <Input
        label="Nama"
        value={nama}
        onChangeText={setNama}
        placeholder="Nama lengkap"
      />

      <Input
        label="Jabatan"
        value={jabatan}
        onChangeText={setJabatan}
        placeholder="Contoh: Programmer"
      />

      <Input
        label="Divisi"
        value={divisi}
        onChangeText={setDivisi}
        placeholder="Contoh: IT"
      />

      <Input
        label="No. HP"
        value={noHp}
        onChangeText={setNoHp}
        placeholder="08xxxxxxxxxx"
        keyboardType="phone-pad"
      />

      <Pressable
        style={styles.button}
        onPress={saveEmployee}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Menyimpan...'
            : 'Simpan Pegawai'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}) {
  return (
    <>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        keyboardType={keyboardType}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  content: {
    padding: 20,
    paddingBottom: 60,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#101828',
  },

  subtitle: {
    color: '#667085',
    marginTop: 5,
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#344054',
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#101828',
  },

  button: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#175CD3',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});