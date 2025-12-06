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



def export_json(request, topic_id):
    try:
        topic = Topic.objects.get(id=topic_id)
    except Topic.DoesNotExist:
        return HttpResponse('Topic not found!', status=404)
    
    all_data = []
    categories = topic.categories.all()

    for category in categories:

        indicators = category.indicators.filter(is_dashboard_visible=True)
        
        for indicator in indicators:
            # Handle ManyToMany or ForeignKey relations
            if hasattr(indicator.for_category, 'all'):
                categories_list = indicator.for_category.all()
            else:
                categories_list = [indicator.for_category] if indicator.for_category else []

            category_names = [c.name_ENG for c in categories_list if hasattr(c, 'name_ENG')]
            topic_titles = [getattr(c.topic, 'title_ENG', None) for c in categories_list if getattr(c, 'topic', None)]

            category_names_str = ", ".join(category_names)
            topic_titles_str = ", ".join(topic_titles)

            data = {
                'code': indicator.code or "",
                'name': indicator.title_ENG or "",
                'description': indicator.description or "",
                
                'topic': topic_titles_str or "",
                'category': category_names_str or "",

                "unit": indicator.measurement_units or "Number",
                'source': indicator.source or "MoPD",
                'kpi_type': indicator.kpi_characteristics or "",
                'version': indicator.version or "",
                'parent': getattr(indicator.parent, 'title_ENG', ""),   
        
            }


            annual_years = [a.for_datapoint.year_EC for a in indicator.annual_data.all() if a.for_datapoint]
            if annual_years:
                annual_data = [
                    (a.for_datapoint.year_EC, a.performance)
                    for a in indicator.annual_data.all()
                    if a.for_datapoint and a.performance is not None and a.performance != 0
                ]

                if annual_data:
                    # Extract years and determine min/max
                    years = [year for year, value in annual_data]
                    min_year = min(years)
                    max_year = max(years)

                    # Compute latest value
                    latest_value = next(
                        (value for year, value in annual_data if year == max_year),
                        None
                    )

                    # Update summary data
                    # data.update({
                    #     "start_year": min_year,
                    #     "end_year": max_year,
                    #     "latest_year": max_year,
                    #     "latest_value": float(latest_value) if latest_value is not None else None,
                    # })

                    # year_rows = {
                    #     f"year_{year}": float(value)
                    #     for year, value in annual_data
                    # }

                    # data.update(year_rows)


            # # === Quarterly data: last 4 years ===
            # quarter_years = [q.for_datapoint.year_EC for q in indicator.quarter_data.all() if q.for_datapoint]
            # if quarter_years:
            #     max_quarter_year = max(quarter_years)
            #     min_quarter_year = max_quarter_year - 3  # last 4 years
            #     quarter_values = {
            #         f"{q.for_datapoint.year_EC} - {q.for_quarter.title_ENG}": q.performance
            #         for q in indicator.quarter_data.all()
            #         if (
            #             q.performance is not None
            #             and q.for_datapoint
            #             and min_quarter_year <= q.for_datapoint.year_EC <= max_quarter_year
            #         )
            #     }
            #     if quarter_values:
            #         data.update(quarter_values)
            # else:
            #     quarter_values = {}

            # # === Monthly data: last 2 years ===
            # month_years = [m.for_datapoint.year_EC for m in indicator.month_data.all() if m.for_datapoint]
            # if month_years:
            #     max_month_year = max(month_years)
            #     min_month_year = max_month_year - 1  # last 2 years
            #     month_values = {
            #         f"{m.for_datapoint.year_EC} - {m.for_month.month_AMH}": m.performance
            #         for m in indicator.month_data.all()
            #         if (
            #             m.performance is not None
            #             and m.for_datapoint
            #             and min_month_year <= m.for_datapoint.year_EC <= max_month_year
            #         )
            #     }
            #     if month_values:
            #         data.update(month_values)
            # else:
            #     month_values = {}

            all_data.append(data)

    
    
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
        # Return full time series
        annual_queryset = AnnualData.objects.filter(indicator__code=code).order_by('for_datapoint__year_EC').exclude(performance = 0)
        if not annual_queryset.exists():
            return Response({"error": "Data not found"}, status=404)

        serializer = AIAnnualDataSerializer(annual_queryset, many=True)
        # Build dict {year: value} for convenience
        full_series = {item['for_datapoint']: item['performance'] for item in serializer.data}
        return Response({
            "indicator": code,
            "time_series": full_series
        })
