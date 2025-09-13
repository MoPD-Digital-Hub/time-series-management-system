from django.urls import path
from mobile.api import api

urlpatterns = [
    path('dashboard/overview/', api.dashboard_overview),
    path('trending/', api.trending),
    path('topic-list/' , api.mobile_topic),
    path('initiatives/' , api.initiatives),
    path('topic-detail/<str:id>/' , api.mobile_topic_detail),
    path('indicator-detail/<str:id>/' , api.mobile_indicator_detail),
    path('indicator-performance-detail/<str:id>/' , api.indicator_performance_detail),
    path('project-list/' , api.mobile_projects),
    path('initiative-list/' , api.mobile_initiatives),
    path('project-detail/<str:id>/' , api.mobile_project_detail),
    path('search-auto-complete/<str:id>/', api.mobile_topic_detail_search, name='mobile_topic_detail_search'),
    path('general_search/' , api.general_search),
    path('month-lists/' , api.month_lists),
    path('year-lists/' , api.year_lists)
]
