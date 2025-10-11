from django.contrib import admin
from import_export import resources
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import *



class MobileDahboardOverviewResource(resources.ModelResource):
    class Meta:
        model = MobileDahboardOverview
        

class MobileDahboardOverviewAdmin(ImportExportModelAdmin):
    resource_class = MobileDahboardOverviewResource
    autocomplete_fields = ['indicator']
    list_display =('id', 'title' ,'rank')
    list_editable = ('rank',)

    def title(self, obj):
        return obj.indicator.title_ENG  
    title.short_description = "Indicator Title (ENG)"


admin.site.register(MobileDahboardOverview, MobileDahboardOverviewAdmin)