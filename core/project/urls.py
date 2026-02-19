from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static


def root_redirect(request):
    return redirect('/data-management/')


urlpatterns = [
    path('', root_redirect),               
    path('admin/', admin.site.urls),
    path('', include('Base.urls')),         
    path('user-admin/', include('UserAdmin.urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('data-portal/', include('DataPortal.urls')),
    path('dashboard/', include('DashBoard.urls')),
    path('api/mobile/', include('mobile.urls')),
    path('user-management/', include('UserManagement.urls')),
    path('data-management/', include('DataManagement.urls')),
    path('oidc/', include('mozilla_django_oidc.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
