from Base.models import *
from UserManagement.models import CategoryAssignment

def get_manager_categories(user):
    return CategoryAssignment.objects.filter(
        manager=user
    ).values_list('category_id', flat=True)

def get_manager_indicators(user):
    categories = get_manager_categories(user)
    return Indicator.objects.filter(
        for_category__in=categories
    ).distinct()

def get_unverified_annual_data(user):
    indicators = get_manager_indicators(user)
    return AnnualData.objects.filter(
        indicator__in=indicators,
        is_verified=False,
    )

def get_unverified_quarter_data(user):
    indicators = get_manager_indicators(user)
    return QuarterData.objects.filter(
        indicator__in=indicators,
        is_verified=False,
    )

def get_unverified_month_data(user):
    indicators = get_manager_indicators(user)
    return MonthData.objects.filter(
        indicator__in=indicators,
        is_verified=False,
    )

def get_unverified_indicators(user):
    categories = get_manager_categories(user)
    return Indicator.objects.filter(
        for_category__in=categories,
        is_verified=False,
    ).distinct()




############ Log Utils ##############

def get_action_context(log):
    """Determine where the action happened based on model type"""
    model_name = log.content_type.model.lower()
    
    if model_name in ['annualdata', 'monthdata', 'quarterdata', 'kpirecord']:
        return "Data Table"
    elif model_name == 'datasubmission':
        return "Data Submission"
    elif model_name == 'indicatorsubmission':
        return "Indicator Submission"
    elif model_name == 'indicator':
        return "Indicator Management"
    else:
        return "System"


def get_field_changes_summary(log):
    """Get a summary of field changes"""
    import json
    
    if log.action == 0:  # Create
        return "New record created"
    elif log.action == 2:  # Delete
        return "Record deleted"
    elif log.action == 1:  # Update
        try:
            if log.changes:
                changes_dict = log.changes if isinstance(log.changes, dict) else json.loads(log.changes)
                if changes_dict:
                    changed_fields = list(changes_dict.keys())
                    if len(changed_fields) == 1:
                        return f"{changed_fields[0]} updated"
                    elif len(changed_fields) <= 3:
                        return ", ".join(changed_fields) + " updated"
                    else:
                        return f"{len(changed_fields)} fields updated"
        except Exception:
            pass
        return "Record updated"
    return ""


def get_related_object_info(log):
    """Get information about related objects (e.g., indicator name, submission details)"""
    try:
        model_name = log.content_type.model.lower()
        object_id = log.object_id or log.object_pk
        
        if not object_id:
            return None
        
        if model_name in ['annualdata', 'monthdata', 'quarterdata', 'kpirecord']:
            # Try to get the indicator name
            try:
                if model_name == 'annualdata':
                    obj = AnnualData.objects.select_related('indicator').filter(id=object_id).first()
                elif model_name == 'monthdata':
                    obj = MonthData.objects.select_related('indicator').filter(id=object_id).first()
                elif model_name == 'quarterdata':
                    obj = QuarterData.objects.select_related('indicator').filter(id=object_id).first()
                elif model_name == 'kpirecord':
                    obj = KPIRecord.objects.select_related('indicator').filter(id=object_id).first()
                else:
                    obj = None
                
                if obj and hasattr(obj, 'indicator') and obj.indicator:
                    return f"Indicator: {obj.indicator.title_ENG}"
            except Exception:
                pass
        
        elif model_name == 'indicator':
            # Get indicator name
            try:
                indicator = Indicator.objects.filter(id=object_id).first()
                if indicator:
                    return indicator.title_ENG
            except Exception:
                pass
        
    except Exception:
        pass
    
    return None