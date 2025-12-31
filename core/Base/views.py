from django.shortcuts import render , HttpResponse, get_object_or_404
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
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
    KPIRecord 
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
    topics = Topic.objects.prefetch_related('categories').all()
    return render(request, 'base/topics.html', {'topics': topics})

def categories_list(request):
    categories = Category.objects.prefetch_related('indicators').all()
    topics = Topic.objects.prefetch_related('categories').all()
    return render(request, 'base/categories.html', {'categories': categories, 'topics': topics})

def indicators_list(request):
    indicators = Indicator.objects.filter(is_verified=True)
    topics = Topic.objects.prefetch_related('categories').all()
    return render(request, 'base/indicators.html', {'indicators': indicators, 'topics': topics})

def indicator_view(request, indicator_id):
    indicator = get_object_or_404(Indicator, id=indicator_id, is_verified=True)
    topics = Topic.objects.prefetch_related('categories').all()
    context = {
        'indicator': indicator,
        'topics': topics,
    }
    return render(request, 'base/indicator_view.html', context)

@login_required
def index(request):
    topics = Topic.objects.prefetch_related('categories').all()
    context = {
        'topics': topics
    }
    return render(request, 'base/index.html', context)

def data_view(request, cat_title):
    category = Category.objects.filter(name_ENG=cat_title).first()
    indicators = Indicator.objects.filter(for_category=category, is_verified=True) if category else []
    topics = Topic.objects.prefetch_related('categories').all()
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
    topics = Topic.objects.prefetch_related('categories__indicators').all()
    context = {
        'topics': topics,
    }
    return render(request, 'base/data_explorer.html', context)