import 'package:flutter/material.dart';
import '../core/config/app_config.dart';
import '../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';

class ServerConfigDialog extends StatefulWidget {
  final AuthProvider authProvider;

  const ServerConfigDialog({super.key, required this.authProvider});

  static Future<void> show(BuildContext context, AuthProvider authProvider) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ServerConfigDialog(authProvider: authProvider),
    );
  }

  @override
  State<ServerConfigDialog> createState() => _ServerConfigDialogState();
}

class _ServerConfigDialogState extends State<ServerConfigDialog> {
  late TextEditingController _urlController;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: widget.authProvider.serverUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  void _applyUrl(String url) {
    widget.authProvider.updateServerUrl(url);
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Servidor actualizado a: $url'),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + bottomInset),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
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
            children: const [
              Icon(Icons.dns_rounded, color: AppColors.primary, size: 24),
              SizedBox(width: 10),
              Text(
                'Configuración del Servidor',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Selecciona el origen del backend para tus pruebas en local o conectado por celular:',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          _buildPresetOption(
            title: 'Red Local Wi-Fi (Celular físico)',
            subtitle: 'http://192.168.100.6:8000/api/v1',
            icon: Icons.wifi,
            url: AppConfig.urlLocalWifi,
          ),
          _buildPresetOption(
            title: 'Localhost (ADB reverse / Desktop)',
            subtitle: 'http://localhost:8000/api/v1',
            icon: Icons.usb,
            url: AppConfig.urlLocalhost,
          ),
          _buildPresetOption(
            title: 'Emulador Android',
            subtitle: 'http://10.0.2.2:8000/api/v1',
            icon: Icons.phone_android,
            url: AppConfig.urlAndroidEmulator,
          ),
          const Divider(height: 24),
          const Text(
            'O ingresa una URL personalizada (ej. servidor desplegado):',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _urlController,
            decoration: InputDecoration(
              hintText: 'https://tu-backend.com/api/v1',
              isDense: true,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              prefixIcon: const Icon(Icons.link, size: 20),
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onPressed: () {
                final text = _urlController.text.trim();
                if (text.isNotEmpty) {
                  _applyUrl(text);
                }
              },
              child: const Text('Guardar URL Personalizada'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPresetOption({
    required String title,
    required String subtitle,
    required IconData icon,
    required String url,
  }) {
    final isSelected = widget.authProvider.serverUrl == url;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primary.withValues(alpha: 0.08) : AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? AppColors.primary : Colors.transparent,
          width: 1.5,
        ),
      ),
      child: ListTile(
        dense: true,
        leading: CircleAvatar(
          backgroundColor: isSelected ? AppColors.primary : AppColors.border,
          radius: 18,
          child: Icon(icon, size: 18, color: isSelected ? Colors.white : AppColors.textSecondary),
        ),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            fontSize: 13,
            color: isSelected ? AppColors.primary : AppColors.textPrimary,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
        ),
        trailing: isSelected
            ? const Icon(Icons.check_circle, color: AppColors.primary, size: 20)
            : null,
        onTap: () => _applyUrl(url),
      ),
    );
  }
}
