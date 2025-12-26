from django.shortcuts import HttpResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Q
from rest_framework import status
from django.db.models import Count
from Base.models import (
    Topic,
    Category,
    Indicator,
    DataPoint
)

from DataPortal.serializers import (
    TopicSerializers,
    CategorySerializers,
    IndicatorWithDataSerializers,
    DataPointSerializers
)

@api_view(['GET'])
def data_points(request):
    if request.method == 'GET':
        data_points = DataPoint.objects.filter().order_by('-year_EC')[:10]
        serializer = DataPointSerializers(data_points, many=True)
        return Response(serializer.data)

@api_view(['GET'])
def topic_lists(request):
    if request.method == 'GET':
        topics = Topic.objects.filter(is_dashboard=True).annotate(category_count=Count('categories')).select_related()
        serializer = TopicSerializers(topics, many=True)
        return Response(serializer.data)
    

@api_view(['GET'])
def category_with_indicator(request, id):
    try:
        topic = Topic.objects.get(id = id)
    except Topic.DoesNotExist:
        return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    
    if 'search' in request.GET:
        search = request.GET['search']
        indicator = Indicator.objects.filter(Q(is_dashboard = True), Q(title_ENG__icontains=search) | Q(title_AMH__icontains=search)).select_related().values('for_category__id')
        categories = Category.objects.filter( Q(is_dashboard_visible = True), Q(name_ENG__icontains=search) | Q(name_AMH__icontains=search) | Q(id__in=indicator)).select_related()
        serializer = CategorySerializers(categories, many=True)
        return Response(serializer.data)
    
    if request.method == 'GET':
        categories = Category.objects.filter(topic =  topic, is_dashboard_visible = True).select_related()
        serializer = CategorySerializers(categories, many=True)
        return Response(serializer.data)
    


@api_view(['GET'])
def indicator_value(request, id):
    try:
        indicator = Indicator.objects.get(pk = id)
    except Indicator.DoesNotExist:
        return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':

        year = list(DataPoint.objects.all().values('year_EC', 'year_GC'))
        serializer = IndicatorWithDataSerializers(indicator)
        return Response({
            'indicators' : serializer.data,
            'year' : year,
        })