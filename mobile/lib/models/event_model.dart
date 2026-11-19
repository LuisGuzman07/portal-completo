class EventModel {
  final int id;
  final String titulo;
  final String descripcion;
  final DateTime fechaInicio;
  final DateTime? fechaFin;
  final String lugar;
  final String imagenUrl;
  final double latitud;
  final double longitud;

  EventModel({
    required this.id,
    required this.titulo,
    required this.descripcion,
    required this.fechaInicio,
    this.fechaFin,
    required this.lugar,
    required this.imagenUrl,
    required this.latitud,
    required this.longitud,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    double parseCoordinate(dynamic val, double fallback) {
      if (val is num) return val.toDouble();
      if (val is String) {
        final parsed = double.tryParse(val);
        if (parsed != null) return parsed;
      }
      return fallback;
    }

    return EventModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '') ?? 0,
      titulo: json['titulo']?.toString() ?? 'Evento Académico',
      descripcion: json['descripcion']?.toString() ?? '',
      fechaInicio: DateTime.tryParse(json['fecha_inicio']?.toString() ?? '') ?? DateTime.now(),
      fechaFin: json['fecha_fin'] != null ? DateTime.tryParse(json['fecha_fin'].toString()) : null,
      lugar: json['lugar']?.toString() ?? 'Sede Central ABOCCRIM, La Paz',
      imagenUrl: json['imagen_url']?.toString() ?? '',
      latitud: parseCoordinate(json['latitud'], -16.500366),
      longitud: parseCoordinate(json['longitud'], -68.133292),
    );
  }
}
