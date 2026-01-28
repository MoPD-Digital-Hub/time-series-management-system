from mobile.models import MobileDahboardOverview, HighFrequency
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
    count_kpis = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = '__all__'

    def get_count_category(self, obj):
        return obj.categories.all().count()
    
    def get_count_kpis(self, obj):
        return (
            Indicator.objects
            .filter(for_category__topic=obj)
            .distinct()
            .count()
        )
    
class AnnualDataSerializer(serializers.ModelSerializer):
    for_datapoint = serializers.SerializerMethodField()
    performance = serializers.SerializerMethodField()
    
    class Meta:
        model = AnnualData
        fields = ('for_datapoint', 'target' ,'performance')

    def get_for_datapoint(self, obj):
        return str(obj.for_datapoint.year_EC) if obj.for_datapoint else None
    
    def get_performance(self, obj):
        return round(obj.performance, 2) if obj.performance is not None else None
    
class QuarterDataSerializer(serializers.ModelSerializer):
    for_datapoint = serializers.SerializerMethodField()
    for_quarter = serializers.SlugRelatedField(read_only=True, slug_field='title_ENG')
    previous_year_performance_data = serializers.SerializerMethodField()
    performance = serializers.SerializerMethodField()

    class Meta:
        model = QuarterData
        fields = '__all__'

    def get_performance(self, obj):
        return round(obj.performance, 2) if obj.performance is not None else None
    
    def get_previous_year_performance_data(self, obj):
        return obj.get_previous_year_performance()
    
    def get_for_datapoint(self, obj):
        return str(obj.for_datapoint.year_EC) if obj.for_datapoint else None

class MonthDataSerializer(serializers.ModelSerializer):
    for_datapoint = serializers.SerializerMethodField()
    for_month = serializers.SlugRelatedField(read_only=True, slug_field='month_AMH')
    previous_year_performance_data = serializers.SerializerMethodField()
    performance = serializers.SerializerMethodField()
    
    
    class Meta:
        model = MonthData
        fields = '__all__'
    
    def get_previous_year_performance_data(self, obj):
        return obj.get_previous_year_performance()
    
    def get_for_datapoint(self, obj):
        return str(obj.for_datapoint.year_EC) if obj.for_datapoint else None
    
    def get_performance(self, obj):
        return round(obj.performance, 2) if obj.performance is not None else None
    
class WeekDataSerializer(serializers.ModelSerializer):
    day_data = serializers.SerializerMethodField()

    class Meta:
        model = KPIRecord
        fields = ('target', 'performance', 'ethio_date', 'day_data')

    def get_day_data(self, obj):
        # Convert weekly date → Ethiopian
        eth = to_ethiopian(EthDate(obj.date.day, obj.date.month, obj.date.year))

        # Extract week (YYYY-MM-W)
        week = int(obj.ethio_date.split("-")[-1])

        # Ethiopian week day range
        start_day = (week - 1) * 7 + 1
        end_day = week * 7

        # Fetch all daily records for this indicator
        daily_qs = KPIRecord.objects.filter(
            indicator=obj.indicator, record_type="daily"
        )

        # Filter Ethiopian dates directly
        filtered = []
        for r in daily_qs:
            d = to_ethiopian(EthDate(r.date.day, r.date.month, r.date.year))
            if d.year == eth.year and d.month == eth.month and start_day <= d.day <= end_day:
                filtered.append(r)

        return DayDataSerializer(filtered, many=True).data
    
class DayDataSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = KPIRecord
        fields = ('target', 'performance', 'ethio_date')
        
class IndicatorSerializer(serializers.ModelSerializer):
    annual_data = serializers.SerializerMethodField()
    quarter_data = QuarterDataSerializer(many = True , read_only = True)
    month_data =serializers.SerializerMethodField()
    week_data =serializers.SerializerMethodField()
    day_data =serializers.SerializerMethodField()
    latest_data = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    
   
    class Meta:
        model = Indicator
        fields = '__all__'
    

    def get_children(self, obj):
        children_qs = obj.children.filter().order_by("rank") 
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
        Q(for_datapoint__year_EC__isnull=False)
        )

        qs = obj.month_data.filter()[::-1][:12][::-1]

        month_list = list(qs)

        return MonthDataSerializer(month_list, many=True).data
    
    def get_week_data(self, obj):
        weekly_qs = obj.records.filter(record_type="weekly").order_by('date')
        return WeekDataSerializer(weekly_qs, many=True).data

   
    def get_day_data(self, obj):
        daily_qs = obj.records.filter(record_type="daily").order_by('date')
        return DayDataSerializer(daily_qs, many=True).data

    
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
    week_data =serializers.SerializerMethodField()
    day_data =serializers.SerializerMethodField()
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
    
    def get_week_data(self, obj):
        weekly_qs = obj.records.filter(record_type="weekly").order_by('date')
        return WeekDataSerializer(weekly_qs, many=True).data

   
    def get_day_data(self, obj):
        daily_qs = obj.records.filter(record_type="daily").order_by('date')
        return DayDataSerializer(daily_qs, many=True).data

    
    
    def get_latest_data(self, obj):
   
        latest_annual = obj.annual_data.order_by('-for_datapoint__year_EC').first() if obj.annual_data.exists() else None
        latest_quarter = obj.quarter_data.order_by('-for_datapoint__year_EC').first() if obj.quarter_data.exists() else None
        latest_month = obj.month_data.order_by('-for_datapoint__year_EC').first() if obj.month_data.exists() else None

        latest_week = obj.records.filter(record_type='weekly').first()
        latest_day = obj.records.filter(record_type='daily').first()

        def get_year(entry):
            if not entry:
                return 0
            if hasattr(entry, "for_datapoint") and entry.for_datapoint:
                return int(entry.for_datapoint.year_EC)
            return 0

        annual_year = get_year(latest_annual)
        quarter_year = get_year(latest_quarter)
        month_year = get_year(latest_month)

        def parse_ethio_date(e_date):
            """e_date: '2017-2-1' or '2017-02-01' → (2017, 2, 1)"""
            if not e_date:
                return (0, 0, 0)
            try:
                parts = [int(p) for p in e_date.split('-')]
                if len(parts) == 3:
                    return (parts[0], parts[1], parts[2])
            except:
                pass
            return (0, 0, 0)

        week_ec = parse_ethio_date(latest_week.ethio_date) if latest_week else (0, 0, 0)
        day_ec  = parse_ethio_date(latest_day.ethio_date) if latest_day else (0, 0, 0)
        latest_data = max(
            [
                ((annual_year, 0, 0), 'annual'),
                ((quarter_year, 0, 0), 'quarterly'),
                ((month_year, 0, 0), 'monthly'),
                (week_ec, 'weekly'),
                (day_ec, 'daily'),
            ],
            key=lambda x: x[0]
        )

        return latest_data[1]

    def get_children(self, obj):
        children_qs = obj.children.filter() 
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
        categories = obj.categories.filter(is_deleted = False, )
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
    



#### AI Serializer ###
class AIAnnualDataSerializer(serializers.ModelSerializer):
    for_datapoint = serializers.SerializerMethodField()
    indicator = serializers.SerializerMethodField()
    class Meta:
        model = AnnualData
        fields = ('indicator', 'for_datapoint', 'performance')

    def get_for_datapoint(self, obj):
        return str(obj.for_datapoint.year_EC) if obj.for_datapoint else None

    def get_indicator(self, obj):
            return str(obj.indicator.title_ENG)

class AIQuarterDataSerializer(serializers.ModelSerializer):
    for_datapoint = serializers.SerializerMethodField()
    for_quarter = serializers.SlugRelatedField(read_only=True, slug_field='title_ENG')

    class Meta:
        model = QuarterData
        fields = '__all__'

    def get_for_datapoint(self, obj):
        return str(obj.for_datapoint.year_EC) if obj.for_datapoint else None

    def get_indicator(self, obj):
            return str(obj.indicator.title_ENG)
    
class AIMonthDataSerializer(serializers.ModelSerializer):
    for_datapoint = serializers.SerializerMethodField()
    for_month = serializers.SlugRelatedField(read_only=True, slug_field='month_ENG')

    class Meta:
        model = MonthData
        fields = '__all__'

    def get_for_datapoint(self, obj):
        return str(obj.for_datapoint.year_EC) if obj.for_datapoint else None

    def get_indicator(self, obj):
            return str(obj.indicator.title_ENG)
    


### Updated category lists
class UpdatedCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class IndicatorShortSerializer(serializers.ModelSerializer):
    annual_data = serializers.SerializerMethodField()
    quarter_data = serializers.SerializerMethodField()
    month_data = serializers.SerializerMethodField()
    latest_data = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
   
    class Meta:
        model = Indicator
        fields = ('id','title_ENG', 'code', 'measurement_units', 'measurement_units_quarter', 'measurement_units_month','latest_data', 'annual_data', 'quarter_data', 'month_data', 'children')
    

    def get_children(self, obj):
        children_qs = obj.children.filter(is_dashboard_visible = True).order_by("rank") 
        return IndicatorShortSerializer(children_qs, many=True, context=self.context).data
    
    def get_annual_data(self, obj):
        year = self.context.get('year')

        qs = obj.annual_data.filter(
            Q(for_datapoint__year_EC__isnull=False)
        )

        if year:
            qs = qs.filter(for_datapoint__year_EC=year)

        qs = qs.order_by('-for_datapoint__year_EC')[:12]

        return AnnualDataSerializer(list(qs)[::-1], many=True).data

    def get_quarter_data(self, obj):
        year = self.context.get('year')
        quarter = self.context.get('quarter')
        month = self.context.get('month')

        if year and month:
            return []


        qs = obj.quarter_data.filter(
            Q(for_datapoint__year_EC__isnull=False)
        )

        if year and quarter:
            qs = qs.filter(
                for_datapoint__year_EC=year,
                for_quarter__title_ENG=quarter
            )
            return QuarterDataSerializer(qs[:1], many=True).data

        if year:
            qs = qs.filter(for_datapoint__year_EC=year)

        if quarter:
            qs = qs.filter(for_quarter__title_ENG=quarter)

        qs = qs.annotate(
            year_ec_int=Cast('for_datapoint__year_EC', IntegerField()),
        ).order_by('-year_ec_int', '-for_quarter__number')


        return QuarterDataSerializer(list(qs)[::-1], many=True).data

    def get_month_data(self, obj):
        year = self.context.get('year')
        month = self.context.get('month')
        quarter = self.context.get('quarter')

        if year and quarter:
            return []

        qs = obj.month_data.all()

        if year and month:
            qs = qs.filter(
                for_datapoint__year_EC=year,
                for_month__month_ENG=month
            )
            return MonthDataSerializer(qs[:1], many=True).data

        if year:
            qs = qs.filter(for_datapoint__year_EC=year)

        if month:
            qs = qs.filter(for_month__month_ENG=month)

        qs = qs.order_by('-for_datapoint__year_EC', '-for_month__number')[:20][::-1]
        month_list = list(qs)

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

class HighFrequencySerializer(serializers.ModelSerializer):
    indicator = serializers.SerializerMethodField()

    year = serializers.SlugRelatedField(
        read_only=True,
        slug_field='year_EC'
    )
    quarter = serializers.SlugRelatedField(
        read_only=True,
        slug_field='title_ENG'
    )
    month = serializers.SlugRelatedField(
        read_only=True,
        slug_field='month_ENG'
    )
    class Meta:
        model = HighFrequency
        fields = '__all__'

    
    def get_indicator(self, obj):
        return IndicatorShortSerializer(
            obj.indicator,
            context={
                **self.context,
                'year': obj.year.year_EC if obj.year else None,
                'quarter': obj.quarter.title_ENG if obj.quarter else None,
                'month': obj.month.month_ENG if obj.month else None,
            }
        ).data


class IndicatorMetaDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indicator
        model = ('id','title_ENG')

    def to_representation(self, instance):
        category_list = instance.for_category.values_list('name_ENG', flat=True).distinct()
        category_name = " | ".join(category_list) if category_list else ""

        topic_list = Topic.objects.filter(categories__indicators=instance).values_list('title_ENG', flat=True).distinct()
        topic_name = " | ".join(topic_list) if topic_list else ""

        parent = instance.parent.title_ENG if instance.parent else ""

        return {
            "id": f"tsms_kpi_{instance.id}",
            "page_content": f"Time Series - Indicator: {instance.title_ENG}",
            "metadata": {
                "entity_type": "indicator",
                "indicator_id": instance.id or "",
                "indicator_eng": instance.title_ENG or "",
                "indicator_code": instance.code or "",
                "parent": parent or "",
                "annual_measurement_unit" : instance.measurement_units or "",
                "quarter_measurement_unit" : instance.measurement_units_quarter or "",
                "month_measurement_unit" : instance.measurement_units_month or "",
                "characteristics": (
                        "Increasing" if instance.kpi_characteristics == "inc"
                        else "Decreasing" if instance.kpi_characteristics == "dec"
                        else "Constant"
                    ),
                "topic_name": topic_name or "",
                "category_name": category_name or "",
                "source": instance.source or "",
                "domain": "TSMS"
            }
        }
    