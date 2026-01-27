from django.shortcuts import get_object_or_404, render , redirect
from Base.models import *
from UserManagement.models import *
from django.contrib.auth.decorators import login_required

from django.contrib import messages
from .forms import IndicatorForm

from django.db.models import Count
from django.utils import timezone

from django.shortcuts import render
from django.db.models import Count, Q, Sum
from django.utils import timezone

from django.db.models import Prefetch


@login_required
def dashboard_index(request):
    # --- 1. Top Level Metrics ---
    total_indicators = Indicator.objects.count()
    total_categories = Category.objects.count()
    total_topics = Topic.objects.count()
    pending_verifications = Indicator.objects.filter(is_verified=False).count()

    # --- 2. Advanced Stats & Health ---
    last_entry = MonthData.objects.order_by('-created_at').first()
    if last_entry:
        diff = timezone.now() - last_entry.created_at
        freshness = "Today" if diff.days == 0 else f"{diff.days} Days Ago"
    else:
        freshness = "No Data"

    # Stat: Data Completion Gap (Indicators with NO data at all)
    indicators_with_any_data = AnnualData.objects.values('indicator').distinct().count()
    data_gap_count = total_indicators - indicators_with_any_data
    data_gap_percentage = round((data_gap_count / total_indicators * 100), 1) if total_indicators > 0 else 0

    # Stat: Data Composition (Annual vs Quarter vs Month)
    total_records = AnnualData.objects.count() + QuarterData.objects.count() + MonthData.objects.count()
    composition = [
        AnnualData.objects.count(),
        QuarterData.objects.count(),
        MonthData.objects.count()
    ]

    # --- 3. Category Summary (Horizontal Bar Chart) ---
    categories_data = Category.objects.annotate(
        indicator_count=Count('indicators')
    ).order_by('-indicator_count')[:10]
    
    cat_names = [c.name_ENG for c in categories_data]
    cat_counts = [c.indicator_count for c in categories_data]

    # --- 4. Monthly Trend (Line Chart) ---
    current_year = DataPoint.objects.order_by('-year_EC').first()
    months_query = Month.objects.all().order_by('number')
    monthly_performance = []
    month_labels = []
    
    for m in months_query:
        count = MonthData.objects.filter(for_month=m, for_datapoint=current_year).count()
        monthly_performance.append(count)
        month_labels.append(m.month_ENG)

    total_indicators = Indicator.objects.count()
    verified_indicators = Indicator.objects.filter(is_verified=True).count()
    
    # Calculate percentage safely
    if total_indicators > 0:
        verification_rate = round((verified_indicators / total_indicators) * 100, 1)
    else:
        verification_rate = 0

    context = {
        'total_topics': total_topics,
        'total_categories': total_categories,
        'total_indicators': total_indicators,
        'pending_verifications': pending_verifications,
        'freshness': freshness,
        'data_gap_count': data_gap_count,
        'data_gap_percentage': data_gap_percentage,
        'composition': composition,
        'cat_names': cat_names,
        'cat_counts': cat_counts,
        'months': month_labels,
        'monthly_data': monthly_performance,
        'latest_indicators': Indicator.objects.all().order_by('-created_at')[:5],
        'current_year': current_year,
        'all_topics'    : Topic.objects.all(),
        'total_indicators': total_indicators,
        'verification_rate': verification_rate, # Pass this directly
        'total_documents': Document.objects.count(),
        'total_users': CustomUser.objects.filter(is_active=True).count(),
    }

    return render(request, 'data_management/dashboard.html', context)

@login_required
def topics(request):
    user = request.user
    # Optimization: prefetch categories to avoid N+1 queries in the template
    base_query = Topic.objects.filter().prefetch_related('categories')

    if hasattr(user, 'is_category_manager') or hasattr(user, 'is_importer'):
        assigned_categories = CategoryAssignment.objects.filter(manager=user).values_list('category', flat=True)
        topics_list = base_query.filter(categories__in=assigned_categories).distinct()
    else:
        topics_list = base_query

    context = {
        'topics': topics_list,
        'topic_count': topics_list.count(),
    }
    return render(request, 'data_management/topics.html', context)

@login_required
def categories(request):
    user = request.user
    topic_id = request.GET.get('topic')  # ✅ Filter by selected topic

    # Base topic query
    base_topics_qs = Topic.objects.prefetch_related('categories')

    if hasattr(user, 'is_category_manager') or hasattr(user, 'is_importer'):
        assigned_category_ids = CategoryAssignment.objects.filter(
            manager=user
        ).values_list('category_id', flat=True)

        # Topics filtered by assigned categories
        topics_qs = base_topics_qs.filter(
            categories__id__in=assigned_category_ids
        ).distinct()

        # Categories filtered by assigned + optionally topic
        categories_qs = Category.objects.filter(
            id__in=assigned_category_ids
        ).select_related('topic')

        if topic_id:
            categories_qs = categories_qs.filter(topic_id=topic_id)

    else:
        topics_qs = base_topics_qs
        categories_qs = Category.objects.select_related('topic')
        if topic_id:
            categories_qs = categories_qs.filter(topic_id=topic_id)

    context = {
        'topics': topics_qs,
        'categories': categories_qs,
        'category_count': categories_qs.count(),
        'selected_topic': int(topic_id) if topic_id else None,  # for template
    }

    return render(request, 'data_management/categories.html', context)

@login_required
def indicators(request):
    user = request.user
    topic_id = request.GET.get('topic')
    category_id = request.GET.get('category')

    # --------------------------------------------------
    # STEP 1: Categories user is allowed to see
    # --------------------------------------------------
    if hasattr(user, 'is_category_manager') or hasattr(user, 'is_importer'):
        assigned_category_ids = CategoryAssignment.objects.filter(
            manager=user
        ).values_list('category', flat=True)

        base_categories = Category.objects.filter(id__in=assigned_category_ids)
    else:
        base_categories = Category.objects.all()

    # --------------------------------------------------
    # STEP 2: Topics list (derived from allowed categories)
    # --------------------------------------------------
    topics_qs = Topic.objects.filter(
        categories__in=base_categories
    ).distinct()

    # --------------------------------------------------
    # STEP 3: Categories list (filtered by topic)
    # --------------------------------------------------
    categories_qs = base_categories

    if topic_id:
        categories_qs = categories_qs.filter(topic_id=topic_id)

    # --------------------------------------------------
    # STEP 4: Indicators filtered by category + topic
    # --------------------------------------------------
    indicators_qs = Indicator.objects.filter(
        for_category__in=categories_qs,
        is_verified=True
    ).distinct()

    if category_id:
        indicators_qs = indicators_qs.filter(for_category__id=category_id)

    # --------------------------------------------------
    # CONTEXT
    # --------------------------------------------------
    context = {
        'topics': topics_qs,
        'categories': categories_qs,
        'indicators': indicators_qs,

        'selected_topic': int(topic_id) if topic_id else None,
        'selected_category': int(category_id) if category_id else None,

        'indicator_count': indicators_qs.count(),
    }

    return render(request, 'data_management/indicators.html', context)

@login_required
def data_entry(request):
    user = request.user

    # ----------------------------
    # Topic & Category (GET)
    # ----------------------------
    topic_id = request.GET.get('topic')
    category_id = request.GET.get('category')

    # ----------------------------
    # Indicators (POST → SESSION)
    # ----------------------------
    indicator_ids = request.GET.getlist('indicators')

    if not indicator_ids and request.method == 'POST':
        indicator_ids = request.POST.getlist('indicators')

    if indicator_ids:
        request.session['selected_indicators'] = indicator_ids
    else:
        indicator_ids = request.session.get('selected_indicators', [])

    # ----------------------------
    # STEP 1: User scope
    # ----------------------------
    if user.is_category_manager or user.is_importer:
        user_category_ids = CategoryAssignment.objects.filter(
            manager=user
        ).values_list('category', flat=True)

        topics_qs = Topic.objects.filter(
            categories__id__in=user_category_ids
        ).distinct()

        base_categories = Category.objects.filter(id__in=user_category_ids)
    else:
        topics_qs = Topic.objects.all()
        base_categories = Category.objects.all()

    # ----------------------------
    # STEP 2: Filter categories
    # ----------------------------
    categories_qs = base_categories
    if topic_id:
        categories_qs = categories_qs.filter(topic_id=topic_id)

    # ----------------------------
    # STEP 3: Indicators list (dropdown)
    # ----------------------------
    base_indicator_qs = Indicator.objects.filter(
        for_category__in=categories_qs,
        is_verified=True
    ).distinct()

    # -------------------------------
    # STEP 4: Table indicators (apply user selection)
    # -------------------------------
    if indicator_ids:
        indicators_qs = base_indicator_qs.filter(id__in=indicator_ids)
    else:
        indicators_qs = base_indicator_qs

    # -------------------------------
    # STEP 5: Indicator dropdown list (SAFE SLICE)
    # -------------------------------
    indicators_list_qs = base_indicator_qs[:300]

    # ----------------------------
    # Time dimensions
    # ----------------------------
    all_years = DataPoint.objects.all().order_by('-year_EC')
    years_annual = all_years[:20]
    years_quarterly = all_years[:10]
    years_monthly = all_years[:5]

    quarters = Quarter.objects.all().order_by('number')
    months = Month.objects.all().order_by('number')

    # ----------------------------
    # Data maps (FAST)
    # ----------------------------
    annual_map = {}
    for row in AnnualData.objects.filter(indicator__in=indicators_qs):
        annual_map.setdefault(row.indicator_id, {})[row.for_datapoint_id] = row.performance

    quarter_map = {}
    for row in QuarterData.objects.filter(indicator__in=indicators_qs):
        quarter_map.setdefault(row.indicator_id, {}) \
                   .setdefault(row.for_datapoint_id, {})[row.for_quarter_id] = row.performance

    month_map = {}
    for row in MonthData.objects.filter(indicator__in=indicators_qs):
        month_map.setdefault(row.indicator_id, {}) \
                 .setdefault(row.for_datapoint_id, {})[row.for_month_id] = row.performance

    context = {
        'topics': topics_qs,
        'categories': categories_qs,
        'indicators_list': indicators_list_qs,
        'indicators': indicators_qs,
        'years_annual': years_annual,
        'years_quarterly': years_quarterly,
        'years_monthly': years_monthly,
        'quarters': quarters,
        'months': months,
        'annual_map': annual_map,
        'quarter_map': quarter_map,
        'month_map': month_map,
        'selected_topic': int(topic_id) if topic_id else None,
        'selected_category': int(category_id) if category_id else None,
        'selected_indicators': list(map(int, indicator_ids)),
    }

    return render(request, 'data_management/data_entry.html', context)



@login_required
def add_indicator_page(request):
    if request.method == 'POST':
        form = IndicatorForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Indicator added successfully.')
            return redirect('data_indicators')
        else:
            # 🔥 SHOW EXACT ERRORS
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"{field}: {error}")
    else:
        form = IndicatorForm()

    return render(request, 'data_management/add_indicator.html', {'form': form})

@login_required
def edit_indicator_page(request, pk):
    indicator = get_object_or_404(Indicator, id=pk)

    if request.method == 'POST':
        form = IndicatorForm(request.POST, instance=indicator)
        if form.is_valid():
            form.save()
            messages.success(request, 'Indicator updated successfully.')
            return redirect('data_indicators')
        else:
            # 🔥 SHOW EXACT ERRORS
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"{field}: {error}")
    else:
        form = IndicatorForm(instance=indicator)

    return render(
        request,
        'data_management/edit_indicator.html',
        {'form': form, 'indicator': indicator}
    )


@login_required
def add_indicator(request):
    user = request.user

    if request.method == 'POST':
        title = request.POST.get('title')
        code = request.POST.get('code')
        category_id = request.POST.get('category')
        unit = request.POST.get('unit')
        frequency = request.POST.get('frequency')
        if user.is_category_manager:
            is_verified = True
        else:
            is_verified = False


        category = get_object_or_404(Category, id=category_id)

        Indicator.objects.create(
            title_ENG=title,
            code=code,
            for_category=category,
            measurement_units=unit,
            frequency=frequency,
            is_verified=is_verified
        )
        messages.success(request, 'Indicator added successfully.')
    return redirect('indicators')

@login_required
def edit_indicator(request, pk):
    indicator = get_object_or_404(Indicator, id=pk)
    if request.method == 'POST':
        indicator.title_ENG = request.POST.get('title')
        indicator.code = request.POST.get('code')
        category_id = request.POST.get('category')
        indicator.for_category = get_object_or_404(Category, id=category_id)
        indicator.measurement_units = request.POST.get('unit')
        indicator.frequency = request.POST.get('frequency')
        indicator.save()
        messages.success(request, 'Indicator updated successfully.')
    return redirect('indicators')



######## Verification #########
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render
from .utils import (
    get_manager_indicators,
    get_unverified_indicators,
    get_unverified_annual_data,
    get_unverified_quarter_data,
    get_unverified_month_data
)

def is_category_manager(user):
    return user.is_authenticated and user.is_category_manager

@login_required
@user_passes_test(is_category_manager)
def verification_dashboard(request):
    context = {
        "indicators": get_unverified_indicators(request.user),
        "annual_data": get_unverified_annual_data(request.user),
        "quarter_data": get_unverified_quarter_data(request.user),
        "month_data": get_unverified_month_data(request.user),
    }
    return render(request, "data_management/verifications.html", context)

@login_required
@user_passes_test(lambda u: u.is_category_manager)
def bulk_verify(request, model):
    model_map = {
        "indicator": Indicator,
        "annual": AnnualData,
        "quarter": QuarterData,
        "month": MonthData,
    }

    ids = request.POST.getlist("ids")

    model_map[model].objects.filter(
        id__in=ids
    ).update(
        is_verified=True
    )

    return redirect("verification_dashboard")


######## Documents ##########
from .forms import DocumentForm

@login_required
def data_documents(request):
    user = request.user
    topic_id = request.GET.get('topic')

    # Base topics
    base_topics_qs = Topic.objects.prefetch_related('categories')

    if hasattr(user, 'is_category_manager') and user.is_category_manager:
        assigned_category_ids = CategoryAssignment.objects.filter(
            manager=user
        ).values_list('category_id', flat=True)
        topics_qs = base_topics_qs.filter(
            categories__id__in=assigned_category_ids
        ).distinct()
        categories_qs = Category.objects.filter(
            id__in=assigned_category_ids
        ).select_related('topic')
        if topic_id:
            categories_qs = categories_qs.filter(topic_id=topic_id)
    else:
        topics_qs = base_topics_qs
        categories_qs = Category.objects.select_related('topic')
        if topic_id:
            categories_qs = categories_qs.filter(topic_id=topic_id)

    documents_qs = Document.objects.filter(category__in=categories_qs)
    if topic_id:
        documents_qs = documents_qs.filter(topic_id=topic_id)

    context = {
        'topics': topics_qs,
        'categories': categories_qs,
        'category_count': categories_qs.count(),
        'selected_topic': int(topic_id) if topic_id else None,
        'documents': documents_qs.order_by('-id'),
    }
    return render(request, 'data_management/documents.html', context)



@login_required
def add_document(request):
    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, "Document added successfully.")
            return redirect('data_documents')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = DocumentForm()
    
    return render(request, 'data_management/add_document.html', {
        'form': form
    })


@login_required
def edit_document(request, doc_id):
    doc = get_object_or_404(Document, id=doc_id)

    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES, instance=doc)
        if form.is_valid():
            form.save()
            messages.success(request, "Document updated successfully.")
            return redirect('data_documents')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = DocumentForm(instance=doc)
    
    return render(request, 'data_management/edit_document.html', {
        'form': form,
        'doc': doc
    })



######## User Management Dashboard ##########
@login_required
def user_management_dashboard(request):
    user = request.user
    
    if user.is_superuser:
        # Admin sees all Managers
        users_to_manage = CustomUser.objects.filter(is_category_manager=True).prefetch_related('managed_categories__category')
        role_label = "Category Managers"
        
        # Admin Stats
        stats = {
            'total_users': CustomUser.objects.count(),
            'managers': users_to_manage.count(),
            'importers': CustomUser.objects.filter(is_importer=True).count(),
            'unassigned_cats': Category.objects.filter(category_managers__isnull=True).count()
        }
    elif user.is_category_manager:
        # Manager sees only THEIR Importers
        users_to_manage = CustomUser.objects.filter(manager=user, is_importer=True).prefetch_related('managed_categories__category')
        role_label = "My Data Importers"
        
        # Manager Stats
        stats = {
            'total_users': users_to_manage.count(),
            'my_cats': CategoryAssignment.objects.filter(manager=user).count(),
            'active_importers': users_to_manage.filter(is_active=True).count()
        }
    else:
        messages.error(request, "Access Denied.")
        return redirect('dashboard_index')

    context = {
        'users': users_to_manage,
        'role_label': role_label,
        'stats': stats,
        'all_topics': Topic.objects.prefetch_related('categories').all()
    }
    return render(request, 'data_management/user_management.html', context)


@login_required
def manage_user_form(request, user_id=None):
    """Handles both Adding and Editing Users"""
    instance = get_object_or_404(CustomUser, id=user_id) if user_id else None
    user = request.user
    
    # Determine what categories can be assigned
    if user.is_superuser:
         available_topics = Topic.objects.prefetch_related('categories').all()
    else:
        # Categories managed by the current user
        my_cats = CategoryAssignment.objects.filter(manager=user).values_list('category_id', flat=True)
        
        # Topics that have at least one of these categories
        available_topics = Topic.objects.filter(categories__id__in=my_cats).distinct()
        
        # Prefetch only the categories the manager can assign
        available_topics = available_topics.prefetch_related(
            Prefetch(
                'categories',
                queryset=Category.objects.filter(id__in=my_cats),
                to_attr='managed_categories'
            )
        )


    if request.method == 'POST':
        email = request.POST.get('email')
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        selected_categories = request.POST.getlist('categories')

        # Create or Update User
        if not instance:
            # Create logic (Password defaults to 'mopd@1234' for simplicity)
            target_user = CustomUser.objects.create_user(
                username=email.split('@')[0],
                email=email,
                first_name=first_name,
                last_name=last_name,
                password='mopd@1234'
            )
            # Assign Role based on Creator
            if user.is_superuser:
                target_user.is_category_manager = True
            else:
                target_user.is_importer = True
                target_user.manager = user
            target_user.save()
        else:
            target_user = instance
            target_user.email = email
            target_user.first_name = first_name
            target_user.last_name = last_name
            target_user.save()

        # Handle Category Assignments
        CategoryAssignment.objects.filter(manager=target_user).delete()
        for cat_id in selected_categories:
            CategoryAssignment.objects.create(manager=target_user, category_id=cat_id)

        messages.success(request, f"User {target_user.get_full_name()} saved successfully.")
        return redirect('user_management_dashboard')

    context = {
        'instance': instance,
        'all_topics': available_topics,
        'assigned_cat_ids': instance.managed_categories.values_list('category_id', flat=True) if instance else [],
        'title': "Edit User" if instance else "Add New User"
    }
    return render(request, 'data_management/user_form.html', context)