export const jobs = [
  {
    id: '1',
    title: 'Mengembangkan Dashboard Employee',
    description:
      'Membangun halaman dashboard untuk aplikasi internal perusahaan.',
    deadline: '25 September 2026',
    status: 'In Progress',
    progress: 70,
    priority: 'High',
  },
  {
    id: '2',
    title: 'Membuat Dokumentasi API',
    description:
      'Membuat dokumentasi endpoint API yang digunakan oleh aplikasi.',
    deadline: '28 September 2026',
    status: 'In Progress',
    progress: 45,
    priority: 'Medium',
  },
  {
    id: '3',
    title: 'Testing Sistem Absensi',
    description:
      'Melakukan pengujian terhadap fitur absensi pegawai.',
    deadline: '30 September 2026',
    status: 'Pending',
    progress: 20,
    priority: 'Medium',
  },
];

export const meetings = [
  {
    id: '1',
    title: 'Weekly Meeting Development',
    date: '20 September 2026',
    time: '10:00 - 11:00',
    location: 'Google Meet',
    link: 'https://meet.google.com/',
    description:
      'Pembahasan progres pekerjaan dan kendala development.',
  },
  {
    id: '2',
    title: 'Sprint Planning',
    date: '22 September 2026',
    time: '13:00 - 14:00',
    location: 'Meeting Room 2',
    link: '',
    description:
      'Perencanaan pekerjaan untuk sprint berikutnya.',
  },
];

export const notifications = [
  {
    id: '1',
    title: 'Jobdesk diperbarui',
    message: 'Dashboard Employee memiliki update progres.',
    type: 'job',
    time: '10 menit lalu',
  },
  {
    id: '2',
    title: 'Meeting hari ini',
    message: 'Weekly Meeting Development dimulai pukul 10:00.',
    type: 'meeting',
    time: '30 menit lalu',
  },
  {
    id: '3',
    title: 'Pengajuan surat',
    message: 'Pengajuan surat kamu sedang diproses.',
    type: 'letter',
    time: '1 jam lalu',
  },
];

export const attendanceData = [
  {
    date: '01 September 2026',
    status: 'Hadir',
    checkIn: '08:01',
    checkOut: '17:02',
  },
  {
    date: '02 September 2026',
    status: 'Hadir',
    checkIn: '08:05',
    checkOut: '17:00',
  },
  {
    date: '03 September 2026',
    status: 'Terlambat',
    checkIn: '08:21',
    checkOut: '17:03',
  },
  {
    date: '04 September 2026',
    status: 'Hadir',
    checkIn: '07:58',
    checkOut: '17:01',
  },
];

export const monthlyAttendance = {
  month: 'September 2026',
  workDays: 22,
  present: 19,
  late: 2,
  permission: 1,
  sick: 0,
  absent: 0,
};
