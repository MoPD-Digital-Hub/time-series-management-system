from rest_framework import serializers
from Base.models import Indicator, AnnualData, QuarterData, MonthData

class AnnualDataSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source='for_datapoint.year_EC')
    class Meta:
        model = AnnualData
        fields = ['year', 'performance']

class QuarterDataSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source='for_datapoint.year_EC')
    quarter_num = serializers.IntegerField(source='for_quarter.number')
    class Meta:
        model = QuarterData
        fields = ['year', 'quarter_num', 'performance']

class MonthDataSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source='for_datapoint.year_EC')
    month_num = serializers.IntegerField(source='for_month.number')
    class Meta:
        model = MonthData
        fields = ['year', 'month_num', 'performance']

class IndicatorExplorerSerializer(serializers.ModelSerializer):
    # Prefetched data turned into serialized lists
    annual_results = AnnualDataSerializer(source='annual_data', many=True, read_only=True)
    quarterly_results = QuarterDataSerializer(source='quarter_data', many=True, read_only=True)
    monthly_results = MonthDataSerializer(source='month_data', many=True, read_only=True)

    class Meta:
        model = Indicator
        fields = ['id', 'title_ENG', 'code', 'annual_results', 'quarterly_results', 'monthly_results']