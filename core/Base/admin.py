from django.contrib import admin
from .models import *
from .resource import *
from import_export.admin import ImportExportModelAdmin



@admin.register(KPIRecord)
class KPIRecordAdmin(ImportExportModelAdmin):
    resource_classes = [WeekKPIRecordResource , DayKPIRecordResource]
    list_display = (
        'indicator', 'ethio_date_display', 'target', 'performance' , 'record_type'
    )
    autocomplete_fields = ['indicator']
    search_fields = ('indicator__name',)
    date_hierarchy = 'date'

    def ethio_date_display(self, obj):
        """Show Ethiopian date in list_display"""
        return obj.ethio_date
    
    

class TopicAdmin(ImportExportModelAdmin):
    list_display = ('title_ENG', 'title_AMH', 'created', 'is_dashboard', 'is_initiative','rank')
    list_editable = ('rank',)
    resource_classes = [TopicResource]
admin.site.register(Topic,TopicAdmin)

class DocumentCategoryAdmin(ImportExportModelAdmin):
    list_display = ('name_ENG', 'name_AMH', 'rank')
    list_editable = ('rank',)
    search_fields = ('name_ENG', 'name_AMH')

admin.site.register(DocumentCategory, DocumentCategoryAdmin)

class DocumentAdmin(ImportExportModelAdmin):
    list_display = ('title_ENG', 'title_AMH', 'topic', 'category', 'document_category', 'file')
    list_filter = ('topic', 'category', 'document_category')
    search_fields = ('title_ENG', 'title_AMH')

admin.site.register(Document, DocumentAdmin)

class CategoryAdmin(ImportExportModelAdmin):
    resource_classes = [CategoryResource]
    list_display = ('name_ENG', 'name_AMH', 'topic', 'is_dashboard_visible', 'rank' ,'is_deleted')
    list_editable = ('rank','is_dashboard_visible')
    search_fields = ['name_ENG', 'name_AMH', 'topic__title_ENG']
    list_filter = ('topic',) 

admin.site.register(Category, CategoryAdmin)


class TagAdmin(ImportExportModelAdmin):
    resource_classes = [TagResource]
    list_display = ('title',)
    search_fields = ('title',)

admin.site.register(Tag, TagAdmin)

class IndicatorAdmin(ImportExportModelAdmin):
    resource_classes = [IndicatorResource, AnnualDataResource , MonthDataWideResource , QuarterDataWideResource]
    list_display = (
        'id',
        'title_ENG', 'code', 'frequency', 
        'measurement_units',
        'measurement_units_quarter',
        'measurement_units_month',
        'kpi_characteristics', 
        'is_dashboard_visible',  'rank', 'parent'
    )
    list_editable = ('frequency','is_dashboard_visible', 'measurement_units_quarter', 'measurement_units_month', 'rank',) #'title_ENG', 'code', 'rank',  'measurement_units',
    filter_horizontal = ('for_category',)
    list_filter = ('for_category__topic', 'for_category', 'is_dashboard_visible')
    search_fields = ['code', 'title_ENG', 'title_AMH']
    autocomplete_fields = ['for_category', 'parent']

admin.site.register(Indicator, IndicatorAdmin)





class DataPointAdmin(ImportExportModelAdmin):
    resource_classes = [DataPointResource]
    list_display = ('year_EC', 'year_GC',)

admin.site.register(DataPoint,  DataPointAdmin)



class AnnualDataAdmin(ImportExportModelAdmin):
    resource_classes = [AnnualDataWideResource]
    list_display = ('indicator_title', 'for_datapoint', 'performance', 'target', 'is_verified',)
    list_filter = ('indicator__for_category__topic','indicator__for_category' ,'indicator',  'for_datapoint')
    search_fields = ('indicator__code','indicator__title_ENG','for_datapoint__year_EC', 'performance')

    autocomplete_fields = ['indicator']
    list_editable = ('performance','for_datapoint')

    def indicator_title(self, obj):
        return obj.indicator.title_ENG
    
    def year(self, obj):
        return obj.for_datapoint.year_EC

admin.site.register(AnnualData,  AnnualDataAdmin)


class QuarterDataAdmin(ImportExportModelAdmin):
    resource_classes = [QuarterDataResource, QuarterDataWideResource]
    list_display = ('id','for_datapoint', 'for_quarter', 'performance', 'target', 'is_verified')
    list_filter = ('indicator__for_category__topic__title_ENG', 'indicator', 'for_datapoint')
    search_fields = (
        'indicator__for_category__topic__title_ENG',
        'indicator__code',
        'indicator__title_ENG',
        'for_datapoint__year_EC',
    )
    autocomplete_fields = ['indicator']
    list_editable = ('for_datapoint','for_quarter', 'performance', 'target')

    

admin.site.register(QuarterData,  QuarterDataAdmin)


class MonthDataAdmin(ImportExportModelAdmin):
    resource_classes = [MonthDataResource,MonthDataWideResource]
    list_display = ('id','for_datapoint' , 'for_month' ,'performance','target', 'is_verified', )
    list_filter = ('indicator' , 'for_datapoint')
    search_fields = (
        'indicator__for_category__topic__title_ENG',
        'indicator__code',
        'indicator__title_ENG',
        'for_datapoint__year_EC',
    )

    autocomplete_fields = ['indicator']
    list_editable = ('for_datapoint','for_month', 'performance', 'target')



class TrendingIndicatorAdmin(admin.ModelAdmin):
    list_display = ("indicator", "performance", "direction", "note", "created_at")
    list_filter = ("direction", "indicator")
    search_fields = ("indicator__title_ENG", "note")

    def get_changeform_initial_data(self, request):
        """Prefill performance from latest AnnualData for the selected indicator"""
        initial = super().get_changeform_initial_data(request)
        indicator_id = request.GET.get('indicator')
        if indicator_id:
            from .models import AnnualData
            latest = AnnualData.objects.filter(
                indicator_id=indicator_id, is_verified=True
            ).order_by('-for_datapoint__year_GC').first()
            if latest:
                initial['performance'] = latest.performance
        return initial
    


admin.site.register(MonthData,  MonthDataAdmin)


admin.site.register(Quarter)
admin.site.register(Month)
admin.site.register(Video)
admin.site.register(ProjectInitiatives)
admin.site.register(SubProject)

