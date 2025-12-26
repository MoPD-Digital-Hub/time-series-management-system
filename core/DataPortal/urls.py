from django.urls import path
from . import views
from .api import views as api

urlpatterns = [

    # ================= API (FIRST) =================
    path('api/topic-lists/', api.topic_lists),
    path('api/category-with-indicator/<int:id>/', api.category_with_indicator),
    path('api/indicator-value/<int:id>/', api.indicator_value),
    path('api/data-points-last-five/', api.data_points),

    # ================= PAGES =======================
    path('', views.index, name='data_portal'),
    path('detail-indicator/<int:id>/', views.detail_indicator),
]
