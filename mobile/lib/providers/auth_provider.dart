import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../services/notification_service.dart';

enum AuthStatus {
  initial,
  authenticating,
  authenticated,
  unauthenticated,
}

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService;
  final StorageService _storageService;

  AuthStatus _status = AuthStatus.initial;
  UserModel? _user;
  String? _errorMessage;
  bool _isLoading = false;
  String _serverUrl = '';

  AuthProvider({
    ApiService? apiService,
    StorageService? storageService,
  })  : _apiService = apiService ?? ApiService(),
        _storageService = storageService ?? StorageService();

  AuthStatus get status => _status;
  UserModel? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _status == AuthStatus.authenticated && _user != null;
  String get serverUrl => _serverUrl;

  /// Inicializa y verifica si hay una sesión guardada
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    _serverUrl = await _storageService.getBaseUrl();
    final savedUser = await _storageService.getUserData();
    final token = await _storageService.getAccessToken();

    if (token != null && token.isNotEmpty && savedUser != null) {
      _user = savedUser;
      _status = AuthStatus.authenticated;
      notifyListeners();

      // En segundo plano verificamos si el token sigue vigente
      try {
        final freshUser = await _apiService.getCurrentUser();
        _user = freshUser;
        await _storageService.saveAuthData(
          accessToken: token,
          refreshToken: (await _storageService.getRefreshToken()) ?? '',
          user: freshUser,
        );
        notifyListeners();
        // Inicializar notificaciones push en segundo plano
        try {
          NotificationService().initialize(apiService: _apiService);
        } catch (_) {}
      } catch (_) {
        // Si falla por 401, cerramos sesión
        final tokenAfter = await _storageService.getAccessToken();
        if (tokenAfter == null) {
          _user = null;
          _status = AuthStatus.unauthenticated;
          notifyListeners();
        }
      }
    } else {
      _status = AuthStatus.unauthenticated;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Inicia sesión con email y contraseña
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    _status = AuthStatus.authenticating;
    notifyListeners();

    try {
      final result = await _apiService.login(email, password);
      _user = result.user;
      _status = AuthStatus.authenticated;
      _errorMessage = null;
      _isLoading = false;
      notifyListeners();
      // Inicializar y sincronizar token FCM con el usuario autenticado
      try {
        await NotificationService().initialize(apiService: _apiService);
        await NotificationService().syncTokenWithBackend(_apiService);
      } catch (_) {}
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _status = AuthStatus.unauthenticated;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Error inesperado: $e';
      _status = AuthStatus.unauthenticated;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Cierra sesión
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await _apiService.logout();
    _user = null;
    _errorMessage = null;
    _status = AuthStatus.unauthenticated;
    _isLoading = false;
    notifyListeners();
  }

  /// Cambia la URL base del servidor (útil para pruebas en local / wifi / emulador / despliegue)
  Future<void> updateServerUrl(String newUrl) async {
    String cleanUrl = newUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
    }
    await _storageService.saveBaseUrl(cleanUrl);
    _serverUrl = cleanUrl;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  /// Envía una solicitud de notificación de prueba
  Future<String> sendTestPush() async {
    try {
      final res = await _apiService.sendTestNotification();
      return res['message']?.toString() ?? 'Notificación enviada correctamente.';
    } catch (e) {
      return 'Error: $e';
    }
  }
}
