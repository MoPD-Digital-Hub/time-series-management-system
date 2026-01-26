import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from Base.models import *

@csrf_exempt
def save_indicator_data_bulk(request):
    user = request.user
    if request.method != "POST":
        return JsonResponse({'success': False, 'message': 'Invalid method'})

    try:
        payload = json.loads(request.body)
        data_list = payload.get('data', [])

        saved = 0

        if user.is_category_manager:
            is_verified = True
        else:
            is_verified = False


        for item in data_list:
            indicator_id = item.get('indicator_id')
            year_id = item.get('year_id')
            quarter_id = item.get('quarter_id')
            month_id = item.get('month_id')
            value = item.get('value')
            type_ = item.get('type')

            # 🔹 Skip empty rows safely
            if value is None:
                continue

            indicator = Indicator.objects.get(id=indicator_id)
            datapoint = DataPoint.objects.get(id=year_id)

            if type_ == "annual":
                AnnualData.objects.update_or_create(
                    indicator=indicator,
                    for_datapoint=datapoint,
                    defaults={
                        'performance': value,
                        'is_verified': is_verified
                    }
                )

            elif type_ == "quarter":
                quarter = Quarter.objects.get(id=quarter_id)
                QuarterData.objects.update_or_create(
                    indicator=indicator,
                    for_datapoint=datapoint,
                    for_quarter=quarter,
                    defaults={
                        'performance': value,
                        'is_verified': is_verified
                    }
                )

            elif type_ == "month":
                month = Month.objects.get(id=month_id)
                MonthData.objects.update_or_create(
                    indicator=indicator,
                    for_datapoint=datapoint,
                    for_month=month,
                    defaults={
                        'performance': value,
                        'is_verified': is_verified
                    }
                )

            
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
