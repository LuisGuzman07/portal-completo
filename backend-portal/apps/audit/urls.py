from django.urls import path
from .views import RegistroAuditoriaListView

urlpatterns = [
    path('audit/', RegistroAuditoriaListView.as_view(), name='audit-list'),
]
