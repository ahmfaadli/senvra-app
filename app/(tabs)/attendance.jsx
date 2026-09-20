import React, { useEffect, useState } from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import {
  Card,
  StatusBadge,
} from '../../components/UI';

import { useAuth } from '../../context/AuthContext';

import { supabase } from '../../lib/supabase';


export default function Attendance() {
  const router = useRouter();

  const { user, session, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const [todayAttendance, setTodayAttendance] = useState(null);

  const [summary, setSummary] = useState({
    hadir: 0,
    terlambat: 0,
    izin: 0,
    sakit: 0,
  });


  /*
  |--------------------------------------------------------------------------
  | USER ID
  |--------------------------------------------------------------------------
  */

  const userId =
    user?.id ||
    session?.user?.id ||
    profile?.id;


  /*
  |--------------------------------------------------------------------------
  | FORMAT TANGGAL
  |--------------------------------------------------------------------------
  */

  const getToday = () => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      now.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };


  /*
  |--------------------------------------------------------------------------
  | FORMAT TANGGAL INDONESIA
  |--------------------------------------------------------------------------
  */

  const formatDate = (dateString) => {
    if (!dateString) {
      return '-';
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    return date.toLocaleDateString(
      'id-ID',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );
  };


  /*
  |--------------------------------------------------------------------------
  | FORMAT JAM
  |--------------------------------------------------------------------------
  */

  const getCurrentTime = () => {
    const now = new Date();

    const hour = String(
      now.getHours()
    ).padStart(2, '0');

    const minute = String(
      now.getMinutes()
    ).padStart(2, '0');

    const second = String(
      now.getSeconds()
    ).padStart(2, '0');

    return `${hour}:${minute}:${second}`;
  };


  /*
  |--------------------------------------------------------------------------
  | LOAD ABSENSI HARI INI
  |--------------------------------------------------------------------------
  */

  const loadTodayAttendance = async () => {
    if (!userId) {
      console.log(
        'User ID belum tersedia.'
      );

      return;
    }

    try {
      const today = getToday();

      console.log(
        'Mengambil absensi hari ini...'
      );

      console.log(
        'User ID:',
        userId
      );

      console.log(
        'Tanggal:',
        today
      );


      const {
        data,
        error,
      } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('tanggal_absen', today)
        .maybeSingle();


      if (error) {
        console.error(
          'Gagal mengambil absensi:',
          error
        );

        return;
      }


      console.log(
        'Absensi hari ini:',
        data
      );


      setTodayAttendance(data);

    } catch (error) {
      console.error(
        'Load attendance error:',
        error
      );
    }
  };


  /*
  |--------------------------------------------------------------------------
  | LOAD REKAP BULAN
  |--------------------------------------------------------------------------
  */

  const loadMonthlySummary = async () => {
    if (!userId) {
      return;
    }

    try {
      const now = new Date();

      const year = now.getFullYear();

      const month = String(
        now.getMonth() + 1
      ).padStart(2, '0');


      const startDate =
        `${year}-${month}-01`;


      const lastDay =
        new Date(
          year,
          now.getMonth() + 1,
          0
        ).getDate();


      const endDate =
        `${year}-${month}-${String(lastDay).padStart(2, '0')}`;


      console.log(
        'Mengambil rekap bulan:',
        startDate,
        endDate
      );


      const {
        data,
        error,
      } = await supabase
        .from('attendance')
        .select('status')
        .eq('user_id', userId)
        .gte(
          'tanggal_absen',
          startDate
        )
        .lte(
          'tanggal_absen',
          endDate
        );


      if (error) {
        console.error(
          'Gagal mengambil rekap:',
          error
        );

        return;
      }


      const result = {
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
      };


      data?.forEach((item) => {

        const status =
          String(
            item.status || ''
          ).toLowerCase();


        if (
          status === 'hadir'
        ) {
          result.hadir++;
        }

        else if (
          status === 'terlambat'
        ) {
          result.terlambat++;
        }

        else if (
          status === 'izin'
        ) {
          result.izin++;
        }

        else if (
          status === 'sakit'
        ) {
          result.sakit++;
        }

      });


      console.log(
        'Rekap bulan:',
        result
      );


      setSummary(result);

    } catch (error) {

      console.error(
        'Monthly summary error:',
        error
      );

    }
  };


  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const loadData = async () => {

      setLoading(true);

      await loadTodayAttendance();

      await loadMonthlySummary();

      setLoading(false);

    };


    if (userId) {
      loadData();
    }

  }, [userId]);


  /*
  |--------------------------------------------------------------------------
  | ABSEN MASUK
  |--------------------------------------------------------------------------
  */

  const handleCheckIn = async () => {

    if (!userId) {

      Alert.alert(
        'Error',
        'User belum ditemukan. Silakan login kembali.'
      );

      return;
    }


    if (todayAttendance) {

      Alert.alert(
        'Informasi',
        'Kamu sudah melakukan absensi hari ini.'
      );

      return;
    }


    try {

      setCheckingIn(true);


      const tanggalAbsen =
        getToday();

      const jamMasuk =
        getCurrentTime();


      console.log(
        'Menyimpan absensi...'
      );

      console.log(
        'user_id:',
        userId
      );

      console.log(
        'tanggal_absen:',
        tanggalAbsen
      );

      console.log(
        'jam_masuk:',
        jamMasuk
      );


      const {
        data,
        error,
      } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,

          tanggal_absen:
            tanggalAbsen,

          jam_masuk:
            jamMasuk,

          status:
            'Hadir',
        })
        .select()
        .single();


      if (error) {

        console.error(
          'Gagal menyimpan absensi:',
          error
        );


        if (
          error.code === '23505'
        ) {

          Alert.alert(
            'Sudah Absen',
            'Kamu sudah melakukan absensi hari ini.'
          );

          await loadTodayAttendance();

          return;
        }


        Alert.alert(
          'Gagal Absen',
          error.message ||
            'Terjadi kesalahan saat menyimpan absensi.'
        );

        return;
      }


      console.log(
        'Absensi berhasil:',
        data
      );


      setTodayAttendance(data);


      await loadMonthlySummary();


      Alert.alert(
        'Absensi Berhasil',
        `Kamu melakukan absensi pada ${jamMasuk.substring(
          0,
          5
        )}.`
      );

    } catch (error) {

      console.error(
        'Check in error:',
        error
      );


      Alert.alert(
        'Error',
        'Terjadi kesalahan saat melakukan absensi.'
      );

    } finally {

      setCheckingIn(false);

    }
  };


  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const attendanceStatus =
    todayAttendance?.status ||
    'Belum Absen';


  /*
  |--------------------------------------------------------------------------
  | TANGGAL HARI INI
  |--------------------------------------------------------------------------
  */

  const today =
    getToday();


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >

      <Text
        style={styles.title}
      >
        Absensi
      </Text>


      <Text
        style={styles.subtitle}
      >
        Catat kehadiran kamu hari ini.
      </Text>


      {/* ABSENSI HARI INI */}

      <Card
        style={styles.todayCard}
      >

        <View
          style={styles.icon}
        >

          <Ionicons
            name="calendar"
            size={30}
            color="#175CD3"
          />

        </View>


        <Text
          style={styles.todayTitle}
        >
          Absensi Hari Ini
        </Text>


        <Text
          style={styles.date}
        >
          {formatDate(today)}
        </Text>


        <StatusBadge
          status={
            attendanceStatus
          }
        />


        {todayAttendance && (

          <View
            style={styles.timeContainer}
          >

            <Text
              style={styles.timeLabel}
            >
              Jam Masuk
            </Text>


            <Text
              style={styles.timeValue}
            >
              {todayAttendance.jam_masuk
                ? todayAttendance.jam_masuk.substring(
                    0,
                    5
                  )
                : '-'}
            </Text>

          </View>

        )}


        <Pressable
          style={[
            styles.absentButton,

            todayAttendance &&
              styles.disabledButton,

            checkingIn &&
              styles.disabledButton,
          ]}
          onPress={
            handleCheckIn
          }
          disabled={
            !!todayAttendance ||
            checkingIn
          }
        >

          <Text
            style={styles.buttonText}
          >

            {checkingIn

              ? 'Menyimpan...'

              : todayAttendance

              ? `Sudah Absen ${
                  todayAttendance.jam_masuk
                    ? todayAttendance.jam_masuk.substring(
                        0,
                        5
                      )
                    : ''
                }`

              : 'Absen Masuk'}

          </Text>

        </Pressable>

      </Card>


      {/* REKAP BULAN */}

      <Card>

        <Text
          style={styles.sectionTitle}
        >
          Ringkasan Bulan Ini
        </Text>


        <View
          style={styles.summary}
        >

          <Summary
            label="Hadir"
            value={summary.hadir}
          />


          <Summary
            label="Terlambat"
            value={
              summary.terlambat
            }
          />


          <Summary
            label="Izin"
            value={
              summary.izin
            }
          />


          <Summary
            label="Sakit"
            value={
              summary.sakit
            }
          />

        </View>


        <Pressable
          style={
            styles.historyButton
          }
          onPress={() =>
            router.push(
              '/attendance-history'
            )
          }
        >

          <Text
            style={
              styles.historyText
            }
          >
            Lihat Rekap Kehadiran
          </Text>

        </Pressable>

      </Card>

    </ScrollView>
  );
}


/*
|--------------------------------------------------------------------------
| SUMMARY COMPONENT
|--------------------------------------------------------------------------
*/

function Summary({
  label,
  value,
}) {

  return (

    <View
      style={styles.summaryItem}
    >

      <Text
        style={styles.summaryValue}
      >
        {value}
      </Text>


      <Text
        style={styles.summaryLabel}
      >
        {label}
      </Text>

    </View>
  );
}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({

    container: {
      flex: 1,

      backgroundColor:
        '#F5F7FB',
    },


    content: {
      padding: 20,

      paddingBottom: 100,
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


    todayCard: {
      alignItems: 'center',
    },


    icon: {
      width: 62,

      height: 62,

      borderRadius: 20,

      backgroundColor:
        '#EAF2FF',

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    todayTitle: {
      fontSize: 20,

      fontWeight: '900',

      color: '#101828',

      marginTop: 15,
    },


    date: {
      color: '#667085',

      marginTop: 5,

      marginBottom: 15,

      textAlign: 'center',
    },


    timeContainer: {
      alignItems: 'center',

      marginTop: 15,
    },


    timeLabel: {
      color: '#98A2B3',

      fontSize: 12,
    },


    timeValue: {
      color: '#101828',

      fontSize: 22,

      fontWeight: '900',

      marginTop: 3,
    },


    absentButton: {
      width: '100%',

      height: 50,

      borderRadius: 12,

      backgroundColor:
        '#175CD3',

      justifyContent:
        'center',

      alignItems:
        'center',

      marginTop: 18,
    },


    disabledButton: {
      backgroundColor:
        '#027A48',
    },


    buttonText: {
      color: '#FFFFFF',

      fontWeight: '800',
    },


    sectionTitle: {
      fontSize: 17,

      fontWeight: '800',

      color: '#101828',

      marginBottom: 20,
    },


    summary: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',
    },


    summaryItem: {
      alignItems:
        'center',
    },


    summaryValue: {
      fontSize: 24,

      fontWeight: '900',

      color: '#101828',
    },


    summaryLabel: {
      color: '#667085',

      fontSize: 11,

      marginTop: 3,
    },


    historyButton: {
      height: 45,

      borderRadius: 11,

      borderWidth: 1,

      borderColor:
        '#175CD3',

      justifyContent:
        'center',

      alignItems:
        'center',

      marginTop: 22,
    },


    historyText: {
      color: '#175CD3',

      fontWeight: '800',
    },

  });