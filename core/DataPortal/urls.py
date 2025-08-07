from django.urls import path
from . import views
from .api import views as api

urlpatterns = [
    path('', views.index, name='data_portal'),
    path('detail-indicator/<str:id>/', views.detail_indicator, name='detail_indicator'),


    #api
    path('api/topic-lists', api.topic_lists),
    path('api/category-with-indicator/<str:id>', api.category_with_indicator),
    path('api/indicator-value/<str:id>', api.indicator_value),
    path('api/data-points-last-five/', api.data_points),
]