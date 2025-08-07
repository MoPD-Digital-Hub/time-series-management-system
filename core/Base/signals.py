from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Indicator


@receiver(post_save, sender=Indicator)
def generate_code_on_create(sender, instance, created, **kwargs):
    if created and not instance.code:
        instance.generate_code()
        instance.save(update_fields=['code'])