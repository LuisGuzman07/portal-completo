import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.accounts.models import Usuario
from apps.roles.models import Rol, Permiso, RolPermiso, UsuarioRol

class Command(BaseCommand):
    help = 'Carga roles, permisos y usuarios de prueba para ABOCCRIM (idempotente)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("=== Iniciando Seed Idempotente ABOCCRIM ==="))

        demo_password = getattr(settings, 'DEMO_USER_PASSWORD', 'Aboccrim2025!')

        # 1. Permisos
        permisos_data = [
            ('usuarios.listar', 'Listar y consultar usuarios del sistema'),
            ('usuarios.crear', 'Crear nuevos usuarios desde el panel administrativo'),
            ('usuarios.editar', 'Modificar datos de usuarios existentes'),
            ('usuarios.activar_desactivar', 'Activar o desactivar cuentas de usuario'),
            ('usuarios.asignar_roles', 'Asignar y revocar roles a los usuarios'),
            ('roles.listar', 'Listar y consultar roles y sus permisos'),
            ('roles.administrar_permisos', 'Asignar o remover permisos a roles'),
            ('auditoria.listar', 'Consultar y filtrar la bitácora de auditoría'),
            ('perfil.ver', 'Consultar y actualizar el perfil propio'),
            ('repositorio.consultar', 'Consultar publicaciones y documentos del repositorio'),
        ]

        permisos_objs = {}
        for codigo, desc in permisos_data:
            perm, created = Permiso.objects.get_or_create(
                codigo=codigo,
                defaults={'descripcion': desc}
            )
            permisos_objs[codigo] = perm
            if created:
                self.stdout.write(f"  [+] Permiso creado: {codigo}")

        # 2. Roles
        roles_data = [
            ('superadmin', 'Superadministrador', 'Administración técnica integral del portal'),
            ('admin_academico', 'Administrador Académico', 'Gestión académica e institucional de ABOCCRIM'),
            ('investigador', 'Investigador', 'Investigador acreditado con perfil y producción científica'),
            ('miembro', 'Miembro ABOCCRIM', 'Miembro colegiado con acceso a recursos institucionales'),
            ('comite_academico', 'Comité Académico', 'Evaluación académica y arbitraje de postulaciones'),
            ('comite_etica', 'Comité de Ética', 'Dictámenes y supervisión ética'),
            ('usuario', 'Usuario Registrado', 'Cuenta básica registrada sin acreditación institucional'),
        ]

        roles_objs = {}
        for codigo, nombre, desc in roles_data:
            rol, created = Rol.objects.get_or_create(
                codigo=codigo,
                defaults={'nombre': nombre, 'descripcion': desc}
            )
            roles_objs[codigo] = rol
            if created:
                self.stdout.write(f"  [+] Rol creado: {codigo} ({nombre})")

        # 3. Asignación de permisos a roles
        rol_permisos_map = {
            'superadmin': list(permisos_objs.keys()),
            'admin_academico': ['usuarios.listar', 'roles.listar', 'perfil.ver', 'repositorio.consultar'],
            'investigador': ['perfil.ver', 'repositorio.consultar'],
            'miembro': ['perfil.ver', 'repositorio.consultar'],
            'comite_academico': ['perfil.ver', 'repositorio.consultar'],
            'comite_etica': ['perfil.ver', 'repositorio.consultar'],
            'usuario': ['perfil.ver', 'repositorio.consultar'],
        }

        for rol_cod, perm_list in rol_permisos_map.items():
            rol = roles_objs[rol_cod]
            for p_cod in perm_list:
                perm = permisos_objs[p_cod]
                RolPermiso.objects.get_or_create(rol=rol, permiso=perm)

        # 4. Usuarios Demo
        usuarios_data = [
            {
                'email': 'superadmin@aboccrim.test',
                'nombres': 'Carlos Roberto',
                'apellidos': 'Mendoza Flores',
                'rol': 'superadmin'
            },
            {
                'email': 'academico@aboccrim.test',
                'nombres': 'Jimena',
                'apellidos': 'Claure Soria',
                'rol': 'admin_academico'
            },
            {
                'email': 'investigador@aboccrim.test',
                'nombres': 'Fernando',
                'apellidos': 'Daza Mercado',
                'rol': 'investigador'
            },
            {
                'email': 'miembro@aboccrim.test',
                'nombres': 'Valeria',
                'apellidos': 'Paz Soldán',
                'rol': 'miembro'
            },
            {
                'email': 'comite.academico@aboccrim.test',
                'nombres': 'Gonzalo',
                'apellidos': 'Torrico Morales',
                'rol': 'comite_academico'
            },
            {
                'email': 'comite.etica@aboccrim.test',
                'nombres': 'Mariana',
                'apellidos': 'Ríos Quiroga',
                'rol': 'comite_etica'
            },
            {
                'email': 'usuario@aboccrim.test',
                'nombres': 'Andrés',
                'apellidos': 'Vargas Silva',
                'rol': 'usuario'
            },
        ]

        for u_data in usuarios_data:
            email = u_data['email']
            user, created = Usuario.objects.get_or_create(
                email=email,
                defaults={
                    'nombres': u_data['nombres'],
                    'apellidos': u_data['apellidos'],
                    'activo': True
                }
            )
            # Siempre asegura contraseña válida
            user.set_password(demo_password)
            user.activo = True
            user.save()

            rol = roles_objs[u_data['rol']]
            UsuarioRol.objects.get_or_create(usuario=user, rol=rol)

            status_str = "Creado" if created else "Actualizado"
            self.stdout.write(f"  [✓] {status_str}: {email} -> Rol: {rol.codigo} (Password: {demo_password})")

        self.stdout.write(self.style.SUCCESS("=== Seed de demostración completado con éxito ==="))
