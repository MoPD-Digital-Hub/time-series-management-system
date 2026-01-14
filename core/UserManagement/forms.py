from django import forms
from .models import CustomUser
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.views import PasswordChangeView
from django.urls import reverse_lazy
from django.shortcuts import render
from Base.models import Topic





class CustomUserForm(UserCreationForm):

    password1 = forms.CharField( max_length=40, label='Password' ,widget=forms.PasswordInput(attrs={
        'class' : 'form-control',
        'placeholder' : 'Enter Your Password',
        'autocomplete': 'off'
    }))
    password2 = forms.CharField( max_length=40, label='Confirm Password', widget=forms.PasswordInput(attrs={
        'class' : 'form-control',
        'placeholder' : 'Confirm Password',
        'autocomplete': 'off'
    }))

  
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'first_name','last_name', 'photo', 'is_superuser']   
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
                'email': forms.EmailInput(attrs={'class': 'form-control'}),
                'first_name': forms.TextInput(attrs={'class': 'form-control'}),
                'last_name': forms.TextInput(attrs={'class': 'form-control'}),
                'is_superuser': forms.CheckboxInput(attrs={'class': 'form-check-input float-start ms-3'}),
                'photo' : forms.ClearableFileInput(attrs={
                    'class' : 'form-control'
                })
        }



class Login_Form(forms.Form):

    email = forms.EmailField(label='Email', widget=forms.EmailInput(attrs={
        'class' : 'form-control',
        'placeholder' : 'Enter Your Email'
    }))
    password = forms.CharField(label='Password', widget=forms.PasswordInput(attrs={
        'class' : 'form-control',
        'placeholder' : 'Enter Your Password'
    }))
    class Meta:
        fields = ['email', 'password']


from Base.models import Document

class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ['title_ENG', 'title_AMH', 'topic', 'category', 'file']
        widgets = {
            'title_ENG': forms.TextInput(attrs={'class': 'form-control'}),
            'title_AMH': forms.TextInput(attrs={'class': 'form-control'}),
            'topic': forms.Select(attrs={'class': 'form-control'}),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'file': forms.ClearableFileInput(attrs={'class': 'form-control'}),
        }
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['topic'].queryset = Topic.objects.filter(is_initiative=False)
