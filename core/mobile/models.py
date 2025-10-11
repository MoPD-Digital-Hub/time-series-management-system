from django.db import models
from Base.models import Indicator, DataPoint, Quarter, Month , Topic

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
        
