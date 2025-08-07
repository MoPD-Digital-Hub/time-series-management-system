from django import forms
from Base.models import(
    Topic,
    Category,
    Indicator,
    Document,
    ProjectInitiatives,
    SubProject
)

class TopicForm(forms.ModelForm):
    class Meta:
        model = Topic
        fields = ['title_ENG', 'title_AMH', 'icon', 'is_dashboard' , 'rank']
        widgets = {
            'title_ENG': forms.TextInput(attrs={'class': 'form-control'}),
            'title_AMH': forms.TextInput(attrs={'class': 'form-control'}),
            'is_dashboard': forms.CheckboxInput(attrs={'class': 'form-check-input ml-3'}),
            'rank': forms.NumberInput(attrs={'class': 'form-control'}),
        }


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name_ENG', 'name_AMH', 'topic', 'is_dashboard_visible']
        widgets = {
            'name_ENG': forms.TextInput(attrs={'class': 'form-control'}),
            'name_AMH': forms.TextInput(attrs={'class': 'form-control'}),
            'topic': forms.Select(attrs={'class': 'form-select'}),
            'is_dashboard_visible': forms.CheckboxInput(attrs={'class': 'form-check-input ml-3'}),
        }

class IndicatorForm(forms.ModelForm):
    class Meta:
        model = Indicator
        fields = ['title_ENG', 'title_AMH', 'for_category', 'is_public','measurement_units', 'kpi_characteristics', 'is_dashboard_visible']
        widgets = {
            'title_ENG': forms.TextInput(attrs={'class': 'form-control'}),
            'title_AMH': forms.TextInput(attrs={'class': 'form-control'}),
            'is_public': forms.CheckboxInput(attrs={'class': 'form-check-input ml-3'}),
            'measurement_units': forms.TextInput(attrs={'class': 'form-control'}),
            'kpi_characteristics': forms.Select(attrs={'class': 'form-select'}),
            'is_dashboard_visible': forms.CheckboxInput(attrs={'class': 'form-check-input ml-3'}),
        }


class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ['title_ENG', 'title_AMH', 'topic', 'file']
        widgets = {
            'title_ENG': forms.TextInput(attrs={'class': 'form-control'}),
            'title_AMH': forms.TextInput(attrs={'class': 'form-control'}),
            'topic': forms.Select(attrs={'class': 'form-select'}),
            'file' : forms.ClearableFileInput(attrs={
                'class' : 'form-control'
            })
        }


class ProjectInitiativesForm(forms.ModelForm):
    class Meta:
        model = ProjectInitiatives
        fields = ['title_ENG', 'title_AMH', 'description' , 'image' , 'image_icons'  ] # Specify the fields you want in the form
        widgets = {
            'title_ENG': forms.TextInput(attrs={'class': 'form-control'}),
            'title_AMH': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control'}),
            'image': forms.ClearableFileInput(attrs={'class': 'form-control'}),
            'image_icons': forms.ClearableFileInput(attrs={'class': 'form-control'}),
        }
    

class SubProjectForm(forms.ModelForm):
    class Meta:
        model = SubProject
        fields = ['title_ENG', 'title_AMH', 'description' , 'is_regional']  # Specify the fields you want in the form
        widgets = {
            'title_ENG': forms.TextInput(attrs={'class': 'form-control'}),
            'title_AMH': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control'}),
            'is_regional': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
    