from django.urls import path

from .views import (
    DocumentoSolicitudReviewDownloadView,
    SolicitudIncorporacionCreateView,
    SolicitudIncorporacionSupportingDocumentsView,
    SolicitudIncorporacionTrackingView,
    SolicitudIncorporacionEvaluateView,
    SolicitudIncorporacionReviewDetailView,
    SolicitudIncorporacionReviewListView,
)

urlpatterns = [
    path('incorporacion/solicitudes/', SolicitudIncorporacionCreateView.as_view(), name='solicitud-incorporacion-create'),
    path('incorporacion/solicitudes/seguimiento/', SolicitudIncorporacionTrackingView.as_view(), name='solicitud-incorporacion-tracking'),
    path('incorporacion/solicitudes/seguimiento/documentos/', SolicitudIncorporacionSupportingDocumentsView.as_view(), name='solicitud-incorporacion-supporting-documents'),
    path('incorporacion/solicitudes/revision/', SolicitudIncorporacionReviewListView.as_view(), name='solicitudes-incorporacion-review-list'),
    path('incorporacion/solicitudes/<int:pk>/revision/', SolicitudIncorporacionReviewDetailView.as_view(), name='solicitud-incorporacion-review-detail'),
    path('incorporacion/solicitudes/<int:pk>/evaluaciones/', SolicitudIncorporacionEvaluateView.as_view(), name='solicitud-incorporacion-evaluate'),
    path('incorporacion/solicitudes/<int:solicitud_id>/documentos/<int:documento_id>/download/', DocumentoSolicitudReviewDownloadView.as_view(), name='solicitud-documento-download'),
]
