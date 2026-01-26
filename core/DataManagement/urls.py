from django.urls import path
from .views import *
from .api.views import *


urlpatterns = [
    path('' , dashboard_index , name='dashboard_index'),
    path('topics', topics, name='data_topics'),
    path('categories/', categories, name='data_categories'),
    path('indicators/', indicators, name='data_indicators'),
    path('data_entry/', data_entry, name='data_entry'),


    path('indicators/add/', add_indicator_page, name='add_indicator_page'),
    path('indicators/add/submit/', add_indicator, name='add_indicator'),

    # Edit indicator page & form submission
    path('indicators/<int:pk>/edit/', edit_indicator_page, name='edit_indicator_page'),
    path('indicators/<int:pk>/edit/submit/', edit_indicator, name='edit_indicator'),

    ########## Verification #######
    path("verification/", verification_dashboard, name="verification_dashboard"),
    path("verification/<str:model>/", bulk_verify, name="bulk_verify"),


    ###### API ########
    path('api/save-indicator-data-bulk/', save_indicator_data_bulk, name='save_indicator_data_bulk'),



    path('documents/', data_documents, name='data_documents'),
    path('documents/add/', add_document, name='add_document'),
    path('documents/edit/<int:doc_id>/', edit_document, name='edit_document'),


    ######## User Management Dashboard ##########
    path('user-management/', user_management_dashboard, name='user_management_dashboard'),
    path('management/add/', manage_user_form, name='user_add'),
    path('management/edit/<int:user_id>/', manage_user_form, name='user_edit'),
]
