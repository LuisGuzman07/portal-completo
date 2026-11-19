import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import 'storage_service.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class LoginResult {
  final UserModel user;
  final String accessToken;
  final String refreshToken;
  final String message;

  LoginResult({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
    required this.message,
  });
}

class ApiService {
  final StorageService _storageService;
  final http.Client _client;

  ApiService({
    StorageService? storageService,
    http.Client? client,
  })  : _storageService = storageService ?? StorageService(),
        _client = client ?? http.Client();

  Future<String> _getBaseUrl() async {
    final url = await _storageService.getBaseUrl();
    // Ensure no trailing slash
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  Map<String, String> _headers([String? token]) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  String _extractErrorMessage(dynamic body, int statusCode) {
    if (body is Map) {
      if (body['detail'] != null) {
        return body['detail'].toString();
      }
      if (body['non_field_errors'] != null) {
        final err = body['non_field_errors'];
        return err is List ? err.join(' ') : err.toString();
      }
      if (body['message'] != null) {
        return body['message'].toString();
      }
      // Check first field error
      final firstKey = body.keys.firstOrNull;
      if (firstKey != null) {
        final val = body[firstKey];
        if (val is List) {
          return '$firstKey: ${val.join(' ')}';
        }
        return '$firstKey: $val';
      }
    } else if (body is String && body.isNotEmpty) {
      return body;
    }
    return 'Error del servidor (código $statusCode).';
  }

  /// Inicia sesión con email y contraseña en el backend ABOCCRIM
  Future<LoginResult> login(String email, String password) async {
    final baseUrl = await _getBaseUrl();
    final uri = Uri.parse('$baseUrl/auth/login/');

    try {
      final response = await _client
          .post(
            uri,
            headers: _headers(),
            body: jsonEncode({
              'email': email.trim().toLowerCase(),
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 12));

      dynamic body;
      try {
        body = jsonDecode(utf8.decode(response.bodyBytes));
      } catch (_) {
        body = response.body;
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final tokens = body['tokens'] ?? {};
        final userData = body['user'] ?? {};

        final accessToken = tokens['access']?.toString() ?? '';
        final refreshToken = tokens['refresh']?.toString() ?? '';
        final user = UserModel.fromJson(userData);
        final message = body['message']?.toString() ?? 'Inicio de sesión exitoso.';

        if (accessToken.isEmpty) {
          throw ApiException('El servidor no retornó un token de acceso válido.');
        }

        // Guardar sesión en almacenamiento local
        await _storageService.saveAuthData(
          accessToken: accessToken,
          refreshToken: refreshToken,
          user: user,
        );

        return LoginResult(
          user: user,
          accessToken: accessToken,
          refreshToken: refreshToken,
          message: message,
        );
      } else {
        final errorMsg = _extractErrorMessage(body, response.statusCode);
        throw ApiException(errorMsg, statusCode: response.statusCode);
      }
    } on SocketException catch (_) {
      throw ApiException(
        'No fue posible conectar con el servidor ($baseUrl).\nVerifique su conexión o la URL configurada.',
      );
    } on TimeoutException catch (_) {
      throw ApiException('El servidor tardó demasiado en responder (Tiempo de espera agotado).');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Ocurrió un error inesperado al iniciar sesión: $e');
    }
  }

  /// Cierra la sesión activa revocando el token en el backend y limpiando storage local
  Future<void> logout() async {
    final baseUrl = await _getBaseUrl();
    final accessToken = await _storageService.getAccessToken();
    final refreshToken = await _storageService.getRefreshToken();

    if (refreshToken != null && refreshToken.isNotEmpty) {
      try {
        final uri = Uri.parse('$baseUrl/auth/logout/');
        await _client
            .post(
              uri,
              headers: _headers(accessToken),
              body: jsonEncode({'refresh': refreshToken}),
            )
            .timeout(const Duration(seconds: 6));
      } catch (_) {
        // En logout, siempre limpiamos local aunque falle la red
      }
    }

    await _storageService.clearAuthData();
  }

  /// Obtiene los datos del usuario actual desde /auth/me/
  Future<UserModel> getCurrentUser() async {
    final baseUrl = await _getBaseUrl();
    final accessToken = await _storageService.getAccessToken();

    if (accessToken == null || accessToken.isEmpty) {
      throw ApiException('No hay sesión iniciada.', statusCode: 401);
    }

    final uri = Uri.parse('$baseUrl/auth/me/');
    try {
      final response = await _client
          .get(uri, headers: _headers(accessToken))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final body = jsonDecode(utf8.decode(response.bodyBytes));
        final user = UserModel.fromJson(body);
        return user;
      } else if (response.statusCode == 401) {
        // Token expirado, intentar refresh
        final refreshed = await refreshToken();
        if (refreshed) {
          return await getCurrentUser();
        }
        throw ApiException('Sesión caducada.', statusCode: 401);
      } else {
        throw ApiException('Error al obtener perfil (${response.statusCode})');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Error de red al consultar usuario: $e');
    }
  }

  /// Intenta renovar el token de acceso
  Future<bool> refreshToken() async {
    final baseUrl = await _getBaseUrl();
    final refreshToken = await _storageService.getRefreshToken();

    if (refreshToken == null || refreshToken.isEmpty) return false;

    try {
      final uri = Uri.parse('$baseUrl/auth/token/refresh/');
      final response = await _client
          .post(
            uri,
            headers: _headers(),
            body: jsonEncode({'refresh': refreshToken}),
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final body = jsonDecode(utf8.decode(response.bodyBytes));
        final newAccess = body['access']?.toString();
        if (newAccess != null && newAccess.isNotEmpty) {
          await _storageService.saveTokens(accessToken: newAccess);
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  /// Registra el token FCM del dispositivo en el backend Django
  Future<void> registerDeviceToken(String fcmToken) async {
    final baseUrl = await _getBaseUrl();
    final accessToken = await _storageService.getAccessToken();

    if (accessToken == null || accessToken.isEmpty) return;

    try {
      final uri = Uri.parse('$baseUrl/auth/devices/');
      await _client
          .post(
            uri,
            headers: _headers(accessToken),
            body: jsonEncode({
              'fcm_token': fcmToken,
              'dispositivo': Platform.operatingSystem,
            }),
          )
          .timeout(const Duration(seconds: 8));
    } catch (_) {
      // Si falla silenciosamente, se reintentará en el próximo inicio
    }
  }

  /// Solicita al backend que envíe una notificación push de prueba al usuario actual
  Future<Map<String, dynamic>> sendTestNotification() async {
    final baseUrl = await _getBaseUrl();
    final accessToken = await _storageService.getAccessToken();

    if (accessToken == null || accessToken.isEmpty) {
      throw ApiException('Debes iniciar sesión para probar notificaciones.');
    }

    final uri = Uri.parse('$baseUrl/auth/test-notification/');
    try {
      final response = await _client
          .post(uri, headers: _headers(accessToken))
          .timeout(const Duration(seconds: 10));

      final body = jsonDecode(utf8.decode(response.bodyBytes));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return body;
      } else {
        throw ApiException(body['detail'] ?? body['message'] ?? 'Error al enviar notificación.');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Error de conexión al solicitar notificación: $e');
    }
  }

  /// Obtiene la solicitud de incorporación/membresía del usuario autenticado
  Future<Map<String, dynamic>> getMyMembershipApplication() async {
    final baseUrl = await _getBaseUrl();
    final accessToken = await _storageService.getAccessToken();

    if (accessToken == null || accessToken.isEmpty) {
      throw ApiException('Debe iniciar sesión para consultar su solicitud.');
    }

    final uri = Uri.parse('$baseUrl/incorporacion/mi-solicitud/');
    try {
      final response = await _client
          .get(uri, headers: _headers(accessToken))
          .timeout(const Duration(seconds: 10));

      final body = jsonDecode(utf8.decode(response.bodyBytes));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return body;
      } else {
        throw ApiException(body['detail'] ?? 'Error al consultar solicitud de incorporación.');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Error de red al consultar solicitud: $e');
    }
  }

  /// Obtiene el listado de publicaciones/libros del usuario
  Future<List<dynamic>> getMyPublications({String? estado}) async {
    final baseUrl = await _getBaseUrl();
    final accessToken = await _storageService.getAccessToken();

    if (accessToken == null || accessToken.isEmpty) {
      throw ApiException('Debe iniciar sesión para ver sus publicaciones.');
    }

    var urlStr = '$baseUrl/publications/';
    if (estado != null && estado.isNotEmpty) {
      urlStr += '?estado=$estado';
    }

    final uri = Uri.parse(urlStr);
    try {
      final response = await _client
          .get(uri, headers: _headers(accessToken))
          .timeout(const Duration(seconds: 12));

      final body = jsonDecode(utf8.decode(response.bodyBytes));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (body is List) {
          return body;
        } else if (body is Map && body['results'] is List) {
          return body['results'];
        }
        return [];
      } else {
        throw ApiException(body['detail'] ?? 'Error al consultar publicaciones.');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Error de red al consultar publicaciones: $e');
    }
  }

  /// Obtiene los eventos institucionales públicos desde /events/public/
  Future<List<dynamic>> getPublicEvents({String? search}) async {
    final baseUrl = await _getBaseUrl();
    var urlStr = '$baseUrl/events/public/';
    if (search != null && search.trim().isNotEmpty) {
      urlStr += '?search=${Uri.encodeComponent(search.trim())}';
    }

    final uri = Uri.parse(urlStr);
    try {
      final response = await _client
          .get(uri, headers: _headers())
          .timeout(const Duration(seconds: 10));

      final body = jsonDecode(utf8.decode(response.bodyBytes));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (body is List) {
          return body;
        } else if (body is Map && body['results'] is List) {
          return body['results'];
        }
        return [];
      } else {
        throw ApiException(body['detail'] ?? 'Error al obtener eventos.');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Error de red al consultar eventos: $e');
    }
  }
}
