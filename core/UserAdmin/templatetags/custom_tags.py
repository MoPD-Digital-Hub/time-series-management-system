from django import template
register = template.Library()

@register.filter
def get_ids(queryset):
    return [obj.id for obj in queryset]