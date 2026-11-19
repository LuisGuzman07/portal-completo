class UserModel {
  final int id;
  final String email;
  final String nombres;
  final String apellidos;
  final bool activo;
  final bool isStaff;
  final bool isSuperuser;
  final List<String> rolesCodigos;
  final List<String> permisosEfectivos;
  final String? lastLogin;

  UserModel({
    required this.id,
    required this.email,
    required this.nombres,
    required this.apellidos,
    required this.activo,
    this.isStaff = false,
    this.isSuperuser = false,
    this.rolesCodigos = const [],
    this.permisosEfectivos = const [],
    this.lastLogin,
  });

  String get fullName => '$nombres $apellidos'.trim().isNotEmpty 
      ? '$nombres $apellidos'.trim() 
      : email;

  String get primaryRoleLabel {
    if (isSuperuser || rolesCodigos.contains('superadmin')) {
      return 'Superadministrador';
    } else if (rolesCodigos.contains('admin_academico')) {
      return 'Administrador Académico';
    } else if (rolesCodigos.contains('investigador')) {
      return 'Investigador';
    } else if (rolesCodigos.contains('miembro')) {
      return 'Miembro Institucional';
    } else if (rolesCodigos.contains('comite_academico')) {
      return 'Comité Académico';
    } else if (rolesCodigos.contains('comite_etica')) {
      return 'Comité de Ética';
    } else if (rolesCodigos.contains('usuario')) {
      return 'Usuario Registrado';
    }
    return 'Miembro ABOCCRIM';
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    List<String> parseStringList(dynamic value) {
      if (value is List) {
        return value.map((e) => e.toString()).toList();
      }
      return [];
    }

    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      email: json['email']?.toString() ?? '',
      nombres: json['nombres']?.toString() ?? '',
      apellidos: json['apellidos']?.toString() ?? '',
      activo: json['activo'] == true,
      isStaff: json['is_staff'] == true,
      isSuperuser: json['is_superuser'] == true,
      rolesCodigos: parseStringList(json['roles_codigos']),
      permisosEfectivos: parseStringList(json['permisos_efectivos']),
      lastLogin: json['last_login']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'nombres': nombres,
      'apellidos': apellidos,
      'activo': activo,
      'is_staff': isStaff,
      'is_superuser': isSuperuser,
      'roles_codigos': rolesCodigos,
      'permisos_efectivos': permisosEfectivos,
      'last_login': lastLogin,
    };
  }
}
