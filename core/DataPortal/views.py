from django.shortcuts import render, HttpResponse
from Base.models import (
    Indicator,
    Month,
    MonthData,
    DataPoint
)
from django.contrib.auth.decorators import login_required

# Create your views here.




@login_required(login_url='login')
def index(request):
    return render(request, 'data_portal/index.html')


@login_required(login_url='login')
def detail_indicator(request, id):
    try:
        indicator = Indicator.objects.get(id=id)
    except Indicator.DoesNotExist:
        return HttpResponse(404)
    
    context = {
        'indicator' : indicator
    }
    return render(request, 'data_portal/detail_indicator.html', context=context)