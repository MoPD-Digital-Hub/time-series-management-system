from rest_framework import serializers
from .models import (
  Topic,
  Category,
  Indicator,
  AnnualData,
  DataPoint,
  QuarterData,
)


class TopicSerializers(serializers.ModelSerializer):
  category_count = serializers.IntegerField(read_only=True)
  class Meta:
    model = Topic
    fields = '__all__'


class CategorySerializers(serializers.ModelSerializer):
  indicator_count = serializers.IntegerField(read_only=True)
  class Meta:
    model = Category
    fields = '__all__'





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



class IndicatorSerializers(serializers.ModelSerializer):
  annual_data = serializers.SerializerMethodField()
  quarter_data = serializers.SerializerMethodField()

  def get_annual_data(self, obj):
        current_year = DataPoint.objects.filter().last()
        recent_data = obj.annual_data.filter(for_datapoint=current_year)
        serialized_data = AnnualDataSerializers(recent_data, many=True).data
        return serialized_data

  def get_quarter_data(self, obj):
        current_year = DataPoint.objects.filter().last()
        recent_quarterly_data = obj.quarter_data.filter(for_datapoint=current_year)
        serialized_quarterly_data = QuarterDataSerializers(recent_quarterly_data, many=True).data
        return serialized_quarterly_data      
  class Meta:
    model = Indicator
    fields = '__all__'

class DataPointSerializers(serializers.ModelSerializer):
  class Meta:
    model = DataPoint
    fields = ['id','year_EC','year_GC']



class CategoryIndicatorSerializers(serializers.ModelSerializer):
  indicators = IndicatorSerializers(many=True)
  class Meta:
    model = Category
    fields = '__all__'


