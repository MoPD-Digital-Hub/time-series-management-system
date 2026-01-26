from django import template

register = template.Library()

@register.filter(name='get_item')
def get_item(dictionary, key):
    """
    Usage in template: {{ my_dict|get_item:key_variable }}
    """
    if isinstance(dictionary, dict):
        # Try both string and integer lookup
        return dictionary.get(str(key)) or dictionary.get(int(key))
    return None