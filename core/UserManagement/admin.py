from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import models
from .models import CustomUser, CategoryAssignment, IndicatorSubmission, DataSubmission, ResponsibleEntity, UserSector

# -------------------- Custom User Admin --------------------
class CustomUserAdmin(BaseUserAdmin):
    model = CustomUser

    list_display = (
        'email', 'username', 'first_name', 'last_name',
        'is_active', 'is_staff',
        'is_category_manager', 'is_importer',
        'managed_categories_display',
    )

    list_filter = (
        'is_active',
        'is_staff',
        'is_superuser',
        'is_category_manager',
        'is_importer',
    )

    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'photo')}),
        ('Permissions', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'is_category_manager',
                'is_importer',
                'groups',
                'user_permissions',
                'climate_user'
            )
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined', 'last_reset_password')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'username', 'first_name', 'last_name',
                'password1', 'password2',
                'is_active', 'is_staff',
                'is_category_manager',
                'groups', 'user_permissions',
            )
        }),
    )


    def managed_categories_display(self, obj):
        categories = obj.managed_categories.select_related('category')
        if not categories.exists():
            return "-"
        return ", ".join(a.category.name_ENG for a in categories)

    managed_categories_display.short_description = "Managed Categories"

    # ✅ FIXED: must be INSIDE the class
    def get_queryset(self, request):
        qs = super().get_queryset(request)

        qs = qs.filter(
            models.Q(manager__isnull=True) |
            models.Q(manager__is_active=True)
        )

        if request.user.is_category_manager:
            qs = qs.filter(
                models.Q(is_importer=True) |
                models.Q(is_category_manager=False, is_importer=False)
            )

        return qs

# -------------------- Category Assignment Admin --------------------
class CategoryAssignmentAdmin(admin.ModelAdmin):
    list_display = ('manager_full_name', 'category')
    list_filter = ('manager', 'category')
    search_fields = (
        'manager__first_name',
        'manager__last_name',
        'manager__email',
        'category__name_ENG',
    )

    def manager_full_name(self, obj):
        return obj.manager.get_full_name() if obj.manager else "-"
    manager_full_name.short_description = "Category Manager"


# -------------------- Indicator Submission Admin --------------------
class IndicatorSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        'indicator',
        'submitted_by',
        'status',
        'verified_by',
        'submitted_at',
        'verified_at',
    )

    list_filter = ('status', 'submitted_at', 'verified_at')
    search_fields = (
        'indicator__title_ENG',
        'submitted_by__email',
        'verified_by__email',
    )

    readonly_fields = ('submitted_at', 'verified_at')
    actions = ['approve_selected', 'decline_selected']

    def get_queryset(self, request):
        qs = super().get_queryset(request)

        if request.user.is_category_manager:
            managed_categories = request.user.managed_categories.values_list(
                'category_id', flat=True
            )
            qs = qs.filter(indicator__for_category__in=managed_categories)

        return qs

    def approve_selected(self, request, queryset):
        updated = queryset.update(
            status='approved',
            verified_by=request.user,
            verified_at=models.functions.Now()
        )
        self.message_user(request, f"{updated} submission(s) approved.")

    def decline_selected(self, request, queryset):
        updated = queryset.update(
            status='declined',
            verified_by=request.user,
            verified_at=models.functions.Now()
        )
        self.message_user(request, f"{updated} submission(s) declined.")

# -------------------- Data Submission Admin --------------------
class DataSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        'indicator',
        'submitted_by',
        'status',
        'verified_by',
        'submitted_at',
        'verified_at',
    )

    list_filter = ('status', 'submitted_at', 'verified_at')
    search_fields = (
        'indicator__title_ENG',
        'submitted_by__email',
        'verified_by__email',
    )

    readonly_fields = ('submitted_at', 'verified_at')
    actions = ['approve_selected', 'decline_selected']

    def get_queryset(self, request):
        qs = super().get_queryset(request)

        if request.user.is_category_manager:
            managed_categories = request.user.managed_categories.values_list(
                'category_id', flat=True
            )
            qs = qs.filter(indicator__for_category__in=managed_categories)

        return qs

    def approve_selected(self, request, queryset):
        updated = queryset.update(
            status='approved',
            verified_by=request.user,
            verified_at=models.functions.Now()
        )
        self.message_user(request, f"{updated} data submission(s) approved.")

    def decline_selected(self, request, queryset):
        updated = queryset.update(
            status='declined',
            verified_by=request.user,
            verified_at=models.functions.Now()
        )
        self.message_user(request, f"{updated} data submission(s) declined.")

# -------------------- Register all --------------------
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(CategoryAssignment, CategoryAssignmentAdmin)
admin.site.register(IndicatorSubmission, IndicatorSubmissionAdmin)
admin.site.register(DataSubmission, DataSubmissionAdmin)
admin.site.register(ResponsibleEntity)
admin.site.register(UserSector)