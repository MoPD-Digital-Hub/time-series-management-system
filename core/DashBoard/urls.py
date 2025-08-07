from django.urls import path
from . import views
from .api import views as api

urlpatterns = [
    path('', views.index, name='dashboard_index'),
    path('dashboard_detail/<str:id>', views.dashboard_detail, name='dashboard_detail'),
    ###Api
    path('components/<str:id>', api.components),
]