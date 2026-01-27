from pathlib import Path
import os

import django
from django.utils.translation import gettext
django.utils.translation.ugettext = gettext
from decouple import config
from import_export.formats.base_formats import CSV, XLSX


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


DJANGO_ENV = config('DJANGO_ENV', default='development')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-20#%$snye!xhu@dwuzg#!=j%xg3rs4na@fa&n27g*^2eypee^$'

if DJANGO_ENV == 'production':
    DEBUG = False
else:
    DEBUG = True
    
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'Base',
    'UserAdmin',
    'import_export',
    'fontawesome_5',
    'rest_framework',
    'UserManagement',
    'DataPortal',
    'DashBoard',
    'DataManagement',
    'mobile',
    'mediaManager',
    'corsheaders',
    'ckeditor',
    'ckeditor_uploader',
    'auditlog',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'auditlog.middleware.AuditlogMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'DashBoard.context_processors.user_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'project.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

##CK editor
CKEDITOR_BASEPATH = "/static/ckeditor/ckeditor/" 

STATIC_URL = 'static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]


if DJANGO_ENV == 'production':
    MEDIA_ROOT = '/mnt/data/tsms-public/media/'
    STATIC_ROOT = '/mnt/data/tsms-public/static/'
else:
    MEDIA_ROOT=os.path.join(BASE_DIR,"media/")
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL='/media/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


#Import export
IMPORT_FORMATS = [CSV, XLSX]
DATA_UPLOAD_MAX_NUMBER_FIELDS = 5000


AUTH_USER_MODEL = 'UserManagement.CustomUser'
# settings.py
LOGIN_URL = '/user-management/login/'


EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'digitalmopd@gmail.com'  
EMAIL_HOST_PASSWORD = 'iyaucxzlhpofybhb'
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False



CKEDITOR_UPLOAD_PATH = "ckeditor/"

# Auditlog configuration
AUDITLOG_INCLUDE_ALL_MODELS = False  # Only track registered models
AUDITLOG_DISABLE_ON_RAW_SAVE = False  # Track raw saves too
# ####log
# # settings.py
# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'handlers': {
#         'file': {
#             'level': 'ERROR',
#             'class': 'logging.FileHandler',
#             'filename': 'logfile.log',
#         },
#     },
#     'loggers': {
#         'django': {
#             'handlers': ['file'],
#             'level': 'ERROR',
#             'propagate': True,
#         },
#     },
# }
