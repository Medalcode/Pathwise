"""
Configuración de la aplicación Celery.
Define el broker (Redis) y el backend de resultados.
"""

import os
from celery import Celery

# URL de Redis (usando variable de entorno o default localhost)
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

celery_app = Celery(
    'buyscraper_worker',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['src.worker.tasks'] # Donde están las tareas
)

celery_app.conf.update(
    result_expires=3600,
    task_serializer='json',
    accept_content=['json'],  # Ignore other content
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    # Rate limit global por worker si se desea
    # worker_concurrency=4 
)

if __name__ == '__main__':
    celery_app.start()
