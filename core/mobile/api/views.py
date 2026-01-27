from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from mobile.models import HighFrequency
from .serializers import HighFrequencySerializer, IndicatorMetaDataSerializer
from itertools import groupby
from Base.models import Indicator

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

    return Response({
            "result": "SUCCESS",
            "message": "",
            "data": serializer.data
        })