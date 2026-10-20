from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        'status': 'healthy',
        'service': 'ABOCCRIM Portal Backend API',
        'version': '1.0.0'
    })

urlpatterns = [
    path('api/v1/health/', health_check, name='health-check'),
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.roles.urls')),
    path('api/v1/', include('apps.audit.urls')),
    path('api/v1/', include('apps.academics.urls')),
]
