from mobile.models import MobileDahboardOverview
from rest_framework import serializers
from django.db.models import OuterRef, Subquery
from Base.models import *
from django.db.models import Q, F
import json
from django.utils import timezone
from datetime import datetime


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

    class Meta:
        model = Indicator
        fields = '__all__'
    

    def get_annual_data(self, obj):
        subquery = obj.annual_data.filter(
            Q(for_datapoint__year_EC__isnull=False),
            for_datapoint__year_EC=OuterRef('for_datapoint__year_EC')
        ).order_by('id')
        
        annual_data = obj.annual_data.filter(
            id=Subquery(subquery.values('id')[:1])
        )[:12]
        
        return AnnualDataSerializer(annual_data, many=True).data

    def get_quarter_data(self, obj):
        subquery = obj.quarter_data.filter(
            Q(for_datapoint__year_EC__isnull=False),
            for_datapoint__year_EC=OuterRef('for_datapoint__year_EC')
        ).order_by('id')
        quarter_data = obj.quarter_data.filter(
            id=Subquery(subquery.values('id')[:1])
        )[:12]

        serializer = QuarterDataSerializer(quarter_data, many=True)
        return serializer.data
    
    def get_month_data(self, obj):
        subquery = obj.month_data.filter(
            Q(for_datapoint__year_EC__isnull=False),
            for_datapoint__year_EC=OuterRef('for_datapoint__year_EC')
        ).order_by('id')
        month_data = obj.month_data.filter(
            id=Subquery(subquery.values('id')[:1])
        )[:12]

        month_data = obj.month_data.filter(Q(for_datapoint__year_EC__isnull = False))[:12]
        serializer = MonthDataSerializer(month_data, many=True)
        return serializer.data
    
    def get_latest_data(self, obj):
     
        latest_annual = obj.annual_data.order_by('-created_at').first() if obj.annual_data.exists() else None
        latest_quarter = obj.quarter_data.order_by('-created_at').first() if obj.quarter_data.exists() else None
        latest_month = obj.month_data.order_by('-created_at').first() if obj.month_data.exists() else None


        def ensure_aware(dt):
            if dt and dt.tzinfo is None: 
                return timezone.make_aware(dt)
            return dt 

        latest_annual_time = ensure_aware(latest_annual.created_at) if latest_annual else None
        latest_quarter_time = ensure_aware(latest_quarter.created_at) if latest_quarter else None
        latest_month_time = ensure_aware(latest_month.created_at) if latest_month else None


        latest_annual_time = latest_annual_time or timezone.make_aware(datetime.min)
        latest_quarter_time = latest_quarter_time or timezone.make_aware(datetime.min)
        latest_month_time = latest_month_time or timezone.make_aware(datetime.min)

 
        latest_data = max(
            [(latest_annual_time, 'annual'), (latest_quarter_time, 'quarterly'), (latest_month_time, 'monthly')],
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

class IndicatorDetailSerializer(serializers.ModelSerializer):
    annual_data = serializers.SerializerMethodField()
    quarter_data = QuarterDataSerializer(many = True , read_only = True)
    month_data = MonthDataSerializer(many = True , read_only = True)
    for_category = CategorySerializer2(many=True, read_only=True)
    latest_data = serializers.SerializerMethodField()
    

    class Meta:
        model = Indicator
        fields = '__all__'
    

    def get_annual_data(self, obj):
        subquery = obj.annual_data.filter(
            Q(for_datapoint__year_EC__isnull=False),
            for_datapoint__year_EC=OuterRef('for_datapoint__year_EC')
        ).order_by('id')
        
        annual_data = obj.annual_data.filter(
            id=Subquery(subquery.values('id')[:1])
        )
        
        return AnnualDataSerializer(annual_data, many=True).data

    def get_quarter_data(self, obj):
        subquery = obj.quarter_data.filter(
            Q(for_datapoint__year_EC__isnull=False),
            for_datapoint__year_EC=OuterRef('for_datapoint__year_EC')
        ).order_by('id')
        quarter_data = obj.quarter_data.filter(
            id=Subquery(subquery.values('id')[:1])
        )

        serializer = QuarterDataSerializer(quarter_data, many=True)
        return serializer.data
    
    def get_month_data(self, obj):
        subquery = obj.month_data.filter(
            Q(for_datapoint__year_EC__isnull=False),
            for_datapoint__year_EC=OuterRef('for_datapoint__year_EC')
        ).order_by('id')
        month_data = obj.month_data.filter(
            id=Subquery(subquery.values('id')[:1])
        )

        month_data = obj.month_data.filter(Q(for_datapoint__year_EC__isnull = False))
        serializer = MonthDataSerializer(month_data, many=True)
        return serializer.data
    
    def get_latest_data(self, obj):
        # Get the latest data from each dataset
        latest_annual = obj.annual_data.order_by('-created_at').first() if obj.annual_data.exists() else None
        latest_quarter = obj.quarter_data.order_by('-created_at').first() if obj.quarter_data.exists() else None
        latest_month = obj.month_data.order_by('-created_at').first() if obj.month_data.exists() else None

        # Convert to aware if necessary (avoid using make_aware on already aware datetime)
        def ensure_aware(dt):
            if dt and dt.tzinfo is None:  # Check if it's naive
                return timezone.make_aware(dt)
            return dt  # Return as is if already aware

        latest_annual_time = ensure_aware(latest_annual.created_at) if latest_annual else None
        latest_quarter_time = ensure_aware(latest_quarter.created_at) if latest_quarter else None
        latest_month_time = ensure_aware(latest_month.created_at) if latest_month else None

        # If there is no data in a dataset, set it to a very old date for comparison
        latest_annual_time = latest_annual_time or timezone.make_aware(datetime.min)
        latest_quarter_time = latest_quarter_time or timezone.make_aware(datetime.min)
        latest_month_time = latest_month_time or timezone.make_aware(datetime.min)

        # Compare the dates of the most recent entries from each dataset
        latest_data = max(
            [(latest_annual_time, 'annual'), (latest_quarter_time, 'quarterly'), (latest_month_time, 'monthly')],
            key=lambda x: x[0]
        )

        return latest_data[1]

class CategoryDetailSerializer(serializers.ModelSerializer):
    indicators = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'
    
    def get_indicators(self, obj):
        request = self.context
        q = request.get('q')

        indicators = obj.indicators.filter()

        if q:
            indicators = indicators.filter(Q(title_ENG__icontains=q) | Q(for_category__name_ENG__icontains=q)).filter()

        # Use IndicatorDetailSerializer instead of custom dict
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
        categories = obj.categories.filter()
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