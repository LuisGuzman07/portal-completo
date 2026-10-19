from django.db import models
from django.conf import settings

class RegistroAuditoria(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        db_column='usuario_id',
        related_name='registros_auditoria'
    )
    accion = models.CharField(max_length=100)
    entidad = models.CharField(max_length=120)
    registro_afectado_id = models.CharField(max_length=60, null=True, blank=True)
    detalle = models.TextField(null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    ip_origen = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'registro_auditoria'
        verbose_name = 'Registro de Auditoría'
        verbose_name_plural = 'Registros de Auditoría'
        ordering = ['-fecha']

    def __str__(self):
        user_str = self.usuario.email if self.usuario else 'Anónimo/Sistema'
        return f"[{self.fecha.strftime('%Y-%m-%d %H:%M:%S')}] {self.accion} on {self.entidad} by {user_str}"


def get_client_ip(request):
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def registrar_auditoria(request=None, usuario=None, accion='', entidad='', registro_afectado_id=None, detalle=None):
    try:
        user = usuario
        ip = None
        if request:
            if not user and hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user
            ip = get_client_ip(request)

        RegistroAuditoria.objects.create(
            usuario=user if (user and getattr(user, 'is_authenticated', False)) else None,
            accion=accion,
            entidad=entidad,
            registro_afectado_id=str(registro_afectado_id) if registro_afectado_id else None,
            detalle=detalle,
            ip_origen=ip
        )
    except Exception as e:
        print(f"Error registrando auditoría: {e}")
