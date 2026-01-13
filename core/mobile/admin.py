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


@admin.register(HighFrequency)
class HighFrequencyAdmin(admin.ModelAdmin):
    list_display = (
        'indicator',
        'chart_type',
        'row',
        'width',
        'include_children',
        'year',
        'quarter',
    )

    list_filter = (
        'row',
        'chart_type',
        'include_children',
        'year',
        'quarter',
    )

    search_fields = (
        'indicator__name',
    )

    ordering = ('row',)

    autocomplete_fields = ['indicator']

    fieldsets = (
        ('Indicator Configuration', {
            'fields': ('indicator', 'chart_type')
        }),
        ('Layout Settings', {
            'fields': ('row', 'width')
        }),
        ('Data Scope', {
            'fields': ('include_children', 'year', 'quarter', 'month'),
            'description': (
                '⚠️ If "Include Children" is enabled or a Quarter is selected, '
                'Year becomes mandatory.'
            )
        }),
    )

    def save_model(self, request, obj, form, change):
        obj.full_clean()
        super().save_model(request, obj, form, change)
