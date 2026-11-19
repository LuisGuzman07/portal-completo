import 'package:flutter/material.dart';
import '../core/config/app_config.dart';
import '../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class MembershipStatusScreen extends StatefulWidget {
  final AuthProvider authProvider;

  const MembershipStatusScreen({super.key, required this.authProvider});

  @override
  State<MembershipStatusScreen> createState() => _MembershipStatusScreenState();
}

class _MembershipStatusScreenState extends State<MembershipStatusScreen> {
  final ApiService _apiService = ApiService();
  bool _loading = true;
  String? _error;
  bool _hasApplication = false;
  Map<String, dynamic>? _solicitud;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await _apiService.getMyMembershipApplication();
      if (mounted) {
        setState(() {
          _hasApplication = res['tiene_solicitud'] == true;
          _solicitud = res['solicitud'];
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
        return AppColors.success;
      case 'observada':
      case 'requiere_documentacion':
        return AppColors.warning;
      case 'rechazada':
        return AppColors.error;
      case 'en_revision':
      case 'lista_decision':
        return AppColors.info;
      default:
        return AppColors.primary;
    }
  }

  String _getStatusLabel(String estado) {
    switch (estado.toLowerCase()) {
      case 'aprobada':
        return 'Aprobada / Miembro Oficial';
      case 'observada':
      case 'requiere_documentacion':
        return 'Observada (Requiere Documentos)';
      case 'rechazada':
        return 'Rechazada';
      case 'en_revision':
        return 'En Revisión por Comité';
      case 'lista_decision':
        return 'En Sesión de Decisión';
      case 'recibida':
        return 'Recibida';
      default:
        return estado.toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        title: const Text(
          'Solicitud de Membresía',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            tooltip: 'Actualizar estado',
            onPressed: _loadStatus,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadStatus,
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              )
            : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                          const SizedBox(height: 12),
                          Text(_error!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14)),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _loadStatus,
                            child: const Text('Reintentar'),
                          ),
                        ],
                      ),
                    ),
                  )
                : !_hasApplication || _solicitud == null
                    ? _buildEmptyState()
                    : _buildApplicationSheet(),
      ),
    );
  }

  Widget _buildEmptyState() {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Center(
        child: Column(
          children: [
            const SizedBox(height: 40),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.08),
              ),
              child: const Icon(Icons.assignment_ind_outlined, size: 64, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            const Text(
              'No tienes solicitudes activas',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 10),
            const Text(
              'Aún no has presentado una postulación formal para incorporarte a la Academia Boliviana de Ciencias Criminológicas.\n\nPuedes enviar tu expediente desde el portal web oficial.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildApplicationSheet() {
    final estado = _solicitud!['estado']?.toString() ?? 'recibida';
    final folio = _solicitud!['id'] ?? _solicitud!['folio'] ?? '001';
    final nombres = _solicitud!['nombres'] ?? '';
    final apellidos = _solicitud!['apellidos'] ?? '';
    final email = _solicitud!['email'] ?? '';
    final telefono = _solicitud!['telefono'] ?? '-';
    final antecedentes = _solicitud!['antecedentes_academicos'] ?? 'Sin antecedentes registrados.';
    final fechaEnvio = _solicitud!['fecha_envio'] ?? '-';
    final observaciones = _solicitud!['observaciones'] ?? _solicitud!['observaciones_dictamen'];
    final documentos = _solicitud!['documentos'] as List<dynamic>? ?? [];

    final statusColor = _getStatusColor(estado);

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(18.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Banner de Hoja Institucional Oficial
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Image.asset(
                      AppConfig.logoAsset,
                      width: 50,
                      height: 50,
                      errorBuilder: (_, _, _) => const Icon(Icons.school, size: 40, color: AppColors.primary),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ABOCCRIM',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                              color: AppColors.primary,
                            ),
                          ),
                          const Text(
                            'Expediente de Incorporación',
                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Folio #SOL-$folio',
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColors.accent,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),

                // Badge de Estado Oficial
                Row(
                  children: [
                    const Text('Estado Oficial: ', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: statusColor, width: 1.2),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(shape: BoxShape.circle, color: statusColor),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _getStatusLabel(estado),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: statusColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                // Observaciones del Comité si las hay
                if (observaciones != null && observaciones.toString().trim().isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: estado == 'aprobada'
                          ? AppColors.success.withValues(alpha: 0.08)
                          : AppColors.warning.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: estado == 'aprobada' ? AppColors.success : AppColors.warning,
                        width: 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              estado == 'aprobada' ? Icons.check_circle_outline : Icons.announcement_outlined,
                              size: 16,
                              color: estado == 'aprobada' ? AppColors.success : AppColors.warning,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              estado == 'aprobada' ? 'Dictamen Institucional:' : 'Observaciones del Comité:',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: estado == 'aprobada' ? AppColors.success : AppColors.warning,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          observaciones.toString(),
                          style: const TextStyle(fontSize: 12, color: AppColors.textPrimary, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Stepper Visual de Avance
          _buildProgressStepper(estado),

          const SizedBox(height: 16),

          // Tarjeta de Datos del Postulante
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.person_pin_outlined, size: 20, color: AppColors.primary),
                    SizedBox(width: 8),
                    Text(
                      'Datos del Postulante (Solo Lectura)',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                  ],
                ),
                const Divider(height: 20),
                _buildFieldRow('Postulante', '$nombres $apellidos'.trim()),
                const SizedBox(height: 10),
                _buildFieldRow('Correo', email),
                const SizedBox(height: 10),
                _buildFieldRow('Teléfono', telefono),
                const SizedBox(height: 10),
                _buildFieldRow('Fecha de Envío', fechaEnvio),
                const SizedBox(height: 14),
                const Text(
                  'Antecedentes Académicos:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 4),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceMuted,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    antecedentes,
                    style: const TextStyle(fontSize: 12, color: AppColors.textPrimary, height: 1.3),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Documentos Adjuntos
          if (documentos.isNotEmpty) ...[
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.folder_shared_outlined, size: 20, color: AppColors.secondary),
                      const SizedBox(width: 8),
                      Text(
                        'Documentos Presentados (${documentos.length})',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                    ],
                  ),
                  const Divider(height: 20),
                  ...documentos.map((doc) {
                    final nombre = doc['nombre'] ?? 'Documento Adjunto';
                    final tipo = doc['tipo'] ?? 'PDF';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.picture_as_pdf, color: AppColors.error, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              nombre,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              tipo,
                              style: const TextStyle(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),
          const Center(
            child: Text(
              'Documento electrónico oficial de seguimiento • ABOCCRIM',
              style: TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildProgressStepper(String estado) {
    int currentStep = 1;
    if (estado == 'en_revision') currentStep = 2;
    if (estado == 'observada') currentStep = 2;
    if (estado == 'lista_decision') currentStep = 3;
    if (estado == 'aprobada' || estado == 'rechazada') currentStep = 4;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Línea de Tiempo del Trámite',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _buildStepItem('1. Envío', currentStep >= 1, true),
              _buildStepItem('2. Comité', currentStep >= 2, currentStep >= 2),
              _buildStepItem('3. Sesión', currentStep >= 3, currentStep >= 3),
              _buildStepItem('4. Dictamen', currentStep >= 4, false),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStepItem(String title, bool isCompleted, bool hasLine) {
    return Expanded(
      child: Row(
        children: [
          Expanded(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 12,
                  backgroundColor: isCompleted ? AppColors.primary : AppColors.border,
                  child: Icon(
                    isCompleted ? Icons.check : Icons.circle,
                    size: 14,
                    color: isCompleted ? Colors.white : AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: isCompleted ? FontWeight.bold : FontWeight.normal,
                    color: isCompleted ? AppColors.primary : AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          if (hasLine)
            Container(
              width: 16,
              height: 2,
              color: isCompleted ? AppColors.primary : AppColors.border,
            ),
        ],
      ),
    );
  }

  Widget _buildFieldRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ],
    );
  }
}
