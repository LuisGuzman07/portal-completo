from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    UsuarioListCreateView,
    UsuarioDetailView,
    AssignRolesView
)

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),

    # Users management
    path('users/', UsuarioListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UsuarioDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/assign_roles/', AssignRolesView.as_view(), name='user-assign-roles'),
]
