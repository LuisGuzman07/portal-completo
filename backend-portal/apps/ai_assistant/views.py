from rest_framework import views, status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import ConversacionIA, MensajeIA, DocumentoIndexado
from .serializers import (
    ConversacionIAListSerializer,
    ConversacionIADetailSerializer,
    ConversacionUpdateSerializer,
    MensajeIASerializer,
    ConsultaIARequestSerializer,
    MensajeFeedbackSerializer,
)
from .services.rag_engine import RAGQueryEngine
from .services.indexer import DocumentIndexerService


class ConversacionListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/ai/conversaciones/
    Lista las conversaciones del usuario autenticado.
    Query param ?favoritas=true para filtrar solo las destacadas.

    POST /api/v1/ai/conversaciones/
    Crea una nueva conversación vacía.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ConversacionIAListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = ConversacionIA.objects.filter(usuario=user)
        favoritas = self.request.query_params.get('favoritas', '').lower()
        if favoritas in ['1', 'true', 'yes']:
            qs = qs.filter(es_favorita=True)
        return qs.order_by('-fecha_actualizacion')

    def create(self, request, *args, **kwargs):
        titulo = request.data.get('titulo', '').strip() or 'Nueva consulta académica'
        conversacion = ConversacionIA.objects.create(
            usuario=request.user,
            titulo=titulo
        )
        serializer = ConversacionIADetailSerializer(conversacion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversacionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/v1/ai/conversaciones/{id}/
    Obtiene la conversación con todos sus mensajes y fuentes documentales.

    PATCH /api/v1/ai/conversaciones/{id}/
    Actualiza título o marca/desmarca como favorita.

    DELETE /api/v1/ai/conversaciones/{id}/
    Elimina la conversación.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConversacionIA.objects.filter(usuario=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ConversacionUpdateSerializer
        return ConversacionIADetailSerializer


class EnviarConsultaIAView(views.APIView):
    """
    POST /api/v1/ai/consultar/
    Envía una pregunta en lenguaje natural al motor RAG de ABOCCRIM.
    Body:
    {
        "query_text": "¿Qué es la criminología crítica y cuáles son sus postulados?",
        "conversacion_id": 12  // Opcional, si no se envía se crea una nueva
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConsultaIARequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query_text = serializer.validated_data['query_text']
        conversacion_id = serializer.validated_data.get('conversacion_id')

        try:
            resultado = RAGQueryEngine.execute_query(
                user=request.user,
                query_text=query_text,
                conversacion_id=conversacion_id
            )
            return Response(resultado, status=status.HTTP_200_OK)
        except ConversacionIA.DoesNotExist:
            return Response(
                {'error': 'La conversación solicitada no existe o no pertenece al usuario.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al procesar la consulta con IA: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MensajeFeedbackView(views.APIView):
    """
    POST /api/v1/ai/mensajes/{id}/feedback/
    Permite calificar un mensaje (like / dislike) y/o marcarlo como favorito.
    Body:
    {
        "valoracion": "like" | "dislike" | null,
        "es_favorito": true | false
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        mensaje = get_object_or_404(
            MensajeIA,
            pk=pk,
            conversacion__usuario=request.user
        )
        serializer = MensajeFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        update_fields = []

        if 'valoracion' in data:
            mensaje.valoracion = data['valoracion']
            update_fields.append('valoracion')

        if 'es_favorito' in data:
            mensaje.es_favorito = data['es_favorito']
            update_fields.append('es_favorito')

        if update_fields:
            mensaje.save(update_fields=update_fields)

        return Response({
            'id': mensaje.id,
            'valoracion': mensaje.valoracion,
            'es_favorito': mensaje.es_favorito,
        }, status=status.HTTP_200_OK)


class IndexacionEstadoView(views.APIView):
    """
    GET /api/v1/ai/indexacion/estado/
    Retorna el estado de indexación de documentos para administradores.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Solo administradores o personal autorizado
        if not (request.user.is_staff or getattr(request.user, 'is_superuser', False) or request.user.has_role('superadmin') or request.user.has_role('admin_academico')):
            return Response({'error': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)

        total_indexados = DocumentoIndexado.objects.filter(estado='indexado').count()
        total_pendientes = DocumentoIndexado.objects.filter(estado='pendiente').count()
        total_errores = DocumentoIndexado.objects.filter(estado='error').count()

        return Response({
            'indexados': total_indexados,
            'pendientes': total_pendientes,
            'errores': total_errores,
        })
