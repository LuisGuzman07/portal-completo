import 'package:flutter/foundation.dart';

class AppConfig {
  static const String appName = 'ABOCCRIM';
  static const String appFullName = 'Academia Boliviana de Ciencias Criminológicas';

  // Preset URLs for convenient testing
  static const String urlLocalhost = 'http://localhost:8000/api/v1';
  static const String urlAndroidEmulator = 'http://10.0.2.2:8000/api/v1';
  static const String urlLocalWifi = 'http://192.168.100.6:8000/api/v1';

  /// Determines default base URL based on runtime platform
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return urlLocalhost;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        // On Android, 10.0.2.2 is standard for emulator, while 192.168.100.6 works for physical phone on Wi-Fi
        // We default to local Wi-Fi IP or emulator based on preference.
        return urlLocalWifi;
      default:
        return urlLocalhost;
    }
  }

  // Assets
  static const String logoAsset = 'assets/images/logo_aboccrim.jpg';
  static const String fullLogoAsset = 'assets/images/logo.png';
}
