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
DJANGO_DEBUG = config('DJANGO_DEBUG', default=(DJANGO_ENV != 'production'), cast=bool)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-20#%$snye!xhu@dwuzg#!=j%xg3rs4na@fa&n27g*^2eypee^$')

DEBUG = DJANGO_DEBUG
    
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
    'mozilla_django_oidc',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'auditlog.middleware.AuditlogMiddleware',
]


#Authntication 
AUTHENTICATION_BACKENDS = (
    'UserManagement.auth_backends.CustomOIDCAuthenticationBackend',
    'django.contrib.auth.backends.ModelBackend',
)

# Keycloak Configuration
OIDC_RP_CLIENT_ID = config('OIDC_RP_CLIENT_ID', default='tsms')
OIDC_RP_CLIENT_SECRET = config('OIDC_RP_CLIENT_SECRET', default='')
OIDC_OP_AUTHORIZATION_ENDPOINT = config('OIDC_OP_AUTHORIZATION_ENDPOINT', default='https://auth.mopd.gov.et/realms/mopd-auth/protocol/openid-connect/auth')
OIDC_OP_TOKEN_ENDPOINT = config('OIDC_OP_TOKEN_ENDPOINT', default='https://auth.mopd.gov.et/realms/mopd-auth/protocol/openid-connect/token')
OIDC_OP_USER_ENDPOINT = config('OIDC_OP_USER_ENDPOINT', default='https://auth.mopd.gov.et/realms/mopd-auth/protocol/openid-connect/userinfo')
OIDC_OP_JWKS_ENDPOINT = config('OIDC_OP_JWKS_ENDPOINT', default='https://auth.mopd.gov.et/realms/mopd-auth/protocol/openid-connect/certs')
OIDC_OP_LOGOUT_ENDPOINT = config('OIDC_OP_LOGOUT_ENDPOINT', default='https://auth.mopd.gov.et/realms/mopd-auth/protocol/openid-connect/logout')
OIDC_POST_LOGOUT_REDIRECT_URI = config('OIDC_POST_LOGOUT_REDIRECT_URI', default='http://localhost:8000/user-management/login/')
OIDC_RP_SIGN_ALGO = config('OIDC_RP_SIGN_ALGO', default='RS256')
OIDC_STORE_ID_TOKEN = config('OIDC_STORE_ID_TOKEN', default=True, cast=bool)
OIDC_CALLBACK_CLASS = config(
    'OIDC_CALLBACK_CLASS',
    default='UserManagement.oidc_views.CustomOIDCAuthenticationCallbackView'
)
OIDC_DRF_AUTH_BACKEND = "UserManagement.auth_backends.CustomOIDCAuthenticationBackend"

# Optional: Automatically create a Django user if they don't exist
OIDC_CREATE_USER = config('OIDC_CREATE_USER', default=False, cast=bool)



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

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "mozilla_django_oidc.contrib.drf.OIDCAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
}



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
LOGIN_URL = config('LOGIN_URL', default='/user-management/login/')
LOGIN_REDIRECT_URL = config('LOGIN_REDIRECT_URL', default='/data-management/')


EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)



CKEDITOR_UPLOAD_PATH = "ckeditor/"
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
