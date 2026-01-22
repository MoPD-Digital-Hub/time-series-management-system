from django.shortcuts import render
from .forms import Login_Form, DocumentForm
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
from Base.models import Category, Indicator, Topic, Document
from django.db.models import Q
from django.contrib.auth.decorators import login_required, user_passes_test
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models import Count

# Create your views here.


# def logout_view(request):
#     logout(request)
#     return redirect('login')

# def login_view(request):
#     if request.method == 'POST':
#         form = Login_Form(request.POST)
#         if form.is_valid():
#             email = form.cleaned_data['email']
#             password = form.cleaned_data['password']
#             user = authenticate(request,email=email,password=password)

#             if user is not None and user.is_superuser:
#                 login(request, user)
#                 return redirect('index')
#             elif user is not None and user.is_staff:
#                 login(request, user)
#                 return redirect('index')
#             else:
#                 messages.error(request, 'Invalid Password or Email')
#             form = Login_Form()
#     else:
#         form = Login_Form()
#     return render(request, 'auth/login.html', {'form': form})


# @login_required
# def reset_password(request):
#     try: 
#         notification_candidate = CustomUser.objects.get(user=request.user)
#     except:
#         notification_candidate = None
#     context = {
#         'notification_candidate' : notification_candidate,
#     }
#     return render(request, 'auth/reset-password.html', context)

# @login_required
# def user_change_password(request):
#     return render(request, 'auth/user/dashboard-change-password.html')
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
    if request.user.is_authenticated:
        if request.user.is_staff:
            # Admins can see all categories
            from Base.models import Category
            manager_categories = Category.objects.all().order_by('name_ENG')
        elif request.user.is_category_manager:
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
    if not (request.user.is_category_manager or request.user.is_superuser):
        messages.error(request, 'Access denied. Only managers can access this page.')
        return render(request, 'usermanagement/access_denied.html')

    submission_type = request.GET.get('type', 'indicator')
    status_filter = request.GET.get('status', '')
    page_number = int(request.GET.get('page', 1))

    if submission_type == 'indicator':
        submissions_qs = IndicatorSubmission.objects.select_related(
            'indicator', 'submitted_by', 'verified_by'
        ).order_by('-submitted_at')
        template = 'usermanagement/indicator_submissions.html'
    else:
        submissions_qs = DataSubmission.objects.select_related(
            'indicator', 'submitted_by', 'verified_by'
        ).order_by('-submitted_at')
        template = 'usermanagement/data_submissions.html'

    # Filter by manager assignment if not superuser/staff
    if not (request.user.is_staff or request.user.is_superuser):
        managed_importers = CustomUser.objects.filter(manager=request.user)
        assigned_categories = CategoryAssignment.objects.filter(manager=request.user).values_list('category_id', flat=True)
        submissions_qs = submissions_qs.filter(
            Q(submitted_by__in=managed_importers) |
            Q(indicator__for_category__in=assigned_categories)
        ).distinct()

    if status_filter:
        submissions_qs = submissions_qs.filter(status=status_filter)

    # Calculate pending count for tabs
    if submission_type == 'indicator':
        pending_qs = IndicatorSubmission.objects.filter(status='pending')
    else:
        pending_qs = DataSubmission.objects.filter(status='pending')
    
    if not (request.user.is_staff or request.user.is_superuser):
        managed_importers = CustomUser.objects.filter(manager=request.user)
        assigned_categories = CategoryAssignment.objects.filter(manager=request.user).values_list('category_id', flat=True)
        pending_qs = pending_qs.filter(
            Q(submitted_by__in=managed_importers) |
            Q(indicator__for_category__in=assigned_categories)
        ).distinct()
    
    pending_count = pending_qs.count()

    paginator = Paginator(submissions_qs, 20)
    submissions_page = paginator.get_page(page_number)

    return render(request, template, {
        'submission_type': submission_type,
        'submissions_page': submissions_page,
        'status_filter': status_filter,
        'pending_count': pending_count
    })


@login_required
@user_passes_test(admin_required, login_url='/user-management/login/')
def category_assignments(request):
    page_number = request.GET.get('page', 1)
    assignments = CategoryAssignment.objects.select_related('manager', 'category', 'category__topic').filter(category__topic__is_initiative=False).order_by('category__name_ENG')
    paginator = Paginator(assignments, 20)
    assignments_page = paginator.get_page(page_number)
    category_managers_count = CustomUser.objects.filter(is_category_manager=True, managed_categories__isnull=False).distinct().count()
    assigned_categories_count = CategoryAssignment.objects.values('category').distinct().count()
    unassigned_categories = Category.objects.annotate(num_assignments=Count('category_managers')).filter(num_assignments=0, topic__is_initiative=False).select_related('topic').prefetch_related('indicators')
    # Get all category managers
    managers = CustomUser.objects.filter(is_category_manager=True).order_by('first_name', 'last_name')
    from Base.models import Topic
    topics = Topic.objects.filter(is_initiative=False)

    return render(request, 'usermanagement/category_assignments.html', {
        'assignments_page': assignments_page,
        'category_managers_count': category_managers_count,
        'assigned_categories_count': assigned_categories_count,
        'unassigned_categories': unassigned_categories,
        'managers': managers,
        'topics': topics,
    })


def login_view(request):
    next_url = request.GET.get('next', request.POST.get('next', ''))
    if request.method == 'POST':
        username = request.POST.get('username') or request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            if user.climate_user:
                return redirect('climate_dashboard')
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
        return render(request, 'usermanagement/climate_access_denied.html')
    
    # Get categories managed by the importer's manager
    assigned_categories = []
    manager = getattr(request.user, 'manager', None)
    if manager:
        assigned_categories = [a.category for a in CategoryAssignment.objects.select_related('category').filter(manager=manager)]
    
    return render(request, 'usermanagement/importer_dashboard.html', {
        'assigned_categories': assigned_categories
    })



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

    # Determine the importer's assigned categories via their category manager
    assigned_categories = []
    manager = getattr(request.user, 'manager', None)
    if manager is not None:
        assigned_categories = [a.category for a in CategoryAssignment.objects.select_related('category').filter(manager=manager)]

    return render(request,'usermanagement/add_indicator.html',
        {
            'categories': categories,
            'frequency_choices': frequency_choices,
            'assigned_categories': assigned_categories,
        }
    )


@login_required
def data_table_explorer(request):
    user = request.user
    if user.is_superuser:
        categories = Category.objects.prefetch_related('indicators').all().order_by('name_ENG')
    else:
        # Determine the manager to check assignments for
        target_manager = user if user.is_category_manager else getattr(user, 'manager', None)
        
        if target_manager:
            category_ids = CategoryAssignment.objects.filter(manager=target_manager).values_list('category_id', flat=True)
            categories = Category.objects.filter(id__in=category_ids).prefetch_related('indicators').order_by('name_ENG')
        else:
            categories = Category.objects.none()

    context = {
        'categories': categories,
    }
    return render(request, 'usermanagement/data_table_explorer.html', context)



@login_required
def review_table_data(request):
    if not (request.user.is_category_manager or request.user.is_superuser):
         return render(request, 'usermanagement/access_denied.html') 
    return render(request, 'usermanagement/review_table_data.html')


@login_required
def documents_list(request):
    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Document uploaded successfully.')
            return redirect('documents_list')
    else:
        form = DocumentForm()
    
    topic_id = request.GET.get('topic')
    category_id = request.GET.get('category')
    
    documents = Document.objects.all().order_by('-id')
    if topic_id:
        documents = documents.filter(topic_id=topic_id)
    if category_id:
        documents = documents.filter(category_id=category_id)
        
    topics = Topic.objects.filter(is_initiative=False)
    categories = Category.objects.all()
    if topic_id:
        categories = categories.filter(topic_id=topic_id)
    
    context = {
        'form': form,
        'documents': documents,
        'topics': topics,
        'categories': categories,
        'selected_topic': topic_id,
        'selected_category': category_id,
    }
    return render(request, 'usermanagement/documents_list.html', context)

@login_required
def delete_document(request, id):
    document = get_object_or_404(Document, id=id)
    document.delete()
    messages.success(request, 'Document deleted successfully.')
    return redirect('documents_list')