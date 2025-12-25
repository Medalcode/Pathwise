"""
BuyScraper - Scraper genérico de precios con análisis temporal.

Este paquete proporciona funcionalidad para:
- Scraping ético con respeto a robots.txt
- Rate limiting para evitar sobrecargar servidores
- Retry logic con backoff exponencial
- Logging profesional
- Parsing robusto de precios
"""

__version__ = "2.0.0"
__author__ = "Medalcode"

from .logger import setup_logger, get_logger
from .robots import RobotsChecker
from .ratelimit import RateLimiter
from .retry import RetryHandler, with_retry

__all__ = [
    'setup_logger',
    'get_logger',
    'RobotsChecker',
    'RateLimiter',
    'RetryHandler',
    'with_retry',
]
