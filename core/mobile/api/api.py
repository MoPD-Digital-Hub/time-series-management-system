from rest_framework.response import Response
from collections import defaultdict
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .serializers import *
from mobile.models import MobileDahboardOverview
from Base.models import Topic , ProjectInitiatives , SubProject , Category , Indicator
from django.db.models import Q


#Time series data
@api_view(['GET'])
def dashboard_overview(request):
    topics = Topic.objects.filter(is_initiative = True)
    serializer = TopicSerializer(topics, many=True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

@api_view(['GET'])
def trending(request):
    indicators = MobileDahboardOverview.objects.all()
    serializer = MobileDashboardOverviewSerializer(indicators, many=True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)


@api_view(['GET'])
def mobile_topic(request):
    topics = Topic.objects.filter(is_initiative = False)
    serializer = TopicSerializer(topics, many=True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

@api_view(['GET'])
def initiatives(request):
    topics = Topic.objects.filter(is_initiative = True)
    serializer = TopicSerializer(topics, many=True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

@api_view(['GET'])
def mobile_topic_detail(request ,id):
    try:
        topic = Topic.objects.get(id = id)
    except Topic.DoesNotExist:
        return Response({"result" : "FAILED", "message" : "Topic not found", "data" : None,}, status=status.HTTP_404_NOT_FOUND)

    if 'q' in request.GET:
        serializer = TopicDetailSerializer(topic, context={'q': request.GET['q']})
    else:
        serializer = TopicDetailSerializer(topic)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

@api_view(['GET'])
def mobile_topic_detail_search(request ,id):
    try:
        topic = Topic.objects.get(id = id)
    except Topic.DoesNotExist:
        return Response({"result" : "FAILED", "message" : "Topic not found", "data" : None,}, status=status.HTTP_404_NOT_FOUND)

    queryset = []
    if 'q' in request.GET:
        q = request.GET['q']
        categories = Category.objects.filter(is_dashboard_visible = True, topic_id=topic.id).filter(Q(name_ENG__icontains=q) | Q(name_AMH__icontains=q)).values('name_ENG')
        indicators = Indicator.objects.filter(is_dashboard_visible = True, for_category__topic=topic).filter(Q(title_ENG__icontains=q) | Q(title_AMH__icontains=q)).values('title_ENG')
        queryset = {"categories" : list(categories) , "indicators" : list(indicators)}
        
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : queryset}, status=status.HTTP_200_OK)

@api_view(['GET'])
def mobile_indicator_detail(request ,id):
    try:
        indicator = Indicator.objects.get(id = id)
    except Indicator.DoesNotExist:
        return Response({"result" : "FAILED", "message" : "Indicator not found", "data" : None,}, status=status.HTTP_404_NOT_FOUND)

    serializer = IndicatorDetailSerializer(indicator ,context = {'request' : request})
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

@api_view(['GET'])
def indicator_performance_detail(request ,id):
    try:
        indicator = Indicator.objects.get(id = id)
    except Indicator.DoesNotExist:
        return Response({"result" : "FAILED", "message" : "Indicator not found", "data" : None,}, status=status.HTTP_404_NOT_FOUND)

    serializer = IndicatorPerformanceSerializer(indicator ,context = {'request' : request})
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

@api_view(['GET'])
def month_lists(request):
    months = Month.objects.all()
    serializer = MonthSerializer(months, many = True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

@api_view(['GET'])
def year_lists(request):
    years = DataPoint.objects.all()
    serializer = YearSerializer(years, many = True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)


##Projects
@api_view(['GET'])
def mobile_projects(request):
    projects = ProjectInitiatives.objects.filter(is_initiative = False)
    serializer = ProjectSerializer(projects , many=True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

##Projects
@api_view(['GET'])
def mobile_initiatives(request):
    initiatives = ProjectInitiatives.objects.filter(is_initiative = True)
    serializer = ProjectSerializer(initiatives , many=True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

@api_view(['GET'])
def mobile_project_detail(request ,id):
    project = ProjectInitiatives.objects.get(id = id)
    serializer = ProjectDetailSerializer(project)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)



@api_view(['GET'])
def general_search(request):
    q = request.GET.get('q', '')
    if not q:
        return Response({"error": "Query parameter 'q' is required."}, status=400)

    indicators = Indicator.objects.filter(
        Q(title_ENG__icontains=q) | Q(title_AMH__icontains=q)
    ).prefetch_related('for_category')

    # Group indicators by category ID
    indicators_by_category = defaultdict(list)
    for indicator in indicators:
        for category in indicator.for_category.all():
            indicators_by_category[category.id].append(indicator)

    # Get all involved categories
    category_ids = indicators_by_category.keys()
    categories = Category.objects.filter(id__in=category_ids)

    serializer = CategoryWithIndicatorsSerializer(
        categories,
        many=True,
        context={'indicators_by_category': indicators_by_category}
    )

    return Response({
        "result": "SUCCESS",
        "message": "SUCCESS",
        "data": serializer.data
    }, status=status.HTTP_200_OK)