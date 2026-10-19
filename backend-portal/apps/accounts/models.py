from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, nombres='', apellidos='', **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            nombres=nombres,
            apellidos=apellidos,
            activo=extra_fields.get('activo', True)
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, nombres='Super', apellidos='Admin', **extra_fields):
        user = self.create_user(
            email=email,
            password=password,
            nombres=nombres,
            apellidos=apellidos,
            activo=True
        )
        # Asignar rol superadmin si existe
        from apps.roles.models import Rol, UsuarioRol
        super_rol, _ = Rol.objects.get_or_create(
            codigo='superadmin',
            defaults={'nombre': 'Superadministrador', 'descripcion': 'Control total del sistema'}
        )
        UsuarioRol.objects.get_or_create(usuario=user, rol=super_rol)
        return user


class Usuario(AbstractBaseUser):
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(max_length=254, unique=True, verbose_name='Correo Electrónico')
    password = models.CharField(max_length=255, db_column='password_hash')
    nombres = models.CharField(max_length=120)
    apellidos = models.CharField(max_length=120)
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True, db_column='ultimo_acceso')

    roles = models.ManyToManyField(
        'roles.Rol',
        through='roles.UsuarioRol',
        through_fields=('usuario', 'rol'),
        related_name='usuarios',
        blank=True
    )

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombres', 'apellidos']

    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-fecha_registro']

    @property
    def is_active(self):
        return self.activo

    @is_active.setter
    def is_active(self, value):
        self.activo = bool(value)

    @property
    def is_staff(self):
        return self.roles.filter(codigo__in=['superadmin', 'admin_academico']).exists()

    @property
    def is_superuser(self):
        return self.roles.filter(codigo='superadmin').exists()

    def has_role(self, role_code):
        return self.roles.filter(codigo=role_code).exists()

    def has_permission(self, perm_code):
        if self.is_superuser:
            return True
        return self.roles.filter(permisos__codigo=perm_code).exists()

    def has_perm(self, perm, obj=None):
        return self.has_permission(perm)

    def has_perms(self, perm_list, obj=None):
        return all(self.has_permission(p) for p in perm_list)

    def has_module_perms(self, app_label):
        if self.is_superuser:
            return True
        return self.roles.filter(permisos__codigo__startswith=f"{app_label}.").exists()

    def get_full_name(self):
        return f"{self.nombres} {self.apellidos}".strip()

    def get_short_name(self):
        return self.nombres

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"
