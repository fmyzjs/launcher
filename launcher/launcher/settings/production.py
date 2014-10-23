from .base import *
from datetime import timedelta

# needed to convert string values to boolean
DEBUG = (get_env_variable("DEBUG") == "True")
TEMPLATE_DEBUG = DEBUG

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',  # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'launcher',  # Or path to database file if using sqlite3.
        # The following settings are not used with sqlite3:
        'USER': get_env_variable('MYSQL_USER'),
        'PASSWORD': get_env_variable('MYSQL_PASSWORD'),
        'HOST': 'localhost',                      # Empty for localhost through domain sockets or '127.0.0.1' for localhost through TCP.
        'PORT': '',                      # Set to empty string for default.
    }
}

INSTALLED_APPS += (
    'djrill',
    'raven.contrib.django.raven_compat',
)

# Sentry/Raven config
RAVEN_CONFIG = {
    'dsn': get_env_variable('SENTRY_DSN'),
    'timeout': 3,
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.memcached.PyLibMCCache',
        'LOCATION': '127.0.0.1:11211',
    }
}

# Email settings
EMAIL_BACKEND = "djrill.mail.backends.djrill.DjrillBackend"
MANDRILL_API_KEY = get_env_variable('MANDRILL_API_KEY')

# Celery settings
BROKER_URL = "redis://localhost:6379/0"
CELERY_IGNORE_RESULT = True

CELERYBEAT_SCHEDULE = {
    'app-expires-soon-notify': {
        'task': 'deployment.tasks.app_expiring_soon_reminder',
        'schedule': timedelta(seconds=60),
    },
    'destroy-expired-apps': {
        'task': 'deployment.tasks.destroy_expired_apps',
        'schedule': timedelta(seconds=60),
    },
}
