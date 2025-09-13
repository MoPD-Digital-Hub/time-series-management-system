from django.urls import path
from .api.view import *
from .api.video_api import *
from .views import *

from UserManagement.views import login_view , logout_view , reset_password ,   user_change_password

from django.contrib.auth import views as auth_views
from .forms import UserPasswordResetForm, UserPasswordConfirmForm

urlpatterns = [
    path('indicator-lists/<str:id>', get_indicators),

    ###Auth
    path('login/',login_view,name="login"),
    path('logout/',logout_view,name="logout"),
    
    
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

]