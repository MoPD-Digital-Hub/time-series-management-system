from mobile.models import MobileDahboardOverview
from rest_framework import serializers
from django.db.models import OuterRef, Subquery
from django.db.models import IntegerField
from django.db.models.functions import Cast, Substr
from Base.models import *
from django.db.models import Q, F
import json
from django.utils import timezone
from datetime import datetime
import re
from django.db import models
from django.db.models import F, Value, Case, When, IntegerField
from django.db.models.functions import Cast
from django.db.models import Func
from django.db import connection


class MonthSerializer(serializers.ModelSerializer):
    class Meta:
        model = Month
        fields = ('month_AMH',)

class YearSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataPoint
        fields = ('year_EC',)

class IndicatorFiedlSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indicator
        fields = ['title_ENG', 'kpi_characteristics']

class AnnualDataPreviousSerializer(serializers.ModelSerializer):
    previous_year_performance_data = serializers.SerializerMethodField()
    class Meta:
        model = AnnualData
        fields = ('previous_year_performance_data',)

    def get_previous_year_performance_data(self, obj):
        return obj.get_previous_year_performance()
    

class QuarterDataPreviousSerializer(serializers.ModelSerializer):
    previous_year_performance_data = serializers.SerializerMethodField()
    class Meta:
        model = QuarterData
        fields = ('previous_year_performance_data',)

    def get_previous_year_performance_data(self, obj):
        return obj.get_previous_year_performance()
    

class MonthDataPreviousSerializer(serializers.ModelSerializer):
    previous_year_performance_data = serializers.SerializerMethodField()
    class Meta:
        model = MonthData
        fields = ('previous_year_performance_data',)

    def get_previous_year_performance_data(self, obj):
        return obj.get_previous_year_performance()
    







class TopicSerializer(serializers.ModelSerializer):
    count_category = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = '__all__'

    def get_count_category(self, obj):
        return obj.categories.all().count()
    

class AnnualDataSerializer(serializers.ModelSerializer):
    for_datapoint = serializers.SlugRelatedField(read_only=True, slug_field='year_EC')
    class Meta:
        model = AnnualData
        fields = ('for_datapoint', 'target' ,'performance')



class QuarterDataSerializer(serializers.ModelSerializer):
    for_datapoint = serializers.SlugRelatedField(read_only=True, slug_field='year_EC')
    for_quarter = serializers.SlugRelatedField(read_only=True, slug_field='title_ENG')
    previous_year_performance_data = serializers.SerializerMethodField()
    class Meta:
        model = QuarterData
        fields = '__all__'

     

    def get_previous_year_performance_data(self, obj):
        return obj.get_previous_year_performance()



class MonthDataSerializer(serializers.ModelSerializer):
    for_datapoint = serializers.SlugRelatedField(read_only=True, slug_field='year_EC')
    for_month = serializers.SlugRelatedField(read_only=True, slug_field='month_AMH')
    previous_year_performance_data = serializers.SerializerMethodField()
    
    class Meta:
        model = MonthData
        fields = '__all__'
    
    def get_previous_year_performance_data(self, obj):
        return obj.get_previous_year_performance()
    

    
class IndicatorSerializer(serializers.ModelSerializer):
    annual_data = serializers.SerializerMethodField()
    quarter_data = QuarterDataSerializer(many = True , read_only = True)
    month_data =serializers.SerializerMethodField()
    latest_data = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    
   

    class Meta:
        model = Indicator
        fields = '__all__'
    

    def get_children(self, obj):
        # safe, DB-agnostic fallback
        children_qs = obj.children.all().order_by("rank")
        #children_list = sorted(children_qs, key=lambda i: _natural_key(i.code))
        #return IndicatorSerializer(children_list, many=True, context=self.context).data
        return IndicatorSerializer(children_qs, many=True, context=self.context).data
    
    def get_annual_data(self, obj):
        subquery = obj.annual_data.filter(
            Q(for_datapoint__year_EC__isnull=False),
            for_datapoint__year_EC=OuterRef('for_datapoint__year_EC')
        ).order_by('-for_datapoint__year_EC')

        annual_data = obj.annual_data.filter(
            id=Subquery(subquery.values('id')[:1])
        ).order_by('-for_datapoint__year_EC')[:12]

        # reverse to ascending order after slicing
        annual_data = reversed(annual_data)

        return AnnualDataSerializer(annual_data, many=True).data


    def get_quarter_data(self, obj):
        # Subquery: cast to int and order by that
        subquery = obj.quarter_data.filter(
            Q(for_datapoint__year_EC__isnull=False),
            for_datapoint__year_EC=OuterRef('for_datapoint__year_EC'),
            # optional: ensure only digit-only values are considered (Postgres regex)
            # remove this line if all values are numeric
            for_datapoint__year_EC__regex=r'^\d+$'
        ).annotate(
            year_ec_int=Cast('for_datapoint__year_EC', IntegerField())
        ).order_by('-year_ec_int')

        qs = obj.quarter_data.filter(
            id=Subquery(subquery.values('id')[:1])
        ).annotate(
            year_ec_int=Cast('for_datapoint__year_EC', IntegerField())
        ).order_by('-year_ec_int')[:12]

        # reverse safely by evaluating to a list first
        quarter_list = list(qs)[::-1]
        return QuarterDataSerializer(quarter_list, many=True).data


    def get_month_data(self, obj):
        subquery = obj.month_data.filter(
        Q(for_datapoint__year_EC__isnull=False),
        for_datapoint__year_EC=OuterRef('for_datapoint__year_EC'),
        for_datapoint__year_EC__regex=r'^\d+$'  # optional
        ).annotate(
            year_ec_int=Cast('for_datapoint__year_EC', IntegerField())
        ).order_by('-year_ec_int')

        qs = obj.month_data.filter(
            id=Subquery(subquery.values('id')[:1])
        ).annotate(
            year_ec_int=Cast('for_datapoint__year_EC', IntegerField())
        ).order_by('-year_ec_int')[:12]

        month_list = list(qs)[::-1]

        return MonthDataSerializer(month_list, many=True).data

    
    def get_latest_data(self, obj):
        # Get the latest entry based on for_datapoint__year_EC from each dataset
        latest_annual = obj.annual_data.order_by('-for_datapoint__year_EC').first() if obj.annual_data.exists() else None
        latest_quarter = obj.quarter_data.order_by('-for_datapoint__year_EC').first() if obj.quarter_data.exists() else None
        latest_month = obj.month_data.order_by('-for_datapoint__year_EC').first() if obj.month_data.exists() else None

        # Extract year_EC values safely
        annual_year = getattr(latest_annual.for_datapoint, 'year_EC', None) if latest_annual else None
        quarter_year = getattr(latest_quarter.for_datapoint, 'year_EC', None) if latest_quarter else None
        month_year = getattr(latest_month.for_datapoint, 'year_EC', None) if latest_month else None

        # Default to a very old year for comparison if missing
        annual_year = annual_year or 0
        quarter_year = quarter_year or 0
        month_year = month_year or 0

        # Compare the year_EC values to determine the most recent dataset
        latest_data = max(
            [(annual_year, 'annual'), (quarter_year, 'quarterly'), (month_year, 'monthly')],
            key=lambda x: x[0]
        )

        return latest_data[1]
    


class MobileDashboardOverviewSerializer(serializers.ModelSerializer):
    performance = serializers.SerializerMethodField()
    indicator = IndicatorSerializer()

    class Meta:
        model = MobileDahboardOverview
        fields = '__all__'
    
    def get_performance(self, obj):
        if obj.quarter:
            quarter_data = obj.indicator.quarter_data.filter(Q(for_datapoint__year_EC = obj.year.year_EC) , Q(for_quarter= obj.quarter))
            serializer = QuarterDataPreviousSerializer(quarter_data, many=True)
        elif obj.month:
            month_data = obj.indicator.month_data.filter(Q(for_datapoint__year_EC = obj.year.year_EC) , Q(for_month= obj.month))
            serializer = MonthDataPreviousSerializer(month_data, many=True)
        else:        
            annual_data = obj.indicator.annual_data.filter(Q(for_datapoint__year_EC = obj.year.year_EC))
            serializer = AnnualDataPreviousSerializer(annual_data, many=True)
        return serializer.data
    
class CategorySerializer2(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['name_ENG']


class IndicatorPerformanceSerializer(serializers.ModelSerializer): 
    previous_performance = serializers.SerializerMethodField()

    class Meta:
        model = Indicator
        fields = '__all__'

    def get_previous_performance(self , obj ):
        request = self.context.get('request')
        year = request.query_params.get('year') or None
        quarter = request.query_params.get('quarter') or None
        month = request.query_params.get('month') or None
        previous_year_performance = None
        five_year_ago_performace = None
        ten_year_ago_performance = None
        if year:
            previous_year_performance = obj.get_previous_year_performance(year = year , quarter = quarter , month = month)
            five_year_ago_performace = obj.get_indicator_value_5_years_ago(year = year , quarter = quarter , month = month)
            ten_year_ago_performance = obj.get_indicator_value_10_years_ago(year = year , quarter = quarter , month = month)
        return {
            'previous_year_performance' : previous_year_performance  ,
            'five_year_ago_performace' :  five_year_ago_performace  ,
            'ten_year_ago_performance' :  ten_year_ago_performance  ,
        }


def _natural_key(code):
        # returns (prefix, numeric_suffix_int)
        if not code:
            return ('', 0)
        m = re.match(r'^(.*?)(?:\.(\d+))?$', code)
        prefix = m.group(1) or ''
        num = int(m.group(2)) if m and m.group(2) else 0
        return (prefix, num)

class IndicatorDetailSerializer(serializers.ModelSerializer):
    annual_data = serializers.SerializerMethodField()
    quarter_data = QuarterDataSerializer(many = True , read_only = True)
    month_data = MonthDataSerializer(many = True , read_only = True)
    for_category = CategorySerializer2(many=True, read_only=True)
    latest_data = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    

    class Meta:
        model = Indicator
        fields = '__all__'

    def get_annual_data(self, obj):
        subquery = obj.annual_data.filter(
            Q(for_datapoint__year_EC__isnull=False)
        ).annotate(
            year_num=Cast('for_datapoint__year_EC', IntegerField())
        ).order_by('year_num')  # ascending order (oldest → newest)

        annual_data = obj.annual_data.filter(
            id__in=Subquery(subquery.values('id'))
        )

        return AnnualDataSerializer(annual_data, many=True).data
    
    def get_quarter_data(self, obj):
        subquery = obj.quarter_data.filter(
            Q(for_datapoint__year_EC__isnull=False)
        ).annotate(
            year_num=Cast('for_datapoint__year_EC', IntegerField())
        ).order_by('-year_num')  # ascending order by year

        quarter_data = obj.quarter_data.filter(
            id__in=Subquery(subquery.values('id'))
        )

        serializer = QuarterDataSerializer(quarter_data, many=True)
        return serializer.data


    def get_month_data(self, obj):
        subquery = obj.month_data.filter(
            Q(for_datapoint__year_EC__isnull=False)
        ).annotate(
            year_num=Cast('for_datapoint__year_EC', IntegerField())
        ).order_by('-year_num')  # ascending order by year

        month_data = obj.month_data.filter(
            id__in=Subquery(subquery.values('id'))
        )

        serializer = MonthDataSerializer(month_data, many=True)
        return serializer.data

    
    
    def get_latest_data(self, obj):
        # Get the latest entry based on for_datapoint__year_EC from each dataset
        latest_annual = obj.annual_data.order_by('-for_datapoint__year_EC').first() if obj.annual_data.exists() else None
        latest_quarter = obj.quarter_data.order_by('-for_datapoint__year_EC').first() if obj.quarter_data.exists() else None
        latest_month = obj.month_data.order_by('-for_datapoint__year_EC').first() if obj.month_data.exists() else None

        # Extract year_EC values safely
        annual_year = getattr(latest_annual.for_datapoint, 'year_EC', None) if latest_annual else None
        quarter_year = getattr(latest_quarter.for_datapoint, 'year_EC', None) if latest_quarter else None
        month_year = getattr(latest_month.for_datapoint, 'year_EC', None) if latest_month else None

        # Default to a very old year for comparison if missing
        annual_year = annual_year or 0
        quarter_year = quarter_year or 0
        month_year = month_year or 0

        # Compare the year_EC values to determine the most recent dataset
        latest_data = max(
            [(annual_year, 'annual'), (quarter_year, 'quarterly'), (month_year, 'monthly')],
            key=lambda x: x[0]
        )

        return latest_data[1]
        

    # in your serializer class
    def get_children(self, obj):
        # safe, DB-agnostic fallback
        children_qs = obj.children.all()
        children_list = sorted(children_qs, key=lambda i: _natural_key(i.code))
        return IndicatorSerializer(children_list, many=True, context=self.context).data


class CategoryDetailSerializer(serializers.ModelSerializer):
    indicators = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'
    
    def get_indicators(self, obj):
        request = self.context
        q = request.get('q')

        indicators = obj.indicators.filter(parent__isnull=True, is_dashboard_visible = True)

        if q:
            indicators = indicators.filter(
                Q(title_ENG__icontains=q) | Q(for_category__name_ENG__icontains=q),
                Q(is_dashboard_visible = True),
            )

        indicators = indicators.annotate(
            code_number=Cast(Substr('code', 8), IntegerField())  
        ).order_by("rank", "code", "code_number")

        serializer = IndicatorSerializer(indicators, many=True)
        return serializer.data

    def to_representation(self, instance):
        q = self.context.get('q')
        if q:
            # Skip category if it doesn't match and has no matching indicators
            category_match = q.lower() in instance.name_ENG.lower()
            indicator_match = instance.indicators.filter(title_ENG__icontains=q).exists()
            if not category_match and not indicator_match:
                return None
        return super().to_representation(instance)
    

class TopicDetailSerializer(serializers.ModelSerializer):
    categories = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = '__all__'

    def get_categories(self, obj):
        categories = obj.categories.filter(is_deleted = False)
        serializer = CategoryDetailSerializer(categories, many=True, context=self.context)
        # Remove categories that were skipped (returned as None)
        return [cat for cat in serializer.data if cat is not None]

        
class CategorySerializer(serializers.ModelSerializer):
    indicators = IndicatorSerializer(many = True , read_only = True)

    class Meta:
        model = Category
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectInitiatives
        fields = '__all__'

class SubProjectSerializer(serializers.ModelSerializer):
    
    data = serializers.SerializerMethodField()  # Serialize the JSON data as a string

    class Meta:
        model = SubProject
        fields = ['id', 'title_ENG', 'title_AMH', 'description', 'image', 'image_icons', 'data', 'is_regional', 'project']

    def get_data(self, obj):
        if obj.data:
          data =  json.loads(obj.data)
          return data
        return None


        
class ProjectDetailSerializer(serializers.ModelSerializer):
    sub_projects = serializers.SerializerMethodField()  # Serialize the JSON data as a string

    class Meta:
        model = ProjectInitiatives
        fields = '__all__'

    def get_sub_projects(self, obj):
        stats = obj.sub_projects.filter(is_stats = True)
        serializer = SubProjectSerializer(stats, many=True)

        projects = obj.sub_projects.filter(is_stats = False)
        serializer_projects = SubProjectSerializer(projects, many=True)

        return {
            'stats': serializer.data,
            'projects': serializer_projects.data
        }


class CategoryWithIndicatorsSerializer(serializers.ModelSerializer):
    indicators = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name_ENG', 'name_AMH', 'indicators']

    def get_indicators(self, category):
        indicators = self.context['indicators_by_category'].get(category.id, [])
        return IndicatorSerializer(indicators, many=True).data