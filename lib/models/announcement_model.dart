// FILE: lib/models/announcement_model.dart

class Announcement {
  final String title;
  final String content;
  final String date;
  final String emoji;

  const Announcement({
    required this.title,
    required this.content,
    required this.date,
    required this.emoji,
  });
}

class DummyAnnouncementData {
  static const List<Announcement> announcements = [
    Announcement(
      title: 'Ujian Akhir Semester',
      content:
          'Ujian akhir semester akan dilaksanakan pada 15–20 Juni 2026. Harap mempersiapkan diri dengan baik.',
      date: '12 Mei 2026',
      emoji: '📢',
    ),
    Announcement(
      title: 'Kegiatan Ekstrakulikuler',
      content:
          'Pendaftaran ekstrakurikuler baru dibuka. Segera daftarkan dirimu sebelum 31 Mei 2026.',
      date: '10 Mei 2026',
      emoji: '🏫',
    ),
    Announcement(
      title: 'Libur Nasional',
      content:
          'Sekolah diliburkan pada tanggal 1 Juni 2026 dalam rangka Hari Lahir Pancasila.',
      date: '8 Mei 2026',
      emoji: '🎉',
    ),
  ];
}
