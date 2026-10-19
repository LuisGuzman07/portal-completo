from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated
from .models import RegistroAuditoria
from apps.roles.permissions import IsSuperAdmin

class RegistroAuditoriaSerializer(serializers.ModelSerializer):
    usuario_email = serializers.CharField(source='usuario.email', default='Sistema/Anónimo', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = RegistroAuditoria
        fields = [
            'id',
            'usuario_email',
            'usuario_nombre',
            'accion',
            'entidad',
            'registro_afectado_id',
            'detalle',
            'fecha',
            'ip_origen'
        ]

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name()
        return 'Sistema / Invitado'


class RegistroAuditoriaListView(generics.ListAPIView):
    serializer_class = RegistroAuditoriaSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        qs = RegistroAuditoria.objects.select_related('usuario').all()
        accion = self.request.query_params.get('accion', '').strip()
        if accion:
            qs = qs.filter(accion__icontains=accion)
        entidad = self.request.query_params.get('entidad', '').strip()
        if entidad:
            qs = qs.filter(entidad__icontains=entidad)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(detalle__icontains=search)
        return qs.order_by('-fecha')
