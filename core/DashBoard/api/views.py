from Base.models import (
    AnnualData , Indicator
)
from DashBoard.models import Component, DashboardIndicator
from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework.response import Response
from DashBoard.models import *
from ..serializer import DashboardSerializer

@api_view(['GET'])
def components(request,id):
    try:
        dashboard = Dashboard.objects.get(id = id)
    except Dashboard.DoesNotExist:
        return Response({'message' : 'Not Found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = DashboardSerializer(dashboard)
        return Response(serializer.data)
    

