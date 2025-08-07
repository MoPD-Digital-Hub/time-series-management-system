from django.shortcuts import render , HttpResponse
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
    Month,
    MonthData   
)
from UserAdmin.forms import(
    IndicatorForm
)
from django.contrib.auth.decorators import login_required




@login_required(login_url='login')
def indicator_detail_view (request , id):
    form = IndicatorForm(request.POST or None)
    if request.method == "GET":
        indicator = None
        try:
            indicator = Indicator.objects.get(id=id)
            topic = indicator.for_category.first().topic
        except:
            return HttpResponse(404)
        annual_data_value = list(AnnualData.objects.filter(indicator=indicator)
        .order_by('-for_datapoint__year_GC')
        .values(
           'id',
           'indicator__title_ENG',
           'indicator__title_AMH',
           'indicator__id',
           'indicator__parent_id',
           'for_datapoint__year_EC',
           'for_datapoint__year_GC',
           'performance',
           'target'
        )[:10]) 
        quarter_data_value = list(QuarterData.objects.filter(indicator=indicator)
                                       .order_by('-for_datapoint__year_GC', '-for_quarter__number')
                                       .values(
                                           'id',
                                           'indicator__title_ENG',
                                           'indicator__title_AMH',
                                           'indicator__id',
                                           'indicator__parent_id',
                                           'for_datapoint__year_EC',
                                           'for_datapoint__year_GC',
                                           'for_quarter__number',
                                           'performance',
                                           'target'
                                       )[:4])  
        month_data_value = list(MonthData.objects.filter(indicator=indicator)
        .order_by('-for_datapoint__year_GC', '-for_month__number')
        .values(
           'id',
           'indicator__title_ENG',
           'indicator__title_AMH',
           'indicator__id',
           'indicator__parent_id',
           'for_datapoint__year_EC',
           'for_datapoint__year_GC',
           'for_month__number',
           'performance',
           'target'
        )[:12])                               
        context = {
            'quarter_data_value' : quarter_data_value,
            'month_data_value' : month_data_value,
            'annual_data_value' : annual_data_value,
            'indicator' : indicator,
            'topic' : topic,
            'form' : form,
        }
        return render(request, 'base/indicator_detail_view.html', context=context)
    
    elif request.method == 'POST':
        if 'form_indicator_add_id' in request.POST:
            parent_id = request.POST['form_indicator_add_id']
            try:
                indicator = Indicator.objects.get(id = parent_id)
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
                    value = AnnualData.objects.get(indicator__id = indicator_id, for_datapoint__year_EC = year_id)
                    value.performance = new_value
                    value.save()
                except:
                    try:
                        indicator = Indicator.objects.get(id = indicator_id)
                        datapoint = DataPoint.objects.get(year_EC = year_id)
                        AnnualData.objects.create(indicator = indicator, performance = new_value, for_datapoint = datapoint)
                    except:
                        return JsonResponse({'response' : False})
            elif quarter_id != "":
                try:
                    value = QuarterData.objects.get(indicator__id = indicator_id, for_datapoint__year_EC = year_id, for_datapoint__quarter = quarter_id)
                    value.performance = new_value
                    value.save()
                except:
                    try:
                        indicator = Indicator.objects.get(id = indicator_id)
                        datapoint = DataPoint.objects.get(year_EC = year_id)
                        quarter = Quarter.objects.get(id = quarter_id)
                        QuarterData.objects.create(indicator = indicator, performance = new_value, for_datapoint = datapoint, for_quarter = quarter)
                    except:
                        return JsonResponse({'response' : False})

            return JsonResponse({'response' : True})
    
    else: return HttpResponse("Bad Request!")



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
    