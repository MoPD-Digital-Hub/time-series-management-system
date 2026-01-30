from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.shortcuts import HttpResponse
from django.db.models import Count
from django.db.models import Q
from rest_framework import status
from Base.models import (
    Topic,
    Category,
    Indicator,
    AnnualData,
    QuarterData,
    DataPoint,
    Quarter,
    Month,
    MonthData,
)

from Base.serializer import (
    TopicSerializers,
    CategorySerializers,
    IndicatorSerializers,
    AnnualDataSerializers,
    DataPointSerializers,
    CategoryIndicatorSerializers,
)
from django.contrib.auth.decorators import login_required

import requests

@login_required(login_url='login')
@api_view(['GET'])
def topic_lists(request):
    if request.method == 'GET':
        topics = Topic.objects.filter(is_initiative = False).annotate(category_count=Count('categories')).select_related()
        serializer = TopicSerializers(topics, many=True)
        return Response(serializer.data)
    

@login_required(login_url='login')
@api_view(['GET'])
def initiative_lists(request):
    if request.method == 'GET':
        topics = Topic.objects.filter(is_initiative = True).annotate(category_count=Count('categories')).select_related()
        serializer = TopicSerializers(topics, many=True)
        return Response(serializer.data)

@login_required(login_url='login')
@api_view(['GET'])
def filter_by_category_with_value(request):
    if request.method == 'GET':
        if 'category' in request.GET:
            category = request.GET['category'].split(',')
            try:
               categories = Category.objects.filter(id__in = category, is_deleted = False).select_related()
               category_serializer = CategorySerializers(categories, many=True)

               indicators = Indicator.objects.filter(for_category__id__in = categories, parent = None ,is_deleted = False).select_related()
               serializer = IndicatorSerializers(indicators, many=True)

               years = DataPoint.objects.all()
               year_serializer = DataPointSerializers(years, many=True)

               annualData = AnnualData.objects.filter(indicator__in = indicators).select_related()
               serializer2 = AnnualDataSerializers(annualData, many=True)


               return Response({
                   'categories' : category_serializer.data,
                   'indicators' : serializer.data,
                   'years' : year_serializer.data,
                   'annualData' : serializer2.data
               })
            except:
               return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        else:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)


@login_required(login_url='login')   
@api_view(['GET'])
def count_indicator_by_category(request,id):
      try:
         topic = Topic.objects.get(id = id)
      except:
         return HttpResponse(status=status.HTTP_404_NOT_FOUND)
      
      if request.method == 'GET':
        categories = Category.objects.filter(topic =  topic).annotate(indicator_count=Count('indicators')).select_related()
        serializer = CategorySerializers(categories, many=True)
        return Response(serializer.data)


@login_required(login_url='login')
@api_view(['GET'])
def get_indicators(request,id):
   '''
   filter Indicator by category id with children
   '''
   indicators_list = []
   indicators = Indicator.objects.filter(for_category__id = id, is_deleted = False).select_related()
   for i in indicators:
      indicators_list.append({
         'id' : i.id,
         'title_ENG' : i.title_ENG,
         'title_AMH' : i.title_AMH,
         'composite_key' : i.composite_key,
         'parent_id' : i.parent.id if i.parent else None,
         'for_category' : list(i.for_category.filter().values_list('name_ENG', flat=True)),
         'measurement_units' : i.measurement_units,
         'kpi_characteristics' : i.kpi_characteristics,
         'is_dashboard_visible' : i.is_dashboard_visible,
         'is_public' : i.is_public,
      })
   context ={
      'indicators' : indicators_list
   }
   return Response(context)


@login_required(login_url='login')
@api_view(['GET'])
def filter_topic_and_category(request):
   '''
   filter indicator and category
   '''
   topics = list(Topic.objects.filter().select_related().values('id','title_ENG','title_AMH'))
   categories = list(Category.objects.filter(is_deleted = False).select_related().values('id','name_ENG','name_AMH','topic__id'))
   context = {
      'topics' : topics,
      'categories' : categories,
   }
   return Response(context)


@login_required(login_url='login')
@api_view(['GET'])
def filter_indicator_by_category(request, id):   
   '''
   filter indicator by category
   '''
   indicators = list(Indicator.objects.filter(for_category__id = id, parent = None).select_related().values('id','title_ENG','title_AMH'))
   context = {
      'indicators' : indicators
   }
   return Response(context)


@login_required(login_url='login')
@api_view(['GET'])
def filter_indicator_annual_value(request):
   if request.method == 'GET':
      indicator_ids = request.GET.getlist('indicator_ids')
      parent_indicator_id = indicator_ids[0].split(',')
      indicator_list_id_with_children = []
      def child_list(parent):
            child = Indicator.objects.filter(parent = parent).select_related()
            for i in child:
               indicator_list_id_with_children.append(i.id)
               child_list(i)
                    
      for i in parent_indicator_id:
          parent = Indicator.objects.filter(id = i).select_related().first()
          indicator_list_id_with_children.append(parent.id)
          child_list(parent)
      
      

      quarter_data_value =list( QuarterData.objects.filter(indicator__id__in = indicator_list_id_with_children ).values(
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
      ))


      month_data_value =list( MonthData.objects.filter(indicator__id__in = indicator_list_id_with_children ).values(
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
      ))

      annual_data_value =list( AnnualData.objects.filter(indicator__id__in = indicator_list_id_with_children ).values(
         'id',
         'indicator__title_ENG',
         'indicator__title_AMH',
         'indicator__id',
         'indicator__parent_id',
         'for_datapoint__year_EC',
         'for_datapoint__year_GC',
         'performance',
         'target'
      ))



      

      indicator_lists = Indicator.objects.filter(id__in = indicator_list_id_with_children).select_related().values()

      year = list(DataPoint.objects.all().order_by('-year_GC').values('year_EC', 'year_GC'))
      quarter = list(Quarter.objects.all().order_by('-number') .values('title_ENG', 'title_AMH', 'number'))
      month = list(Month.objects.all().order_by('-number').values('month_ENG', 'month_AMH', 'number')
)




      context = {
         'year' : year,
         'annual_data_value' : annual_data_value,
         'quarter' : quarter,
         'quarter_data_value' : quarter_data_value,
         'month_data_value' : month_data_value,
         'indicator_lists' : indicator_lists,
         'month' : month,
         
       }
      return Response(context)


@login_required(login_url='login')
@api_view(['GET'])
def detail_indicator_with_children(request, id):
   if request.method == 'GET':
      indicator = Indicator.objects.filter(id = id).select_related().first()
      indicator_id_with_children = []

      def child_list(parent):
            child = Indicator.objects.filter(parent = parent).select_related()
            for i in child:
               indicator_id_with_children.append(i.id)
               child_list(i)

      indicator_id_with_children.append(indicator.id)
      child_list(indicator)


      annual_data_value =list(AnnualData.objects.filter(indicator__id__in = indicator_id_with_children ).values(
         'id',
         'indicator__title_ENG',
         'indicator__title_AMH',
         'indicator__id',
         'indicator__parent_id',
         'for_datapoint__year_EC',
         'for_datapoint__year_GC',
         'performance',
         'target'
      ))

      quarter_data_value =list( QuarterData.objects.filter(indicator__id__in = indicator_id_with_children ).values(
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
      ))

      month_data_value =list( MonthData.objects.filter(indicator__id__in = indicator_id_with_children ).values(
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
      ))

      year = list(DataPoint.objects.all().values('year_EC', 'year_GC'))
      quarter = list(Quarter.objects.all().values('title_ENG', 'title_AMH', 'number'))
      indicator_lists = Indicator.objects.filter(id__in = indicator_id_with_children).select_related().values()
      month = list(Month.objects.all().values('month_ENG', 'month_AMH', 'number'))


   

      context = {
         'year' : year,
         'annual_data_value' : annual_data_value,
         'quarter_data_value' : quarter_data_value,
         'month_data_value' : month_data_value,
         'quarter' : quarter,
         'indicator_lists' : indicator_lists,
         'month' : month,
      }

      return Response(context)
   




#Graph API
@login_required(login_url='login')
@api_view(['GET'])
def indicator_graph(request, id):
   print(id)
   if request.method == 'GET':
      indicator = Indicator.objects.filter(id=id).select_related().first()

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
                                       )[:40])
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

      year = list(DataPoint.objects.all().values('year_EC', 'year_GC'))
      quarter = list(Quarter.objects.all().values('title_ENG', 'title_AMH', 'number'))
      month = list(Month.objects.all().values('month_ENG', 'month_AMH', 'number'))


   

      context = {
         'annual_data_value' : annual_data_value,
         'quarter_data_value' : quarter_data_value,
         'month_data_value' : month_data_value,
      }

      return Response(context)
   


@login_required(login_url='login')
@api_view(['GET'])
def recent_data_for_topic(request, id):
   categories = Category.objects.filter(topic__id = id, is_deleted = False).select_related()
   serializer = CategoryIndicatorSerializers(categories, many = True)
   return Response(serializer.data)




########## External API Integration ##########

@login_required(login_url='login')
@api_view(['GET'])
def fayda_api(request):
    EXTERNAL_API_URL = "https://nid-cms.fayda.et/api/faydanumber"  # ← your API

    try:
        response = requests.get(
            EXTERNAL_API_URL,
            timeout=50,
            headers={
                "Accept": "application/json",
                # "Authorization": "Bearer YOUR_TOKEN",  # if needed
            }
        )

        response.raise_for_status()  # raises 4xx / 5xx errors

        return Response(response.json(), status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        return Response(
            {
                "error": "Failed to fetch external data",
                "details": str(e)
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
