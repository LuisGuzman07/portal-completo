from rest_framework.permissions import BasePermission


class CanEvaluateIncorporation(BasePermission):
    message = 'Solo el Comité Académico autorizado puede evaluar solicitudes de incorporación.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (
                user.is_superuser or user.has_role('superadmin') or user.has_role('comite_academico')
            )
        )


def can_evaluate_incorporation(user):
    return bool(
        user and user.is_authenticated and (
            user.is_superuser or user.has_role('superadmin') or user.has_role('comite_academico')
        )
    )
