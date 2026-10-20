from rest_framework.permissions import BasePermission


class CanManageInvestigators(BasePermission):
    message = 'Se requiere el rol de administrador académico para gestionar investigadores.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.has_role('superadmin') or user.has_role('admin_academico'))
        )


class CanManageMembers(CanManageInvestigators):
    message = 'Se requiere el rol de administrador académico para gestionar miembros.'
