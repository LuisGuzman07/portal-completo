from django.db import models

class Permiso(models.Model):
    id = models.BigAutoField(primary_key=True)
    codigo = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'permiso'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['codigo']

    def __str__(self):
        return f"{self.codigo} - {self.descripcion or ''}"


class Rol(models.Model):
    id = models.BigAutoField(primary_key=True)
    codigo = models.CharField(max_length=60, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)
    permisos = models.ManyToManyField(
        Permiso,
        through='RolPermiso',
        related_name='roles',
        blank=True
    )

    class Meta:
        db_table = 'rol'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['id']

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class RolPermiso(models.Model):
    id = models.BigAutoField(primary_key=True)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='rol_id', related_name='rol_permiso_rel')
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, db_column='permiso_id', related_name='permiso_rol_rel')

    class Meta:
        db_table = 'rol_permiso'
        unique_together = (('rol', 'permiso'),)
        verbose_name = 'Rol - Permiso'
        verbose_name_plural = 'Roles - Permisos'

    def __str__(self):
        return f"{self.rol.codigo} -> {self.permiso.codigo}"


class UsuarioRol(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(
        'accounts.Usuario',
        on_delete=models.CASCADE,
        db_column='usuario_id',
        related_name='usuario_rol_rel'
    )
    rol = models.ForeignKey(
        Rol,
        on_delete=models.RESTRICT,
        db_column='rol_id',
        related_name='rol_usuario_rel'
    )
    asignado_por = models.ForeignKey(
        'accounts.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        db_column='asignado_por_id',
        related_name='roles_asignados_por_mi'
    )
    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuario_rol'
        unique_together = (('usuario', 'rol'),)
        verbose_name = 'Usuario - Rol'
        verbose_name_plural = 'Usuarios - Roles'

    def __str__(self):
        return f"{self.usuario.email} -> {self.rol.codigo}"
