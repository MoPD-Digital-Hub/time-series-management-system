import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from Base.models import *

@csrf_exempt
@login_required
def save_indicator_data_bulk(request):
    user = request.user

    if request.method != "POST":
        return JsonResponse({'success': False, 'message': 'Invalid method'})

    try:
        payload = json.loads(request.body)
        data_list = payload.get('data', [])

        saved = 0

        default_verified = True if user.is_category_manager else False

        for item in data_list:
            indicator_id = item.get('indicator_id')
            year_id = item.get('year_id')
            quarter_id = item.get('quarter_id')
            month_id = item.get('month_id')
            value = item.get('value')
            type_ = item.get('type')

            # 🔹 Skip empty values
            if value in [None, ""]:
                continue

            indicator = Indicator.objects.get(id=indicator_id)
            datapoint = DataPoint.objects.get(id=year_id)

            if type_ == "annual":
                obj, created = AnnualData.objects.update_or_create(
                    indicator=indicator,
                    for_datapoint=datapoint,
                    defaults={
                        'performance': value
                    }
                )

            elif type_ == "quarter":
                quarter = Quarter.objects.get(id=quarter_id)
                obj, created = QuarterData.objects.update_or_create(
                    indicator=indicator,
                    for_datapoint=datapoint,
                    for_quarter=quarter,
                    defaults={
                        'performance': value
                    }
                )

            elif type_ == "month":
                month = Month.objects.get(id=month_id)
                obj, created = MonthData.objects.update_or_create(
                    indicator=indicator,
                    for_datapoint=datapoint,
                    for_month=month,
                    defaults={
                        'performance': value
                    }
                )

            # 🔹 Only set verification on CREATE
            if created:
                obj.is_verified = default_verified
                obj.save(update_fields=['is_verified'])

            saved += 1

        return JsonResponse({
            'success': True,
            'message': f'{saved} records saved successfully'
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })
