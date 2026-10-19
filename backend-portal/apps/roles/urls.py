from django.urls import path
from .views import RolListCreateView, RolDetailView, PermisoListView, AssignPermissionsView

urlpatterns = [
    path('roles/', RolListCreateView.as_view(), name='role-list-create'),
    path('roles/<int:pk>/', RolDetailView.as_view(), name='role-detail'),
    path('roles/<int:pk>/permissions/', AssignPermissionsView.as_view(), name='role-assign-permissions'),
    path('permissions/', PermisoListView.as_view(), name='permission-list'),
]
