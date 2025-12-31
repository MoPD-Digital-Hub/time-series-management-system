
from rest_framework.decorators import api_view
from rest_framework.response import Response
from ..models import Indicator, Topic, Category
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from ..serializer import (
    IndicatorAnnualSerializer,
    IndicatorMonthlySerializer,
    IndicatorQuarterlySerializer,
    WeeklyKPIRecordUpdateSerializer,
    DailyKPIRecordUpdateSerializer,
)
from ..serializer import TopicSerializers, TrendingIndicatorSerializer,IndicatorQuarterlySerializer
from django.db.models import F, Prefetch
from ..models import AnnualData, MonthData, QuarterData, DataPoint, TrendingIndicator, Category, Quarter, Month, KPIRecord
from rest_framework import status
from django.db.models import Q
import json
from datetime import datetime
from ethiopian_date_converter.ethiopian_date_convertor import to_ethiopian, EthDate

def indicator_data_api(request, indicator_title):
    try:
        indicator = Indicator.objects.get(title_ENG=indicator_title)
    except Indicator.DoesNotExist:
        return JsonResponse({
            'error': 'Indicator not found',
            'message': f'No indicator found with title: {indicator_title}'
        }, status=404)
    
    if not indicator.is_verified:
        return JsonResponse({
            'error': 'Indicator not verified',
            'message': 'This indicator has not been verified yet and is not available for viewing.',
            'last_10': [],
            'recent_year': None,
            'monthly': [],
            'quarterly': [],
            'weekly': [],
            'daily': [],
            'latest_annual': None,
            'all_annual': [],
            'title_eng': indicator.title_ENG,
            'title_amh': indicator.title_AMH,
        }, status=200)

    # --- Annual data ---
    annual_qs = AnnualData.objects.filter(indicator=indicator, for_datapoint__isnull=False, is_verified=True)\
        .select_related('for_datapoint').order_by('-for_datapoint__year_GC')
    data_points = [
        {
            'year_ec': a.for_datapoint.year_EC,
            'year_gc': a.for_datapoint.year_GC,
            'performance': float(a.performance) if a.performance is not None else None
        }
        for a in annual_qs
    ]
    last_10 = data_points[:10][::-1]
    recent_year = data_points[0]['year_gc'] if data_points else None

    # --- Monthly data ---
    monthly_qs = MonthData.objects.filter(indicator=indicator, is_verified=True)\
        .select_related('for_month', 'for_datapoint')\
        .order_by('for_datapoint__year_GC', 'for_month__number')
    monthly = [
        {
            'month': m.for_month.month_ENG,
            'month_amh': m.for_month.month_AMH,
            'month_number': m.for_month.number,
            'year_ec': m.for_datapoint.year_EC if m.for_datapoint else None,
            'year_gc': m.for_datapoint.year_GC if m.for_datapoint else None,
            'performance': float(m.performance) if m.performance is not None else None
        }
        for m in monthly_qs
    ]

    # --- Quarterly data ---
    quarterly = []
    if recent_year:
        dps = DataPoint.objects.filter(year_GC=recent_year)
        quarter_qs = QuarterData.objects.filter(for_datapoint__in=dps, indicator=indicator, is_verified=True)\
            .select_related('for_quarter', 'for_datapoint')
        quarterly = [
            {
                'quarter': q.for_quarter.title_ENG if q.for_quarter else '',
                'quarter_number': q.for_quarter.number if q.for_quarter else None,
                'year_ec': q.for_datapoint.year_EC if q.for_datapoint else None,
                'year_gc': q.for_datapoint.year_GC if q.for_datapoint else None,
                'performance': float(q.performance) if q.performance is not None else None
            }
            for q in quarter_qs
        ]

    # --- Weekly data from KPIRecord ---
    weekly_qs = KPIRecord.objects.filter(indicator=indicator, record_type='weekly', is_verified=True)\
        .order_by('-date')
    weekly = [
        {
            'date': w.date.isoformat(),
            'ethio_date': w.ethio_date,
            'performance': float(w.performance) if w.performance is not None else None,
            'target': float(w.target) if w.target is not None else None
        }
        for w in weekly_qs
    ]

    # --- Daily data from KPIRecord ---
    daily_qs = KPIRecord.objects.filter(indicator=indicator, record_type='daily', is_verified=True)\
        .order_by('-date')
    daily = [
        {
            'date': d.date.isoformat(),
            'ethio_date': d.ethio_date,
            'performance': float(d.performance) if d.performance is not None else None,
            'target': float(d.target) if d.target is not None else None
        }
        for d in daily_qs
    ]

    latest_annual = data_points[0] if data_points else None

    return JsonResponse({
        'last_10': last_10,
        'recent_year': recent_year,
        'monthly': monthly,
        'quarterly': quarterly,
        'weekly': weekly,
        'daily': daily,
        'latest_annual': latest_annual,
        'all_annual': data_points,
        'title_eng': indicator.title_ENG,
        'title_amh': indicator.title_AMH,
    })

def indicator_data_by_id_api(request, indicator_id):
    try:
        indicator = Indicator.objects.get(pk=indicator_id)
    except Indicator.DoesNotExist:
        return JsonResponse({
            'error': 'Indicator not found',
            'message': f'No indicator found with ID: {indicator_id}'
        }, status=404)
    
    if not indicator.is_verified:
        return JsonResponse({
            'error': 'Indicator not verified',
            'message': 'This indicator has not been verified yet and is not available for viewing.',
            'last_10': [],
            'recent_year': None,
            'monthly': [],
            'quarterly': [],
            'weekly': [],
            'daily': [],
            'latest_annual': None,
            'all_annual': [],
            'title_eng': indicator.title_ENG,
            'title_amh': indicator.title_AMH,
        }, status=200)
    
    # --- Annual data ---
    annual_qs = AnnualData.objects.filter(indicator=indicator, for_datapoint__isnull=False, is_verified=True)\
        .select_related('for_datapoint').order_by('-for_datapoint__year_GC')
    data_points = [
        {
            'year_ec': a.for_datapoint.year_EC,
            'year_gc': a.for_datapoint.year_GC,
            'performance': float(a.performance) if a.performance is not None else None
        }
        for a in annual_qs
    ]
    last_10 = data_points[:10][::-1]
    recent_year = data_points[0]['year_gc'] if data_points else None

    # --- Monthly data ---
    monthly_qs = MonthData.objects.filter(indicator=indicator, is_verified=True)\
        .select_related('for_month', 'for_datapoint')\
        .order_by('for_datapoint__year_GC', 'for_month__number')
    monthly = [
        {
            'month': m.for_month.month_ENG,
            'month_amh': m.for_month.month_AMH,
            'month_number': m.for_month.number,
            'year_ec': m.for_datapoint.year_EC if m.for_datapoint else None,
            'year_gc': m.for_datapoint.year_GC if m.for_datapoint else None,
            'performance': float(m.performance) if m.performance is not None else None
        }
        for m in monthly_qs
    ]

    # --- Quarterly data ---
    quarterly = []
    if recent_year:
        dps = DataPoint.objects.filter(year_GC=recent_year)
        quarter_qs = QuarterData.objects.filter(for_datapoint__in=dps, indicator=indicator, is_verified=True)\
            .select_related('for_quarter', 'for_datapoint')
        quarterly = [
            {
                'quarter': q.for_quarter.title_ENG if q.for_quarter else '',
                'quarter_number': q.for_quarter.number if q.for_quarter else None,
                'year_ec': q.for_datapoint.year_EC if q.for_datapoint else None,
                'year_gc': q.for_datapoint.year_GC if q.for_datapoint else None,
                'performance': float(q.performance) if q.performance is not None else None
            }
            for q in quarter_qs
        ]

    # --- Weekly data from KPIRecord ---
    weekly_qs = KPIRecord.objects.filter(indicator=indicator, record_type='weekly', is_verified=True)\
        .order_by('-date')
    weekly = [
        {
            'date': w.date.isoformat(),
            'ethio_date': w.ethio_date,
            'performance': float(w.performance) if w.performance is not None else None,
            'target': float(w.target) if w.target is not None else None
        }
        for w in weekly_qs
    ]

    # --- Daily data from KPIRecord ---
    daily_qs = KPIRecord.objects.filter(indicator=indicator, record_type='daily', is_verified=True)\
        .order_by('-date')
    daily = [
        {
            'date': d.date.isoformat(),
            'ethio_date': d.ethio_date,
            'performance': float(d.performance) if d.performance is not None else None,
            'target': float(d.target) if d.target is not None else None
        }
        for d in daily_qs
    ]

    latest_annual = data_points[0] if data_points else None

    return JsonResponse({
        'last_10': last_10,
        'recent_year': recent_year,
        'monthly': monthly,
        'quarterly': quarterly,
        'weekly': weekly,
        'daily': daily,
        'latest_annual': latest_annual,
        'all_annual': data_points,
        'title_eng': indicator.title_ENG,
        'title_amh': indicator.title_AMH,
    })


@api_view(['POST', 'PATCH'])
def indicators_bulk_api(request):
    # Handle data fetching (GET or POST)
    # Normalize inputs so `id_list` and `mode` are always defined regardless of method.
    id_list = []
    mode = request.GET.get('mode') or request.GET.get('record_type') or 'annual'

    if request.method == 'POST':
        # DRF parses JSON into request.data for us, but be defensive and fall back to body parsing.
        try:
            payload = request.data if isinstance(request.data, dict) else json.loads(request.body)
        except Exception:
            payload = request.data if isinstance(request.data, dict) else {}

        # Accept either `records` (array) or `ids` (csv or array) or `records_ids` for compatibility
        raw_ids = payload.get('records') or payload.get('ids') or payload.get('records_ids') or []
        # Mode key used by clients is `record_type` in some callers
        mode = payload.get('record_type') or payload.get('mode') or mode or 'annual'

        # Normalize id list to a Python list of ints/strings
        if isinstance(raw_ids, str):
            # comma-separated string
            id_list = [s for s in [x.strip() for x in raw_ids.split(",")] if s]
        elif isinstance(raw_ids, (list, tuple)):
            id_list = list(raw_ids)
        elif raw_ids is None:
            id_list = []
        else:
            # unexpected shape
            id_list = []

    elif request.method == 'GET':
        # GET may provide `ids` as a comma-separated query param or multiple `ids` params
        ids_q = request.GET.get('ids')
        if ids_q:
            if isinstance(ids_q, str) and ',' in ids_q:
                id_list = [s for s in [x.strip() for x in ids_q.split(',')] if s]
            else:
                # getlist will return multiple values if provided as ?ids=1&ids=2
                id_list = request.GET.getlist('ids') or [ids_q]
        else:
            id_list = []
    
    # Handle PATCH requests (data updates)
    elif request.method == 'PATCH':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)

        mode_patch = data.get('mode', 'annual')
        updates = data.get('updates', [])

        if not isinstance(updates, list) or not updates:
            return JsonResponse({'error': 'Updates must be a non-empty list.'}, status=400)

        # Determine verification status based on user role
        is_verified_status = request.user.is_category_manager or request.user.is_superuser


        errors = []
        results = []

        for item in updates:
            indicator_id = item.get('indicator_id')
            value = item.get('value')
            year_ec = item.get('year_ec')
            year_gc = item.get('year_gc')

            if not indicator_id or year_ec is None or value is None:
                errors.append({'item': item, 'error': 'Missing indicator_id, year_ec, or value.'})
                continue

            try:
                indicator = Indicator.objects.get(id=indicator_id)
            except Indicator.DoesNotExist:
                errors.append({'item': item, 'error': 'Indicator not found.'})
                continue

            datapoint, _ = DataPoint.objects.get_or_create(year_EC=year_ec)
            if year_gc:
                datapoint.year_GC = year_gc
                datapoint.save()

            try:
                if mode_patch == 'annual':
                    ad, created = AnnualData.objects.update_or_create(
                        indicator=indicator,
                        for_datapoint=datapoint,
                        defaults={'performance': value, 'is_verified': is_verified_status}

                    )
                    results.append({'indicator_id': indicator_id, 'year_ec': year_ec, 'value': value, 'created': created})

                elif mode_patch == 'monthly':
                    month_number = item.get('month_number')
                    if month_number is None:
                        errors.append({'item': item, 'error': 'month_number is required for monthly updates.'})
                        continue
                    month = Month.objects.filter(number=month_number).first()
                    if not month:
                        errors.append({'item': item, 'error': f'Month with number {month_number} not found.'})
                        continue
                    md, created = MonthData.objects.update_or_create(
                        indicator=indicator,
                        for_datapoint=datapoint,
                        for_month=month,
                        defaults={'performance': value, 'is_verified': is_verified_status}

                    )
                    results.append({'indicator_id': indicator_id, 'year_ec': year_ec, 'month_number': month_number, 'value': value, 'created': created})

                elif mode_patch == 'quarterly':
                    quarter_number = item.get('quarter_number')
                    if quarter_number is None:
                        errors.append({'item': item, 'error': 'quarter_number is required for quarterly updates.'})
                        continue
                    quarter = Quarter.objects.filter(number=quarter_number).first()
                    if not quarter:
                        errors.append({'item': item, 'error': f'Quarter with number {quarter_number} not found.'})
                        continue
                    qd, created = QuarterData.objects.update_or_create(
                        indicator=indicator,
                        for_datapoint=datapoint,
                        for_quarter=quarter,
                        defaults={'performance': value, 'is_verified': is_verified_status}

                    )
                    results.append({'indicator_id': indicator_id, 'year_ec': year_ec, 'quarter_number': quarter_number, 'value': value, 'created': created})
                
                elif mode_patch == 'weekly':
                    week = item.get('week')
                    date_str = item.get('date')
                    if not date_str:
                        errors.append({'item': item, 'error': 'date is required for weekly updates.'})
                        continue
                    
                    from datetime import datetime
                    try:
                        record_date = datetime.fromisoformat(date_str).date()
                    except:
                        errors.append({'item': item, 'error': f'Invalid date format: {date_str}'})
                        continue
                    
                    kr, created = KPIRecord.objects.update_or_create(
                        indicator=indicator,
                        record_type='weekly',
                        date=record_date,
                        defaults={'performance': value, 'is_verified': is_verified_status}

                    )
                    results.append({'indicator_id': indicator_id, 'date': date_str, 'week': week, 'value': value, 'created': created})
                
                elif mode_patch == 'daily':
                    date_str = item.get('date')
                    if not date_str:
                        errors.append({'item': item, 'error': 'date is required for daily updates.'})
                        continue
                    
                    from datetime import datetime
                    try:
                        record_date = datetime.fromisoformat(date_str).date()
                    except:
                        errors.append({'item': item, 'error': f'Invalid date format: {date_str}'})
                        continue
                    
                    kr, created = KPIRecord.objects.update_or_create(
                        indicator=indicator,
                        record_type='daily',
                        date=record_date,
                        defaults={'performance': value, 'is_verified': is_verified_status}

                    )
                    results.append({'indicator_id': indicator_id, 'date': date_str, 'value': value, 'created': created})
                
                else:
                    errors.append({'item': item, 'error': 'Invalid mode.'})
            except Exception as e:
                errors.append({'item': item, 'error': str(e)})

        response = {
            'results': results, 
            'saved': len(results),
            'verification_status': 'verified' if is_verified_status else 'pending'
        }
        if errors:
            response['errors'] = errors

        return JsonResponse(response)

    # provide available DataPoint years so frontend can render year rows even when
    # selected indicators have no data. Use EC as integer and GC as returned by model.
    datapoints_qs = DataPoint.objects.order_by('-year_EC').values('year_EC', 'year_GC')
    datapoints = [
        {'year_ec': dp['year_EC'], 'year_gc': dp['year_GC']}
        for dp in datapoints_qs
    ]

    if not id_list:
        return JsonResponse({'results': [], 'datapoints': datapoints})
    
    # Safeguard: Warn if requesting too many indicators
    MAX_INDICATORS = 2000
    if len(id_list) > MAX_INDICATORS:
        return JsonResponse({
            'error': f'Too many indicators requested. Maximum is {MAX_INDICATORS}, but {len(id_list)} were requested.',
            'message': 'Please select fewer indicators or contact support for bulk data export options.'
        }, status=400)
    
    # Add warning for large requests (will be included in response)
    warning_message = None
    if len(id_list) > 500:
        warning_message = f'Large request: {len(id_list)} indicators selected. This may take longer to load.'

    # Optimize query: only fetch needed fields to reduce memory usage
    indicators = list(
        Indicator.objects.filter(id__in=id_list, is_verified=True)
        .only('id', 'title_ENG', 'title_AMH', 'code')
    )

    # --- Preload Annual Data ---
    annual_all = AnnualData.objects.filter(
        indicator_id__in=id_list, for_datapoint__isnull=False, is_verified=True
    ).select_related('for_datapoint')

    annual_map = {}
    for row in annual_all.values('indicator_id', 'for_datapoint__year_EC', 'for_datapoint__year_GC', 'performance'):
        lst = annual_map.setdefault(row['indicator_id'], [])
        lst.append({
            'year_ec': row['for_datapoint__year_EC'],
            'year_gc': row['for_datapoint__year_GC'],
            'value': float(row['performance']) if row['performance'] is not None else None
        })

    for arr in annual_map.values():
        arr.sort(key=lambda x: (x['year_gc'] or ''), reverse=True)

    # --- Annual Mode ---
    if mode in ('annual', 'all'):
        ser = IndicatorAnnualSerializer(indicators, many=True, context={'annual_map': annual_map})
        response_data = {'mode': 'annual', 'results': ser.data, 'datapoints': datapoints}
        if warning_message:
            response_data['warning'] = warning_message
        return JsonResponse(response_data)

    # --- Monthly Mode ---
    if mode == 'monthly':
        month_rows = MonthData.objects.filter(indicator_id__in=id_list, is_verified=True)\
            .select_related('for_month', 'for_datapoint')\
            .values(
                'indicator_id', 'performance',
                'for_month__month_ENG', 'for_month__month_AMH', 'for_month__number',
                'for_datapoint__year_EC', 'for_datapoint__year_GC'
            )

        monthly_map = {ind.id: [] for ind in indicators}
        for r in month_rows:
            ind_id = r.get('indicator_id')
            if not ind_id:
                continue
            monthly_map.setdefault(ind_id, []).append({
                'month': r.get('for_month__month_ENG'),
                'month_amh': r.get('for_month__month_AMH'),
                'month_number': r.get('for_month__number'),
                'year_ec': r.get('for_datapoint__year_EC'),
                'year_gc': r.get('for_datapoint__year_GC'),
                'value': float(r['performance']) if r.get('performance') is not None else None,
            })

        # sort latest -> oldest, months newest first
        for arr in monthly_map.values():
            arr.sort(key=lambda x: (int(x.get('year_ec') or 0), int(x.get('month_number') or 0)), reverse=True)

        ser = IndicatorMonthlySerializer(indicators, many=True, context={'monthly_map': monthly_map})
        return JsonResponse({'mode': 'monthly', 'results': ser.data, 'datapoints': datapoints})

    # --- Quarterly Mode ---
    if mode == 'quarterly':
        qrows = QuarterData.objects.filter(indicator_id__in=id_list, is_verified=True)\
            .select_related('for_quarter', 'for_datapoint')\
            .values(
                'indicator_id',
                'for_quarter__title_ENG', 'for_quarter__number',
                'for_datapoint__year_EC', 'for_datapoint__year_GC',
                'performance'
            )
    
        quarterly_map = {ind.id: [] for ind in indicators}
        for r in qrows:
            # Skip incomplete data
            if not r.get('for_quarter__number') or not r.get('for_datapoint__year_EC'):
                continue
            ind_id = r.get('indicator_id')
            if not ind_id:
                continue
            quarterly_map.setdefault(ind_id, []).append({
                'quarter': r.get('for_quarter__title_ENG') or f'Q{r.get("for_quarter__number")}',
                'quarter_number': int(r.get('for_quarter__number')),
                'year_ec': r.get('for_datapoint__year_EC'),
                'year_gc': r.get('for_datapoint__year_GC'),
                'value': float(r.get('performance')) if r.get('performance') is not None else None,
            })
    
        # Sort latest -> oldest by EC year and quarter number
        for arr in quarterly_map.values():
            arr.sort(key=lambda x: (int(x.get('year_ec') or 0), int(x.get('quarter_number') or 0)), reverse=True)
    
        ser = IndicatorQuarterlySerializer(indicators, many=True, context={'quarterly_map': quarterly_map})
        return JsonResponse({'mode': 'quarterly', 'results': ser.data, 'datapoints': datapoints})

    # --- Weekly Mode ---
    if mode == 'weekly':
        weekly_map = {ind.id: [] for ind in indicators}
        
        # Get 5 most recent weeks PER indicator
        for ind in indicators:
            weekly_rows = KPIRecord.objects.filter(
                indicator=ind, 
                record_type='weekly', 
                is_verified=True
            ).order_by('-date')[:5]  # 5 per indicator
            
            for r in weekly_rows:
                # Parse Ethiopian date to get week info
                parts = r.ethio_date.split('-') if r.ethio_date else []
                week_num = int(parts[2]) if len(parts) == 3 else 1
                month_num = int(parts[1]) if len(parts) >= 2 else r.date.month
                year_ec = int(parts[0]) if len(parts) >= 1 else None
                
                # Get month name
                month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                month_name = month_names[r.date.month - 1] if r.date.month <= 12 else str(r.date.month)
                
                weekly_map[ind.id].append({
                    'date': r.date.isoformat(),
                    'week': week_num,
                    'week_label': f"Week{week_num} ({month_name})",
                    'month_number': month_num,
                    'month_name': month_name,
                    'year_ec': year_ec,
                    'year_gc': str(r.date.year),
                    'value': float(r.performance) if r.performance is not None else None,
                    'target': float(r.target) if r.target is not None else None,
                })

        # Build results
        results_data = []
        for ind in indicators:
            results_data.append({
                'id': ind.id,
                'title': ind.title_ENG,
                'code': ind.code,
                'weekly': weekly_map.get(ind.id, [])
            })
        
        return JsonResponse({'mode': 'weekly', 'results': results_data, 'datapoints': datapoints})

    # --- Daily Mode ---
    if mode == 'daily':
        daily_map = {ind.id: [] for ind in indicators}
        
        # Get 10 most recent days PER indicator
        for ind in indicators:
            daily_rows = KPIRecord.objects.filter(
                indicator=ind,
                record_type='daily',
                is_verified=True
            ).order_by('-date')[:10]  # 10 per indicator
            
            for r in daily_rows:
                # Parse Ethiopian date
                parts = r.ethio_date.split('-') if r.ethio_date else []
                year_ec = int(parts[0]) if len(parts) >= 1 else None
                
                # Format Gregorian date
                greg_date_str = r.date.strftime("%b %d, %Y")
                
                daily_map[ind.id].append({
                    'date': r.date.isoformat(),
                    'greg_date_formatted': greg_date_str,
                    'ethio_date': r.ethio_date,
                    'day_label': f"{greg_date_str}",
                    'year_ec': year_ec,
                    'year_gc': str(r.date.year),
                    'value': float(r.performance) if r.performance is not None else None,
                    'target': float(r.target) if r.target is not None else None,
                })

        # Build results
        results_data = []
        for ind in indicators:
            results_data.append({
                'id': ind.id,
                'title': ind.title_ENG,
                'code': ind.code,
                'daily': daily_map.get(ind.id, [])
            })
        return JsonResponse({'mode': 'daily', 'results': results_data, 'datapoints': datapoints})
    
    # Fallback to annual if mode doesn't match any known types
    ser = IndicatorAnnualSerializer(indicators, many=True, context={'annual_map': annual_map})
    
    return JsonResponse({'mode': 'annual', 'results': ser.data, 'datapoints': datapoints})

@api_view(['PATCH'])
def kpi_weekly_bulk_api(request):
    try:
        payload = json.loads(request.body)
    except Exception:
        payload = request.data if isinstance(request.data, dict) else {}

    updates = payload.get('updates', [])
    if not isinstance(updates, list) or not updates:
        return JsonResponse({'error': 'Updates must be a non-empty list.'}, status=400)

    errors = []
    results = []

    for item in updates:
        serializer = WeeklyKPIRecordUpdateSerializer(data=item)
        if not serializer.is_valid():
            errors.append({'item': item, 'error': serializer.errors})
            continue

        ind_id = serializer.validated_data.get('indicator_id')
        date_val = serializer.validated_data.get('date')
        perf = serializer.validated_data.get('performance', item.get('value'))
        target = serializer.validated_data.get('target')
        # Enforce verification logic: Only managers can verify directly
        is_manager = request.user.is_category_manager or request.user.is_superuser
        req_verified = serializer.validated_data.get('is_verified', True)
        is_verified = is_manager and req_verified

        try:
            indicator = Indicator.objects.get(id=ind_id)
        except Indicator.DoesNotExist:
            errors.append({'item': item, 'error': 'Indicator not found.'})
            continue

        try:
            # validate week within month (1-5) based on Ethiopian date
            eth = to_ethiopian(EthDate(date_val.day, date_val.month, date_val.year))
            week_num = min(((eth.day - 1) // 7) + 1, 5)
            if week_num < 1 or week_num > 5:
                errors.append({'item': item, 'error': 'Week must be between 1 and 5 for the month.'})
                continue

            _, created = KPIRecord.objects.update_or_create(
                indicator=indicator,
                record_type='weekly',
                date=date_val,
                defaults={
                    'performance': perf,
                    'target': target,
                    'is_verified': is_verified,
                },
            )
            results.append({
                'indicator_id': ind_id,
                'date': date_val.isoformat() if hasattr(date_val, 'isoformat') else str(date_val),
                'value': perf,
                'target': target,
                'created': created,
            })
        except Exception as e:
            errors.append({'item': item, 'error': str(e)})

    response = {
        'results': results, 
        'saved': len(results),
        'verification_status': 'verified' if (request.user.is_category_manager or request.user.is_superuser) else 'pending'
    }
    if errors:
        response['errors'] = errors
    return JsonResponse(response, status=200 if results else 400 if errors else 200)


@api_view(['PATCH'])
def kpi_daily_bulk_api(request):
    try:
        payload = json.loads(request.body)
    except Exception:
        payload = request.data if isinstance(request.data, dict) else {}

    updates = payload.get('updates', [])
    if not isinstance(updates, list) or not updates:
        return JsonResponse({'error': 'Updates must be a non-empty list.'}, status=400)

    errors = []
    results = []

    for item in updates:
        serializer = DailyKPIRecordUpdateSerializer(data=item)
        if not serializer.is_valid():
            errors.append({'item': item, 'error': serializer.errors})
            continue

        ind_id = serializer.validated_data.get('indicator_id')
        date_val = serializer.validated_data.get('date')
        perf = serializer.validated_data.get('performance', item.get('value'))
        target = serializer.validated_data.get('target')
        # Enforce verification logic
        is_manager = request.user.is_category_manager or request.user.is_superuser
        req_verified = serializer.validated_data.get('is_verified', True)
        is_verified = is_manager and req_verified

        try:
            indicator = Indicator.objects.get(id=ind_id)
        except Indicator.DoesNotExist:
            errors.append({'item': item, 'error': 'Indicator not found.'})
            continue

        try:
            _, created = KPIRecord.objects.update_or_create(
                indicator=indicator,
                record_type='daily',
                date=date_val,
                defaults={
                    'performance': perf,
                    'target': target,
                    'is_verified': is_verified,
                },
            )
            results.append({
                'indicator_id': ind_id,
                'date': date_val.isoformat() if hasattr(date_val, 'isoformat') else str(date_val),
                'value': perf,
                'target': target,
                'created': created,
            })
        except Exception as e:
            errors.append({'item': item, 'error': str(e)})

    response = {
        'results': results, 
        'saved': len(results),
        'verification_status': 'verified' if (request.user.is_category_manager or request.user.is_superuser) else 'pending'
    }
    if errors:
        response['errors'] = errors
    return JsonResponse(response, status=200 if results else 400 if errors else 200)


@api_view(['GET'])
def topic_categories_api(request, topic_id):
    try:
        topic = Topic.objects.prefetch_related('categories__indicators').get(id=topic_id)
    except Topic.DoesNotExist:
        return Response({'error': 'Topic not found'}, status=404)
    data = TopicSerializers(topic).data
    if 'categories' not in data or data['categories'] is None:
        data['categories'] = []
    return Response(data)


@api_view(['GET'])
def dashboard_counts_api(request):
    return Response({
        'topics': Topic.objects.count(),
        'categories': Category.objects.count(),
        'indicators': Indicator.objects.filter(is_verified=True).count(),
    })


@api_view(['GET'])
def indicators_per_topic_api(request):
    topics = Topic.objects.prefetch_related('categories__indicators').all()
    result = []
    for topic in topics:
        count = 0
        for cat in topic.categories.all():
            count += cat.indicators.count()
        result.append({
            'id': topic.id,
            'title_eng': topic.title_eng,
            'indicator_count': count
        })
    return Response(result)


@api_view(['GET', 'POST'])
def trending_indicator_list_create(request):
    if request.method == 'GET':
        queryset = TrendingIndicator.objects.select_related('indicator').order_by('-created_at')
        serializer = TrendingIndicatorSerializer(queryset, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = TrendingIndicatorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def trending_indicator_detail(request, pk):
    trending = get_object_or_404(TrendingIndicator, pk=pk)
    if request.method == 'GET':
        serializer = TrendingIndicatorSerializer(trending)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = TrendingIndicatorSerializer(trending, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        trending.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def indicators_per_category_api(request):
    categories = Category.objects.prefetch_related('indicators').all()
    data = []
    for cat in categories:
        data.append({
            'id': cat.id,
            'name_ENG': cat.name_ENG,
            'indicator_count': cat.indicators.count(),
            'indicators': [
                {
                    'id': i.id,
                    'title_ENG': i.title_ENG,
                    'is_verified': i.is_verified
                }
                for i in cat.indicators.all()
            ]
        })
    return Response(data)