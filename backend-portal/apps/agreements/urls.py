from django.urls import path

from .views import (
    ConvenioAdminDetailView,
    ConvenioAdminListCreateView,
    ConvenioDocumentoView,
    ConvenioPublicoListView,
    InstitucionAdminDetailView,
    InstitucionAdminListCreateView,
)

urlpatterns = [
    path('convenios/public/', ConvenioPublicoListView.as_view(), name='convenios-public-list'),
    path('convenios/', ConvenioAdminListCreateView.as_view(), name='convenios-list-create'),
    path('convenios/<int:pk>/', ConvenioAdminDetailView.as_view(), name='convenios-detail'),
    path('convenios/<int:pk>/documento/', ConvenioDocumentoView.as_view(), name='agreement-document'),
    path('instituciones/', InstitucionAdminListCreateView.as_view(), name='instituciones-list-create'),
    path('instituciones/<int:pk>/', InstitucionAdminDetailView.as_view(), name='instituciones-detail'),
]
