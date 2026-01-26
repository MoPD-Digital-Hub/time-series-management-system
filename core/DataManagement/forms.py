from django import forms
from Base.models import *


class IndicatorForm(forms.ModelForm):
    class Meta:
        model = Indicator
        fields = '__all__'
        widgets = {
            'title_ENG': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Indicator title'}),
            'title_AMH': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Title in Amharic'}),
            'code': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Code (optional)'}),
            'rank': forms.NumberInput(attrs={'class': 'form-control'}),
            'for_category': forms.SelectMultiple(attrs={'class': 'form-control js-choice'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'measurement_units': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Unit'}),
            'measurement_units_quarter': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Quarter unit'}),
            'measurement_units_month': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Month unit'}),
            'frequency': forms.Select(attrs={'class': 'form-control'}, choices=Indicator.FREQUENCY_CHOICES),
            'source': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'methodology': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'disaggregation_dimensions': forms.TextInput(attrs={'class': 'form-control'}),
            'time_coverage_start_year': forms.Select(attrs={'class': 'form-control'}),
            'time_coverage_end_year': forms.Select(attrs={'class': 'form-control'}),
            'data_type': forms.Select(attrs={'class': 'form-control'}, choices=Indicator.DATA_TYPE_CHOICE),
            'responsible_entity': forms.TextInput(attrs={'class': 'form-control'}),
            'tags': forms.TextInput(attrs={'class': 'form-control'}),
            'sdg_link': forms.TextInput(attrs={'class': 'form-control'}),
            'status': forms.Select(attrs={'class': 'form-control'}, choices=Indicator.STATUS_CHOICE),
            'version': forms.NumberInput(attrs={'class': 'form-control'}),
            'collection_Instrument': forms.TextInput(attrs={'class': 'form-control'}),
            'parent': forms.Select(attrs={'class': 'form-control js-choice'}),
            'kpi_characteristics': forms.Select(attrs={'class': 'form-control'}, choices=Indicator.KPI_CHARACTERISTIC_CHOICES),
            'is_dashboard_visible': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'is_public': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'is_verified': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'main_parent': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'image': forms.ClearableFileInput(attrs={'class': 'form-control'}),
        }



class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = '__all__'
        widgets = {
            'title_ENG': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter English Title'}),
            'title_AMH': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter Amharic Title'}),
            'topic': forms.Select(attrs={'class': 'form-select'}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'document_category': forms.Select(attrs={'class': 'form-select'}),
            'file_type': forms.Select(attrs={'class': 'form-select'}),
            'file': forms.ClearableFileInput(attrs={'class': 'form-control'}),
            'is_verified': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
