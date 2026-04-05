from django.urls import path
from .views import *

urlpatterns = [
    path('high-frequency/', high_frequency, name='api-mobile-high-frequency'),
    path('kpis/', ai_indicator_meta_data, name='api-ai-kpis'),
    path('topics-tree/', topic_category_indicator_tree, name='api-mobile-topics-tree'),
]
