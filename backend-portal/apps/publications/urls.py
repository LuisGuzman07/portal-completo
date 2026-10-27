from django.urls import path

from .views import (
    CategoriaListCreateView,
    DocumentoDigitalDetailView,
    DocumentoDigitalDownloadView,
    DocumentoDigitalListCreateView,
    DocumentoDigitalReplaceView,
    InvestigadoresDisponiblesAutoresView,
    PalabraClaveListView,
    PublicacionDetailView,
    PublicacionListCreateView,
    RepositorioDetailView,
    RepositorioListView,
    RevisionPublicacionActionView,
    RevisionPublicacionListView,
    TipoDocumentoListView,
    TipoPublicacionListView,
)

urlpatterns = [
    # Catálogos de Clasificación (CU15)
    path('publications/types/', TipoPublicacionListView.as_view(), name='publication-types'),
    path('publications/document-types/', TipoDocumentoListView.as_view(), name='publication-document-types'),
    path('publications/categories/', CategoriaListCreateView.as_view(), name='publication-categories'),
    path('publications/keywords/', PalabraClaveListView.as_view(), name='publication-keywords'),
    path('publications/investigators/', InvestigadoresDisponiblesAutoresView.as_view(), name='publication-available-investigators'),

    # Publicaciones Científicas (CU10)
    path('publications/', PublicacionListCreateView.as_view(), name='publication-list-create'),
    path('publications/<int:pk>/', PublicacionDetailView.as_view(), name='publication-detail'),

    # Revisión Académica y Dictamen (CU11)
    path('publications/review-queue/', RevisionPublicacionListView.as_view(), name='publication-review-queue'),
    path('publications/<int:pk>/review/', RevisionPublicacionActionView.as_view(), name='publication-review-action'),

    # Repositorio Académico (CU12, CU16)
    path('repository/', RepositorioListView.as_view(), name='repository-list'),
    path('repository/<int:pk>/', RepositorioDetailView.as_view(), name='repository-detail'),

    # Documentos Digitales y Descarga Segura (CU14, CU13)
    path('publications/<int:pub_id>/documents/', DocumentoDigitalListCreateView.as_view(), name='publication-documents-list-create'),
    path('publications/documents/<int:doc_id>/', DocumentoDigitalDetailView.as_view(), name='publication-document-detail'),
    path('publications/documents/<int:doc_id>/replace/', DocumentoDigitalReplaceView.as_view(), name='publication-document-replace'),
    path('publications/documents/<int:doc_id>/download/', DocumentoDigitalDownloadView.as_view(), name='publication-document-download'),
]
