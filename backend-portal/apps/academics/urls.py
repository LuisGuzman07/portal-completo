from django.urls import path

from .views import (
    AreaTematicaListCreateView,
    AreaTematicaDetailView,
    AreasTematicasPublicasView,
    InvestigadorDetailView,
    InvestigadorListCreateView,
    InvestigadorPublicoDetalleView,
    InvestigadoresPublicosView,
    MiPerfilAcademicoView,
    MiembroListCreateView,
    MiembroDetailView,
    CategoriasMiembroListCreateView,
    CategoriaMiembroDetailView,
    UsuariosDisponiblesMiembroView,
    PerfilesDisponiblesInvestigadorView,
    SolicitarDirectorioInvestigadorView,
)

urlpatterns = [
    path('academic/members/', MiembroListCreateView.as_view(), name='member-list-create'),
    path('academic/members/available-users/', UsuariosDisponiblesMiembroView.as_view(), name='member-available-users'),
    path('academic/members/<int:pk>/', MiembroDetailView.as_view(), name='member-detail'),
    path('academic/member-categories/', CategoriasMiembroListCreateView.as_view(), name='member-category-list-create'),
    path('academic/member-categories/<int:pk>/', CategoriaMiembroDetailView.as_view(), name='member-category-detail'),
    path('academic/public/investigators/', InvestigadoresPublicosView.as_view(), name='public-investigator-list'),
    path('academic/public/investigators/<int:pk>/', InvestigadorPublicoDetalleView.as_view(), name='public-investigator-detail'),
    path('academic/public/areas/', AreasTematicasPublicasView.as_view(), name='public-academic-areas'),
    path('academic/profile/me/', MiPerfilAcademicoView.as_view(), name='my-academic-profile'),
    path('academic/profile/me/request-investigator/', SolicitarDirectorioInvestigadorView.as_view(), name='request-investigator-directory'),
    path('academic/investigators/', InvestigadorListCreateView.as_view(), name='investigator-list-create'),
    path('academic/investigators/available-profiles/', PerfilesDisponiblesInvestigadorView.as_view(), name='investigator-available-profiles'),
    path('academic/investigators/<int:pk>/', InvestigadorDetailView.as_view(), name='investigator-detail'),
    path('academic/areas/', AreaTematicaListCreateView.as_view(), name='academic-area-list-create'),
    path('academic/areas/<int:pk>/', AreaTematicaDetailView.as_view(), name='academic-area-detail'),
]
