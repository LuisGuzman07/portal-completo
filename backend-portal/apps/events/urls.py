from django.urls import path

from .views import EventoAdminDetailView, EventoAdminListCreateView, EventoPublicoListView

urlpatterns = [
    path('events/public/', EventoPublicoListView.as_view(), name='public-events'),
    path('events/', EventoAdminListCreateView.as_view(), name='event-list-create'),
    path('events/<int:pk>/', EventoAdminDetailView.as_view(), name='event-detail'),
]
