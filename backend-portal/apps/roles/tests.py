from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Usuario
from apps.roles.models import Rol, UsuarioRol, Permiso, RolPermiso

class RolesCU05Tests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.rol_super, _ = Rol.objects.get_or_create(codigo='superadmin', defaults={'nombre': 'Superadministrador'})
        self.rol_acad, _ = Rol.objects.get_or_create(codigo='admin_academico', defaults={'nombre': 'Admin Académico'})
        self.rol_user, _ = Rol.objects.get_or_create(codigo='usuario', defaults={'nombre': 'Usuario Registrado'})

        self.perm_listar, _ = Permiso.objects.get_or_create(codigo='usuarios.listar', defaults={'descripcion': 'Listar usuarios'})
        self.perm_roles, _ = Permiso.objects.get_or_create(codigo='roles.listar', defaults={'descripcion': 'Listar roles'})

        # Superadmin user
        self.superadmin = Usuario.objects.create_user(
            email='superadmin@aboccrim.test',
            password='TestPassword123!',
            nombres='Carlos',
            apellidos='Mendoza'
        )
        UsuarioRol.objects.create(usuario=self.superadmin, rol=self.rol_super)

        # Normal user
        self.user = Usuario.objects.create_user(
            email='usuario@aboccrim.test',
            password='TestPassword123!',
            nombres='Andres',
            apellidos='Vargas'
        )
        UsuarioRol.objects.create(usuario=self.user, rol=self.rol_user)

    def test_cu05_list_roles_as_superadmin(self):
        """CU05: Superadmin puede listar roles y permisos"""
        self.client.force_authenticate(user=self.superadmin)
        res = self.client.get('/api/v1/roles/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.data) >= 3)

    def test_cu05_list_roles_forbidden_for_normal_user(self):
        """CU05: Usuario regular sin permisos no puede acceder al listado de roles"""
        self.client.force_authenticate(user=self.user)
        res = self.client.get('/api/v1/roles/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_cu05_assign_permissions_to_role(self):
        """CU05: Asignar permisos a un rol de forma exitosa"""
        self.client.force_authenticate(user=self.superadmin)
        payload = {
            'permisos_codigos': ['usuarios.listar', 'roles.listar']
        }
        res = self.client.post(f'/api/v1/roles/{self.rol_acad.id}/permissions/', payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(RolPermiso.objects.filter(rol=self.rol_acad, permiso=self.perm_listar).exists())

    def test_cu05_assign_roles_to_user(self):
        """CU05: Asignar y revocar roles a un usuario"""
        self.client.force_authenticate(user=self.superadmin)
        payload = {
            'roles_codigos': ['admin_academico', 'usuario']
        }
        res = self.client.post(f'/api/v1/users/{self.user.id}/assign_roles/', payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.has_role('admin_academico'))
