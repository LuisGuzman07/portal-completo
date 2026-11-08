from django.urls import path

from .views import (
    RecursoMultimediaAdminDetailView,
    RecursoMultimediaAdminListCreateView,
    RecursoMultimediaDescargaView,
    RecursoMultimediaPublicoListView,
)

urlpatterns = [
    path('multimedia/public/', RecursoMultimediaPublicoListView.as_view(), name='multimedia-public-list'),
    path('multimedia/', RecursoMultimediaAdminListCreateView.as_view(), name='multimedia-list-create'),
    path('multimedia/<int:pk>/', RecursoMultimediaAdminDetailView.as_view(), name='multimedia-detail'),
    path('multimedia/<int:pk>/download/', RecursoMultimediaDescargaView.as_view(), name='multimedia-download'),
]
