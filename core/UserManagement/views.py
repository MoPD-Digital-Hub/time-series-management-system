from django.shortcuts import render
from .forms import Login_Form
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect
from django.contrib import messages 
from .models import CustomUser
from django.shortcuts import render , HttpResponse
from .models import *
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.core.paginator import Paginator  
from .models import CustomUser, CategoryAssignment
from Base.models import Category, Indicator, Topic
from Base.models import Category, Indicator, Topic
from django.db.models import Q
from django.contrib.auth.decorators import login_required, user_passes_test
from django.conf import settings
from django.shortcuts import get_object_or_404

def admin_required(user):
    return user.is_superuser


@login_required
def user_management_dashboard(request):
    return render(request, 'usermanagement/dashboard.html')

@login_required
def users_list(request):
    search_query = request.GET.get('search', '')
    role_filter = request.GET.get('role', '')
    page_number = int(request.GET.get('page', 1))
    users_qs = CustomUser.objects.select_related('manager').prefetch_related('managed_categories__category').all().order_by('email')

    if request.user.is_authenticated and request.user.is_category_manager and not request.user.is_staff:
        users_qs = CustomUser.objects.filter(Q(is_importer=True, manager=request.user) | Q(id=request.user.id)).order_by('email')

    if search_query:
        users_qs = users_qs.filter(
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query) |
            Q(username__icontains=search_query)
        )

    if role_filter:
        if role_filter == 'category_manager':
            users_qs = users_qs.filter(is_category_manager=True)
        elif role_filter == 'importer':
            users_qs = users_qs.filter(is_importer=True)
        elif role_filter == 'admin':
            users_qs = users_qs.filter(is_staff=True)

    paginator = Paginator(users_qs, 20)
    users_page = paginator.get_page(page_number)

    manager_categories = []
    if request.user.is_authenticated and request.user.is_category_manager:
        manager_categories = [assign.category for assign in CategoryAssignment.objects.filter(manager=request.user).select_related('category')]

    return render(request, 'usermanagement/users_list.html', {
        'users_page': users_page,
        'search_query': search_query,
        'role_filter': role_filter,
        'manager_categories': manager_categories,
    })


@login_required
def submissions_list(request):
    # Allow only managers
    if not getattr(request.user, 'is_category_manager', False):
        messages.error(request, 'Access denied. Only managers can access this page.')
        return render(request, 'usermanagement/access_denied.html')

    submission_type = request.GET.get('type', 'indicator')

    if submission_type == 'indicator':
        template = 'usermanagement/indicator_submissions.html'
    else:
        template = 'usermanagement/data_submissions.html'

    return render(request, template, {'submission_type': submission_type})


@login_required
@user_passes_test(admin_required, login_url='/user-management/login/')
def category_assignments(request):
    page_number = request.GET.get('page', 1)
    assignments = CategoryAssignment.objects.select_related('manager', 'category', 'category__topic').order_by('category__name_ENG')
    paginator = Paginator(assignments, 20)
    assignments_page = paginator.get_page(page_number)
    category_managers_count = CustomUser.objects.filter(is_category_manager=True, managed_categories__isnull=False).count()
    assigned_categories_count = CategoryAssignment.objects.count()
    unassigned_categories = Category.objects.filter(manager__isnull=True)
    # Get only category managers who don't have an assignment yet (one-to-one relationship)
    managers = CustomUser.objects.filter(is_category_manager=True, managed_categories__isnull=True).order_by('first_name', 'last_name')

    return render(request, 'usermanagement/category_assignments.html', {
        'assignments_page': assignments_page,
        'category_managers_count': category_managers_count,
        'assigned_categories_count': assigned_categories_count,
        'unassigned_categories': unassigned_categories,
        'managers': managers,
    })


def login_view(request):
    next_url = request.GET.get('next', request.POST.get('next', ''))
    if request.method == 'POST':
        username = request.POST.get('username') or request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            if next_url:
                return redirect(next_url)
            return redirect('user_management_dashboard')
        else:
            messages.error(request, 'Invalid username or password')

    return render(request, 'usermanagement/common/login.html', {'next': next_url})


def logout_view(request):
    """Log out and redirect to login page."""
    auth_logout(request)
    return redirect('user_management_login')

@login_required
def importer_dashboard(request):
    if not request.user.is_importer:
        messages.error(request, 'Access denied. Only data importers can access this page.')
        return render(request, 'usermanagement/access_denied.html')
    
    return render(request, 'usermanagement/importer_dashboard.html')



@login_required
def data_submission_preview(request, submission_id):
    """
    Render a simple HTML preview of a DataSubmission file in its own page.
    """
    from .models import DataSubmission  # local import to avoid circulars
    from .api.api_views import _preview_csv_file, _preview_excel_file

    submission = get_object_or_404(DataSubmission, pk=submission_id)
    ffield = submission.data_file
    rows = []
    headers = []

    if ffield:
        filename = (getattr(ffield, 'name', '') or '').lower()
        try:
            if filename.endswith('.csv'):
                rows_dict = _preview_csv_file(ffield, max_rows=200)
            elif filename.endswith(('.xls', '.xlsx')):
                if settings.DEBUG is False and 'openpyxl' not in globals():
                    rows_dict = []
                else:
                    rows_dict = _preview_excel_file(ffield, max_rows=200)
            else:
                rows_dict = []

            if rows_dict:
                headers = list(rows_dict[0].keys())
                rows = [[row.get(h, '') for h in headers] for row in rows_dict]
        except Exception:
            rows = []
            headers = []

    context = {
        'submission': submission,
        'headers': headers,
        'rows': rows,
    }
    return render(request, 'usermanagement/data_submission_preview.html', context)


@login_required
def add_indicator(request):
    if not request.user.is_importer:
        messages.error(request, 'Access denied. Only data importers can submit indicators.')
        return render(request, 'usermanagement/dashboard.html')

    categories = Category.objects.all().order_by('name_ENG')
    frequency_choices = Indicator.FREQUENCY_CHOICES

    # Determine the importer's assigned category via their category manager
    assigned_category = None
    manager = getattr(request.user, 'manager', None)
    if manager is not None:
        assignment = CategoryAssignment.objects.select_related('category').filter(manager=manager).first()
        if assignment is not None:
            assigned_category = assignment.category

    return render(
        request,
        'usermanagement/add_indicator.html',
        {
            'categories': categories,
            'frequency_choices': frequency_choices,
            'assigned_category': assigned_category,
        }
    )


@login_required
def data_table_explorer(request):
    topics = Topic.objects.prefetch_related('categories__indicators').all()
    context = {
        'topics': topics,
    }
    return render(request, 'usermanagement/data_table_explorer.html', context)


@login_required
def review_table_data(request):
    if not (request.user.is_category_manager or request.user.is_superuser):
         return render(request, 'usermanagement/access_denied.html') 
    return render(request, 'usermanagement/review_table_data.html')