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


@register.simple_tag
def flex_lookup(data_list, key_name, target_value, return_key):
    """General lookup for Annual Data"""
    match = next((item for item in data_list if item.get(key_name) == target_value), None)
    return match.get(return_key) if match else "-"

@register.simple_tag
def quarter_lookup(data_list, year, quarter_num):
    """Specific lookup for Quarterly Data (Matches Year AND Quarter)"""
    match = next((item for item in data_list if item.get('year') == year and item.get('quarter_num') == quarter_num), None)
    return match.get('performance') if match else "-"

@register.simple_tag
def month_lookup(data_list, year, month_num):
    """Specific lookup for Monthly Data (Matches Year AND Month)"""
    match = next((item for item in data_list if item.get('year') == year and item.get('month_num') == month_num), None)
    return match.get('performance') if match else "-"