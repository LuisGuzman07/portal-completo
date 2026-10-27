from rest_framework.permissions import BasePermission


class CanRegisterPublication(BasePermission):
    message = 'Debe iniciar sesión para registrar una publicación académica.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class CanManagePublication(BasePermission):
    message = 'No tiene permisos para modificar esta publicación.'

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.has_role('superadmin') or user.has_role('admin_academico'):
            return True
        return obj.registrada_por_id == user.id


class CanManageDocument(BasePermission):
    message = 'No tiene permisos para administrar los documentos de esta publicación.'

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.has_role('superadmin') or user.has_role('admin_academico'):
            return True
        # obj can be a DocumentoDigital or Publicacion
        pub = getattr(obj, 'publicacion', obj)
        return pub.registrada_por_id == user.id


class CanReviewPublication(BasePermission):
    message = 'Se requieren privilegios de comité académico o administración para evaluar publicaciones.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.has_role('superadmin')
                or user.has_role('admin_academico')
                or user.has_role('comite_academico')
            )
        )
