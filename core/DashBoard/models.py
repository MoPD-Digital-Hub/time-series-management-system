from django.db import models
from Base.models import Indicator
from Base.models import DataPoint, Month, Quarter,AnnualData

colors = {
    ('blue' , 'blue'),
    ('red' , 'red'),
    ('green' , 'green'),
}

component_category = {
    ('card' , 'card'),
    ('graph' , 'graph'),
    ('table' , 'table'),
}

row_style = {
    ('justify-content-start', 'Start'),
    ('justify-content-end', 'End'),
    ('justify-content-center', 'Center'),
    ('justify-content-between', 'Gap between'),
}


class Component(models.Model):
    data_type_options = (
        ('year','year'),
        ('month','month'),
        ('quarter','quarter'),
    )
    
    name = models.CharField(max_length=50)
    category = models.CharField(choices=component_category , max_length=50)
    is_multiple = models.BooleanField(default=False)
    is_range = models.BooleanField(default=False)
    is_single_year =  models.BooleanField(default=False)
    has_title = models.BooleanField(default=True)
    has_description = models.BooleanField(default=False)
    has_indicator = models.BooleanField(default=True)
    has_icon = models.BooleanField(default=False)
    is_country = models.BooleanField(default=False)
    data_type = models.CharField(choices=data_type_options, max_length=10,null=True, blank=True)
    image = models.ImageField(upload_to='components/', null=True, blank=True)
    path = models.CharField(max_length=50, unique=True)
    is_custom = models.BooleanField(default=False)
    is_image_component = models.BooleanField(default=False)

    def __str__(self):
        return self.name
    

class Dashboard(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    color = models.CharField(choices=colors , max_length=50, null=True, blank=True)
    icon = models.CharField(max_length=30, null=True, blank=True)

    def row_list(self):
        return Row.objects.filter(for_dashboard=self)

    def __str__(self):
        return self.title

class Row(models.Model):
    rank = models.IntegerField()
    for_dashboard = models.ForeignKey(Dashboard , on_delete=models.CASCADE , related_name='rows')
    style =models.CharField(max_length=100, choices=row_style, default='justify-content-start')


    class Meta:
        ordering = ['rank'] 

    def col_list(self):
        return DashboardIndicator.objects.filter(for_row=self)

    def __str__(self):
        return str(self.rank) + ' ' + self.for_dashboard.title + ' ' + str(self.id)


sizes = (('25%', '25%'), ('33%', '33%'), ('50%', '50%'), ('100%', '100%'))



class DashboardIndicator(models.Model):
    for_row = models.ForeignKey(Row , on_delete=models.CASCADE, related_name='cols')
    indicator = models.ManyToManyField(Indicator,blank=True ,related_name='indicator')  
    component = models.ForeignKey(Component ,  on_delete=models.SET_NULL , null = True , related_name='component')
    year = models.ForeignKey( DataPoint,on_delete=models.SET_NULL, null=True, blank=True, related_name="year")
    title = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    data_range_start = models.ForeignKey(DataPoint,null=True, blank=True, related_name="dateStartDataPoint" ,on_delete=models.SET_NULL)
    data_range_end = models.ForeignKey(DataPoint,null=True, blank=True, related_name="dateEndDataPoint" ,on_delete=models.SET_NULL)
    rank = models.IntegerField(default=0)
    icon = models.ImageField(upload_to='dashboard/icon/', null=True, blank=True)
    width = models.CharField(choices=sizes , max_length=50 , default='50%', null=True , blank=True)
    addis_ababa = models.FloatField(null=True, blank=True)
    tigray = models.FloatField(null=True, blank=True)
    amhara = models.FloatField(null=True, blank=True)
    oromia = models.FloatField(null=True, blank=True)
    somali = models.FloatField(null=True, blank=True)
    afar = models.FloatField(null=True, blank=True)
    benshangul_gumuz = models.FloatField(null=True, blank=True)
    dire_dawa = models.FloatField(null=True, blank=True)
    gambella = models.FloatField(null=True, blank=True)
    snnp = models.FloatField(null=True, blank=True)
    harari = models.FloatField(null=True, blank=True)
    custom_value = models.CharField(max_length=50 , null=True,  blank=True)
    image = models.ImageField(upload_to='dashboard/images/', null=True, blank=True)

    def __str__(self):
        return str(self.for_row.rank) 
    
    class Meta:
        ordering = ['rank'] 


    def get_annual_value(self,start_date=None, end_date=None, year=None):
        indicator = self.indicator.all()
        if (start_date and end_date) and not year:
            annual = AnnualData.objects.filter(indicator__in = indicator ,for_datapoint__year_EC__range=(start_date, end_date))
            return annual
        else:
            annual = AnnualData.objects.filter(indicator__in = indicator ,for_datapoint__year_EC=year)
            return annual   
         
