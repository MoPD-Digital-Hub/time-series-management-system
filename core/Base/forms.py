from django import forms
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.forms import SetPasswordForm




class ImportFileForm(forms.Form):
    file = forms.FileField(widget=forms.ClearableFileInput(attrs={
        'class' : 'form-control'
    }))


data_point_type = [
    ('yearly', 'Yearly'),
    ('quarterly', 'Quarterly'),
    ('monthly', 'Monthly'),
]


class ImportFileIndicatorAddValueForm(forms.Form):
    type_of_data = forms.ChoiceField(required=True, choices=data_point_type, widget=forms.Select(attrs={
        'class' : 'form-select'
    }))
    file = forms.FileField(required=True,widget=forms.ClearableFileInput(attrs={
        'class' : 'form-control'
    }))





######Reset
class UserPasswordResetForm(PasswordResetForm):
    def __init__(self, *args, **kwargs):
        super(UserPasswordResetForm, self).__init__(*args, **kwargs)

    email = forms.EmailField(label='',widget=forms.EmailInput(attrs={
        'class': 'form-control',
        'placeholder' : 'Enter your email',
        }))


class UserPasswordConfirmForm(SetPasswordForm):
    new_password1 = forms.CharField(label='Password', widget=forms.PasswordInput(attrs={
        'class': 'form-control w-100',
        'placeholder': 'Password',
    }))
    new_password2 = forms.CharField(label='Conform Password', widget=forms.PasswordInput(attrs={
        'class': 'form-control w-100',
        'placeholder': 'Confirm Password',
    }))