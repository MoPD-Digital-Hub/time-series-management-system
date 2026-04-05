from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from mobile.models import HighFrequency
from .serializers import (
    HighFrequencySerializer,
    IndicatorMetaDataSerializer,
    TopicTreeTopicSerializer,
)
from itertools import groupby
from collections import defaultdict
from django.db.models import Prefetch
from Base.models import (
    AnnualData,
    Category,
    Indicator,
    MonthData,
    QuarterData,
    Topic,
)

@api_view(['GET'])
def high_frequency(request):
    queryset = HighFrequency.objects.all().order_by('row')
    serializer = HighFrequencySerializer(queryset, many=True)

    data = [
        list(group)
        for _, group in groupby(serializer.data, key=lambda x: x['row'])
    ]

    return Response({
        "result": "SUCCESS",
        "message": "",
        "data": data
    })

@api_view(['GET'])
def ai_indicator_meta_data(request):
    kpis = Indicator.objects.filter(is_dashboard_visible=True,)
    serializer = IndicatorMetaDataSerializer(kpis, many=True)

    return Response(serializer.data)


@api_view(['GET'])
def topic_category_indicator_tree(request):
    topics = (
        Topic.objects.filter(is_dashboard=True, is_initiative=False)
        .prefetch_related(
            Prefetch(
                'categories',
                queryset=Category.objects.filter(
                    is_deleted=False,
                    is_dashboard_visible=True,
                ).order_by('rank', 'id'),
                to_attr='prefetched_categories',
            )
        )
        .order_by('rank', 'id')
    )

    indicators = (
        Indicator.objects.filter(is_verified=True, is_dashboard_visible=True)
        .prefetch_related(
            'for_category',
            Prefetch(
                'annual_data',
                queryset=AnnualData.objects.filter(is_verified=True)
                .select_related('for_datapoint')
                .order_by('for_datapoint__year_EC', 'id'),
                to_attr='verified_annual_data',
            ),
            Prefetch(
                'quarter_data',
                queryset=QuarterData.objects.filter(is_verified=True)
                .select_related('for_datapoint', 'for_quarter')
                .order_by('for_datapoint__year_EC', 'for_quarter__number', 'id'),
                to_attr='verified_quarter_data',
            ),
            Prefetch(
                'month_data',
                queryset=MonthData.objects.filter(is_verified=True)
                .select_related('for_datapoint', 'for_month')
                .order_by('for_datapoint__year_EC', 'for_month__number', 'id'),
                to_attr='verified_month_data',
            ),
        )
        .order_by('rank', 'id')
    )

    children_map = defaultdict(list)
    category_indicator_map = defaultdict(list)

    for indicator in indicators:
        if indicator.parent_id:
            children_map[indicator.parent_id].append(indicator)

        if indicator.parent_id is None:
            for category in indicator.for_category.all():
                category_indicator_map[category.id].append(indicator)

    serializer = TopicTreeTopicSerializer(
        topics,
        many=True,
        context={
            'children_map': children_map,
            'category_indicator_map': category_indicator_map,
        },
    )

    return Response(
        {
            "result": "SUCCESS",
            "message": "Topic tree fetched successfully",
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )
