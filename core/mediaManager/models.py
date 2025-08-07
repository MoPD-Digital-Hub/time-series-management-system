from django.db import models

class Media(models.Model):
    file = models.FileField(upload_to='media-manager/')