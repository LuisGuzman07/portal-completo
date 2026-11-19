from django.urls import path
from .views import (
    ConversacionListCreateView,
    ConversacionDetailView,
    EnviarConsultaIAView,
    MensajeFeedbackView,
    IndexacionEstadoView,
)

urlpatterns = [
    path('conversaciones/', ConversacionListCreateView.as_view(), name='ai-conversaciones-list-create'),
    path('conversaciones/<int:pk>/', ConversacionDetailView.as_view(), name='ai-conversacion-detail'),
    path('consultar/', EnviarConsultaIAView.as_view(), name='ai-consultar'),
    path('mensajes/<int:pk>/feedback/', MensajeFeedbackView.as_view(), name='ai-mensaje-feedback'),
    path('indexacion/estado/', IndexacionEstadoView.as_view(), name='ai-indexacion-estado'),
]
