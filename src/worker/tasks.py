"""
Tareas asíncronas de Celery.
Ejecutadas por los workers distribuidos.
"""

from .celery_app import celery_app
from src.scraper.engine import engine
from src.scraper.models import ScrapeRecipe, SelectorConfig, SelectorType
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@celery_app.task(bind=True, max_retries=3)
def scrape_task(self, url: str, selector: str, name_selector: str = None, dynamic: bool = False, product_fallback: str = "Unknown"):
    """
    Tarea distribuida para scrapear una URL.
    Construye una receta ad-hoc y ejecuta el engine.
    """
    try:
        logger.info(f"Worker iniciando scraping para: {url}")
        
        # 1. Reconstruir Receta desde argumentos
        # (Idealmente en el futuro pasaríamos el ID de una receta guardada)
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        
        selectors = {
            "price": SelectorConfig(type=SelectorType.CSS, value=selector)
        }
        if name_selector:
             selectors["product_title"] = SelectorConfig(type=SelectorType.CSS, value=name_selector)
        
        recipe = ScrapeRecipe(
            domain=domain,
            selectors=selectors,
            meta={"dynamic": dynamic, "ad_hoc": True}
        )
        
        # 2. Ejecutar Engine
        result = engine.process(recipe, override_url=url)
        
        # 3. Retornar resultado (serializable)
        logger.info(f"Scraping completado: {result.price}")
        return {
            "status": "success",
            "price": float(result.price) if result.price else None,
            "product": result.product_title,
            "url": str(result.url)
        }
        
    except Exception as e:
        logger.error(f"Error en tarea scraping {url}: {e}")
        # Reintentar con backoff exponencial propio de Celery
        raise self.retry(exc=e, countdown=2 ** self.request.retries)
