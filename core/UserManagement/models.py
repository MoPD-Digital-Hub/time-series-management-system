from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    photo = models.ImageField(upload_to='users/photos/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_first_time = models.BooleanField(default=True)
    last_reset_password = models.DateTimeField(null=True, blank=True)
    is_dashboard = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.email} ({'Active' if self.is_active else 'Inactive'})"

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

class ResponsibleEntity(models.Model):
    name_eng = models.CharField("Ministry Name (English)", max_length=350)
    name_amh = models.CharField("Ministry Name (Amharic)", max_length=350, blank=True, null=True)
    code = models.CharField("Ministry Code", max_length=200)
    logo = models.ImageField(upload_to='ministries/logos/', blank=True, null=True)
    background_image = models.ImageField(upload_to='ministries/backgrounds/', blank=True, null=True)
    is_visible = models.BooleanField(default=False)
    rank = models.PositiveIntegerField(default=400)

    def __str__(self):
        return f"{self.name_eng} ({self.code})"

    class Meta:
        verbose_name = "Responsible Ministry"
        verbose_name_plural = "Responsible Ministries"
        ordering = ['rank', 'name_eng']

class UserSector(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    ministry = models.ForeignKey(ResponsibleEntity, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user.email} - {self.ministry.code}"

    class Meta:
        verbose_name = "User Sector"
        verbose_name_plural = "User Sectors"