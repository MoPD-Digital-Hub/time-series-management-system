from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import *
# Register your models here.


@admin.register(Dashboard)
class DashboardAdmin(ImportExportModelAdmin):
    pass


@admin.register(DashboardIndicator)
class DashboardIndicatorAdmin(ImportExportModelAdmin):
    pass


@admin.register(Row)
class RowAdmin(ImportExportModelAdmin):
    pass


@admin.register(Component)
class ComponentAdmin(ImportExportModelAdmin):
    pass
