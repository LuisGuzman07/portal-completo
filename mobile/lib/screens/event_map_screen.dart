import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/constants/app_colors.dart';
import '../models/event_model.dart';

class EventMapScreen extends StatefulWidget {
  final EventModel event;

  const EventMapScreen({super.key, required this.event});

  @override
  State<EventMapScreen> createState() => _EventMapScreenState();
}

class _EventMapScreenState extends State<EventMapScreen> {
  GoogleMapController? _mapController;
  MapType _currentMapType = MapType.normal;
  Position? _userPosition;
  double? _distanceKm;
  bool _locatingUser = false;
  bool _mapError = false;

  @override
  void initState() {
    super.initState();
    _checkUserLocation();
  }

  Future<void> _checkUserLocation() async {
    setState(() => _locatingUser = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() => _locatingUser = false);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() => _locatingUser = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() => _locatingUser = false);
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );

      final distanceMeters = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        widget.event.latitud,
        widget.event.longitud,
      );

      if (mounted) {
        setState(() {
          _userPosition = position;
          _distanceKm = distanceMeters / 1000.0;
          _locatingUser = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _locatingUser = false);
      }
    }
  }

  Future<void> _launchNavigation() async {
    final lat = widget.event.latitud;
    final lng = widget.event.longitud;
    final title = widget.event.titulo;

    // 1. Intent directo de Google Maps Navigation Turn-by-Turn
    final googleNavUri = Uri.parse('google.navigation:q=$lat,$lng&mode=d');
    // 2. Intent geo para selector de apps de mapas
    final geoUri = Uri.parse('geo:$lat,$lng?q=$lat,$lng(${Uri.encodeComponent(title)})');
    // 3. Fallback Web universal de Google Maps
    final webUri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');

    try {
      if (await canLaunchUrl(googleNavUri)) {
        await launchUrl(googleNavUri);
        return;
      }
      if (await canLaunchUrl(geoUri)) {
        await launchUrl(geoUri);
        return;
      }
      if (await canLaunchUrl(webUri)) {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
        return;
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('No se pudo abrir la navegación: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  String _formatDateTime(DateTime date) {
    final d = date.day.toString().padLeft(2, '0');
    final m = date.month.toString().padLeft(2, '0');
    final y = date.year;
    final h = date.hour.toString().padLeft(2, '0');
    final min = date.minute.toString().padLeft(2, '0');
    return '$d/$m/$y • $h:$min';
  }

  @override
  Widget build(BuildContext context) {
    final eventPos = LatLng(widget.event.latitud, widget.event.longitud);

    final Set<Marker> markers = {
      Marker(
        markerId: MarkerId('event_${widget.event.id}'),
        position: eventPos,
        infoWindow: InfoWindow(
          title: widget.event.titulo,
          snippet: widget.event.lugar,
        ),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
      ),
      if (_userPosition != null)
        Marker(
          markerId: const MarkerId('user_current_location'),
          position: LatLng(_userPosition!.latitude, _userPosition!.longitude),
          infoWindow: const InfoWindow(title: 'Tu Ubicación Actual'),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        ),
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ubicación del Evento', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Cambiar tipo de mapa',
            icon: Icon(
              _currentMapType == MapType.normal ? Icons.satellite_alt_rounded : Icons.map_rounded,
              color: Colors.white,
            ),
            onPressed: () {
              setState(() {
                _currentMapType = _currentMapType == MapType.normal ? MapType.hybrid : MapType.normal;
              });
            },
          ),
          IconButton(
            tooltip: 'Centrar en el Evento',
            icon: const Icon(Icons.my_location_rounded, color: Colors.white),
            onPressed: () {
              _mapController?.animateCamera(
                CameraUpdate.newCameraPosition(
                  CameraPosition(target: eventPos, zoom: 16),
                ),
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // Mapa Interactivo Google Maps o Fallback
          if (!_mapError)
            GoogleMap(
              initialCameraPosition: CameraPosition(
                target: eventPos,
                zoom: 15,
              ),
              mapType: _currentMapType,
              markers: markers,
              myLocationEnabled: true,
              myLocationButtonEnabled: false,
              zoomControlsEnabled: false,
              compassEnabled: true,
              onMapCreated: (controller) {
                _mapController = controller;
              },
            )
          else
            _buildMapFallback(),

          // Tarjeta flotante con Información del Evento y Botón Cómo Llegar
          Positioned(
            left: 16,
            right: 16,
            bottom: 20,
            child: _buildEventCard(),
          ),
        ],
      ),
    );
  }

  Widget _buildMapFallback() {
    return Container(
      color: Colors.grey.shade200,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.location_on_rounded, size: 64, color: AppColors.accent),
              const SizedBox(height: 12),
              Text(
                widget.event.titulo,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              Text(
                widget.event.lugar,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEventCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.event_available_rounded, color: AppColors.accent, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.event.titulo,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.access_time_rounded, size: 13, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          _formatDateTime(widget.event.fechaInicio),
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Ubicación / Lugar
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 16, color: AppColors.primary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  widget.event.lugar,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
              ),
              if (_distanceKm != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'A ${_distanceKm!.toStringAsFixed(1)} km',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                )
              else if (_locatingUser)
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
            ],
          ),
          const SizedBox(height: 16),
          // Botón destacado Cómo Llegar (Navegación GPS)
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 3,
            ),
            icon: const Icon(Icons.directions_car_rounded, size: 20),
            label: const Text(
              'CÓMO LLEGAR (Navegación GPS)',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 0.5),
            ),
            onPressed: _launchNavigation,
          ),
        ],
      ),
    );
  }
}
