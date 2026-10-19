from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Usuario
from apps.roles.models import Rol, UsuarioRol, Permiso

class AccountsCU01toCU04Tests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create roles
        self.rol_super, _ = Rol.objects.get_or_create(codigo='superadmin', defaults={'nombre': 'Superadministrador'})
        self.rol_user, _ = Rol.objects.get_or_create(codigo='usuario', defaults={'nombre': 'Usuario Registrado'})
        self.rol_acad, _ = Rol.objects.get_or_create(codigo='admin_academico', defaults={'nombre': 'Admin Académico'})

        # Create permissions
        self.perm_list, _ = Permiso.objects.get_or_create(codigo='usuarios.listar', defaults={'descripcion': 'Listar usuarios'})

        # Superadmin user
        self.superadmin = Usuario.objects.create_user(
            email='superadmin@aboccrim.test',
            password='TestPassword123!',
            nombres='Carlos',
            apellidos='Mendoza'
        )
        UsuarioRol.objects.create(usuario=self.superadmin, rol=self.rol_super)

        # Standard user
        self.user = Usuario.objects.create_user(
            email='usuario@aboccrim.test',
            password='TestPassword123!',
            nombres='Andres',
            apellidos='Vargas'
        )
        UsuarioRol.objects.create(usuario=self.user, rol=self.rol_user)

    def test_cu01_register_account_success(self):
        """CU01: Registro exitoso asigna rol base de usuario"""
        payload = {
            'email': 'nuevo@aboccrim.test',
            'nombres': 'Nuevo',
            'apellidos': 'Postulante',
            'password': 'StrongPassword2025!',
            'password_confirm': 'StrongPassword2025!'
        }
        response = self.client.post('/api/v1/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuario.objects.filter(email='nuevo@aboccrim.test').exists())
        new_u = Usuario.objects.get(email='nuevo@aboccrim.test')
        self.assertTrue(new_u.has_role('usuario'))
        self.assertFalse(new_u.has_role('superadmin'))

    def test_cu01_register_duplicate_email_fails(self):
        """CU01: No se permite registrar un correo ya existente"""
        payload = {
            'email': 'usuario@aboccrim.test',
            'nombres': 'Clon',
            'apellidos': 'Clon',
            'password': 'StrongPassword2025!',
            'password_confirm': 'StrongPassword2025!'
        }
        response = self.client.post('/api/v1/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cu02_login_success(self):
        """CU02: Inicio de sesión válido retorna tokens JWT"""
        response = self.client.post('/api/v1/auth/login/', {
            'email': 'superadmin@aboccrim.test',
            'password': 'TestPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])

    def test_cu02_login_invalid_password_fails(self):
        """CU02: Contraseña errónea es rechazada"""
        response = self.client.post('/api/v1/auth/login/', {
            'email': 'superadmin@aboccrim.test',
            'password': 'WrongPassword!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cu02_login_inactive_user_fails(self):
        """CU02: Usuario desactivado no puede iniciar sesión"""
        self.user.activo = False
        self.user.save()

        response = self.client.post('/api/v1/auth/login/', {
            'email': 'usuario@aboccrim.test',
            'password': 'TestPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cu03_logout_success(self):
        """CU03: Cierre de sesión válido"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/v1/auth/logout/', {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cu04_list_users_as_superadmin(self):
        """CU04: Superadmin puede listar usuarios"""
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get('/api/v1/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cu04_list_users_unauthorized_for_standard_user(self):
        """CU04: Usuario común sin permiso es bloqueado en listado"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cu04_safeguard_cannot_deactivate_self(self):
        """CU04 Salvaguarda: El superadministrador no puede desactivarse a sí mismo"""
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.patch(f'/api/v1/users/{self.superadmin.id}/', {'activo': False})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.superadmin.refresh_from_db()
        self.assertTrue(self.superadmin.activo)

    def test_cu04_safeguard_cannot_deactivate_last_active_superadmin(self):
        """CU04 Salvaguarda: No se puede desactivar al único superadmin activo"""
        # Crear un admin secundario para probar la acción
        admin_sec = Usuario.objects.create_user(
            email='admin2@aboccrim.test',
            password='TestPassword123!',
            nombres='Admin',
            apellidos='Dos'
        )
        UsuarioRol.objects.create(usuario=admin_sec, rol=self.rol_super)
        self.client.force_authenticate(user=admin_sec)

        # Ahora intentar desactivar al primer superadmin: debe permitirse porque queda admin_sec
        res1 = self.client.patch(f'/api/v1/users/{self.superadmin.id}/', {'activo': False})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Pero ahora admin_sec es el ÚLTIMO activo: intentar desactivarlo debe ser rechazado
        res2 = self.client.patch(f'/api/v1/users/{admin_sec.id}/', {'activo': False})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
