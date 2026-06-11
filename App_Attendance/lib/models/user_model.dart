class UserProfile {
  final String id;
  final String fullName;
  final String? nisn;
  final String role; // student, admin, teacher, parent
  final String? classId;
  final String? className; // mapped from join
  final String? major; // mapped from join classes.major
  final String? homeroomTeacher; // mapped from join classes -> homeroom_teacher
  final String? homeroomTeacherPhone; // mapped from join classes -> homeroom_teacher
  final String? phone;
  final String? avatarUrl;
  final List<String> parentOf;

  UserProfile({
    required this.id,
    required this.fullName,
    this.nisn,
    required this.role,
    this.classId,
    this.className,
    this.major,
    this.homeroomTeacher,
    this.homeroomTeacherPhone,
    this.phone,
    this.avatarUrl,
    this.parentOf = const [],
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    List<String> parsedParentOf = [];
    if (json['parent_of'] != null) {
      parsedParentOf = List<String>.from(json['parent_of']);
    }

    final classData = json['classes'] as Map<String, dynamic>?;

    // Parse homeroom teacher from nested join
    String? homeroomTeacherName;
    String? homeroomTeacherPhone;
    if (classData != null && classData['homeroom_teacher'] != null) {
      final teacherData = classData['homeroom_teacher'] as Map<String, dynamic>;
      homeroomTeacherName = teacherData['full_name'] as String?;
      homeroomTeacherPhone = teacherData['phone'] as String?;
    }

    return UserProfile(
      id: json['id'] as String,
      fullName: json['full_name'] as String,
      nisn: json['nisn'] as String?,
      role: json['role'] as String,
      classId: json['class_id'] as String?,
      className: classData != null ? classData['name'] as String? : null,
      major: classData != null ? classData['major'] as String? : null,
      homeroomTeacher: homeroomTeacherName,
      homeroomTeacherPhone: homeroomTeacherPhone,
      phone: json['phone'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      parentOf: parsedParentOf,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'nisn': nisn,
      'role': role,
      'class_id': classId,
      'phone': phone,
      'avatar_url': avatarUrl,
      'parent_of': parentOf,
    };
  }

  bool get isAdmin => role == 'admin';
  bool get isTeacher => role == 'teacher';
  bool get isStudent => role == 'student';
  bool get isParent => role == 'parent';
}
