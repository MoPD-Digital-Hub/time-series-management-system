from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import models
from .models import CustomUser, CategoryAssignment, IndicatorSubmission, DataSubmission, ResponsibleEntity, UserSector

# -------------------- Custom User Admin --------------------
class CustomUserAdmin(BaseUserAdmin):
    model = CustomUser

    # Columns in list display
    list_display = (
        'email', 'username', 'first_name', 'last_name',
        'is_active', 'is_staff', 'is_category_manager', 'is_importer',
        'managed_category'
    )
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'is_category_manager', 'is_importer')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)

    # Fieldsets for view/edit
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'photo')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_category_manager', 'is_importer', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined', 'last_reset_password')}),
    )

    # Fieldsets for adding a user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'username', 'first_name', 'last_name',
                'password1', 'password2', 'is_active', 'is_staff',
                'is_category_manager', 'groups', 'user_permissions'
            )
        }),
    )

    # -------------------- Managed Category Safe Display --------------------
    def managed_category(self, obj):
        try:
            assignment = obj.managed_categories.first()
            return assignment.category.name_ENG if assignment and assignment.category else "-"
        except Exception:
            return "-"
    managed_category.short_description = "Managed Category"

    # -------------------- Safe Queryset --------------------
def get_queryset(self, request):
    qs = super().get_queryset(request)
    qs = qs.filter(models.Q(manager__isnull=True) | models.Q(manager__is_active=True))
    if request.user.is_category_manager:
        qs = qs.filter(models.Q(is_importer=True) | models.Q(is_category_manager=False, is_importer=False))
    
    return qs


# -------------------- Category Assignment Admin --------------------
class CategoryAssignmentAdmin(admin.ModelAdmin):
    list_display = ('manager_full_name', 'category')
    list_filter = ('manager', 'category')
    search_fields = ('manager__first_name', 'manager__last_name', 'category__name_ENG')

    def manager_full_name(self, obj):
        return obj.manager.get_full_name() if obj.manager else "-"
    manager_full_name.short_description = 'Category Manager'


    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "manager":
            assigned_managers = CategoryAssignment.objects.values_list('manager_id', flat=True)
            kwargs["queryset"] = CustomUser.objects.filter(
                is_category_manager=True
            ).exclude(id__in=assigned_managers)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)



# -------------------- Indicator Submission Admin --------------------
class IndicatorSubmissionAdmin(admin.ModelAdmin):
    list_display = ('indicator', 'submitted_by', 'status', 'verified_by', 'submitted_at', 'verified_at')
    list_filter = ('status', 'submitted_at', 'verified_at')
    search_fields = ('indicator__title_ENG', 'submitted_by__email', 'verified_by__email')
    readonly_fields = ('submitted_at', 'verified_at')
    actions = ['approve_selected', 'decline_selected']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_category_manager:
            managed_categories = request.user.managed_categories.values_list('category', flat=True)
            return qs.filter(indicator__for_category__in=managed_categories)
        return qs

    def approve_selected(self, request, queryset):
        updated = queryset.update(status='approved', verified_by=request.user, verified_at=models.functions.Now())
        self.message_user(request, f"{updated} submission(s) approved.")
    approve_selected.short_description = "Mark selected submissions as approved"

    def decline_selected(self, request, queryset):
        updated = queryset.update(status='declined', verified_by=request.user, verified_at=models.functions.Now())
        self.message_user(request, f"{updated} submission(s) declined.")
    decline_selected.short_description = "Mark selected submissions as declined"

# -------------------- Data Submission Admin --------------------
class DataSubmissionAdmin(admin.ModelAdmin):
    list_display = ('indicator', 'submitted_by', 'status', 'verified_by', 'submitted_at', 'verified_at')
    list_filter = ('status', 'submitted_at', 'verified_at')
    search_fields = ('indicator__title_ENG', 'submitted_by__email', 'verified_by__email')
    readonly_fields = ('submitted_at', 'verified_at')
    actions = ['approve_selected', 'decline_selected']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_category_manager:
            managed_categories = request.user.managed_categories.values_list('category', flat=True)
            return qs.filter(indicator__for_category__in=managed_categories)
        return qs

    def approve_selected(self, request, queryset):
        updated = queryset.update(status='approved', verified_by=request.user, verified_at=models.functions.Now())
        self.message_user(request, f"{updated} data submission(s) approved.")
    approve_selected.short_description = "Mark selected data submissions as approved"

    def decline_selected(self, request, queryset):
        updated = queryset.update(status='declined', verified_by=request.user, verified_at=models.functions.Now())
        self.message_user(request, f"{updated} data submission(s) declined.")
    decline_selected.short_description = "Mark selected data submissions as declined"

# -------------------- Register all --------------------
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(CategoryAssignment, CategoryAssignmentAdmin)
admin.site.register(IndicatorSubmission, IndicatorSubmissionAdmin)
admin.site.register(DataSubmission, DataSubmissionAdmin)
admin.site.register(ResponsibleEntity)
admin.site.register(UserSector)
