from rest_framework import serializers
from Base.models import (
    Topic,
    Indicator,
    Category,
    AnnualData,
    DataPoint,
)


class DataPointSerializers(serializers.ModelSerializer):
    class Meta:
        model = DataPoint
        fields = '__all__'

class TopicSerializers(serializers.ModelSerializer):
    category_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Topic
        exclude = ('updated', 'created')

class AnnualDataSerializers(serializers.ModelSerializer):
    for_datapoint = serializers.SlugRelatedField(read_only=True, slug_field='year_GC')
    class Meta:
        model = AnnualData
        fields = '__all__'

class IndicatorSerializers(serializers.ModelSerializer):
    annual_data = serializers.SerializerMethodField()

    def get_annual_data(self, obj):
        annual = AnnualData.objects.filter(indicator = obj).order_by('for_datapoint__year_EC').reverse()[:10]
        serializer = AnnualDataSerializers(annual, many=True)
        return serializer.data
    
    class Meta:
        model = Indicator
        fields = ('id', 'title_ENG', 'title_AMH', 'for_category', 'measurement_units', 'parent', 'annual_data')


class CategorySerializers(serializers.ModelSerializer):
    indicators = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'
    
    def get_indicators(self, obj):
        indicators =  Indicator.objects.filter(for_category=obj, is_dashboard_visible = True)
        serializer = IndicatorSerializers(indicators, many=True, read_only=True)
        return serializer.data




class IndicatorWithDataSerializers(serializers.ModelSerializer):
    annual_data = serializers.SerializerMethodField()
    class Meta:
        model = Indicator
        fields = '__all__'

    def get_fields(self):
        fields = super(IndicatorWithDataSerializers, self).get_fields()
        fields['children'] = IndicatorWithDataSerializers(many=True)
        return fields
    
    def get_annual_data(self, obj):
        annual = AnnualData.objects.filter(indicator = obj).order_by('for_datapoint__year_EC').reverse()[:10]
        serializer = AnnualDataSerializers(annual, many=True)
        return serializer.data
    

