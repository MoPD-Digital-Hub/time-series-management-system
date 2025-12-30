from rest_framework import serializers
from UserManagement.models import CustomUser, CategoryAssignment, IndicatorSubmission, DataSubmission
from Base.models import Category


class CustomUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    managed_category = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'photo', 'is_active', 'is_staff', 'is_category_manager', 'is_importer',
            'roles', 'managed_category', 'last_login', 'date_joined'
        ]
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
    
    def get_roles(self, obj):
        roles = []
        if obj.is_staff:
            roles.append('Admin')
        if obj.is_category_manager:
            roles.append('Category Manager')
        if obj.is_importer:
            roles.append('Data Importer')
        if not roles:
            roles.append('User')
        return roles
    
    def get_managed_category(self, obj):
        try:
            assignment = obj.managed_categories.get()
            return {
                'id': assignment.category.id,
                'name_eng': assignment.category.name_ENG,
                'name_amh': assignment.category.name_AMH,
            }
        except CategoryAssignment.DoesNotExist:
            return None


class CategoryAssignmentSerializer(serializers.ModelSerializer):
    manager_details = serializers.SerializerMethodField()
    category_details = serializers.SerializerMethodField()
    
    class Meta:
        model = CategoryAssignment
        fields = ['id', 'manager', 'category', 'manager_details', 'category_details']
    
    def get_manager_details(self, obj):
        return {
            'id': obj.manager.id,
            'email': obj.manager.email,
            'full_name': obj.manager.get_full_name() or obj.manager.username,
            'is_active': obj.manager.is_active,
            'last_login': obj.manager.last_login,
        }
    
    def get_category_details(self, obj):
        return {
            'id': obj.category.id,
            'name_eng': obj.category.name_ENG,
            'name_amh': obj.category.name_AMH,
            'indicator_count': obj.category.indicators.count(),
            'subcategory_count': obj.category.subcategories.count(),
        }


class UnassignedCategorySerializer(serializers.ModelSerializer):
    indicator_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name_ENG', 'name_AMH', 'indicator_count']
    
    def get_indicator_count(self, obj):
        return obj.indicators.count()


class IndicatorSubmissionSerializer(serializers.ModelSerializer):
    indicator_details = serializers.SerializerMethodField()
    submitted_by_details = serializers.SerializerMethodField()
    verified_by_details = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = IndicatorSubmission
        fields = [
            'id', 'indicator', 'submitted_by', 'status', 'status_display',
            'submitted_at', 'verified_by', 'verified_at',
            'indicator_details', 'submitted_by_details', 'verified_by_details'
        ]
    
    def get_indicator_details(self, obj):
        return {
            'id': obj.indicator.id,
            'title_eng': obj.indicator.title_ENG,
            'title_amh': obj.indicator.title_AMH,
        }
    
    def get_submitted_by_details(self, obj):
        return {
            'id': obj.submitted_by.id,
            'email': obj.submitted_by.email,
            'full_name': obj.submitted_by.get_full_name() or obj.submitted_by.username,
        }
    
    def get_verified_by_details(self, obj):
        if obj.verified_by:
            return {
                'id': obj.verified_by.id,
                'email': obj.verified_by.email,
                'full_name': obj.verified_by.get_full_name() or obj.verified_by.username,
            }
        return None


class DataSubmissionSerializer(serializers.ModelSerializer):
    indicator_details = serializers.SerializerMethodField()
    submitted_by_details = serializers.SerializerMethodField()
    verified_by_details = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    preview = serializers.SerializerMethodField()
    
    class Meta:
        model = DataSubmission
        fields = [
            'id', 'indicator', 'submitted_by', 'data_file',
            'notes', 'status', 'status_display', 'submitted_at',
            'verified_by', 'verified_at', 'indicator_details',
            'submitted_by_details', 'verified_by_details', 'preview'
        ]
    
    def get_indicator_details(self, obj):
        return {
            'id': obj.indicator.id,
            'title_eng': obj.indicator.title_ENG,
            'title_amh': obj.indicator.title_AMH,
        }
    
    def get_submitted_by_details(self, obj):
        return {
            'id': obj.submitted_by.id,
            'email': obj.submitted_by.email,
            'full_name': obj.submitted_by.get_full_name() or obj.submitted_by.username,
        }
    
    def get_verified_by_details(self, obj):
        if obj.verified_by:
            return {
                'id': obj.verified_by.id,
                'email': obj.verified_by.email,
                'full_name': obj.verified_by.get_full_name() or obj.verified_by.username,
            }
        return None
    
    def get_preview(self, obj):
        if obj.data_file:
            try:
                import pandas as pd
                file_path = obj.data_file.path
                if file_path.endswith('.csv'):
                    df = pd.read_csv(file_path, nrows=5)
                elif file_path.endswith(('.xls', '.xlsx')):
                    df = pd.read_excel(file_path, nrows=5)
                else:
                    return []
                return df.fillna('').to_dict(orient='records')
            except Exception:
                return []
        return []


class UserManagementStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    category_managers = serializers.IntegerField()
    importers = serializers.IntegerField()
    pending_indicator_submissions = serializers.IntegerField()
    pending_data_submissions = serializers.IntegerField()
