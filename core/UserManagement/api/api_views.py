from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ..models import CustomUser, CategoryAssignment, IndicatorSubmission, DataSubmission
from Base.models import Category, Indicator, DataPoint, Month, MonthData, Quarter, QuarterData, AnnualData, KPIRecord
from ..serializers import (
    CustomUserSerializer, CategoryAssignmentSerializer,
    IndicatorSubmissionSerializer, DataSubmissionSerializer,
    UserManagementStatsSerializer, UnassignedCategorySerializer
)
from datetime import timedelta, date
from ethiopian_date_converter.ethiopian_date_convertor import to_ethiopian, EthDate
import secrets
from ..models import CustomUser as UM_CustomUser
import csv
import os
from django.http import HttpResponse
import tablib
try:
    import openpyxl
except Exception:
    openpyxl = None

from io import TextIOWrapper

from rest_framework.views import APIView


@api_view(['GET'])
def user_management_stats_api(request):
    """Get user management dashboard statistics"""
    try:
        stats = {
            'total_users': CustomUser.objects.count(),
            'active_users': CustomUser.objects.filter(is_active=True).count(),
            'category_managers': CustomUser.objects.filter(is_category_manager=True).count(),
            'importers': CustomUser.objects.filter(is_importer=True).count(),
            'pending_indicator_submissions': IndicatorSubmission.objects.filter(status='pending').count(),
            'pending_data_submissions': DataSubmission.objects.filter(status='pending').count(),
        }
        serializer = UserManagementStatsSerializer(stats)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def users_list_api(request):
    """Get paginated list of users with filtering"""
    search_query = request.GET.get('search', '')
    role_filter = request.GET.get('role', '')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    users = CustomUser.objects.all()
    
    if search_query:
        users = users.filter(
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query) |
            Q(username__icontains=search_query)
        )
    
    if role_filter:
        if role_filter == 'category_manager':
            users = users.filter(is_category_manager=True)
        elif role_filter == 'importer':
            users = users.filter(is_importer=True)
        elif role_filter == 'admin':
            users = users.filter(is_staff=True)
    
    # Pagination
    paginator = Paginator(users, page_size)
    users_page = paginator.get_page(page)
    
    serializer = CustomUserSerializer(users_page.object_list, many=True)
    
    return Response({
        'results': serializer.data,
        'pagination': {
            'current_page': users_page.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'has_next': users_page.has_next(),
            'has_previous': users_page.has_previous(),
            'start_index': users_page.start_index(),
            'end_index': users_page.end_index(),
        }
    })


@api_view(['GET'])
def indicator_submissions_api(request):
    """Get paginated list of indicator submissions with filtering"""
    status_filter = request.GET.get('status', '')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    submissions = IndicatorSubmission.objects.select_related(
        'indicator', 'submitted_by', 'verified_by'
    ).order_by('-submitted_at')
    
    if status_filter:
        submissions = submissions.filter(status=status_filter)
    
    # Pagination
    paginator = Paginator(submissions, page_size)
    submissions_page = paginator.get_page(page)
    
    serializer = IndicatorSubmissionSerializer(submissions_page.object_list, many=True)
    
    return Response({
        'results': serializer.data,
        'pagination': {
            'current_page': submissions_page.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'has_next': submissions_page.has_next(),
            'has_previous': submissions_page.has_previous(),
            'start_index': submissions_page.start_index(),
            'end_index': submissions_page.end_index(),
        }
    })


@api_view(['GET'])
def data_submissions_api(request):
    """Get paginated list of data submissions with filtering"""
    status_filter = request.GET.get('status', '')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    submissions = DataSubmission.objects.select_related(
        'indicator', 'submitted_by', 'verified_by'
    ).order_by('-submitted_at')
    
    if status_filter:
        submissions = submissions.filter(status=status_filter)
    
    # Pagination
    paginator = Paginator(submissions, page_size)
    submissions_page = paginator.get_page(page)
    
    serializer = DataSubmissionSerializer(submissions_page.object_list, many=True)
    
    return Response({
        'results': serializer.data,
        'pagination': {
            'current_page': submissions_page.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'has_next': submissions_page.has_next(),
            'has_previous': submissions_page.has_previous(),
            'start_index': submissions_page.start_index(),
            'end_index': submissions_page.end_index(),
        }
    })


@api_view(['GET'])
def category_assignments_api(request):
    """Get paginated list of category assignments"""
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    assignments = CategoryAssignment.objects.select_related(
        'manager', 'category'
    ).order_by('category__name_ENG')
    
    # Pagination
    paginator = Paginator(assignments, page_size)
    assignments_page = paginator.get_page(page)
    
    serializer = CategoryAssignmentSerializer(assignments_page.object_list, many=True)
    
    return Response({
        'results': serializer.data,
        'pagination': {
            'current_page': assignments_page.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'has_next': assignments_page.has_next(),
            'has_previous': assignments_page.has_previous(),
            'start_index': assignments_page.start_index(),
            'end_index': assignments_page.end_index(),
        }
    })


@api_view(['GET'])
def unassigned_categories_api(request):
    """Get list of categories not assigned to any manager"""
    assigned_category_ids = CategoryAssignment.objects.values_list('category_id', flat=True)
    unassigned_categories = Category.objects.exclude(id__in=assigned_category_ids).prefetch_related('indicators')
    
    serializer = UnassignedCategorySerializer(unassigned_categories, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def create_importer_api(request):
    """Allow a category manager to create an importer (is_importer=True) under their management."""
    if not request.user.is_authenticated or not request.user.is_category_manager:
        return Response({'error': 'Access denied. Only category managers can create importers.'}, status=status.HTTP_403_FORBIDDEN)

    # support both JSON and multipart/form-data (photo upload)
    email = (request.data.get('email') or '').strip().lower()
    first_name = (request.data.get('first_name') or '').strip()
    last_name = (request.data.get('last_name') or '').strip()
    password = request.data.get('password') or None
    photo = request.FILES.get('photo')
    assigned_category = request.data.get('assigned_category') or None

    if not email or '@' not in email:
        return Response({'error': 'A valid email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if UM_CustomUser.objects.filter(email=email).exists():
        return Response({'error': 'A user with that email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    # generate password if not provided
    if not password:
        password = secrets.token_urlsafe(8)

    # derive a username from email (ensure unique)
    base_username = email.split('@')[0][:30]
    username = base_username
    suffix = 1
    while UM_CustomUser.objects.filter(username=username).exists():
        username = f"{base_username}{suffix}"
        suffix += 1

    try:
        user = UM_CustomUser.objects.create_user(email=email, username=username, first_name=first_name, last_name=last_name, password=password)
        user.is_importer = True
        user.manager = request.user
        if photo:
            user.photo = photo
        user.save()
        # Validate assigned_category (do not persist a new model here; return info to client)
        assigned_category_info = None
        if assigned_category:
            try:
                ac_id = int(assigned_category)
                # only allow categories the current manager actually manages
                if CategoryAssignment.objects.filter(manager=request.user, category_id=ac_id).exists():
                    cat = Category.objects.get(id=ac_id)
                    assigned_category_info = {'id': cat.id, 'name': cat.name_ENG}
                else:
                    # ignore silently (client may have tampered)
                    assigned_category_info = None
            except Exception:
                assigned_category_info = None
        resp = {'message': 'Importer created', 'id': user.id, 'email': user.email}
        # include password in response only if we generated one or one was provided
        if password:
            resp['password'] = password
        if assigned_category_info:
            resp['assigned_category'] = assigned_category_info
        return Response(resp, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def recent_submissions_api(request):
    """Get recent indicator and data submissions for dashboard"""
    limit = int(request.GET.get('limit', 5))
    
    recent_indicator_submissions = IndicatorSubmission.objects.select_related(
        'indicator', 'submitted_by', 'verified_by'
    ).order_by('-submitted_at')[:limit]
    
    recent_data_submissions = DataSubmission.objects.select_related(
        'indicator', 'submitted_by', 'verified_by'
    ).order_by('-submitted_at')[:limit]
    
    indicator_serializer = IndicatorSubmissionSerializer(recent_indicator_submissions, many=True)
    data_serializer = DataSubmissionSerializer(recent_data_submissions, many=True)
    
    return Response({
        'indicator_submissions': indicator_serializer.data,
        'data_submissions': data_serializer.data,
    })


@api_view(['POST'])
def approve_submission_api(request):
    """Approve a submission (indicator or data)"""
    submission_type = request.data.get('type')
    submission_id = request.data.get('id')
    
    if submission_type == 'indicator':
        submission = get_object_or_404(IndicatorSubmission, id=submission_id)
    elif submission_type == 'data':
        submission = get_object_or_404(DataSubmission, id=submission_id)
    else:
        return Response({'error': 'Invalid submission type'}, status=status.HTTP_400_BAD_REQUEST)
    
    submission.status = 'approved'
    submission.verified_by = request.user
    submission.verified_at = timezone.now()
    submission.save()
    # If this is an indicator submission, mark the indicator as verified
    if submission_type == 'indicator' and hasattr(submission, 'indicator') and submission.indicator:
        try:
            ind = submission.indicator
            ind.is_verified = True
            ind.save(update_fields=['is_verified'])
        except Exception:
            # don't block approval if marking fails; approval already saved
            pass
    
    if submission_type == 'indicator':
        serializer = IndicatorSubmissionSerializer(submission)
    else:
        # attempt to import data into DB when a data submission is approved
        import_result = None
        try:
            import_result = _import_data_submission_to_db(submission)
        except Exception as e:
            # don't fail the approval if import fails; include error in response
            import_result = {'error': str(e)}
        serializer = DataSubmissionSerializer(submission)
    
    out = serializer.data
    if submission_type == 'data':
        # keep serialized submission fields at top-level for backwards compatibility
        # and attach import_result as an extra key
        try:
            out = dict(serializer.data)
        except Exception:
            out = serializer.data
        out['import_result'] = import_result
    return Response(out)


def _import_data_submission_to_db(submission: DataSubmission):


    result = {'created': 0, 'updated': 0, 'skipped': 0, 'errors': []}

    # ensure file path is available
    ffield = submission.data_file
    if not ffield:
        raise ValueError('No uploaded file attached to submission')

    file_path = ffield.path if hasattr(ffield, 'path') else None
    if not file_path or not os.path.exists(file_path):
        raise ValueError('Uploaded file not found on disk')

    # helper to parse rows from CSV or Excel
    def iter_rows_from_file(path):
        lower = path.lower()
        if lower.endswith('.csv'):
            with open(path, newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for r in reader:
                    yield r
        elif lower.endswith(('.xls', '.xlsx')):
            if not openpyxl:
                raise RuntimeError('openpyxl required to parse Excel files but is not installed')
            wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
            ws = wb.active
            rows = list(ws.rows)
            if not rows:
                return
            headers = [str(c.value).strip() if c.value is not None else '' for c in rows[0]]
            for row in rows[1:]:
                obj = {}
                for h, cell in zip(headers, row):
                    obj[h] = cell.value
                yield obj
        else:
            raise RuntimeError('Unsupported file type')

    # parse and import
    for i, raw in enumerate(iter_rows_from_file(file_path), start=1):
        try:
            # normalize keys to lowercase
            row = { (k or '').strip().lower(): (v if v is not None else '') for k,v in raw.items() }

            # determine year
            year = row.get('year_ec') or row.get('year_gc')
            if not year:
                result['skipped'] += 1
                result['errors'].append({'row': i, 'error': 'Missing year_EC/year_GC'})
                continue

            # performance
            perf_raw = row.get('performance') or row.get('value') or row.get('amount')
            if perf_raw in (None, ''):
                result['skipped'] += 1
                result['errors'].append({'row': i, 'error': 'Missing performance/value'})
                continue
            try:
                performance = float(perf_raw)
            except Exception:
                result['skipped'] += 1
                result['errors'].append({'row': i, 'error': f'Invalid performance value: {perf_raw}'})
                continue

            # find or create datapoint by year_EC (prefer)
            year_ec = row.get('year_ec') or None
            if not year_ec and row.get('year_gc'):
                # best-effort: try to derive year_ec from GC by subtracting 7 (approx)
                try:
                    year_ec = str(int(row.get('year_gc')) - 7)
                except Exception:
                    year_ec = None

            if year_ec:
                datapoint, _ = DataPoint.objects.get_or_create(year_EC=str(year_ec))
            else:
                datapoint, _ = DataPoint.objects.get_or_create(year_EC=str(year))

            # frequency
            if 'month' in row and row.get('month') != '':
                # month can be number or name
                mraw = str(row.get('month')).strip()
                month_obj = None
                try:
                    mnum = int(mraw)
                    month_obj = Month.objects.filter(number=mnum).first()
                except Exception:
                    # try to match by english name
                    month_obj = Month.objects.filter(month_ENG__iexact=mraw).first()
                if not month_obj:
                    # create a Month if numeric given
                    try:
                        if mraw.isdigit():
                            month_obj = Month.objects.create(number=int(mraw), month_ENG=str(mraw), month_AMH=str(mraw))
                        else:
                            raise ValueError('Unknown month')
                    except Exception:
                        result['skipped'] += 1
                        result['errors'].append({'row': i, 'error': f'Invalid month: {mraw}'})
                        continue

                obj, created = MonthData.objects.update_or_create(
                    for_datapoint=datapoint,
                    for_month=month_obj,
                    defaults={'indicator': submission.indicator, 'performance': performance, 'is_verified': True}
                )
                if created:
                    result['created'] += 1
                else:
                    result['updated'] += 1
                continue

            if 'quarter' in row and row.get('quarter') != '':
                qraw = row.get('quarter')
                try:
                    qnum = int(qraw)
                except Exception:
                    result['skipped'] += 1
                    result['errors'].append({'row': i, 'error': f'Invalid quarter: {qraw}'})
                    continue
                quarter_obj, _ = Quarter.objects.get_or_create(number=qnum, defaults={'title_ENG': f'Q{qnum}', 'title_AMH': f'Q{qnum}'})
                obj, created = QuarterData.objects.update_or_create(
                    for_datapoint=datapoint,
                    for_quarter=quarter_obj,
                    defaults={'indicator': submission.indicator, 'performance': performance, 'is_verified': True}
                )
                if created:
                    result['created'] += 1
                else:
                    result['updated'] += 1
                continue

            # else assume annual
            obj, created = AnnualData.objects.update_or_create(
                indicator=submission.indicator,
                for_datapoint=datapoint,
                defaults={'performance': performance, 'is_verified': True}
            )
            if created:
                result['created'] += 1
            else:
                result['updated'] += 1

        except Exception as e:
            result['skipped'] += 1
            result['errors'].append({'row': i, 'error': str(e)})

    return result


@api_view(['POST'])
def submit_bulk_data_api(request):
    if not request.user.is_importer:
        return Response({'error': 'Access denied. Only importers can submit data.'}, status=status.HTTP_403_FORBIDDEN)

    data_file = request.FILES.get('data_file')
    if not data_file:
        return Response({'error': 'data_file is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Read rows from uploaded file (CSV or Excel)
        filename = (getattr(data_file, 'name', '') or '').lower()
        _, ext = os.path.splitext(filename)
        ext = ext.lower()

        def iter_rows_from_upload(fobj, extension):
            if extension == '.csv':
                # Read entire stream as text and parse via DictReader
                content = fobj.read()
                if isinstance(content, bytes):
                    text = content.decode('utf-8', errors='replace')
                else:
                    text = str(content)
                lines = text.splitlines()
                reader = csv.DictReader(lines)
                for r in reader:
                    yield r
            elif extension in ('.xls', '.xlsx'):
                if not openpyxl:
                    raise RuntimeError('Excel import requires openpyxl on the server. Please install openpyxl.')
                fobj.seek(0)
                wb = openpyxl.load_workbook(fobj, read_only=True, data_only=True)
                ws = wb.active
                rows = list(ws.rows)
                if not rows:
                    return
                headers = [str(c.value).strip() if c.value is not None else '' for c in rows[0]]
                for row in rows[1:]:
                    obj = {}
                    for h, cell in zip(headers, row):
                        obj[h] = cell.value
                    yield obj
            else:
                raise RuntimeError('Unsupported file type. Accepts .csv, .xls, .xlsx')

        result = {'created': 0, 'updated': 0, 'skipped': 0, 'errors': []}

        for i, raw in enumerate(iter_rows_from_upload(data_file, ext), start=1):
            try:
                row = { (k or '').strip().lower(): (v if v is not None else '') for k,v in raw.items() }

                code = (row.get('indicator') or '').strip()
                if not code:
                    result['skipped'] += 1
                    result['errors'].append({'row': i, 'error': 'Missing indicator code'})
                    continue

                try:
                    indicator = Indicator.objects.get(code=code)
                except Indicator.DoesNotExist:
                    result['skipped'] += 1
                    result['errors'].append({'row': i, 'error': f'Unknown indicator code: {code}'})
                    continue

                # year
                year = row.get('year_ec') or row.get('year_gc')
                if not year:
                    result['skipped'] += 1
                    result['errors'].append({'row': i, 'error': 'Missing year_EC/year_GC'})
                    continue

                perf_raw = row.get('performance') or row.get('value') or row.get('amount')
                if perf_raw in (None, ''):
                    result['skipped'] += 1
                    result['errors'].append({'row': i, 'error': 'Missing performance/value'})
                    continue
                try:
                    performance = float(perf_raw)
                except Exception:
                    result['skipped'] += 1
                    result['errors'].append({'row': i, 'error': f'Invalid performance value: {perf_raw}'})
                    continue

                year_ec = row.get('year_ec') or None
                if not year_ec and row.get('year_gc'):
                    try:
                        year_ec = str(int(row.get('year_gc')) - 7)
                    except Exception:
                        year_ec = None

                if year_ec:
                    datapoint, _ = DataPoint.objects.get_or_create(year_EC=str(year_ec))
                else:
                    datapoint, _ = DataPoint.objects.get_or_create(year_EC=str(year))

                # monthly
                if 'month' in row and row.get('month') != '':
                    mraw = str(row.get('month')).strip()
                    month_obj = None
                    try:
                        mnum = int(mraw)
                        month_obj = Month.objects.filter(number=mnum).first()
                    except Exception:
                        month_obj = Month.objects.filter(month_ENG__iexact=mraw).first()
                    if not month_obj:
                        try:
                            if mraw.isdigit():
                                month_obj = Month.objects.create(number=int(mraw), month_ENG=str(mraw), month_AMH=str(mraw))
                            else:
                                raise ValueError('Unknown month')
                        except Exception:
                            result['skipped'] += 1
                            result['errors'].append({'row': i, 'error': f'Invalid month: {mraw}'})
                            continue

                    obj, created = MonthData.objects.update_or_create(
                        indicator=indicator,
                        for_datapoint=datapoint,
                        for_month=month_obj,
                        defaults={'performance': performance, 'is_verified': True}
                    )
                    if created: result['created'] += 1
                    else: result['updated'] += 1
                    continue

                # quarterly
                if 'quarter' in row and row.get('quarter') != '':
                    qraw = row.get('quarter')
                    try:
                        qnum = int(qraw)
                    except Exception:
                        result['skipped'] += 1
                        result['errors'].append({'row': i, 'error': f'Invalid quarter: {qraw}'})
                        continue
                    quarter_obj, _ = Quarter.objects.get_or_create(number=qnum, defaults={'title_ENG': f'Q{qnum}', 'title_AMH': f'Q{qnum}'})
                    obj, created = QuarterData.objects.update_or_create(
                        indicator=indicator,
                        for_datapoint=datapoint,
                        for_quarter=quarter_obj,
                        defaults={'performance': performance, 'is_verified': True}
                    )
                    if created: result['created'] += 1
                    else: result['updated'] += 1
                    continue

                # annual
                obj, created = AnnualData.objects.update_or_create(
                    indicator=indicator,
                    for_datapoint=datapoint,
                    defaults={'performance': performance, 'is_verified': True}
                )
                if created: result['created'] += 1
                else: result['updated'] += 1

            except Exception as e:
                result['skipped'] += 1
                result['errors'].append({'row': i, 'error': str(e)})

        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def decline_submission_api(request):
    """Decline a submission (indicator or data)"""
    submission_type = request.data.get('type')
    submission_id = request.data.get('id')
    
    if submission_type == 'indicator':
        submission = get_object_or_404(IndicatorSubmission, id=submission_id)
    elif submission_type == 'data':
        submission = get_object_or_404(DataSubmission, id=submission_id)
    else:
        return Response({'error': 'Invalid submission type'}, status=status.HTTP_400_BAD_REQUEST)
    
    submission.status = 'declined'
    submission.verified_by = request.user
    submission.verified_at = timezone.now()
    submission.save()
    # If this is an indicator submission, unmark the indicator as verified
    if submission_type == 'indicator' and hasattr(submission, 'indicator') and submission.indicator:
        try:
            ind = submission.indicator
            ind.is_verified = False
            ind.save(update_fields=['is_verified'])
        except Exception:
            pass
    
    if submission_type == 'indicator':
        serializer = IndicatorSubmissionSerializer(submission)
    else:
        serializer = DataSubmissionSerializer(submission)
    
    return Response(serializer.data)


@api_view(['GET'])
def indicators_list_api(request):
    """Get list of indicators for importer to submit data for"""
    indicators = Indicator.objects.all().order_by('title_ENG')
    out = []
    for ind in indicators:
        cats = [c.name_ENG for c in ind.for_category.all()]
        out.append({
            'id': ind.id,
            'title_eng': ind.title_ENG,
            'title_amh': ind.title_AMH,
            'is_verified': getattr(ind, 'is_verified', False),
            'categories': cats,
        })
    return Response(out)


@api_view(['GET'])
def sample_template_api(request):
    """Return a downloadable sample Excel file for annual/quarter/month data submissions.

    The template matches the approval import expectations:
      - annual: columns [year_EC, performance]
      - quarter: columns [year_EC, quarter, performance]
      - monthly: columns [year_EC, month, performance]
    """
    kind = (request.GET.get('type') or request.GET.get('kind') or '').strip().lower()
    multiple = (request.GET.get('multiple') or '').strip().lower() in ('1', 'true', 'yes')
    if kind not in ('annual', 'quarter', 'monthly'):
        return Response({'error': 'Invalid type. Use one of: annual, quarter, monthly'}, status=status.HTTP_400_BAD_REQUEST)

    # Build sample dataset
    if kind == 'annual':
        headers = ('indicator', 'year_EC', 'performance') if multiple else ('year_EC', 'performance')
        rows = [
            (('IND001', '2014', 123.45) if multiple else ('2014', 123.45)),
            (('IND001', '2015', 150.00) if multiple else ('2015', 150.00)),
        ]
        filename = 'sample_annual_data.xlsx'
    elif kind == 'quarter':
        headers = ('indicator', 'year_EC', 'quarter', 'performance') if multiple else ('year_EC', 'quarter', 'performance')
        rows = [
            (('IND001', '2015', 1, 25.5) if multiple else ('2015', 1, 25.5)),
            (('IND001', '2015', 2, 30.0) if multiple else ('2015', 2, 30.0)),
            (('IND001', '2015', 3, 28.2) if multiple else ('2015', 3, 28.2)),
            (('IND001', '2015', 4, 31.7) if multiple else ('2015', 4, 31.7)),
        ]
        filename = 'sample_quarter_data.xlsx'
    else:
        headers = ('indicator', 'year_EC', 'month', 'performance') if multiple else ('year_EC', 'month', 'performance')
        rows = [
            (('IND001', '2016', 1, 10.0) if multiple else ('2016', 1, 10.0)),
            (('IND001', '2016', 2, 11.5) if multiple else ('2016', 2, 11.5)),
            (('IND001', '2016', 3, 12.2) if multiple else ('2016', 3, 12.2)),
        ]
        filename = 'sample_month_data.xlsx'

    dataset = tablib.Dataset(*rows, headers=headers)

    # Prefer xlsx output; fall back to csv if openpyxl not available
    try:
        binary = dataset.export('xlsx')
        resp = HttpResponse(binary, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        resp['Content-Disposition'] = f'attachment; filename="{filename}"'
        return resp
    except Exception:
        csv_data = dataset.export('csv')
        resp = HttpResponse(csv_data, content_type='text/csv; charset=utf-8')
        resp['Content-Disposition'] = f'attachment; filename="{os.path.splitext(filename)[0]}.csv"'
        return resp


@api_view(['POST'])
def submit_indicator_api(request):
    """Submit a new indicator for approval"""
    if not request.user.is_importer:
        return Response({'error': 'Access denied. Only importers can submit indicators.'}, 
                       status=status.HTTP_403_FORBIDDEN)

    title_eng = request.data.get('title_eng')
    title_amh = request.data.get('title_amh')
    code = request.data.get('code')
    description = request.data.get('description')
    measurement_units = request.data.get('measurement_units')
    frequency = request.data.get('frequency')
    source = request.data.get('source')
    methodology = request.data.get('methodology')
    # Accept either a list or comma-separated string
    category_ids = request.data.get('category_ids') or request.data.get('category_id')

    if not title_eng or not category_ids:
        return Response({'error': 'Title (English) and category are required.'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    # Normalize category_ids to a list of ints
    if isinstance(category_ids, str):
        # try as comma separated ids
        category_ids = [c.strip() for c in category_ids.split(',') if c.strip().isdigit()]
    if isinstance(category_ids, list):
        try:
            category_ids = [int(c) for c in category_ids]
        except ValueError:
            return Response({'error': 'Invalid category ids.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # validate categories
        categories = list(Category.objects.filter(id__in=category_ids))
        if len(categories) != len(category_ids):
            return Response({'error': 'One or more categories are invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        # create indicator without assigning m2m directly
        indicator = Indicator.objects.create(
            title_ENG=title_eng,
            title_AMH=title_amh,
            code=code or '',
            description=description,
            measurement_units=measurement_units,
            frequency=frequency,
            source=source,
            methodology=methodology,
        )
        # assign categories (many-to-many)
        indicator.for_category.set(category_ids)

        # Create submission record
        IndicatorSubmission.objects.create(
            indicator=indicator,
            submitted_by=request.user,
            status='pending'
        )

        return Response({'message': 'Indicator submitted successfully', 'indicator_id': indicator.id}, 
                       status=status.HTTP_201_CREATED)
    except Category.DoesNotExist:
        return Response({'error': 'Invalid category'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def submit_data_api(request):
    """Submit data for an existing indicator"""
    if not request.user.is_importer:
        return Response({'error': 'Access denied. Only importers can submit data.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    indicator_id = request.data.get('indicator_id')
    data_file = request.FILES.get('data_file')
    notes = request.data.get('notes', '')
    
    if not indicator_id:
        return Response({'error': 'Indicator ID is required.'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        indicator = Indicator.objects.get(id=indicator_id)
        # Validate uploaded file format (read only header / first row) to avoid expensive loops
        if data_file:
            filename = (getattr(data_file, 'name', '') or '').lower()
            _, ext = os.path.splitext(filename)
            ext = ext.lower()

            # Helper to check required columns
            def _check_columns(cols):
                cols_l = [c.strip().lower() for c in cols if c is not None]
                has_year = any(x in cols_l for x in ('year_ec', 'year_gc'))
                has_perf = any(x in cols_l for x in ('performance', 'value', 'amount'))
                return has_year and has_perf

            if ext == '.csv':
                try:
                    # read a small chunk and extract first non-empty line as header
                    data_file.seek(0)
                    sample = data_file.read(8192)
                    # ensure we have text
                    if isinstance(sample, bytes):
                        sample_text = sample.decode('utf-8', errors='replace')
                    else:
                        sample_text = str(sample)
                    first_line = None
                    for ln in sample_text.splitlines():
                        if ln.strip():
                            first_line = ln
                            break
                    if not first_line:
                        return Response({'error': 'CSV file appears empty or malformed (no header found).'}, status=status.HTTP_400_BAD_REQUEST)
                    # detect delimiter simply
                    delimiter = ',' if first_line.count(',') >= first_line.count(';') else ';'
                    import csv as _csv
                    header = next(_csv.reader([first_line], delimiter=delimiter))
                    if not _check_columns(header):
                        return Response({'error': 'CSV missing required columns. Required: year_EC/year_GC and performance/value/amount (case-insensitive).'}, status=status.HTTP_400_BAD_REQUEST)
                finally:
                    try:
                        data_file.seek(0)
                    except Exception:
                        pass
            elif ext in ('.xls', '.xlsx'):
                if not openpyxl:
                    return Response({'error': 'Excel import requires openpyxl on the server. Please install openpyxl.'}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    data_file.seek(0)
                    wb = openpyxl.load_workbook(data_file, read_only=True, data_only=True)
                    ws = wb.active
                    # read header row only
                    header_row = next(ws.iter_rows(min_row=1, max_row=1, values_only=True), None)
                    if not header_row:
                        return Response({'error': 'Excel file appears empty or malformed (no header found).'}, status=status.HTTP_400_BAD_REQUEST)
                    cols = [ (str(c).strip() if c is not None else '') for c in header_row ]
                    if not _check_columns(cols):
                        return Response({'error': 'Excel missing required columns. Required: year_EC/year_GC and performance/value/amount (case-insensitive).'}, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    return Response({'error': 'Failed to inspect Excel file header: ' + str(e)}, status=status.HTTP_400_BAD_REQUEST)
                finally:
                    try:
                        data_file.seek(0)
                    except Exception:
                        pass
            else:
                return Response({'error': 'Unsupported file type. Accepts .csv, .xls, .xlsx only.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create submission record (file passed validations)
        submission = DataSubmission.objects.create(
            indicator=indicator,
            submitted_by=request.user,
            data_file=data_file,
            notes=notes,
            status='pending'
        )

        return Response({'message': 'Data submitted successfully', 'submission_id': submission.id}, status=status.HTTP_201_CREATED)
    except Indicator.DoesNotExist:
        return Response({'error': 'Invalid indicator'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def preview_existing_submission_api(request, submission_id: int):
    """
    Return a lightweight preview of an uploaded DataSubmission file.
    """
    try:
        submission = DataSubmission.objects.get(pk=submission_id)
    except DataSubmission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)

    ffield = submission.data_file
    if not ffield:
        return Response({'error': 'No data file attached to submission'}, status=status.HTTP_400_BAD_REQUEST)

    filename = (getattr(ffield, 'name', '') or '').lower()
    if filename.endswith('.csv'):
        rows = _preview_csv_file(ffield)
    elif filename.endswith(('.xls', '.xlsx')):
        if not openpyxl:
            return Response({'error': 'Excel preview requires openpyxl on the server.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        rows = _preview_excel_file(ffield)
    else:
        return Response({'error': 'Unsupported file type for preview. Accepts .csv, .xls, .xlsx only.'},
                        status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'id': submission.id,
        'name': getattr(ffield, 'name', ''),
        'size': getattr(ffield, 'size', 0),
        'rows': rows,
    }, status=status.HTTP_200_OK)


def _preview_csv_file(file_field, max_rows: int = 20):
    file_field.open('rb')
    wrapper = TextIOWrapper(file_field, encoding='utf-8', errors='replace')
    reader = csv.DictReader(wrapper)
    out = []
    for i, row in enumerate(reader):
        if i >= max_rows:
            break
        out.append({str(k): ('' if v is None else str(v)) for k, v in row.items()})
    file_field.close()
    return out


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def preview_data_submission_api(request):
    fobj = request.FILES.get('data_file')
    if not fobj:
        return Response({'error': 'data_file is required for preview.'},
                        status=status.HTTP_400_BAD_REQUEST)

    filename = (getattr(fobj, 'name', '') or '').lower()
    try:
        if filename.endswith('.csv'):
            rows_dict = _preview_csv_file(fobj, max_rows=50)
        elif filename.endswith(('.xls', '.xlsx')):
            if not openpyxl:
                return Response(
                    {'error': 'Excel preview requires openpyxl on the server.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            rows_dict = _preview_excel_file(fobj, max_rows=50)
        else:
            return Response(
                {'error': 'Unsupported file type. Accepts .csv, .xls, .xlsx only.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response({'error': f'Failed to parse file for preview: {e}'},
                        status=status.HTTP_400_BAD_REQUEST)

    if not rows_dict:
        preview = {'headers': [], 'rows': []}
        row_count = 0
    else:
        headers = list(rows_dict[0].keys())
        rows_matrix = []
        for row in rows_dict:
            rows_matrix.append([row.get(h, '') for h in headers])
        preview = {'headers': headers, 'rows': rows_matrix}
        row_count = len(rows_dict)

    payload = {
        'row_count': row_count,
        'preview': preview,
        'parse_errors': [],
        'invalid_rows': [],
        'warnings': [],
        'totals': {
            'new': row_count,
            'update': 0,
            'skip': 0,
        },
        'indicators_found': [],
        'row_statuses': [],
    }

    return Response(payload, status=status.HTTP_200_OK)


def _preview_excel_file(file_field, max_rows: int = 20):
    file_field.open('rb')
    wb = openpyxl.load_workbook(file_field, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.rows)
    if not rows:
        return []

    headers = [str(c.value).strip() if c.value is not None else '' for c in rows[0]]
    out = []
    for row in rows[1:max_rows + 1]:
        obj = {}
        for h, cell in zip(headers, row):
            obj[h] = '' if cell.value is None else str(cell.value)
        out.append(obj)
    file_field.close()
    return out


class AnnualSidebarList(APIView):
    PAGE_SIZE = 10

    def get(self, request):
        # Accept 1-based page from frontend; convert to 0-based slice index
        page = max(int(request.GET.get("page", 1)), 1)
        datapoints = DataPoint.objects.order_by('-year_EC')
        total = datapoints.count()
        start = (page - 1) * self.PAGE_SIZE
        slice_items = list(datapoints[start:start + self.PAGE_SIZE])

        payload = [
            {"id": dp.id, "year_ec": dp.year_EC, "year_gc": dp.year_GC}
            for dp in slice_items
        ]

        total_pages = (total + self.PAGE_SIZE - 1) // self.PAGE_SIZE if self.PAGE_SIZE else 1
        next_url = None
        prev_url = None
        base = request.build_absolute_uri(request.path)
        if (start + self.PAGE_SIZE) < total:
            next_url = f"{base}?page={page+1}"
        if page > 1 and total > 0:
            prev_url = f"{base}?page={page-1}"

        return Response({
            "results": payload,
            "has_next": (start + self.PAGE_SIZE) < total,
            "has_prev": page > 1 and total > 0,
            "page": page,
            "total": total,
            "total_pages": total_pages,
            "next": next_url,
            "previous": prev_url,
        }, status=status.HTTP_200_OK)


class QuarterlySidebarList(APIView):
    PAGE_SIZE = 1  # one year per page

    def get(self, request):
        # Accept 1-based page parameter from frontend
        page = max(int(request.GET.get("page", 1)), 1)

        datapoints = DataPoint.objects.order_by('-year_EC')
        total_years = datapoints.count()

        # select datapoint by 1-based page index
        idx = page - 1
        try:
            datapoint = datapoints[idx]
        except IndexError:
            datapoint = None

        payload = []
        if datapoint:
            for quarter in self._get_quarters():
                payload.append({
                    "id": f"{datapoint.year_EC}-Q{quarter['number']}",
                    "title_ENG": quarter['title_ENG'],
                    "title_AMH": quarter['title_AMH'],
                    "year_ec": datapoint.year_EC,
                    "year_gc": datapoint.year_GC,
                    "quarter_number": quarter['number'],
                })

        return Response({
            "results": payload,
            "has_next": page < total_years,
            "has_prev": page > 1,
            "page": page,
            "total": total_years,
            "total_pages": total_years,
            "next": (request.build_absolute_uri(request.path) + f"?page={page+1}") if page < total_years else None,
            "previous": (request.build_absolute_uri(request.path) + f"?page={page-1}") if page > 1 else None,
        })

    def _get_quarters(self):
        qs = Quarter.objects.order_by('number')
        if qs.exists():
            return [
                {"number": q.number,
                 "title_ENG": q.title_ENG,
                 "title_AMH": q.title_AMH} for q in qs
            ]
        return [{"number": i, "title_ENG": f"Q{i}", "title_AMH": f"Q{i}"} for i in range(1, 4)]


class MonthlySidebarList(APIView):
    PAGE_SIZE = 1  # one year per page

    def get(self, request):
        # Accept 1-based page parameter from frontend
        page = max(int(request.GET.get("page", 1)), 1)

        datapoints = DataPoint.objects.order_by('-year_EC')
        total_years = datapoints.count()

        idx = page - 1
        try:
            datapoint = datapoints[idx]
        except IndexError:
            datapoint = None

        payload = []
        if datapoint:
            for month in self._get_months():
                payload.append({
                    "id": f"{datapoint.year_EC}-M{month['number']}",
                    "month_ENG": month['month_ENG'],
                    "month_AMH": month['month_AMH'],
                    "year_ec": datapoint.year_EC,
                    "year_gc": datapoint.year_GC,
                    "month_number": month['number'],
                })

        return Response({
            "results": payload,
            "has_next": page < total_years,
            "has_prev": page > 1,
            "page": page,
            "total": total_years,
            "total_pages": total_years,
            "next": (request.build_absolute_uri(request.path) + f"?page={page+1}") if page < total_years else None,
            "previous": (request.build_absolute_uri(request.path) + f"?page={page-1}") if page > 1 else None,
        })

    def _get_months(self):
        qs = Month.objects.order_by('number')
        if qs.exists():
            return [{
                "number": m.number,
                "month_ENG": m.month_ENG,
                "month_AMH": m.month_AMH,
            } for m in qs]

        # fallback
        return [{"number": i, "month_ENG": f"Month {i}", "month_AMH": f"Month {i}"} for i in range(1, 13)]


class WeeklySidebarList(APIView):
    PAGE_SIZE = 5  # show 5 weeks per page

    def get(self, request):
        page = max(int(request.GET.get("page", 1)), 1)

        unique_dates = KPIRecord.objects.filter(record_type='weekly')\
            .order_by('date').values_list('date', flat=True).distinct()

        seen_weeks = set()
        unique_week_items = []

        # Helper to calculate week grouping key
        def get_ethio_week_key(greg_date):
            gregorian_date = EthDate(greg_date.day, greg_date.month, greg_date.year)
            eth_date = to_ethiopian(gregorian_date)
            week = ((eth_date.day - 1) // 7) + 1
            week = min(week, 5)
            return (eth_date.year, eth_date.month, week)

        for d in unique_dates:
            key = get_ethio_week_key(d)
            if key not in seen_weeks:
                seen_weeks.add(key)
                unique_week_items.append({
                    'date': d,
                    'year_ec': key[0],
                    'month_ec': key[1],
                    'week_ec': key[2]
                })

        total = len(unique_week_items)
        start = (page - 1) * self.PAGE_SIZE
        page_items = unique_week_items[start:start + self.PAGE_SIZE]

        # Format for payload
        payload = []
        for item in page_items:
            rec = KPIRecord.objects.filter(record_type='weekly', date=item['date']).first()
            if not rec:
                continue

            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            # item['date'] is a date object
            month_gc_idx = item['date'].month - 1
            month_name = month_names[month_gc_idx]
            
            # Format: "Week X (Month) - Year" (Using GC Year to match Month Name)
            label = f"Week {item['week_ec']} ({month_name}) - {item['date'].year}"

            payload.append({
                "id": rec.id,
                "date": item['date'].isoformat(),
                "ethio_date": rec.ethio_date, # Should match our calc
                "week": item['week_ec'],
                "month_number": item['month_ec'],
                "month_name": month_name,
                "label": label,
                "year_ec": item['year_ec'],
                "year_gc": f"{item['date'].year}",
            })

        return Response({
            "results": payload,
            "has_next": (start + self.PAGE_SIZE) < total,
            "has_prev": page > 1,
            "page": page,
            "total": total,
            "total_pages": (total + self.PAGE_SIZE - 1) // self.PAGE_SIZE,
        })


class DailySidebarList(APIView):
    PAGE_SIZE = 10  # show 10 days per page

    def get(self, request):
        page = max(int(request.GET.get("page", 1)), 1)

        # Get all daily KPI records ordered by date (most recent first)
        qs = KPIRecord.objects.filter(record_type='daily').order_by('-date')
        unique_dates = list(qs.order_by('-date').values_list('date', flat=True).distinct())
        total = len(unique_dates)

        start = (page - 1) * self.PAGE_SIZE
        page_dates = unique_dates[start:start + self.PAGE_SIZE]
        slice_items = []
        for d in page_dates:
            rec = qs.filter(date=d).first()
            if rec:
                slice_items.append(rec)

        # Format each daily record for sidebar
        payload = []
        for r in slice_items:
            # Format Gregorian date
            greg_date_str = r.date.strftime("%b %d, %Y")  # e.g., "Dec 04, 2024"
            
            # Ethiopian date is already formatted in the model property
            ethio_date_str = r.ethio_date if r.ethio_date else ""
            
            payload.append({
                "id": r.id,
                "date": r.date.isoformat(),
                "greg_date_formatted": greg_date_str,
                "ethio_date": ethio_date_str,
                "label": f"{greg_date_str} ({ethio_date_str})",
                "performance": float(r.performance) if r.performance else None,
                "target": float(r.target) if r.target else None,
            })

        return Response({
            "results": payload,
            "has_next": (start + self.PAGE_SIZE) < total,
            "has_prev": page > 1,
            "page": page,
            "total": total,
            "total_pages": (total + self.PAGE_SIZE - 1) // self.PAGE_SIZE,
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_category_assignment_api(request):
    manager_id = request.data.get('manager_id')
    category_id = request.data.get('category_id')

    if not manager_id:
        return Response({'error': 'Manager ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not category_id:
        return Response({'error': 'Category ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        manager_id = int(manager_id)
        category_id = int(category_id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid manager or category ID.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate manager exists and is a category manager
    try:
        manager = CustomUser.objects.get(id=manager_id)
        if not manager.is_category_manager:
            return Response({'error': 'Selected user is not a category manager.'}, status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Manager not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Validate category exists
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Check if manager is already assigned to a category
    if CategoryAssignment.objects.filter(manager_id=manager_id).exists():
        return Response({'error': 'This manager is already assigned to a category.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if category is already assigned
    if CategoryAssignment.objects.filter(category_id=category_id).exists():
        return Response({'error': 'This category is already assigned to a manager.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        assignment = CategoryAssignment.objects.create(manager_id=manager_id, category_id=category_id)
    except Exception as e:
        return Response({'error': f'Failed to create assignment: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Return full data needed for JS - use manager_details and category_details format
    data = {
        'id': assignment.id,
        'manager_details': {
            'id': assignment.manager.id,
            'full_name': assignment.manager.get_full_name() or assignment.manager.username,
            'email': assignment.manager.email,
            'is_active': assignment.manager.is_active,
            'last_login': assignment.manager.last_login.isoformat() if assignment.manager.last_login else None,
        },
        'category_details': {
            'id': assignment.category.id,
            'name_eng': assignment.category.name_ENG,
            'indicator_count': assignment.category.indicators.count(),
            'subcategory_count': assignment.category.subcategories.count() if hasattr(assignment.category, 'subcategories') else 0,
            'topic_title': assignment.category.topic.title_ENG if assignment.category.topic else '',
        },
    }
    return Response(data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_category_assignment_api(request, pk):
    try:
        assignment = CategoryAssignment.objects.get(pk=pk)
    except CategoryAssignment.DoesNotExist:
        return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)

    manager_id = request.data.get('manager_id')
    
    if not manager_id:
        return Response({'error': 'Manager ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        manager_id = int(manager_id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid manager ID.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate manager exists and is a category manager
    try:
        manager = CustomUser.objects.get(id=manager_id)
        if not manager.is_category_manager:
            return Response({'error': 'Selected user is not a category manager.'}, status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Manager not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Check if manager is already assigned to another category
    if CategoryAssignment.objects.filter(manager_id=manager_id).exclude(pk=pk).exists():
        return Response({'error': 'This manager is already assigned to another category.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        assignment.manager_id = manager_id
        assignment.save()
    except Exception as e:
        return Response({'error': f'Failed to update assignment: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Return data in format expected by JavaScript frontend
    data = {
        'id': assignment.id,
        'manager_details': {
            'id': assignment.manager.id,
            'full_name': assignment.manager.get_full_name() or assignment.manager.username,
            'email': assignment.manager.email,
            'is_active': assignment.manager.is_active,
            'last_login': assignment.manager.last_login.isoformat() if assignment.manager.last_login else None,
        },
        'category_details': {
            'id': assignment.category.id,
            'name_eng': assignment.category.name_ENG,
            'indicator_count': assignment.category.indicators.count(),
            'subcategory_count': assignment.category.subcategories.count() if hasattr(assignment.category, 'subcategories') else 0,
            'topic_title': assignment.category.topic.title_ENG if assignment.category.topic else '',
        },
    }
    return Response(data, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_category_assignment_api(request, pk):
    try:
        assignment = CategoryAssignment.objects.get(pk=pk)
        category = assignment.category
        assignment.delete()

        data = {
            'success': True,
            'message': 'Assignment deleted successfully',
            'category': {
                'id': category.id,
                'name_ENG': category.name_ENG,
                'indicator_count': category.indicators.count()
            }
        }
        return Response(data, status=status.HTTP_200_OK)
    except CategoryAssignment.DoesNotExist:
        return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Failed to delete assignment: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def review_pending_data(request):
    """
    Fetch all unverified data points from AnnualData, QuarterData, MonthData, and KPIRecord.
    """
    if not (request.user.is_category_manager or request.user.is_superuser):
        return Response({'error': 'Unauthorized'}, status=403)

    results = []

    # 1. Annual Data
    annuals = AnnualData.objects.filter(is_verified=False).select_related('indicator', 'for_datapoint')
    for a in annuals:
        results.append({
            'id': a.id,
            'type': 'annual',
            'indicator_title': a.indicator.title_ENG if a.indicator else 'Unknown',
            'period_display': f"{a.for_datapoint.year_EC} EC" if a.for_datapoint else "Unknown Year",
            'value': a.performance
        })

    # 2. Quarterly Data
    quarters = QuarterData.objects.filter(is_verified=False).select_related('indicator', 'for_quarter', 'for_datapoint')
    for q in quarters:
        q_title = q.for_quarter.title_ENG if q.for_quarter else f"Q{q.for_quarter_number or '?'}"
        year = q.for_datapoint.year_EC if q.for_datapoint else "?"
        results.append({
            'id': q.id,
            'type': 'quarterly',
            'indicator_title': q.indicator.title_ENG if q.indicator else 'Unknown',
            'period_display': f"{year} EC - {q_title}",
            'value': q.performance
        })

    # 3. Monthly Data
    months = MonthData.objects.filter(is_verified=False).select_related('indicator', 'for_month', 'for_datapoint')
    for m in months:
        m_name = m.for_month.month_ENG if m.for_month else "?"
        year = m.for_datapoint.year_EC if m.for_datapoint else "?"
        results.append({
            'id': m.id,
            'type': 'monthly',
            'indicator_title': m.indicator.title_ENG if m.indicator else 'Unknown',
            'period_display': f"{year} EC - {m_name}",
            'value': m.performance
        })

    # 4. KPI Records (Weekly/Daily)
    kpis = KPIRecord.objects.filter(is_verified=False).select_related('indicator')
    for k in kpis:
        p_disp = str(k.date)
        if k.record_type == 'weekly':
            p_disp = f"Weekly: {k.date}"
        elif k.record_type == 'daily':
            p_disp = f"Daily: {k.date}"
        
        results.append({
            'id': k.id,
            'type': k.record_type, 
            'indicator_title': k.indicator.title_ENG if k.indicator else 'Unknown',
            'period_display': p_disp,
            'value': k.performance
        })

    return Response({'results': results})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_pending_data(request):
    if not (request.user.is_category_manager or request.user.is_superuser):
        return Response({'error': 'Unauthorized'}, status=403)
    
    try:
        data_type = request.data.get('type')
        data_id = request.data.get('id')
        
        if not data_type or not data_id:
            return Response({'error': 'Missing type or id'}, status=400)
        
        obj = None
        if data_type == 'annual':
            obj = AnnualData.objects.get(id=data_id)
        elif data_type == 'quarterly':
            obj = QuarterData.objects.get(id=data_id)
        elif data_type == 'monthly':
            obj = MonthData.objects.get(id=data_id)
        elif data_type == 'weekly' or data_type == 'daily':
            obj = KPIRecord.objects.get(id=data_id)
        else:
            return Response({'error': 'Invalid type'}, status=400)
        
        obj.is_verified = True
        obj.save()
        return Response({'status': 'approved'})

    except (AnnualData.DoesNotExist, QuarterData.DoesNotExist, MonthData.DoesNotExist, KPIRecord.DoesNotExist):
        return Response({'error': 'Data record not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)