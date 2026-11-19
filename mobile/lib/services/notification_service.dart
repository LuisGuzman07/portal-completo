import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  debugPrint('Notificación push en segundo plano: ${message.messageId}');
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  FirebaseMessaging? _fcm;
  FirebaseMessaging get fcm => _fcm ??= FirebaseMessaging.instance;

  bool _isInitialized = false;
  String? _fcmToken;

  String? get fcmToken => _fcmToken;
  bool get isInitialized => _isInitialized;

  /// Callback opcional para escuchar mensajes en primer plano desde la UI
  void Function(RemoteMessage message)? onForegroundMessage;

  /// Inicializa Firebase Messaging y solicita permisos
  Future<void> initialize({ApiService? apiService}) async {
    if (_isInitialized) {
      if (apiService != null) {
        await syncTokenWithBackend(apiService);
      }
      return;
    }

    try {
      try {
        await Firebase.initializeApp();
      } catch (_) {}

      _fcm = FirebaseMessaging.instance;
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // 1. Solicitar permisos (Crítico en Android 13+)
      final settings = await fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      debugPrint('Permisos de notificación: ${settings.authorizationStatus}');

      // Habilitar visualización de alertas con la app en primer plano
      await fcm.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // 2. Obtener el Token FCM del dispositivo
      _fcmToken = await fcm.getToken();
      debugPrint('FCM Token obtenido: $_fcmToken');

      // Escuchar renovación de token
      fcm.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        if (apiService != null) {
          apiService.registerDeviceToken(newToken);
        }
      });

      // 3. Escuchar notificaciones mientras la app está abierta (Primer plano)
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Notificación en primer plano recibida: ${message.notification?.title}');
        if (onForegroundMessage != null) {
          onForegroundMessage!(message);
        }
      });

      _isInitialized = true;

      // Si se pasa ApiService, registrar token en el backend
      if (apiService != null) {
        await syncTokenWithBackend(apiService);
      }
    } catch (e) {
      debugPrint('Aviso en inicialización de notificaciones: $e');
    }
  }

  /// Sincroniza el token FCM actual con la cuenta de usuario activa en el backend
  Future<void> syncTokenWithBackend(ApiService apiService) async {
    try {
      _fcmToken ??= await fcm.getToken();
      if (_fcmToken != null && _fcmToken!.isNotEmpty) {
        await apiService.registerDeviceToken(_fcmToken!);
        debugPrint('FCM Token sincronizado con el usuario activo en backend.');
      }
    } catch (e) {
      debugPrint('Error sincronizando token FCM con backend: $e');
    }
  }
}
