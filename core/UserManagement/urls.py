from django.urls import path
from . import views
from .api import api_views

urlpatterns = [
    # Template views
    path('', views.user_management_dashboard, name='user_management_dashboard'),
    path('users/', views.users_list, name='users_list'),
    path('submissions/', views.submissions_list, name='submissions_list'),
    path('category-assignments/', views.category_assignments, name='category_assignments'),
    path('importer/', views.importer_dashboard, name='importer_dashboard'),
    path('add-indicator/', views.add_indicator, name='add_indicator'),
    path('login/', views.login_view, name='user_management_login'),
    path('logout/', views.logout_view, name='user_management_logout'),
    
    # API endpoints
    path('api/users/', api_views.users_list_api, name='users_list_api'),
    path('stats/api/', api_views.user_management_stats_api, name='user_management_stats_api'),
    path('api/indicator-submissions/', api_views.indicator_submissions_api, name='indicator_submissions_api'),
    path('api/data-submissions/', api_views.data_submissions_api, name='data_submissions_api'),
    path('api/category-assignments/', api_views.category_assignments_api, name='category_assignments_api'),
    path('api/recent-submissions/', api_views.recent_submissions_api, name='recent_submissions_api'),
    path('api/recent-table-data-submissions/', api_views.recent_table_data_submissions_api, name='recent_table_data_submissions_api'),
    path('api/approve-submission/', api_views.approve_submission_api, name='approve_submission_api'),
    path('api/approve-all-submissions/', api_views.approve_all_submissions_api, name='approve_all_submissions_api'),
    path('api/decline-submission/', api_views.decline_submission_api, name='decline_submission_api'),
    path('data-table-explorer/', views.data_table_explorer, name='data_table_explorer'),
    path('api/category_assignments/', api_views.category_assignments_api, name='category_assignments_api'),
    path('api/category_assignments/create/', api_views.create_category_assignment_api, name='create_category_assignment_api'),
    path('api/category_assignments/<int:pk>/update/', api_views.update_category_assignment_api, name='update_category_assignment_api'),
    path('api/category_assignments/<int:pk>/delete/', api_views.delete_category_assignment_api, name='delete_category_assignment_api'),
    path('api/unassigned_categories/', api_views.unassigned_categories_api, name='unassigned_categories_api'),
    
    # Importer API endpoints
    path('api/indicators/', api_views.indicators_list_api, name='indicators_list_api'),
    path('api/submit-indicator/', api_views.submit_indicator_api, name='submit_indicator_api'),
    path('api/submit-data/', api_views.submit_data_api, name='submit_data_api'),
    path('api/sample-template/', api_views.sample_template_api, name='sample_template_api'),
    path('api/submit-bulk-data/', api_views.submit_bulk_data_api, name='submit_bulk_data_api'),
    path('api/create-importer/', api_views.create_importer_api, name='create_importer_api'),
    path('api/users/<int:pk>/update/', api_views.update_user_api, name='update_user_api'),
    path('api/preview/', api_views.preview_data_submission_api, name='preview_data_submission_api'),
    path('api/data-submissions/<int:submission_id>/preview/', api_views.preview_existing_submission_api, name='preview_existing_data_submission_api'),
    path('data-submissions/<int:submission_id>/preview/', views.data_submission_preview, name='data_submission_preview'),


    # Admin views
    path('sidebar/annual/', api_views.AnnualSidebarList.as_view()),
    path('sidebar/quarterly/', api_views.QuarterlySidebarList.as_view()),
    path('sidebar/monthly/', api_views.MonthlySidebarList.as_view()),
    path('sidebar/weekly/', api_views.WeeklySidebarList.as_view()),
    path('sidebar/daily/', api_views.DailySidebarList.as_view()),

    path('review-table-data/', views.review_table_data, name='review_table_data'),
    path('api/review-pending-data/', api_views.review_pending_data, name='review_pending_data'),
    path('api/approve-pending-data/', api_views.approve_pending_data, name='approve_pending_data'),
    path('api/decline-pending-data/', api_views.decline_pending_data, name='decline_pending_data'),
    path('api/approve-all-table-data/', api_views.approve_all_table_data_api, name='approve_all_table_data'),
]