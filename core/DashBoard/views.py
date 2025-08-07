from django.shortcuts import render , HttpResponse
from .models import *
from django.contrib.auth.decorators import login_required

# Create your views here.


def index(request):   
    context = {
        'dashboards' : Dashboard.objects.all(),
        'rows' : Row.objects.all()
    } 
    return render(request, 'dashboard/index.html' , context)


def dashboard_detail(request , id): 
    try:
        dashboard = Dashboard.objects.get(id=id)
    except Dashboard.DoesNotExist:
        dashboard = None
    try:
        rows = Row.objects.filter(for_dashboard=Dashboard.objects.get(id=id))
    except Row.DoesNotExist:  
        rows = None
    print(rows)
    context = {
        'dashboard' : dashboard,
        'dashboards' : Dashboard.objects.all(),
        'rows' : rows
    } 
    return render(request, 'dashboard/dashboard_detail.html' , context)
