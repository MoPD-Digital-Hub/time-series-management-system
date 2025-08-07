from django.contrib import admin
from .models import *
from django.contrib.auth.admin import UserAdmin



admin.site.register(CustomUser, UserAdmin)
admin.site.register(ResponsibleEntity)
admin.site.register(UserSector)
