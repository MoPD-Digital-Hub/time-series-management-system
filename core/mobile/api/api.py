from rest_framework.response import Response
from collections import defaultdict
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .serializers import *
from mobile.models import MobileDahboardOverview
from Base.models import Topic , ProjectInitiatives , SubProject , Category , Indicator
from django.db.models import Q

from django.http import JsonResponse, HttpResponse
from Base.resource import AnnualDataResource , QuarterDataResource , MonthDataResource  # import your resource

#Time series data
@api_view(['GET'])
def dashboard_overview(request):
    topics = Topic.objects.filter(is_initiative = False, is_dashboard = True)
    serializer = TopicSerializer(topics, many=True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

@api_view(['GET'])
def trending(request):
    indicators = MobileDahboardOverview.objects.all()
    serializer = MobileDashboardOverviewSerializer(indicators, many=True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)


@api_view(['GET'])
def mobile_topic(request):
    topics = Topic.objects.filter(is_initiative = False, is_dashboard = True)
    serializer = TopicSerializer(topics, many=True)
    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

@api_view(['GET'])
def initiatives(request):
    topics = Topic.objects.filter(is_initiative = True, is_dashboard = True)
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
        (Q(title_ENG__icontains=q) | Q(title_AMH__icontains=q)) & Q(is_dashboard_visible=True)
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

@api_view(['GET'])
def indicators_filter(request):
    category_id = request.GET.get("category_id")
    name = request.GET.get("name")

    if not category_id or not name:
        return Response(
            {"error": "Both 'category_id' and 'name' query parameters are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response(
            {"error": f"Category with id {category_id} not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    indicators = Indicator.objects.filter(
        for_category=category,
        title_ENG__iexact=name,
        is_dashboard_visible=True
    )

    serializer = IndicatorSerializer(indicators, many=True)
    return Response({
        "result": "SUCCESS",
        "message": "SUCCESS",
        "data": serializer.data
    }, status=status.HTTP_200_OK)

  
####### Export Data #########
def get_resource_by_data_type(data_type):
    """Return the correct resource class and filename suffix based on data type."""
    data_type = data_type.lower()
    if data_type == 'quarter':
        return QuarterDataResource, "QuarterData"
    elif data_type == 'month':
        return MonthDataResource, "MonthData"
    else:  # default to annual
        return AnnualDataResource, "AnnualData"


def export_dataset(indicators, resource_class, file_type, filename_prefix):
    """Export indicators dataset in requested format and return HttpResponse."""
    dataset = resource_class().export(indicators)

    file_type = file_type.lower()
    if file_type == 'csv':
        content = dataset.csv
        content_type = 'text/csv'
        ext = 'csv'
    elif file_type == 'html':
        content = dataset.html
        content_type = 'text/html'
        ext = 'html'
    else:  # default to Excel
        content = dataset.xlsx
        content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ext = 'xlsx'

    response = HttpResponse(content, content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{filename_prefix}.{ext}"'
    return response


@api_view(['GET'])
def download_topic_data(request, id):
    data_type = request.GET.get("data_type", "annual")
    file_type = request.GET.get("file_type", "xlsx")

    try:
        topic = Topic.objects.get(id=id)
    except Topic.DoesNotExist:
        return Response({"result": "FAILED", "message": "Topic not found", "data": None}, status=404)

    indicators = Indicator.objects.filter(for_category__topic=topic).distinct()
    resource_class, filename_suffix = get_resource_by_data_type(data_type)
    filename_prefix = f"{topic.title_ENG}_{filename_suffix}"

    return export_dataset(indicators, resource_class, file_type, filename_prefix)


@api_view(['GET'])
def download_category_data(request, id):
    data_type = request.GET.get("data_type", "annual")
    file_type = request.GET.get("file_type", "xlsx")

    try:
        category = Category.objects.get(id=id)
    except Category.DoesNotExist:
        return Response({"result": "FAILED", "message": "Category not found", "data": None}, status=404)

    indicators = Indicator.objects.filter(for_category=category).distinct()
    resource_class, filename_suffix = get_resource_by_data_type(data_type)
    filename_prefix = f"{category.name_ENG}_{filename_suffix}"

    return export_dataset(indicators, resource_class, file_type, filename_prefix)


@api_view(['GET'])
def download_indicator_data(request, id):
    data_type = request.GET.get("data_type", "annual")
    file_type = request.GET.get("file_type", "xlsx")

    try:
        indicator = Indicator.objects.get(id=id)
    except Indicator.DoesNotExist:
        return Response({"result": "FAILED", "message": "Indicator not found", "data": None}, status=404)

    # Include the indicator itself and all its children
    indicators = Indicator.objects.filter(models.Q(id=indicator.id) | models.Q(parent=indicator)).distinct()
    resource_class, filename_suffix = get_resource_by_data_type(data_type)
    filename_prefix = f"{indicator.title_ENG}_{filename_suffix}"

    return export_dataset(indicators, resource_class, file_type, filename_prefix)


def serialize_indicator(indicator):
    """
    Recursively serialize an indicator and all its children.
    """
    data = {
        'code': indicator.code or "",
        'name': indicator.title_ENG or "",
        'description': indicator.description or "",
        'unit': indicator.measurement_units or "Number",
        'source': indicator.source or "MoPD",
        'kpi_type': indicator.kpi_characteristics or "",
        'version': indicator.version or "",
        'parent': getattr(indicator.parent, 'title_ENG', None),
        'child': []
    }

    # Recursive children
    children = indicator.children.filter(is_dashboard_visible=True)
    for child in children:
        data['child'].append(serialize_indicator(child))

    return data

def export_json(request, topic_id):
    try:
        topic = Topic.objects.get(id=topic_id)
    except Topic.DoesNotExist:
        return HttpResponse('Topic not found!', status=404)
    

    categories = topic.categories.all()
    all_data = []

    for category in categories:
        # Get top-level indicators (parents only)
        indicators = category.indicators.filter(
            is_dashboard_visible=True,
            parent__isnull=True
        )

        for indicator in indicators:
            all_data.append(serialize_indicator(indicator))
    
    response = HttpResponse(
            json.dumps(all_data, ensure_ascii=False, indent=4),
            content_type='application/json; charset=utf-8'
        )
    response['Content-Disposition'] = f'attachment; filename="{category.name_ENG}_data.json"'
    return response


@api_view(['GET'])
def get_annual_value(request):
    code = request.query_params.get('code')
    year = request.query_params.get('year')

    if not code:
        return Response({"error": "Missing 'code' parameter"}, status=400)
    
    if year:
        try:
            year = int(year)
        except ValueError:
            return Response({"error": "'year' must be an integer"}, status=400)
        
        try:
            annual_data = AnnualData.objects.get(indicator__code=code, for_datapoint__year_EC=year)
            serializer = AIAnnualDataSerializer(annual_data)
            return Response({
                "indicator": code,
                "year": year,
                "value": serializer.data['performance']
            })
        except AnnualData.DoesNotExist:
            return Response({"error": "Data not found"}, status=404)
    else:
        annual_queryset = AnnualData.objects.filter(indicator__code=code).order_by('-for_datapoint__year_EC').exclude(performance = 0)[:10]
        quarter_queryset = QuarterData.objects.filter(indicator__code=code, for_datapoint__isnull = False, for_quarter__isnull = False).order_by('-for_datapoint__year_EC').exclude(performance = 0)[:10]
        month_queryset = MonthData.objects.filter(indicator__code=code, for_datapoint__isnull = False, for_month__isnull = False).order_by('-for_datapoint__year_EC').exclude(performance = 0)[:10]

        if not (annual_queryset.exists() or quarter_queryset.exists() or month_queryset.exists()):
            return Response({"error": "Data not found"}, status=404)

        annual_serializer = AIAnnualDataSerializer(annual_queryset, many=True)
        quarter_serializer = AIQuarterDataSerializer(quarter_queryset, many=True)
        month_serializer = AIMonthDataSerializer(month_queryset, many=True)

        annual_full_series = [
            {
                'year' : item['for_datapoint'],
                'value': item['performance'] 
            }
            for item in annual_serializer.data
        ]

        quarter_full_series = [
            {
                'year' : item['for_datapoint'],
                'quarter' : item['for_quarter'], 
                'value': item['performance'] 
            }
            for item in quarter_serializer.data
        ]

        month_full_series = [
            {
                'year' : item['for_datapoint'],
                'month' : item['for_month'], 
                'value': item['performance'] 
            }
            for item in month_serializer.data
        ]


        return Response({
            "indicator": code,
            "time_series": {
                "annual" : annual_full_series,
                "quarter" : quarter_full_series,
                "month" : month_full_series
            }
        })


##### Updated API For Category

@api_view(['GET'])
def categories(request, topic_id):
    try:
        topic = Topic.objects.get(id = topic_id)
    except Topic.DoesNotExist:
        return Response({"result" : "FAILED", "message" : "Topic not found", "data" : None,}, status=status.HTTP_404_NOT_FOUND)
    
    category_lists = topic.categories.all()
    serializer = UpdatedCategorySerializer(category_lists, many = True)

    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)


@api_view(['GET'])
def kpis(request, category_id):
    try:
        category = Category.objects.get(id = category_id)
    except Category.DoesNotExist:
        return Response({"result" : "FAILED", "message" : "Category not found", "data" : None,}, status=status.HTTP_404_NOT_FOUND)
    
    kpi_lists = category.indicators.all()
    serializer = IndicatorSerializer(kpi_lists, many = True)

    return Response({"result" : "SUCCUSS", "message" : "SUCCUSS", "data" : serializer.data,}, status=status.HTTP_200_OK)

