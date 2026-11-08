from rest_framework.permissions import BasePermission


class CanManageMultimedia(BasePermission):
    message = 'Se requiere el rol de administrador académico para gestionar contenido multimedia.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (
                user.is_superuser
                or user.has_role('superadmin')
                or user.has_role('admin_academico')
            )
        )


def has_multimedia_admin_access(user):
    return bool(
        user and user.is_authenticated and (
            user.is_superuser
            or user.has_role('superadmin')
            or user.has_role('admin_academico')
        )
    )


def has_multimedia_review_access(user):
    return bool(
        has_multimedia_admin_access(user)
        or (user and user.is_authenticated and user.has_role('comite_academico'))
    )


def has_accredited_member_access(user):
    if has_multimedia_review_access(user):
        return True
    if not user or not user.is_authenticated:
        return False

    from apps.academics.models import Investigador, Miembro

    return bool(
        Miembro.objects.filter(usuario_id=user.id, estado='activo').exists()
        or Investigador.objects.filter(
            perfil_academico__usuario_id=user.id,
            estado='activo',
        ).exists()
    )
