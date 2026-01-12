from django.urls import path
from .api.view import *
from .api.video_api import *
from .views import *
from . import views
from .api import api_views

from django.contrib.auth import views as auth_views
from .forms import UserPasswordResetForm, UserPasswordConfirmForm

urlpatterns = [
    path('indicator-lists/<str:id>', get_indicators),

    ###Auth
    # path('login/',login_view,name="login"),
    # path('logout/',logout_view,name="logout"),
    
        ###Rest
    path('password_reset/', auth_views.PasswordResetView.as_view(template_name='auth/reset_password.html', form_class=UserPasswordResetForm), name='password_reset'),
    path('password_reset_done/', auth_views.PasswordResetDoneView.as_view(template_name='auth/password_reset_done.html'), name='password_reset_done'),
    path(r'reset/<uidb64>/<token>/',auth_views.PasswordResetConfirmView.as_view(template_name="auth/password_reset_confirm.html",form_class=UserPasswordConfirmForm), name='password_reset_confirm'),
    path('password_reset_complete/', auth_views.PasswordResetCompleteView.as_view(template_name="auth/password_reset_complete.html"), name='password_reset_complete'),


    ###Api
    path('topic_list/', topic_lists),
    path('initiatives/', initiative_lists),
    path('count_indicator_by_category/<str:id>/', count_indicator_by_category),
    path('filter_by_category_with_value/', filter_by_category_with_value),
    

    path('indicator-lists/<str:id>/', get_indicators),
    path('filter_topic_and_category/', filter_topic_and_category),
    path('filter_indicator_by_category/<str:id>/', filter_indicator_by_category),

    path('filter_indicator_by_category/<str:id>/', filter_indicator_by_category),
    path('filter_indicator_annual_value/', filter_indicator_annual_value),
    path('filter_indicator_detail_annual_value/<str:id>/', detail_indicator_with_children),
    path('indicator_graph/<str:id>/', indicator_graph),


    path('recent_data_for_topic/<str:id>', recent_data_for_topic),

    path('api/video_api' , video_api),

    path('api/search-indicator' , search_category_indicator),

# my Urls
    path('', views.index, name='dashboard_index'),
    path('Welcome/', views.Welcome, name='Welcome'),
    path('data_view/<str:cat_title>/', views.data_view, name='data_view'),
    path('data-explorer/', views.data_explorer, name='data_explorer'),
    path('api/topic/<int:topic_id>/', api_views.topic_categories_api, name='topic_categories_api'),
    path('indicator/<str:indicator_id>/', views.indicator_view, name='indicator_view'),
    path('api/indicator/<str:indicator_title>/', api_views.indicator_data_api, name='indicator_data_api'),
    path('api/indicator-id/<int:indicator_id>/', api_views.indicator_data_by_id_api, name='indicator_data_by_id_api'),
    path('api/indicators-bulk/', api_views.indicators_bulk_api, name='indicators_bulk_api'),
    path('api/kpi-records/weekly/', api_views.kpi_weekly_bulk_api, name='kpi_weekly_bulk_api'),
    path('api/kpi-records/daily/', api_views.kpi_daily_bulk_api, name='kpi_daily_bulk_api'),
    path('api/acknowledge-seen/', api_views.acknowledge_seen_api, name='acknowledge_seen_api'),
    path('api/dashboard-counts/', api_views.dashboard_counts_api, name='dashboard_counts_api'),
    path('topics/', views.topics_list, name='topics_list'),
    path('categories/', views.categories_list, name='categories_list'),
    path('indicators/', views.indicators_list, name='indicators_list'),
    path('api/indicators-per-topic/', api_views.indicators_per_topic_api, name='indicators-per-topic-api'),
    path('api/trending-indicators/', api_views.trending_indicator_list_create, name='trending-indicator-list-create'),
    path('api/trending-indicators/<int:pk>/', api_views.trending_indicator_detail, name='trending-indicator-detail'),
    path('api/indicators-per-category/', api_views.indicators_per_category_api, name='indicators-per-category-api'),
]