from rest_framework import serializers
from .models import *
from Base.models import Indicator, AnnualData 

class AnnualSerializer(serializers.ModelSerializer):
    for_datapoint = serializers.SlugRelatedField(slug_field='year_EC', read_only=True)
    class Meta:
        model = AnnualData
        fields = ['performance', 'indicator', 'for_datapoint']
    

class IndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indicator
        fields = ['id', 'title_ENG']



class ComponentSerializer(serializers.ModelSerializer):
    indicator = IndicatorSerializer(many=True)
    data_range_start = serializers.SlugRelatedField(slug_field='year_EC', read_only=True)
    data_range_end = serializers.SlugRelatedField(slug_field='year_EC', read_only=True)
    year = serializers.SlugRelatedField(slug_field='year_EC', read_only=True)
    component = serializers.SlugRelatedField(slug_field='path', read_only=True)
    annual_value = serializers.SerializerMethodField()
    class Meta:
        model = DashboardIndicator
        fields = '__all__'

    def get_annual_value(self,obj):
        if obj.component.is_range:
            start_date = obj.data_range_start.year_EC
            end_date = obj.data_range_end.year_EC
            annual = obj.get_annual_value(start_date=start_date, end_date=end_date)
            serializer  = AnnualSerializer(annual, many=True)
            return serializer.data
        elif obj.component.is_single_year:
            year = obj.year.year_EC
            annual = obj.get_annual_value(year=year)
            serializer  = AnnualSerializer(annual, many=True)
            return serializer.data    
        return None

class RowSerializer(serializers.ModelSerializer):
    cols = ComponentSerializer(many=True)
    class Meta:
        model = Row
        fields = '__all__'

class DashboardSerializer(serializers.ModelSerializer):
    rows = RowSerializer(many=True)
    class Meta:
        model = Dashboard
        fields = '__all__'