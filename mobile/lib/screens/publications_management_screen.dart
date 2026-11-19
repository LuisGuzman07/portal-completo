import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class PublicationsManagementScreen extends StatefulWidget {
  final AuthProvider authProvider;

  const PublicationsManagementScreen({super.key, required this.authProvider});

  @override
  State<PublicationsManagementScreen> createState() => _PublicationsManagementScreenState();
}

class _PublicationsManagementScreenState extends State<PublicationsManagementScreen> {
  final ApiService _apiService = ApiService();
  bool _loading = true;
  String? _error;
  List<dynamic> _publications = [];
  String _selectedFilter = 'todas';

  @override
  void initState() {
    super.initState();
    _loadPublications();
  }

  Future<void> _loadPublications() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final estadoParam = _selectedFilter == 'todas' ? null : _selectedFilter;
      final list = await _apiService.getMyPublications(estado: estadoParam);
      if (mounted) {
        setState(() {
          _publications = list;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Color _getStatusColor(String estado) {
    switch (estado.toLowerCase()) {
      case 'aprobada':
      case 'publicada':
        return AppColors.success;
      case 'pendiente':
        return AppColors.primary;
      case 'en_revision':
        return AppColors.secondary;
      case 'observada':
        return AppColors.warning;
      case 'rechazada':
        return AppColors.error;
      default:
        return AppColors.textMuted;
    }
  }

  String _getStatusLabel(String estado) {
    switch (estado.toLowerCase()) {
      case 'aprobada':
      case 'publicada':
        return 'Aprobada y Publicada';
      case 'pendiente':
        return 'Pendiente de Revisión';
      case 'en_revision':
        return 'En Revisión Técnica';
      case 'observada':
        return 'Observada';
      case 'rechazada':
        return 'Rechazada';
      default:
        return estado;
    }
  }

  void _showPublicationDetails(Map<String, dynamic> pub) {
    final titulo = pub['titulo'] ?? 'Sin título';
    final resumen = pub['resumen'] ?? 'Sin resumen registrado.';
    final tipo = pub['tipo_nombre'] ?? pub['tipo']?['nombre'] ?? 'Publicación';
    final anio = pub['anio']?.toString() ?? '-';
    final estado = pub['estado']?.toString() ?? 'pendiente';
    final statusColor = _getStatusColor(estado);
    final autores = pub['autores'] as List<dynamic>? ?? [];
    final documentos = pub['documentos'] as List<dynamic>? ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      tipo,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: statusColor, width: 1),
                    ),
                    child: Text(
                      _getStatusLabel(estado),
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: statusColor),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                titulo,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              Text(
                'Año de publicación: $anio',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const Divider(height: 24),
              const Text(
                'Resumen / Abstract:',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              Text(
                resumen,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
              ),
              if (autores.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text(
                  'Autores:',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  children: autores.map((a) {
                    final nombre = a is Map ? '${a['nombres']} ${a['apellidos']}' : a.toString();
                    return Chip(
                      label: Text(nombre, style: const TextStyle(fontSize: 11)),
                      backgroundColor: AppColors.surfaceMuted,
                    );
                  }).toList(),
                ),
              ],
              if (documentos.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  'Archivos Digitales (${documentos.length}):',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 8),
                ...documentos.map((d) {
                  final nom = d is Map ? d['nombre'] ?? 'Documento' : 'Documento';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceMuted,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.picture_as_pdf, color: AppColors.error, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(nom, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  );
                }),
              ],
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        title: const Text(
          'Gestión de Publicaciones',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            tooltip: 'Actualizar',
            onPressed: _loadPublications,
          ),
        ],
      ),
      body: Column(
        children: [
          // Barra de Filtros por Estado
          Container(
            color: AppColors.surface,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('Todas', 'todas'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Pendientes', 'pendiente'),
                  const SizedBox(width: 8),
                  _buildFilterChip('En Revisión', 'en_revision'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Aprobadas', 'aprobada'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Observadas', 'observada'),
                ],
              ),
            ),
          ),
          const Divider(height: 1),

          // Listado de Publicaciones
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadPublications,
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : _error != null
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                                const SizedBox(height: 12),
                                Text(_error!, textAlign: TextAlign.center),
                                const SizedBox(height: 16),
                                ElevatedButton(onPressed: _loadPublications, child: const Text('Reintentar')),
                              ],
                            ),
                          ),
                        )
                      : _publications.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.menu_book_outlined, size: 60, color: AppColors.textMuted),
                                  const SizedBox(height: 14),
                                  const Text(
                                    'No se encontraron publicaciones',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(height: 6),
                                  const Text(
                                    'Las obras y libros registrados aparecerán aquí.',
                                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _publications.length,
                              itemBuilder: (ctx, index) {
                                final pub = _publications[index] as Map<String, dynamic>;
                                final titulo = pub['titulo'] ?? 'Sin título';
                                final tipo = pub['tipo_nombre'] ?? pub['tipo']?['nombre'] ?? 'Publicación';
                                final anio = pub['anio']?.toString() ?? '';
                                final estado = pub['estado']?.toString() ?? 'pendiente';
                                final statusColor = _getStatusColor(estado);

                                return Card(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  elevation: 1,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                    side: const BorderSide(color: AppColors.border),
                                  ),
                                  child: InkWell(
                                    onTap: () => _showPublicationDetails(pub),
                                    borderRadius: BorderRadius.circular(14),
                                    child: Padding(
                                      padding: const EdgeInsets.all(16.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: AppColors.primary.withValues(alpha: 0.08),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  tipo,
                                                  style: const TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                    color: AppColors.primary,
                                                  ),
                                                ),
                                              ),
                                              if (anio.isNotEmpty) ...[
                                                const SizedBox(width: 8),
                                                Text('• $anio', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                              ],
                                              const Spacer(),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: statusColor.withValues(alpha: 0.12),
                                                  borderRadius: BorderRadius.circular(10),
                                                  border: Border.all(color: statusColor, width: 1),
                                                ),
                                                child: Text(
                                                  _getStatusLabel(estado),
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                    color: statusColor,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 10),
                                          Text(
                                            titulo,
                                            style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textPrimary,
                                            ),
                                          ),
                                          const SizedBox(height: 12),
                                          Row(
                                            children: const [
                                              Text(
                                                'Tocar para ver detalles y dictamen',
                                                style: TextStyle(fontSize: 11, color: AppColors.accent, fontWeight: FontWeight.w600),
                                              ),
                                              SizedBox(width: 4),
                                              Icon(Icons.arrow_forward_ios, size: 10, color: AppColors.accent),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String key) {
    final isSelected = _selectedFilter == key;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        color: isSelected ? Colors.white : AppColors.textPrimary,
      ),
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.surfaceMuted,
      onSelected: (val) {
        if (val) {
          setState(() => _selectedFilter = key);
          _loadPublications();
        }
      },
    );
  }
}
