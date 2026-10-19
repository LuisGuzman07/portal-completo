from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Permite acceso únicamente a Superadministradores autenticados.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.has_role('superadmin')
        )


class CanManageUsers(permissions.BasePermission):
    """
    Verifica que el usuario tenga permiso de gestión de usuarios o sea superadmin.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.has_role('superadmin'):
            return True
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_permission('usuarios.listar')
        return request.user.has_permission('usuarios.editar') or request.user.has_permission('usuarios.crear')


class CanManageRoles(permissions.BasePermission):
    """
    Verifica que el usuario tenga permiso de gestión de roles o sea superadmin.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.has_role('superadmin'):
            return True
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_permission('roles.listar')
        return request.user.has_permission('roles.administrar_permisos')
