from rest_framework.permissions import BasePermission


class CanManageNews(BasePermission):
    message = 'Se requiere el rol de administrador académico para gestionar noticias institucionales.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (
                user.is_superuser
                or user.has_role('superadmin')
                or user.has_role('admin_academico')
            )
        )
