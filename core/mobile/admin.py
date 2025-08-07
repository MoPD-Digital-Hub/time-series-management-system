from django.contrib import admin
from .models import *


class MobileDahboardOverviewAdmin(admin.ModelAdmin):
    autocomplete_fields = ['indicator'] 


admin.site.register(MobileDahboardOverview, MobileDahboardOverviewAdmin)