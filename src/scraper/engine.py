"""
Motor de Ejecución V3 (Scraper Engine).
Orquesta la obtención de HTML (Estático/Dinámico) y la extracción de datos
basada EXCLUSIVAMENTE en Recetas (ScrapeRecipe).
"""

import logging
from typing import Optional
from datetime import datetime, timezone
from urllib.parse import urlparse

# Modelos V3
from .models import ScrapeRecipe, ExtractedProduct, SelectorType
# Componentes existentes
from .ua import ua_rotator
from .robots import RobotsChecker
from .ratelimit import RateLimiter
from .retry import RetryHandler
from .browser import fetch_html_dynamic
from .database import save_price, get_price_history
from src.notification.notifier import notification_manager

# Depenencias de scraping
import requests
from bs4 import BeautifulSoup
from decimal import Decimal
import re

logger = logging.getLogger('buyscraper.engine')

# Inicialización de componentes (Singleton pattern simplificado)
robots_checker = RobotsChecker(user_agent="*")
rate_limiter = RateLimiter(requests_per_minute=10, global_delay=1.0)
retry_handler = RetryHandler(max_retries=3, backoff_factor=2.0)

class ScraperEngine:
    """
    Motor unificado que procesa una Receta de Scraping.
    Abstrae la complejidad de red, validación y extracción.
    """
    
    def process(self, recipe: ScrapeRecipe, override_url: Optional[str] = None) -> ExtractedProduct:
        """
        Ejecuta el scraping completo para una receta.
        
        Args:
            recipe: Configuración de scraping (selectores, meta, etc.)
            override_url: URL específica a scrapear (si la receta es genérica para un dominio)
        """
        # 1. Determinar URL objetivo
        target_url = override_url 
        if not target_url:
            # En v3 las recetas podrían tener "url_template" o similar, 
            # por ahora asumimos que se pasa la URL o fallamos si no hay manera de saberla.
            raise ValueError("Se requiere una URL para procesar la receta")

        # 2. Configurar modo (Estático vs Dinámico)
        # Esto debería venir en la receta v3 (ej: meta.dynamic = True)
        use_dynamic = recipe.meta.get("dynamic", False)
        wait_selector = recipe.selectors.get("price", {}).value if use_dynamic else None

        # 3. Fetching (Red)
        html_content = self._fetch_content(target_url, use_dynamic, wait_selector)

        # 4. Extracción (Parsing)
        extracted_data = self._extract_data(html_content, recipe)
        
        # 5. Construir Resultado
        product_data = ExtractedProduct(
            site=urlparse(target_url).netloc,
            product_title=extracted_data.get('title', 'Unknown Product'),
            price=extracted_data.get('price'),
            currency=extracted_data.get('currency', 'USD'),
            url=target_url,
            timestamp=datetime.now(timezone.utc).isoformat()
        )

        # 6. Post-Procesamiento (Persistencia y Alertas)
        self._post_process(product_data)

        return product_data

    def _fetch_content(self, url: str, dynamic: bool, wait_selector: Optional[str]) -> str:
        """Maneja toda la lógica de red: Robots, RateLimit, Retry, UA."""
        
        # UA Rotativo
        current_ua = ua_rotator.get_random_ua()

        # Validaciones Previas
        if not robots_checker.can_fetch(url, current_ua):
            raise ValueError(f"Robots.txt bloquea acceso a {url}")
            
        rate_limiter.wait_if_needed(urlparse(url).netloc)

        # Ejecución Segura
        def _request():
            if dynamic:
                return fetch_html_dynamic(url, wait_selector=wait_selector)
            else:
                headers = {"User-Agent": current_ua}
                resp = requests.get(url, headers=headers, timeout=15)
                resp.raise_for_status()
                return resp.text

        try:
            return retry_handler.execute_with_retry(_request)
        except Exception as e:
            logger.error(f"Error crítico obteniendo {url}: {e}")
            raise

    def _extract_data(self, html: str, recipe: ScrapeRecipe) -> dict:
        """Extrae datos usando los selectores de la receta."""
        soup = BeautifulSoup(html, "html.parser")
        data = {}

        for field, config in recipe.selectors.items():
            element = None
            
            # Selector CSS
            if config.type == SelectorType.CSS:
                element = soup.select_one(config.value)
            
            # TODO: Implementar XPATH aquí si fuera necesario
            
            if element:
                # Extraer valor (atributo o texto)
                if config.attribute:
                    raw_value = element.get(config.attribute, '').strip()
                else:
                    raw_value = element.get_text(strip=True)
                
                # Procesamiento específico por campo
                if field == 'price':
                    data['price'] = self._parse_price(raw_value)
                elif field == 'product_title': # Mapeo al nombre interno 'title'
                    data['title'] = raw_value
                else:
                    data[field] = raw_value
            else:
                logger.warning(f"Selector '{field}' ({config.value}) no encontró nada.")
        
        return data

    def _parse_price(self, text: str) -> Optional[Decimal]:
        """Lógica de parsing de precios (migrada y mejorada)."""
        if not text: return None
        # Limpieza básica
        clean_text = re.sub(r'[^\d.,]', '', text) 
        try:
            # Heurística simple: reemplazar , con . si parece decimal
            if ',' in clean_text and '.' not in clean_text:
                clean_text = clean_text.replace(',', '.')
            elif ',' in clean_text and '.' in clean_text:
                # Asumimos el último separador es el decimal
                last_comma = clean_text.rfind(',')
                last_dot = clean_text.rfind('.')
                if last_comma > last_dot: # European style 1.000,00
                    clean_text = clean_text.replace('.', '').replace(',', '.')
                else: # US style 1,000.00
                    clean_text = clean_text.replace(',', '')
            
            return Decimal(clean_text)
        except Exception:
            return None

    def _post_process(self, product: ExtractedProduct):
        """Persistencia y Notificaciones."""
        # 1. Normalizar para DB (dict)
        # Nota: SQLite no soporta Decimal nativo, convertir a float
        db_row = {
            'timestamp': product.timestamp,
            'site': product.site,
            'product': product.product_title,
            'price': float(product.price) if product.price else None,
            'currency': product.currency,
            'url': str(product.url)
        }

        # 2. Verificar Caída de Precio (Lógica de Alerta)
        if db_row['price']:
            self._check_price_drop(product.product_title, db_row['price'], str(product.url))

        # 3. Guardar
        try:
            save_price(db_row)
        except Exception as e:
            logger.error(f"Error guardando en DB: {e}")

    def _check_price_drop(self, product: str, current_price: float, url: str):
        """Verifica historial y notifica."""
        try:
            history = get_price_history(product=product, limit=1)
            if history:
                last_price = history[0]['price']
                if last_price and current_price < last_price:
                    drop_pct = ((last_price - current_price) / last_price) * 100
                    if drop_pct >= 1.0:
                        notification_manager.notify_price_drop(product, last_price, current_price, url)
        except Exception as e:
            logger.warning(f"Error checking notifications: {e}")

# Instancia global del motor
engine = ScraperEngine()
