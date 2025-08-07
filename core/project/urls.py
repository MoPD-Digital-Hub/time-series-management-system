from django.contrib import admin
from django.urls import path,include

from django.conf.urls.static import static
from django.conf import settings



urlpatterns = [
    path('admin/', admin.site.urls),
    path('',include('Base.urls')),
    path('user-admin/',include('UserAdmin.urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('data-portal/',include('DataPortal.urls')),
    path('dashboard/',include('DashBoard.urls')),
    path('api/mobile/', include('mobile.urls')),
]

urlpatterns += static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)