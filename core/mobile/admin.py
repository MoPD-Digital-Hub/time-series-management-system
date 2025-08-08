from django.contrib import admin
from import_export import resources
from import_export.admin import ImportExportModelAdmin
from .models import MobileDahboardOverview


class MobileDahboardOverviewResource(resources.ModelResource):
    class Meta:
        model = MobileDahboardOverview
        fields = '__all__'  # Export all fields
        export_order = ('id',)  # Optional: set export order


class MobileDahboardOverviewAdmin(ImportExportModelAdmin):
    resource_class = MobileDahboardOverviewResource
    autocomplete_fields = ['indicator']


admin.site.register(MobileDahboardOverview, MobileDahboardOverviewAdmin)