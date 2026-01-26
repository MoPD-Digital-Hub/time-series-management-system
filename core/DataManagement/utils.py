from Base.models import Indicator, AnnualData, QuarterData, MonthData
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