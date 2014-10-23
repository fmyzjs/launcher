import os
from os.path import join, abspath, dirname
from django.core.exceptions import ImproperlyConfigured


def get_env_variable(var_name):
    """ Get the environment variable or return exception """
    try:
        return os.environ[var_name]
    except KeyError:
        error_msg = "Set the %s environment variable" % var_name
        raise ImproperlyConfigured(error_msg)

# utility functions for handling paths inside the project
here = lambda *x: join(abspath(dirname(__file__)), *x)
PROJECT_ROOT = here("..", "..")
root = lambda *x: join(abspath(PROJECT_ROOT), *x)


DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    ('Jason Zhu', 'root@idefs.net'),
    ('fmyzjs', 'fmyzjs@gmail.com'),
)

MANAGERS = ADMINS

DEFAULT_FROM_EMAIL = 'support@idefs.net'
SERVER_EMAIL = DEFAULT_FROM_EMAIL

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',  # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': root('launcher.db'),  # Or path to database file if using sqlite3.
        # The following settings are not used with sqlite3:
        'USER': '',
        'PASSWORD': '',
        'HOST': '',                      # Empty for localhost through domain sockets or '127.0.0.1' for localhost through TCP.
        'PORT': '',                      # Set to empty string for default.
    }
}

# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = [
    '.edustack.bistu.edu.cn'
    '.idefs.net',
    '127.0.0.1',
]

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'America/New_York'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/var/www/example.com/media/"
MEDIA_ROOT = root('media')

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://example.com/media/", "http://media.example.com/"
MEDIA_URL = '/media/'

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"
STATIC_ROOT = root('collected_static')

# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
STATIC_URL = '/static/'

# Additional locations of static files
STATICFILES_DIRS = (
    root('static'),
    root('components/bower_components'),
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'pipeline.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'pipeline.finders.PipelineFinder',
    #'pipeline.finders.CachedFileFinder',

)

STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'

# Make this unique, and don't share it with anybody.
SECRET_KEY = get_env_variable('SECRET_KEY')

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.static",
    "django.core.context_processors.tz",
    "django.contrib.messages.context_processors.messages"
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    #'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'launcher.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'launcher.wsgi.application'

TEMPLATE_DIRS = (
    root('templates'),
)

INSTALLED_APPS = (
    # Django apps
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    #'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',

    # Third-party apps
    'djangobower',
    'django_extensions',
    'kombu.transport.django',
    'pipeline',
    'south',
    'tastypie',

    # Project apps
    'deployment',
)

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'root': {
        'level': 'WARNING',
        'handlers': ['sentry'],
    },
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
        },
    },
    'handlers': {
        'sentry': {
            'level': 'ERROR',
            'class': 'raven.contrib.django.raven_compat.handlers.SentryHandler',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        'django.db.backends': {
            'level': 'ERROR',
            'handlers': ['console'],
            'propagate': False,
        },
        'raven': {
            'level': 'DEBUG',
            'handlers': ['console'],
            'propagate': False,
        },
        'sentry.errors': {
            'level': 'DEBUG',
            'handlers': ['console'],
            'propagate': False,
        },
        'celery': {
            'level': 'WARNING',
            'handlers': ['sentry'],
            'propagate': False,
        },
        'deployment.tasks': {
            'level': 'INFO',
            'handlers': ['console'],
            'propagate': False,
        },
    },
}

# Bower config
BOWER_COMPONENTS_ROOT = root('components')

BOWER_INSTALLED_APPS = (
    'jquery#1.9.1',
    'underscore#1.6.0',
    'backbone#1.1.2',
    'json2',
    'kbwood_countdown#1.6.2',
    'bootstrap#3.1.1',
)

# Django Pipeline config

PIPELINE_CSS = {
    'launcher_main': {
        'source_filenames': (
            'bootstrap/dist/css/bootstrap.css',
            'bootstrap/dist/css/bootstrap-theme.css',
            'css/app.css'
        ),
        'output_filename': 'css/launcher_main.css',
        'extra_context': {
            'media': 'screen',
        },
    },
}

PIPELINE_JS = {
    'launcher_main': {
        'source_filenames': (
            'jquery/jquery.js',
            'json2/json2.js',
            'underscore/underscore.js',
            'backbone/backbone.js',
            'bootstrap/dist/js/bootstrap.js',
        ),
        'output_filename': 'js/launcher_main.min.js',
    },
    'app': {
        'source_filenames': (
            'js/app.js',
        ),
        'output_filename': 'js/app.min.js'

    },
    'countdown': {
        'source_filenames': (
            'kbwood_countdown/jquery.countdown.js',
        ),
        'output_filename': 'js/countdown.min.js'

    },
}

PIPELINE_COMPILERS = (
    'pipeline.compilers.less.LessCompiler',
)

# npm install -g uglify-js
PIPELINE_JS_COMPRESSOR = 'pipeline.compressors.uglifyjs.UglifyJSCompressor'
PIPELINE_UGLIFYJS_BINARY = '/usr/bin/env uglifyjs'

# Server config
BASE_URL = get_env_variable('BASE_URL')
APP_DOMAIN = get_env_variable('APP_DOMAIN')

# Celery config
BROKER_URL = 'django://'
CELERYD_HIJACK_ROOT_LOGGER = False

# Pusher settings
PUSHER_APP_ID = get_env_variable('PUSHER_APP_ID')
PUSHER_APP_KEY = get_env_variable('PUSHER_APP_KEY')
PUSHER_APP_SECRET = get_env_variable('PUSHER_APP_SECRET')

# Customer.io settings
CUSTOMERIO_SITE_ID = get_env_variable('CUSTOMERIO_SITE_ID')
CUSTOMERIO_API_KEY = get_env_variable('CUSTOMERIO_API_KEY')

# Intercom.io settings
USE_INTERCOM = get_env_variable('USE_INTERCOM')
if USE_INTERCOM:
    INTERCOM_APP_ID = get_env_variable('INTERCOM_APP_ID')
    INTERCOM_API_KEY = get_env_variable('INTERCOM_API_KEY')
    INTERCOM_EDX_APP_ID = get_env_variable('INTERCOM_EDX_APP_ID')
    INTERCOM_EDX_APP_SECRET = get_env_variable('INTERCOM_EDX_APP_SECRET')

# Docker settings
SHIPYARD_HOST = get_env_variable('SHIPYARD_HOST')
SHIPYARD_USER = get_env_variable('SHIPYARD_USER')
SHIPYARD_KEY = get_env_variable('SHIPYARD_KEY')
