from rest_framework import serializers
from rest_framework import serializers
from .models import Indicator, AnnualData, QuarterData, KPIRecord, DataPoint


from .models import (
  Topic,
  Category,
  Indicator,
  AnnualData,
  DataPoint,
  QuarterData,
  TrendingIndicator,
)

class DataPointSerializers(serializers.ModelSerializer):
  value = serializers.SerializerMethodField()

  class Meta:
    model = DataPoint
    fields = ['id','year_EC','year_GC', 'value']

  def get_value(self, obj):
      # Get the annual value (performance) for this data point (if any)
      annual = AnnualData.objects.filter(for_datapoint=obj, is_verified=True).first()
      return float(annual.performance) if annual else None


class IndicatorSerializers(serializers.ModelSerializer):
    annual_data = serializers.SerializerMethodField()
    quarter_data = serializers.SerializerMethodField()
    weekly_data = serializers.SerializerMethodField()
    daily_data = serializers.SerializerMethodField()
    data_points = serializers.SerializerMethodField()

    class Meta:
        model = Indicator
        fields = [
            'id', 'title_ENG', 'title_AMH', 
            'annual_data', 'quarter_data', 
            'weekly_data', 'daily_data', 
            'data_points'
        ]

    # --- Annual Data ---
    def get_annual_data(self, obj):
        current_year = DataPoint.objects.last()
        recent_data = obj.annual_data.filter(for_datapoint=current_year)
        return AnnualDataSerializers(recent_data, many=True).data

    # --- Quarterly Data ---
    def get_quarter_data(self, obj):
        current_year = DataPoint.objects.last()
        recent_quarterly_data = obj.quarter_data.filter(for_datapoint=current_year)
        return QuarterDataSerializers(recent_quarterly_data, many=True).data

    # --- Weekly Data (last 7 days) ---
    def get_weekly_data(self, obj):
        from datetime import timedelta, date
        last_date = KPIRecord.objects.filter(indicator=obj, record_type='daily').order_by('-date').first()
        if not last_date:
            return []
        end_date = last_date.date
        start_date = end_date - timedelta(days=6)
        weekly_records = KPIRecord.objects.filter(
            indicator=obj,
            record_type='daily',
            date__range=[start_date, end_date]
        ).order_by('date')
        return [
            {
                'id': r.id,
                'date': r.date,
                'performance': r.performance,
                'target': r.target,
                'ethio_date': r.ethio_date
            }
            for r in weekly_records
        ]

    # --- Daily Data (last 10 days) ---
    def get_daily_data(self, obj):
        daily_records = KPIRecord.objects.filter(indicator=obj, record_type='daily').order_by('-date')[:10]
        return [
            {
                'id': r.id,
                'date': r.date,
                'performance': r.performance,
                'target': r.target,
                'ethio_date': r.ethio_date
            }
            for r in daily_records
        ]

    # --- Data Points ---
    def get_data_points(self, obj):
        annuals = AnnualData.objects.filter(
            indicator=obj, 
            for_datapoint__isnull=False, 
            is_verified=True
        ).select_related('for_datapoint').order_by('-for_datapoint__year_GC')
        dps = [a.for_datapoint for a in annuals if a.for_datapoint]
        return DataPointSerializers(dps, many=True).data


class CategorySerializers(serializers.ModelSerializer):
  indicators = IndicatorSerializers(many=True, read_only=True)
  indicator_count = serializers.IntegerField(read_only=True)

  class Meta:
    model = Category
    fields = '__all__'

    def get_indicators(self, obj):
        # Only include verified indicators with at least one verified annual data
        verified_indicators = obj.indicators.filter(
            is_verified=True,
            annual_data__is_verified=True
        ).distinct()
        return IndicatorSerializers(verified_indicators, many=True).data

class TopicSerializers(serializers.ModelSerializer):
  background_image = serializers.ImageField(read_only=True)
  image_icons = serializers.ImageField(read_only=True)
  categories = CategorySerializers(many=True, read_only=True)
  category_count = serializers.IntegerField(read_only=True)

  class Meta:
    model = Topic
    fields = '__all__'


class TrendingIndicatorSerializer(serializers.ModelSerializer):
    indicator_title = serializers.CharField(source='indicator.title_ENG', read_only=True)

    class Meta:
        model = TrendingIndicator
        fields = ['id', 'indicator', 'indicator_title', 'performance', 'direction', 'note', 'created_at']


class AnnualDataSerializers(serializers.ModelSerializer):
  for_datapoint = serializers.SlugRelatedField(
      
        read_only=True,
        slug_field='year_EC'
    )
  class Meta:
    model = AnnualData
    fields = '__all__'

class QuarterDataSerializers(serializers.ModelSerializer):
  for_datapoint = serializers.SlugRelatedField(
      
        read_only=True,
        slug_field='year_EC'
    )
  class Meta:
    model = QuarterData
    fields = '__all__'


class CategoryIndicatorSerializers(serializers.ModelSerializer):
  indicators = IndicatorSerializers(many=True)
  class Meta:
    model = Category
    fields = '__all__'


#######my ser######

class IndicatorAnnualSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='title_ENG', read_only=True)
    title_AMH = serializers.CharField(read_only=True)
    all_annual = serializers.SerializerMethodField()

    class Meta:
        model = Indicator
        fields = ['id', 'title_ENG', 'title_AMH', 'title', 'all_annual']

    def get_all_annual(self, obj):
        annual_map = self.context.get('annual_map', {})
        return [a for a in annual_map.get(obj.id, []) if a.get('is_verified', True)]


class IndicatorMonthlySerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='title_ENG', read_only=True)
    title_AMH = serializers.CharField(read_only=True)
    monthly = serializers.SerializerMethodField()

    class Meta:
        model = Indicator
        fields = ['id', 'title_ENG', 'title_AMH', 'title', 'monthly']

    def get_monthly(self, obj):
        monthly_map = self.context.get('monthly_map', {})
        return monthly_map.get(obj.id, [])


class IndicatorQuarterlySerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='title_ENG', read_only=True)
    title_AMH = serializers.CharField(read_only=True)
    quarterly = serializers.SerializerMethodField()

    class Meta:
        model = Indicator
        fields = ['id', 'title_ENG', 'title_AMH', 'title', 'quarterly']

    def get_quarterly(self, obj):
        quarterly_map = self.context.get('quarterly_map', {})
        return quarterly_map.get(obj.id, [])


class WeeklyKPIRecordUpdateSerializer(serializers.Serializer):
    indicator_id = serializers.IntegerField()
    date = serializers.DateField()
    performance = serializers.FloatField(required=False, allow_null=True)
    target = serializers.FloatField(required=False, allow_null=True)
    is_verified = serializers.BooleanField(required=False)


class DailyKPIRecordUpdateSerializer(serializers.Serializer):
    indicator_id = serializers.IntegerField()
    date = serializers.DateField()
    performance = serializers.FloatField(required=False, allow_null=True)
    target = serializers.FloatField(required=False, allow_null=True)
    is_verified = serializers.BooleanField(required=False)
