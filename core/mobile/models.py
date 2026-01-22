from django.db import models
from Base.models import Indicator, DataPoint, Quarter, Month , Topic
from django.core.exceptions import ValidationError

class MobileDahboardOverview(models.Model):
    indicator = models.ForeignKey(Indicator, null=True, blank=True, on_delete=models.SET_NULL)
    rank = models.IntegerField(default=0)
    year = models.ForeignKey(DataPoint, null=True, blank=True, on_delete=models.SET_NULL)
    quarter = models.ForeignKey(Quarter, null=True, blank=True, on_delete=models.SET_NULL)
    month = models.ForeignKey(Month, null=True, blank=True, on_delete=models.SET_NULL)
    is_trending = models.BooleanField(default=False)
    include_children = models.BooleanField(default=False)

    def __str__(self):
        return self.indicator.title_ENG
    
    class Meta:
        ordering = ('rank',)
        


class HighFrequency(models.Model):
    CHART_TYPE_CHOICES = [
        ('bar', 'Bar'),
        ('line', 'Line'),
        ('number', 'Number'),
    ]

    indicator = models.ForeignKey(Indicator, on_delete=models.SET_NULL, null=True)
    row = models.IntegerField(default=1)
    chart_type = models.CharField(max_length=20, choices=CHART_TYPE_CHOICES)
    width = models.IntegerField(default=50)
    include_children = models.BooleanField(default=False)
    year = models.ForeignKey(DataPoint, null=True, blank=True, on_delete=models.SET_NULL)
    quarter = models.ForeignKey(Quarter, null=True, blank=True, on_delete=models.SET_NULL)
    month = models.ForeignKey(Month, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ('row',)

    def clean(self):
        errors = {}

        if self.include_children and not self.year:
            errors['year'] = 'Year is required when "include children" is enabled.'

        if self.quarter and not self.year:
            errors['year'] = 'Year is required when quarter is selected.'

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()  
        super().save(*args, **kwargs)
