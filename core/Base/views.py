from django.shortcuts import render , HttpResponse, get_object_or_404
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q, Exists, OuterRef
from rest_framework import status
from .models import (
    Topic,
    Category,
    Indicator,
    AnnualData,
    QuarterData,
    DataPoint,
    Quarter,
    MonthData,
    KPIRecord,
    Document,
    DocumentCategory,
    ProjectInitiatives
)
from UserAdmin.forms import(
    IndicatorForm
)
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect
from django.contrib import messages
from datetime import timedelta
from django.utils import timezone
from UserManagement.models import *

from UserManagement.forms import *

from django.core.paginator import Paginator  

@login_required(login_url='login')
def indicator_detail_view(request, id):
    form = IndicatorForm(request.POST or None)
    
    if request.method == "GET":
        try:
            indicator = Indicator.objects.get(id=id)
            topic = indicator.for_category.first().topic
        except Indicator.DoesNotExist:
            return HttpResponse(404)

        # --- Annual Data (last 10 years) ---
        annual_data_value = list(
            AnnualData.objects.filter(indicator=indicator)
            .order_by('-for_datapoint__year_GC')
            .values(
                'id', 'indicator__title_ENG', 'indicator__title_AMH',
                'indicator__id', 'indicator__parent_id',
                'for_datapoint__year_EC', 'for_datapoint__year_GC',
                'performance', 'target'
            )[:10]
        )

        # --- Quarterly Data (last 4 quarters) ---
        quarter_data_value = list(
            QuarterData.objects.filter(indicator=indicator)
            .order_by('-for_datapoint__year_GC', '-for_quarter__number')
            .values(
                'id', 'indicator__title_ENG', 'indicator__title_AMH',
                'indicator__id', 'indicator__parent_id',
                'for_datapoint__year_EC', 'for_datapoint__year_GC',
                'for_quarter__number',
                'performance', 'target'
            )[:4]
        )

        # --- Monthly Data (last 12 months) ---
        month_data_value = list(
            MonthData.objects.filter(indicator=indicator)
            .order_by('-for_datapoint__year_GC', '-for_month__number')
            .values(
                'id', 'indicator__title_ENG', 'indicator__title_AMH',
                'indicator__id', 'indicator__parent_id',
                'for_datapoint__year_EC', 'for_datapoint__year_GC',
                'for_month__number',
                'performance', 'target'
            )[:12]
        )

        # --- Weekly Data (last 7 days, aggregated into weeks) ---
        today = timezone.now().date()
        last_7_days = today - timedelta(days=6)
        weekly_data_value = list(
            KPIRecord.objects.filter(indicator=indicator, record_type='daily', date__range=[last_7_days, today])
            .order_by('date')
            .values(
                'id', 'date', 'performance', 'target'
            )
        )

        # --- Daily Data (last 10 days) ---
        last_10_days = today - timedelta(days=9)
        daily_data_value = list(
            KPIRecord.objects.filter(indicator=indicator, record_type='daily', date__range=[last_10_days, today])
            .order_by('-date')
            .values(
                'id', 'date', 'performance', 'target'
            )
        )

        context = {
            'annual_data_value': annual_data_value,
            'quarter_data_value': quarter_data_value,
            'month_data_value': month_data_value,
            'weekly_data_value': weekly_data_value,
            'daily_data_value': daily_data_value,
            'indicator': indicator,
            'topic': topic,
            'form': form,
        }
        return render(request, 'base/indicator_detail_view.html', context=context)

    # --- POST Handling (unchanged) ---
    elif request.method == 'POST':
        if 'form_indicator_add_id' in request.POST:
            parent_id = request.POST['form_indicator_add_id']
            try:
                indicator = Indicator.objects.get(id=parent_id)
                if form.is_valid():
                    obj = form.save(commit=False)
                    obj.parent = indicator
                    obj.save()
                    for category in indicator.for_category.all():
                        obj.for_category.add(category)
                    obj.save()
                    messages.success(request, '😃 Hello User, Successfully Added Indicator')
            except:
                messages.error(request, '😞 Hello User , An error occurred while Adding Indicator')
            return redirect('indicator_detail_view', id)
        
        elif 'indicator_id' in request.POST:
            indicator_id = request.POST['indicator_id']
            year_id = request.POST['year_id']
            new_value = request.POST['value']
            quarter_id = request.POST['quarter_id']

            if quarter_id == "":
                try:
                    value = AnnualData.objects.get(indicator__id=indicator_id, for_datapoint__year_EC=year_id)
                    value.performance = new_value
                    value.save()
                except AnnualData.DoesNotExist:
                    try:
                        indicator = Indicator.objects.get(id=indicator_id)
                        datapoint = DataPoint.objects.get(year_EC=year_id)
                        AnnualData.objects.create(indicator=indicator, performance=new_value, for_datapoint=datapoint)
                    except:
                        return JsonResponse({'response': False})
            else:
                try:
                    value = QuarterData.objects.get(indicator__id=indicator_id, for_datapoint__year_EC=year_id, for_datapoint__quarter=quarter_id)
                    value.performance = new_value
                    value.save()
                except QuarterData.DoesNotExist:
                    try:
                        indicator = Indicator.objects.get(id=indicator_id)
                        datapoint = DataPoint.objects.get(year_EC=year_id)
                        quarter = Quarter.objects.get(id=quarter_id)
                        QuarterData.objects.create(indicator=indicator, performance=new_value, for_datapoint=datapoint, for_quarter=quarter)
                    except:
                        return JsonResponse({'response': False})

            return JsonResponse({'response': True})

    else:
        return HttpResponse("Bad Request!")
  
@api_view(['GET'])
def search_category_indicator(request):
    queryset = []
    if 'search' in request.GET:
            q = request.GET['search']
            dashboard_topic = Topic.objects.filter(is_dashboard = True)
            queryset = Category.objects.filter().prefetch_related('indicator__set').filter(Q(indicators__title_ENG__contains=q, indicators__for_category__topic__in = dashboard_topic ) | Q(indicators__for_category__name_ENG__contains=q, indicators__for_category__topic__in = dashboard_topic) ).values(
                'name_ENG',
                'indicators__title_ENG',
            )
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : list(queryset)}, status=status.HTTP_200_OK)
    
# my Views

def Welcome(request):
    topics = Topic.objects.prefetch_related('categories').all()
    return render(request, 'welcome.html', {'topics': topics})


def topics_list(request):
    topics = Topic.objects.prefetch_related('categories').filter(is_initiative=False)
    return render(request, 'base/topics.html', {'topics': topics})

def categories_list(request):
    categories = Category.objects.prefetch_related('indicators').all()
    topics = Topic.objects.prefetch_related('categories').filter(is_initiative=False)
    return render(request, 'base/categories.html', {'categories': categories, 'topics': topics})

def indicators_list(request):
    indicators = Indicator.objects.filter(is_verified=True)
    topics = Topic.objects.prefetch_related('categories').filter(is_initiative=False)
    return render(request, 'base/indicators.html', {'indicators': indicators, 'topics': topics})

def indicator_view(request, indicator_id):
    indicator = get_object_or_404(Indicator, id=indicator_id, is_verified=True)
    topics = Topic.objects.prefetch_related('categories').filter(is_initiative=False)
    context = {
        'indicator': indicator,
        'topics': topics,
    }
    return render(request, 'base/indicator_view.html', context)

@login_required
def index(request):
    topics = Topic.objects.prefetch_related('categories').filter(is_initiative=False)
    context = {
        'topics': topics
    }
    return render(request, 'base/index.html', context)

def data_view(request, cat_title):
    category = Category.objects.filter(name_ENG=cat_title).first()
    if category:
        indicators = Indicator.objects.filter(for_category=category, is_verified=True).annotate(
            has_annual=Exists(AnnualData.objects.filter(indicator=OuterRef('pk'), is_verified=True)),
            has_quarterly=Exists(QuarterData.objects.filter(indicator=OuterRef('pk'), is_verified=True)),
            has_monthly=Exists(MonthData.objects.filter(indicator=OuterRef('pk'), is_verified=True)),
        )
    else:
        indicators = []
    topics = Topic.objects.prefetch_related('categories').filter(is_initiative=False)
    # Build datapoints (unique years) from annual data for the selected indicators
    datapoints = []
    table_rows = []
    if indicators:
        # fetch annual data for these indicators
        annual_qs = AnnualData.objects.filter(
            indicator__in=indicators, for_datapoint__isnull=False, is_verified=True
        ).select_related('for_datapoint')

        # collect unique datapoint years in order (latest first by year_GC)
        seen = {}
        for a in annual_qs.order_by('-for_datapoint__year_GC'):
            dp = a.for_datapoint
            if not dp:
                continue
            key = (dp.year_EC, dp.year_GC)
            if key not in seen:
                seen[key] = {'year_ec': dp.year_EC, 'year_gc': dp.year_GC}
        datapoints = list(seen.values())

        # build a lookup of performance per indicator per datapoint
        perf_map = {}
        for a in annual_qs:
            dp = a.for_datapoint
            if not dp:
                continue
            key = (dp.year_EC, dp.year_GC)
            perf_map.setdefault(a.indicator_id, {})[key] = a.performance

        # build table rows aligned with datapoints order
        for ind in indicators:
            values = []
            for dp in datapoints:
                key = (dp['year_ec'], dp['year_gc'])
                val = perf_map.get(ind.id, {}).get(key)
                values.append(val)
            table_rows.append({'indicator': ind, 'values': values})

    context = {
        'category': category,
        'indicators': indicators,
        'topics': topics,
        'datapoints': datapoints,
        'table_rows': table_rows,
    }
    return render(request, 'base/data_view.html', context)

@login_required
def data_explorer(request):
    topics = Topic.objects.prefetch_related('categories__indicators').filter(is_initiative=False)
    context = {
        'topics': topics,
    }
    return render(request, 'base/data_explorer.html', context)




@login_required
def climate_dashboard(request):
    """
    Climate Dashboard combining analytics and document-based knowledge management.
    """
    # Get or create Climate topic
    climate_topic = Topic.objects.get(
        title_ENG__iexact='Climate'
    )
    
    # Get categories for climate topic
    categories = Category.objects.filter(topic=climate_topic, is_deleted=False).order_by('rank')
    
    # Get indicators for climate topic
    indicators = Indicator.objects.filter(
        for_category__topic=climate_topic,
        is_verified=True,
        is_dashboard_visible=True
    ).distinct().order_by('rank', 'title_ENG')
    
    # Get document categories (not filtered by topic since DocumentCategory doesn't have topic field)
    document_categories = DocumentCategory.objects.all().order_by('rank', 'name_ENG')
    
    # Get documents for climate topic
    documents = Document.objects.filter(topic=climate_topic).select_related('document_category', 'category').order_by('-id')
    
    # Get recent annual data for key indicators (last 5 years)
    recent_years = DataPoint.objects.order_by('-year_GC')[:5]
    annual_data = AnnualData.objects.filter(
        indicator__in=indicators,
        for_datapoint__in=recent_years,
        
    ).select_related('indicator', 'for_datapoint').order_by('-for_datapoint__year_GC', 'indicator__rank')
    
    # Get quarterly data for recent year
    latest_year = recent_years.first() if recent_years.exists() else None
    quarterly_data = []
    if latest_year:
        quarterly_data = QuarterData.objects.filter(
            indicator__in=indicators,
            for_datapoint=latest_year,
            
        ).select_related('indicator', 'for_datapoint', 'for_quarter').order_by('for_quarter__number')
    
    # Get monthly data for recent year
    monthly_data = []
    if latest_year:
        monthly_data = MonthData.objects.filter(
            indicator__in=indicators,
            for_datapoint=latest_year,
            
        ).select_related('indicator', 'for_datapoint', 'for_month').order_by('for_month__number')
    
    # Get project initiatives related to climate
    initiatives = ProjectInitiatives.objects.filter(is_initiative=True).order_by('-created')[:5]
    
    # Prepare data for charts and latest values for indicators
    indicators_data = []
    indicators_with_latest = []
    
    # Create a dictionary to store latest annual data per indicator
    latest_data_map = {}
    for ad in annual_data.order_by('indicator_id', '-for_datapoint__year_GC'):
        if ad.indicator_id not in latest_data_map:
            latest_data_map[ad.indicator_id] = {
                'performance': ad.performance,
                'target': ad.target,
                'year_gc': ad.for_datapoint.year_GC if ad.for_datapoint else None,
            }
    
    # Prepare indicators with latest data
    for indicator in indicators:
        latest = latest_data_map.get(indicator.id, {})
        indicators_with_latest.append({
            'indicator': indicator,
            'latest_performance': latest.get('performance'),
            'latest_target': latest.get('target'),
            'latest_year': latest.get('year_gc'),
        })
    
    # Prepare data for charts (top 10 indicators)
    for indicator in indicators[:10]:
        ind_annual = annual_data.filter(indicator=indicator).order_by('for_datapoint__year_GC')
        indicators_data.append({
            'indicator': indicator,
            'annual_data': [
                {
                    'year_ec': ad.for_datapoint.year_EC,
                    'year_gc': ad.for_datapoint.year_GC,
                    'performance': float(ad.performance) if ad.performance else None,
                    'target': float(ad.target) if ad.target else None,
                }
                for ad in ind_annual
            ]
        })
    
    context = {
        'climate_topic': climate_topic,
        'categories': categories,
        'document_categories': document_categories,
        'indicators': indicators,
        'indicators_with_latest': indicators_with_latest,
        'documents': documents,
        'annual_data': annual_data,
        'quarterly_data': quarterly_data,
        'monthly_data': monthly_data,
        'indicators_data': indicators_data,
        'recent_years': recent_years,
        'latest_year': latest_year,
        'initiatives': initiatives,
        'topics': Topic.objects.prefetch_related('categories').filter(is_initiative=False),
    }
    return render(request, 'base/climate_dashboard.html', context)

@login_required
def climate_user_management_dashboard(request):
    return render(request, 'usermanagement/climate_user_management_dashboard.html')


@login_required
def users_list_climate(request):
    search_query = request.GET.get('search', '')
    role_filter = request.GET.get('role', '')
    page_number = int(request.GET.get('page', 1))
    users_qs = CustomUser.objects.select_related('manager').prefetch_related('managed_categories__category').filter(climate_user=True).order_by('email')

    if request.user.is_authenticated and request.user.is_category_manager and not request.user.is_staff:
        users_qs = CustomUser.objects.filter(Q(is_importer=True, manager=request.user) | Q(id=request.user.id)).order_by('email')

    if search_query:
        users_qs = users_qs.filter(
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query) |
            Q(username__icontains=search_query)
        )

    if role_filter:
        if role_filter == 'category_manager':
            users_qs = users_qs.filter(is_category_manager=True)
        elif role_filter == 'importer':
            users_qs = users_qs.filter(is_importer=True)
        elif role_filter == 'admin':
            users_qs = users_qs.filter(is_staff=True)

    paginator = Paginator(users_qs, 20)
    users_page = paginator.get_page(page_number)

    manager_categories = []
    if request.user.is_authenticated and request.user.is_category_manager:
        manager_categories = [assign.category for assign in CategoryAssignment.objects.filter(manager=request.user).select_related('category')]

    return render(request, 'usermanagement/users_list_climate.html', {
        'users_page': users_page,
        'search_query': search_query,
        'role_filter': role_filter,
        'manager_categories': manager_categories,
    })

@login_required
def climate_review_table_data(request):
    if not (request.user.is_category_manager or request.user.is_superuser):
         return render(request, 'usermanagement/access_denied_climate.html') 
    return render(request, 'usermanagement/review_table_data_climate.html')



@login_required
def submissions_list_climate(request):
    # Allow only managers
    if not (request.user.is_category_manager or request.user.is_superuser):
        messages.error(request, 'Access denied. Only managers can access this page.')
        return render(request, 'usermanagement/climate_access_denied.html')

    submission_type = request.GET.get('type', 'indicator')
    status_filter = request.GET.get('status', '')
    page_number = int(request.GET.get('page', 1))

    if submission_type == 'indicator':
        submissions_qs = IndicatorSubmission.objects.select_related(
            'indicator', 'submitted_by', 'verified_by'
        ).order_by('-submitted_at')
        template = 'usermanagement/indicator_submissions_climate.html'
    else:
        submissions_qs = DataSubmission.objects.select_related(
            'indicator', 'submitted_by', 'verified_by'
        ).order_by('-submitted_at')
        template = 'usermanagement/data_submissions_climate.html'

    # Filter by manager assignment if not superuser/staff
    if not (request.user.is_staff or request.user.is_superuser):
        managed_importers = CustomUser.objects.filter(manager=request.user)
        assigned_categories = CategoryAssignment.objects.filter(manager=request.user).values_list('category_id', flat=True)
        submissions_qs = submissions_qs.filter(
            Q(submitted_by__in=managed_importers) |
            Q(indicator__for_category__in=assigned_categories)
        ).distinct()

    if status_filter:
        submissions_qs = submissions_qs.filter(status=status_filter)

    # Calculate pending count for tabs
    if submission_type == 'indicator':
        pending_qs = IndicatorSubmission.objects.filter(status='pending')
    else:
        pending_qs = DataSubmission.objects.filter(status='pending')
    
    if not (request.user.is_staff or request.user.is_superuser):
        managed_importers = CustomUser.objects.filter(manager=request.user)
        assigned_categories = CategoryAssignment.objects.filter(manager=request.user).values_list('category_id', flat=True)
        pending_qs = pending_qs.filter(
            Q(submitted_by__in=managed_importers) |
            Q(indicator__for_category__in=assigned_categories)
        ).distinct()
    
    pending_count = pending_qs.count()

    paginator = Paginator(submissions_qs, 20)
    submissions_page = paginator.get_page(page_number)

    return render(request, template, {
        'submission_type': submission_type,
        'submissions_page': submissions_page,
        'status_filter': status_filter,
        'pending_count': pending_count
    })



@login_required
def climate_document(request):
    """
    Climate Dashboard combining analytics and document-based knowledge management.
    """
    # Get or create Climate topic
    climate_topic, created = Topic.objects.get_or_create(
        title_ENG__iexact='Climate',
        defaults={
            'title_ENG': 'Climate',
            'title_AMH': 'አየር ንብከት',
            'is_dashboard': True,
            'rank': 1
        }
    )
    
    
    
    # Get document categories (not filtered by topic since DocumentCategory doesn't have topic field)
    document_categories = DocumentCategory.objects.all().order_by('rank', 'name_ENG')
    
    # Get documents for climate topic
    documents = Document.objects.filter(topic=climate_topic).select_related('document_category', 'category').order_by('-id')
    
 

    context = {
        'climate_topic': climate_topic,
        'document_categories': document_categories,
        'documents': documents,
    }
    return render(request, 'base/climate_documents.html', context)

@login_required
def climate_data_explorer(request):
    topics = Topic.objects.prefetch_related('categories__indicators').filter(title_ENG__iexact='Climate')
    context = {
        'topics': topics,  # iterable
    }
    return render(request, 'base/climate_data_explorer.html', context)


@login_required
def importer_dashboard_climate(request):
    if not request.user.is_importer:
        messages.error(request, 'Access denied. Only data importers can access this page.')
        return render(request, 'usermanagement/access_denied.html')
    
    # Get categories managed by the importer's manager
    assigned_categories = []
    manager = getattr(request.user, 'manager', None)
    if manager:
        assigned_categories = [a.category for a in CategoryAssignment.objects.select_related('category').filter(manager=manager)]
    
    return render(request, 'usermanagement/importer_dashboard_climate.html', {
        'assigned_categories': assigned_categories
    })

@login_required
def data_table_explorer_climate(request):
    user = request.user
    if user.is_superuser:
        categories = Category.objects.prefetch_related('indicators').all().order_by('name_ENG')
    else:
        # Determine the manager to check assignments for
        target_manager = user if user.is_category_manager else getattr(user, 'manager', None)
        
        if target_manager:
            category_ids = CategoryAssignment.objects.filter(manager=target_manager).values_list('category_id', flat=True)
            categories = Category.objects.filter(id__in=category_ids).prefetch_related('indicators').order_by('name_ENG')
        else:
            categories = Category.objects.none()

    context = {
        'categories': categories,
    }
    return render(request, 'usermanagement/data_table_explorer_climate.html', context)


@login_required
def add_indicator_climate(request):
    if not request.user.is_importer:
        messages.error(request, 'Access denied. Only data importers can submit indicators.')
        return render(request, 'usermanagement/dashboard.html')

    categories = Category.objects.all().order_by('name_ENG')
    frequency_choices = Indicator.FREQUENCY_CHOICES

    # Determine the importer's assigned categories via their category manager
    assigned_categories = []
    manager = getattr(request.user, 'manager', None)
    if manager is not None:
        assigned_categories = [a.category for a in CategoryAssignment.objects.select_related('category').filter(manager=manager)]

    return render(request,'usermanagement/add_indicator_climate.html',
        {
            'categories': categories,
            'frequency_choices': frequency_choices,
            'assigned_categories': assigned_categories,
        }
    )


@login_required
def documents_list_climate(request):
    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Document uploaded successfully.')
            return redirect('documents_list')
    else:
        form = DocumentForm()
    
    topic_id = request.GET.get('topic')
    category_id = request.GET.get('category')
    
    documents = Document.objects.all().order_by('-id')
    if topic_id:
        documents = documents.filter(topic_id=topic_id)
    if category_id:
        documents = documents.filter(category_id=category_id)
        
    topics = Topic.objects.filter(is_initiative=False)
    categories = Category.objects.all()
    if topic_id:
        categories = categories.filter(topic_id=topic_id)
    
    context = {
        'form': form,
        'documents': documents,
        'topics': topics,
        'categories': categories,
        'selected_topic': topic_id,
        'selected_category': category_id,
    }
    return render(request, 'usermanagement/documents_list_climate.html', context)



def admas_ai(request):
    return render(request, 'base/admas_ai.html')