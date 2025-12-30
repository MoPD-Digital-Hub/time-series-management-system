from django.db import models
from fontawesome_5.fields import IconField
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
import json
from UserManagement.models import ResponsibleEntity
from ethiopian_date_converter.ethiopian_date_convertor import to_ethiopian, to_gregorian, EthDate
from datetime import date


class Topic(models.Model):
    title_ENG = models.CharField(max_length=300, unique = True)
    title_AMH = models.CharField(max_length=300, null = True)
    is_dashboard = models.BooleanField(default = False)
    is_mobile_dashaboard_overview = models.BooleanField(default = False)
    rank = models.IntegerField(null=True, blank=True)
    icon = IconField()
    image = models.FileField(upload_to="media/topic-image" , null=True, blank=True)
    image_icons = models.FileField(upload_to="media/image_icons" , null=True, blank=True)
    background_image = models.FileField(upload_to="media/background_image" , null=True, blank=True)
    is_initiative = models.BooleanField(default=False)
    description = models.TextField(null=True, blank=True)
    updated =  models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title_ENG
    
    def get_document_lists(self):
        return Document.objects.filter(topic = self)
    class Meta:
        ordering = ['rank'] 

class Document(models.Model):
    # Responsible to store file documents
    title_ENG = models.CharField(max_length=300, unique = True)
    title_AMH = models.CharField(max_length=300, null = True)
    topic = models.ForeignKey(Topic, null=True, blank=True, on_delete=models.SET_NULL)
    file= models.FileField(upload_to='documents/')

    def __str__(self):
        return self.title_ENG

class Category(models.Model):
    name_ENG = models.CharField(max_length=300, unique = True)
    name_AMH = models.CharField(max_length=300, unique = True)
    code = models.CharField(max_length=10, unique=True)
    is_reginal = models.BooleanField(default=False)
    is_dashboard_visible = models.BooleanField(default = False)
    topic = models.ForeignKey(Topic, null=True, blank=True, on_delete=models.SET_NULL, related_name='categories')
    rank = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    is_deleted = models.BooleanField(default=False)


    class Meta:
        ordering = ['rank'] 

    def __str__(self):
        return self.name_ENG

class Tag(models.Model):
    title = models.CharField(max_length=30)

    def __str__(self):
        return self.title

class Indicator(models.Model):
    KPI_CHARACTERISTIC_CHOICES = [
        ('inc', 'Increasing'),
        ('dec', 'Decreasing'),
        ('const', 'Constant'),
        ('volatile', 'Volatile'),
    ]

    FREQUENCY_CHOICES = [
        ('month', 'month'),
        ('quarter', 'quarter'),
        ('biannual', 'Biannual'),
        ('annual', 'annual'),
    ]


    DATA_TYPE_CHOICE = [
        ('number', 'Integer'),
        ('decimal', 'Decimal'),
        ('percentage', 'Percentage'),
    ]

    STATUS_CHOICE = [
        ('active', 'Active'),
        ('deprecated', 'Deprecated'),
        ('under_development', 'Under Development'),
        ('pending_review', 'Pending Review'), 
    ]


    title_ENG = models.CharField(max_length=300)
    title_AMH = models.CharField(max_length=300, null=True, blank=True)
    code = models.CharField(max_length=100, unique=True, blank=True, null=True)
    rank = models.IntegerField(default=0)
    for_category = models.ManyToManyField("Category", related_name='indicators')
    description = models.TextField(null=True, blank=True)
    measurement_units = models.CharField(max_length=50, null=True, blank=True, default="")
    measurement_units_quarter = models.CharField(max_length=50, null=True, blank=True, default="")
    measurement_units_month = models.CharField(max_length=50, null=True, blank=True, default="")
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, null=True, blank=True)
    source = models.TextField(null=True, blank=True)
    methodology = models.TextField(null=True, blank=True)
    disaggregation_dimensions = models.CharField(max_length=200, null=True, blank=True)
    time_coverage_start_year = models.ForeignKey("DataPoint", on_delete=models.SET_NULL, null=True, blank=True, related_name='indicator_start_year')
    time_coverage_end_year = models.ForeignKey("DataPoint", on_delete=models.SET_NULL, null=True, blank=True, related_name='indicator_end_year')
    data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICE, null=True, blank=True)
    responsible_entity = models.CharField(max_length=300, null=True, blank=True)
    tags = models.CharField(max_length=70,null=True, blank=True)
    sdg_link = models.CharField(max_length=300, null=True, blank=True)
    status = models.CharField(max_length=200, choices=STATUS_CHOICE, default="active")
    version = models.IntegerField(default=1)
    collection_Instrument = models.CharField(max_length=200, null=True, blank=True)
    parent = models.ForeignKey('self', related_name='children', on_delete=models.CASCADE, blank=True, null=True)
    kpi_characteristics = models.CharField(max_length=20, choices=KPI_CHARACTERISTIC_CHOICES, default="inc")
    is_dashboard_visible = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)
    main_parent = models.BooleanField(default=False)
    image = models.FileField(upload_to='indicator/images/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id'] 

    
    def generate_code(self):
        # Top-level indicator
        if not self.code and self.parent is None: 
            categories = list(self.for_category.all().order_by('code')) if self.for_category.exists() else []
            if categories:
                prefix = "-".join([cat.code.upper() for cat in categories])
                existing_codes = Indicator.objects.filter(
                    code__startswith=f"{prefix}-", parent__isnull=True
                ).values_list('code', flat=True)

                max_suffix = 0
                for code in existing_codes:
                    try:
                        suffix = int(code.split("-")[-1])
                        if suffix > max_suffix:
                            max_suffix = suffix
                    except (IndexError, ValueError):
                        continue

                new_suffix = max_suffix + 1
                self.code = f"{prefix}-{new_suffix:02d}"
        # Child indicator
        elif self.parent and self.parent.code:
            parent_code = self.parent.code
            siblings = Indicator.objects.filter(parent=self.parent).exclude(pk=self.pk)
            child_numbers = []

            for s in siblings:
                try:
                    suffix = s.code.replace(f"{parent_code}.", "")
                    parts = suffix.split(".")
                    if parts and parts[0].isdigit():
                        child_numbers.append(int(parts[0]))
                except (AttributeError, ValueError):
                    continue

            next_number = (max(child_numbers) if child_numbers else 0) + 1
            self.code = f"{parent_code}.{next_number}"

    # def save(self , *args , **kwargs ):
    #     super(Indicator, self).save(*args, **kwargs)
    #     if not self.code:
    #         self.generate_code()
    #         self.save()
    
    def __str__(self):
        return f"{self.title_ENG} ({self.code})"
    
class DataPoint(models.Model):
    year_EC = models.IntegerField(unique=True)
    year_GC = models.CharField(max_length=10,unique = True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-year_EC'] 

    def __str__(self):
        return str(self.year_EC)
    def save(self, *args, **kwargs):
        self.year_GC = f'{str(int(self.year_EC )+ 7)}/{str(int(self.year_EC)+ 8)}'
        super(DataPoint, self).save(*args, **kwargs)
    
class Quarter(models.Model):
    title_ENG = models.CharField(max_length=50)
    title_AMH = models.CharField(max_length=50)
    number = models.IntegerField()
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['number']
    
    def __str__(self):
        return self.title_AMH + " " + self.title_AMH
    
class Month(models.Model):
    month_ENG = models.CharField(max_length=50)
    month_AMH = models.CharField(max_length=50)
    number = models.IntegerField()
    is_fiscal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['number']

    def __str__(self):
        return self.month_AMH + " : " + self.month_ENG + " ==> " + str(self.number)   

class MonthData(models.Model):
    indicator = models.ForeignKey(Indicator, on_delete=models.SET_NULL, blank=True ,null=True , related_name='month_data')
    for_month = models.ForeignKey(Month, on_delete=models.SET_NULL, blank=True ,null=True)
    for_datapoint = models.ForeignKey(DataPoint, on_delete=models.SET_NULL, blank=True, null=True)
    performance = models.FloatField(blank=True ,null=True)
    target = models.FloatField(blank=True ,null=True)
    created_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False, verbose_name="Verified")

    def __str__(self):
        if self.indicator:
            return self.indicator.title_ENG + " " + self.for_month.month_AMH
    
    class Meta:
        ordering = ['for_datapoint__year_EC' , 'for_month__number']
    
      
    def get_previous_year_performance(self):
        # Calculate and return the change in performance compared to the previous year
        if self.for_datapoint:
            previous_year = int (self.for_datapoint.year_EC) - 1
            previous_year = str(previous_year)
            try:
                
                previous_year_plan = MonthData.objects.get(
                    for_datapoint__year_EC=previous_year,
                    for_month = self.for_month,
                    indicator=self.indicator,
                )
                
                if previous_year_plan.performance is not None and self.performance is not None and previous_year_plan.performance != 0:
                    performance_change = self.performance - previous_year_plan.performance


                    performance_change_percent = (
                        (self.performance - previous_year_plan.performance)/previous_year_plan.performance) * 100

                    if self.indicator.kpi_characteristics == 'inc':
                        # For increasing KPIs, positive change is good, and negative change is bad
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" :round(performance_change_percent,1)
                            }
                    elif self.indicator.kpi_characteristics == 'dec':
                        # For decreasing KPIs, negative change is good, and positive change is bad
                        return {
                            "change" : round(-performance_change, 1), 
                            "percent" :round(-performance_change_percent,1)
                            }
                    else:
                        # For constant KPIs, return the change without modifying its sign
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" : round(performance_change_percent,1)
                        }
                else:
                    return None
            except MonthData.DoesNotExist:
                return None
        return None
    

        
    def get_indicator_value_5_years_ago(self):
        # Calculate and return the change in performance compared to the previous year
        if self.for_datapoint:
            previous_year = int (self.for_datapoint.year_EC) - 5
            previous_year = str(previous_year)
            try:
                
                previous_year_plan = MonthData.objects.get(
                    for_datapoint__year_EC=previous_year,
                    for_month = self.for_month,
                    indicator=self.indicator,
                )
                
                if previous_year_plan.performance is not None and self.performance is not None and previous_year_plan.performance != 0:
                    performance_change = self.performance - previous_year_plan.performance


                    performance_change_percent = (
                        (self.performance - previous_year_plan.performance)/previous_year_plan.performance) * 100

                    if self.indicator.kpi_characteristics == 'inc':
                        # For increasing KPIs, positive change is good, and negative change is bad
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" :round(performance_change_percent,1)
                            }
                    elif self.indicator.kpi_characteristics == 'dec':
                        # For decreasing KPIs, negative change is good, and positive change is bad
                        return {
                            "change" : round(-performance_change, 1), 
                            "percent" :round(-performance_change_percent,1)
                            }
                    else:
                        # For constant KPIs, return the change without modifying its sign
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" : round(performance_change_percent,1)
                        }
                else:
                    return None
            except MonthData.DoesNotExist:
                return None
        return None
    

    def get_indicator_value_10_years_ago(self):
        # Calculate and return the change in performance compared to the previous year
        if self.for_datapoint:
            previous_year = int (self.for_datapoint.year_EC) - 10
            previous_year = str(previous_year)
            try:
                
                previous_year_plan = MonthData.objects.get(
                    for_datapoint__year_EC=previous_year,
                    for_month = self.for_month,
                    indicator=self.indicator,
                )
                
                if previous_year_plan.performance is not None and self.performance is not None and previous_year_plan.performance != 0:
                    performance_change = self.performance - previous_year_plan.performance


                    performance_change_percent = (
                        (self.performance - previous_year_plan.performance)/previous_year_plan.performance) * 100

                    if self.indicator.kpi_characteristics == 'inc':
                        # For increasing KPIs, positive change is good, and negative change is bad
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" :round(performance_change_percent,1)
                            }
                    elif self.indicator.kpi_characteristics == 'dec':
                        # For decreasing KPIs, negative change is good, and positive change is bad
                        return {
                            "change" : round(-performance_change, 1), 
                            "percent" :round(-performance_change_percent,1)
                            }
                    else:
                        # For constant KPIs, return the change without modifying its sign
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" : round(performance_change_percent,1)
                        }
                else:
                    return None
            except MonthData.DoesNotExist:
                return None
        return None
    
class QuarterData(models.Model):
    indicator = models.ForeignKey(Indicator, on_delete=models.SET_NULL, blank=True ,null=True , related_name='quarter_data')
    for_quarter = models.ForeignKey(Quarter, on_delete=models.SET_NULL, blank=True ,null=True)
    for_datapoint = models.ForeignKey(DataPoint, on_delete=models.SET_NULL, blank=True, null=True)
    performance = models.FloatField(blank=True ,null=True)
    target = models.FloatField(blank=True ,null=True)
    created_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False, verbose_name="Verified")

    def __str__(self):
        if self.indicator:
            return self.indicator.title_ENG + " " + self.for_quarter.title_AMH
        
    
    class Meta:
        ordering = ['for_datapoint__year_EC' , 'for_quarter__number']
    
    def get_previous_year_performance(self):
        # Calculate and return the change in performance compared to the previous year
        if self.for_datapoint:
            previous_year = int (self.for_datapoint.year_EC) - 1
            previous_year = str(previous_year)
            try:
                
                previous_year_plan = QuarterData.objects.get(
                    for_datapoint__year_EC=previous_year,
                    for_quarter = self.for_quarter,
                    indicator=self.indicator,
                )
                
                if previous_year_plan.performance is not None and self.performance is not None and previous_year_plan.performance != 0:
                    performance_change = self.performance - previous_year_plan.performance


                    performance_change_percent = (
                        (self.performance - previous_year_plan.performance)/previous_year_plan.performance) * 100

                    if self.indicator.kpi_characteristics == 'inc':
                        # For increasing KPIs, positive change is good, and negative change is bad
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" :round(performance_change_percent,1)
                            }
                    elif self.indicator.kpi_characteristics == 'dec':
                        # For decreasing KPIs, negative change is good, and positive change is bad
                        return {
                            "change" : round(-performance_change, 1), 
                            "percent" :round(-performance_change_percent,1)
                            }
                    else:
                        # For constant KPIs, return the change without modifying its sign
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" : round(performance_change_percent,1)
                        }
                else:
                    return None
            except QuarterData.DoesNotExist:
                return None
        return None
    

    def get_performance_value_5_years_ago(self):
        # Calculate and return the change in performance compared to the previous year
        
        if self.for_datapoint:
            previous_year = int (self.for_datapoint.year_EC) - 5
            previous_year = str(previous_year)
            try:
                
                previous_year_plan = QuarterData.objects.get(
                    for_datapoint__year_EC=previous_year,
                    for_quarter = self.for_quarter,
                    indicator=self.indicator,
                )
                
                if previous_year_plan.performance is not None and self.performance is not None and previous_year_plan.performance != 0:
                    performance_change = self.performance - previous_year_plan.performance


                    performance_change_percent = (
                        (self.performance - previous_year_plan.performance)/previous_year_plan.performance) * 100

                    if self.indicator.kpi_characteristics == 'inc':
                        # For increasing KPIs, positive change is good, and negative change is bad
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" :round(performance_change_percent,1)
                            }
                    elif self.indicator.kpi_characteristics == 'dec':
                        # For decreasing KPIs, negative change is good, and positive change is bad
                        return {
                            "change" : round(-performance_change, 1), 
                            "percent" :round(-performance_change_percent,1)
                            }
                    else:
                        # For constant KPIs, return the change without modifying its sign
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" : round(performance_change_percent,1)
                        }
                else:
                    return None
            except QuarterData.DoesNotExist:
                return None
        return None
    
    def get_performance_value_10_years_ago(self):
        # Calculate and return the change in performance compared to the previous year
        if self.for_datapoint:
            previous_year = int (self.for_datapoint.year_EC) - 10
            previous_year = str(previous_year)
            try:
                
                previous_year_plan = QuarterData.objects.get(
                    for_datapoint__year_EC=previous_year,
                    for_quarter = self.for_quarter,
                    indicator=self.indicator,
                )
                
                if previous_year_plan.performance is not None and self.performance is not None and previous_year_plan.performance != 0:
                    performance_change = self.performance - previous_year_plan.performance


                    performance_change_percent = (
                        (self.performance - previous_year_plan.performance)/previous_year_plan.performance) * 100

                    if self.indicator.kpi_characteristics == 'inc':
                        # For increasing KPIs, positive change is good, and negative change is bad
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" :round(performance_change_percent,1)
                            }
                    elif self.indicator.kpi_characteristics == 'dec':
                        # For decreasing KPIs, negative change is good, and positive change is bad
                        return {
                            "change" : round(-performance_change, 1), 
                            "percent" :round(-performance_change_percent,1)
                            }
                    else:
                        # For constant KPIs, return the change without modifying its sign
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" : round(performance_change_percent,1)
                        }
                else:
                    return None
            except QuarterData.DoesNotExist:
                return None
        return None
    
class AnnualData(models.Model):
    indicator = models.ForeignKey(Indicator, on_delete=models.SET_NULL, related_name='annual_data' ,blank=True ,null=True)
    for_datapoint = models.ForeignKey(DataPoint, on_delete=models.SET_NULL, blank=True, null=True)
    performance = models.FloatField(blank=True ,null=True)
    target = models.FloatField(blank=True ,null=True)
    created_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False, verbose_name="Verified")

    def save(self, *args, **kwargs):
        # Round performance to two decimal places before saving
        if self.performance is not None:
            try:
                self.performance = round(self.performance, 2)
            except:
                pass    
        super().save(*args, **kwargs)


    def __str__(self):
        if self.indicator:
            return self.indicator.title_ENG
        else:
            return str(self.performance)
    
    class Meta:
        ordering = ['for_datapoint__year_EC']
        #unique_together = ('indicator', 'for_datapoint')
    
    def get_previous_year_performance(self):
        # Calculate and return the change in performance compared to the previous year
        if self.for_datapoint:
            previous_year = int (self.for_datapoint.year_EC) - 1
            previous_year = str(previous_year)
            try:
                
                previous_year_plan = AnnualData.objects.get(
                    for_datapoint__year_EC=previous_year,
                    indicator=self.indicator,
                )
                
                if previous_year_plan.performance is not None and self.performance is not None and previous_year_plan.performance != 0:
                    performance_change = self.performance - previous_year_plan.performance


                    performance_change_percent = (
                        (self.performance - previous_year_plan.performance)/previous_year_plan.performance) * 100

                    if self.indicator.kpi_characteristics == 'inc':
                        # For increasing KPIs, positive change is good, and negative change is bad
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" :round(performance_change_percent,1)
                            }
                    elif self.indicator.kpi_characteristics == 'dec':
                        # For decreasing KPIs, negative change is good, and positive change is bad
                        return {
                            "change" : round(-performance_change, 1), 
                            "percent" :round(-performance_change_percent,1)
                            }
                    else:
                        # For constant KPIs, return the change without modifying its sign
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" : round(performance_change_percent,1)
                        }
                else:
                    return None
            except AnnualData.DoesNotExist:
                return None
        return None
    
    def get_performance_value_5_years_ago(self):
        # Calculate and return the change in performance compared to the previous year
        if self.for_datapoint:
            previous_year = int (self.for_datapoint.year_EC) - 5
            previous_year = str(previous_year)
            try:
                
                previous_year_plan = AnnualData.objects.get(
                    for_datapoint__year_EC=previous_year,
                    indicator=self.indicator,
                )
                
                if previous_year_plan.performance is not None and self.performance is not None and previous_year_plan.performance != 0:
                    performance_change = self.performance - previous_year_plan.performance


                    performance_change_percent = (
                        (self.performance - previous_year_plan.performance)/previous_year_plan.performance) * 100

                    if self.indicator.kpi_characteristics == 'inc':
                        # For increasing KPIs, positive change is good, and negative change is bad
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" :round(performance_change_percent,1)
                            }
                    elif self.indicator.kpi_characteristics == 'dec':
                        # For decreasing KPIs, negative change is good, and positive change is bad
                        return {
                            "change" : round(-performance_change, 1), 
                            "percent" :round(-performance_change_percent,1)
                            }
                    else:
                        # For constant KPIs, return the change without modifying its sign
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" : round(performance_change_percent,1)
                        }
                else:
                    return None
            except AnnualData.DoesNotExist:
                return None
        return None
    
    def get_performance_value_10_years_ago(self):
        # Calculate and return the change in performance compared to the previous year
        if self.for_datapoint:
            previous_year = int (self.for_datapoint.year_EC) - 10
            previous_year = str(previous_year)
            try:
                
                previous_year_plan = AnnualData.objects.get(
                    for_datapoint__year_EC=previous_year,
                    indicator=self.indicator,
                )
                
                if previous_year_plan.performance is not None and self.performance is not None and previous_year_plan.performance != 0:
                    performance_change = self.performance - previous_year_plan.performance


                    performance_change_percent = (
                        (self.performance - previous_year_plan.performance)/previous_year_plan.performance) * 100

                    if self.indicator.kpi_characteristics == 'inc':
                        # For increasing KPIs, positive change is good, and negative change is bad
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" :round(performance_change_percent,1)
                            }
                    elif self.indicator.kpi_characteristics == 'dec':
                        # For decreasing KPIs, negative change is good, and positive change is bad
                        return {
                            "change" : round(-performance_change, 1), 
                            "percent" :round(-performance_change_percent,1)
                            }
                    else:
                        # For constant KPIs, return the change without modifying its sign
                        return {
                            "change" : round(performance_change, 1), 
                            "percent" : round(performance_change_percent,1)
                        }
                else:
                    return None
            except AnnualData.DoesNotExist:
                return None
        return None


class KPIRecord(models.Model):
    """
    Stores KPI performance and target data for a specific organization and date.
    Supports dynamic allocation (from_org -> to_org) and weighted performance.
    """
    RECORD_TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]

    indicator = models.ForeignKey(
        Indicator, null=True ,on_delete=models.SET_NULL, related_name='records',
        help_text="Select the KPI this record belongs to"
    )
    record_type = models.CharField(max_length=100, choices=RECORD_TYPE_CHOICES, default='quarterly')
    target = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Target value for this KPI"
    )
    performance = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Actual performance value for this KPI"
    )
    date = models.DateField(
        help_text="The date this KPI record is associated with"
    )

    class Meta:
        indexes = [
            models.Index(fields=['indicator', 'date']),
            models.Index(fields=['date']),
            models.Index(fields=['record_type']),
        ]
        ordering = ['-date']
        verbose_name = "KPI Record"
        verbose_name_plural = "KPI Records"
        unique_together = ('indicator', 'record_type', 'date')

    @property
    def ethio_date(self):
        """
        Returns the Ethiopian date formatted according to the KPI frequency:
        - yearly: YYYY
        - quarterly/monthly: YYYY-MM
        - daily/weekly: YYYY-MM-DD
        """
      

        gregorian_date = EthDate(self.date.day, self.date.month, self.date.year)
        eth_date = to_ethiopian(gregorian_date)

        freq = getattr(self, 'record_type', 'daily')
      

        if  freq == 'weekly':
            eth_year = eth_date.year
            eth_month = eth_date.month 
            week = ((eth_date.day  - 1) // 7) + 1
            week = min(week , 4)
            return f"{eth_year}-{eth_month}-{week}"
        elif freq in ('daily'):
            return f"{eth_date.year}-{eth_date.month:02d}-{eth_date.day:02d}"
        else:
            return f"{eth_date.year}-{eth_date.month:02d}-{eth_date.day:02d}"
    
    @staticmethod
    def create_aggregate_data(indicator):
        daily = KPIRecord.objects.filter(
            indicator=indicator,
            record_type='daily'
        )

        groups = {}

        for r in daily:
            # Convert Gregorian -> Ethiopian using your method
            eth = to_ethiopian(EthDate(r.date.day, r.date.month, r.date.year))

            week = min(((eth.day - 1) // 7) + 1, 4)
            key = (eth.year, eth.month, week)

            groups.setdefault(key, []).append(r)

        # Aggregate
        for key, items in groups.items():
            if len(items) < 5:
                continue

            tot_perf = sum(i.performance or 0 for i in items)
            tot_target = sum(i.target or 0 for i in items)

            first_date = items[0].date

            KPIRecord.objects.update_or_create(
                indicator=indicator,
                record_type='weekly',
                date=first_date,
                defaults={
                    'performance': tot_perf,
                    'target': tot_target,
                }
            )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if self.record_type == 'daily':
            KPIRecord.create_aggregate_data(self.indicator)
        
    
    def __str__(self):
        return f"{self.indicator} ({self.date}) - Target: {self.target}, Perf: {self.performance}"
    

class ProjectInitiatives(models.Model):
    title_ENG = models.CharField(max_length=50)
    title_AMH = models.CharField(max_length=50)
    description = models.TextField()  
    image = models.FileField(upload_to="media/image" , null=True, blank=True)
    image_icons = models.FileField(upload_to="media/image_icons" , null=True, blank=True)
    is_initiative = models.BooleanField(default=False)
    content = models.JSONField(null=True , blank=True)  
    updated = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title_ENG

class SubProject(models.Model):
    title_ENG = models.CharField(max_length=50)
    title_AMH = models.CharField(max_length=50)
    project = models.ForeignKey(ProjectInitiatives, on_delete=models.SET_NULL, null=True, blank=True , related_name='sub_projects')
    description = models.TextField()
    image = models.FileField(upload_to="media/image" , null=True, blank=True)
    image_icons = models.FileField(upload_to="media/image_icons" , null=True, blank=True)  
    content = models.JSONField(null=True , blank=True) 
    data = models.JSONField(null=True , blank=True) 
    is_regional = models.BooleanField(default=False)
    is_stats = models.BooleanField(default=False)
    updated = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'({self.project.title_ENG})'  + ' - ' + self.title_ENG
    
    def save(self , *args , **kwargs ):
        if(self.content):
            data = json.loads(self.content)
            headers = data[0]
            rows = data[1:]  
            structured_data = []
            for row in rows:
                row_data = {headers[i]: row[i] for i in range(len(headers))}
                structured_data.append(row_data)
            
            self.data = json.dumps(structured_data)

        super(SubProject, self).save(*args, **kwargs)

    class Meta:
        ordering = ['project__title_ENG'] #Oldest First
         
            
class TrendingIndicator(models.Model):
    indicator = models.ForeignKey(Indicator, related_name="trending_entries", on_delete=models.CASCADE, verbose_name="Indicator", null=True, blank=True)
    performance = models.DecimalField(max_digits=20, decimal_places=5, blank=True, null=True)
    direction = models.CharField(max_length=4, choices=[('up','Up'),('down','Down')])
    note = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Trending Indicator"
        verbose_name_plural = "Trending Indicators"

    def save(self, *args, **kwargs):
        if self.performance is None and self.indicator_id:
            from .models import AnnualData
            latest = AnnualData.objects.filter(indicator_id=self.indicator_id).order_by('-data_point__year_gc').first()
            if latest:
                self.value = latest.value
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.indicator.title_ENG} ({self.performance}) {self.direction}"



















####################################### Test #################################
class Video(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    like = models.IntegerField(default=0)
    video = models.FileField(upload_to='videos/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    def add_like(self):
        self.like += 1
        self.save()
    
    def remove_like(self):
        if self.like > 0:
            self.like -= 1
            self.save()