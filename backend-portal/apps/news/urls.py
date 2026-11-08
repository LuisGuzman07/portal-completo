from django.urls import path

from .views import NoticiaAdminDetailView, NoticiaAdminListCreateView, NoticiaPublicaListView

urlpatterns = [
    path('news/public/', NoticiaPublicaListView.as_view(), name='public-news'),
    path('news/', NoticiaAdminListCreateView.as_view(), name='news-list-create'),
    path('news/<int:pk>/', NoticiaAdminDetailView.as_view(), name='news-detail'),
]
