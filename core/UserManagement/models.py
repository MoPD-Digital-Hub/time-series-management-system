from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    photo = models.ImageField(upload_to='users/photos/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_first_time = models.BooleanField(default=True)
    last_reset_password = models.DateTimeField(null=True, blank=True)
    is_dashboard = models.BooleanField(default=False)
    is_category_manager = models.BooleanField(default=False, verbose_name="Category Manager")
    is_importer = models.BooleanField(default=False, verbose_name="Data Importer")

    manager = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        #limit_choices_to={'is_category_manager': True},
        related_name='importers',
        verbose_name="Category Manager"
    )

    groups = models.ManyToManyField(
        Group,
        related_name="customuser_set",
        blank=True,
        verbose_name='groups'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="customuser_set",
        blank=True,
        verbose_name='user permissions'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    # def __str__(self):
    #     roles = []
    #     if self.is_category_manager:
    #         roles.append("Category Manager")
    #     if self.is_importer:
    #         roles.append("Importer")
    #     role_str = ", ".join(roles) or "No Role"
    #     manager_email = f" (Manager: {self.manager.email})" if self.manager else ""
    #     return f"{self.email} ({'Active' if self.is_active else 'Inactive'}) - {role_str}{manager_email}"

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



class CategoryAssignment(models.Model):
    manager = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="managed_categories"
    )
    category = models.OneToOneField(
        'Base.Category', 
        on_delete=models.CASCADE,
        related_name="manager"
    )

    class Meta:
        verbose_name = "Category Assignment"
        verbose_name_plural = "Category Assignments"

    def __str__(self):
        full_name = self.manager.get_full_name() or self.manager.username
        return f"{full_name} → {self.category.name_ENG}"



class IndicatorSubmission(models.Model):
    indicator = models.ForeignKey(
        'Base.Indicator', 
        on_delete=models.CASCADE,
        related_name="submissions"
    )
    submitted_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="submitted_indicators"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('declined', 'Declined'),
        ],
        default='pending'
    )
    verified_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="verified_indicators"
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Indicator Submission"
        verbose_name_plural = "Indicator Submissions"

    def __str__(self):
        return f"{self.indicator.title_ENG} ({self.status})"



class DataSubmission(models.Model):
    indicator = models.ForeignKey(
        'Base.Indicator', 
        on_delete=models.CASCADE,
        related_name="data_submissions"
    )
    submitted_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="data_entries"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    data_file = models.FileField(upload_to="uploads/data/", null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('declined', 'Declined'),
        ],
        default='pending'
    )
    verified_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="verified_data"
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Data Submission"
        verbose_name_plural = "Data Submissions"

    def __str__(self):
        return f"{self.indicator.title_ENG} - {self.submitted_by.email} ({self.status})"