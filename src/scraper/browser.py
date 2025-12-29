"""
Motor de Navegador basado en Playwright para sitios dinámicos (SPA).
Carga JavaScript y maneja reders complejos.
"""

import logging
from typing import Optional
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from .ua import ua_rotator

logger = logging.getLogger('buyscraper.browser')

def fetch_html_dynamic(url: str, wait_selector: Optional[str] = None, timeout: int = 30000) -> str:
    """
    Obtiene HTML usando un navegador real (Chromium).
    
    Args:
        url: URL a scrapear.
        wait_selector: Selector CSS opcional a esperar antes de devolver HTML.
                       Útil para asegurar que el precio se cargó.
        timeout: Timeout en milisegundos.
        
    Returns:
        HTML renderizado.
    """
    ua = ua_rotator.get_random_ua()
    
    with sync_playwright() as p:
        # Lanzar navegador (headless=True por defecto)
        browser = p.chromium.launch(headless=True)
        
        # Crear contexto con UA rotativo y viewport común
        context = browser.new_context(
            user_agent=ua,
            viewport={'width': 1280, 'height': 800}
        )
        
        page = context.new_page()
        
        try:
            logger.info(f"Navegando a {url} (Dynamic Mode)")
            # Goto con espera 'domcontentloaded' suele ser suficiente, 
            # pero 'networkidle' es más seguro para SPAs pesadas.
            page.goto(url, wait_until="domcontentloaded", timeout=timeout)
            
            if wait_selector:
                logger.debug(f"Esperando selector: {wait_selector}")
                page.wait_for_selector(wait_selector, timeout=timeout)
            
            # Obtener contenido final renderizado
            content = page.content()
            logger.debug(f"Contenido dinámico obtenido ({len(content)} bytes)")
            
            return content
            
        except PlaywrightTimeout:
            logger.error(f"Timeout esperando carga/selector en {url}")
            # Intento de screenshot para debug (opcional, guardar en logs)
            # page.screenshot(path=f"logs/error_{url[:20]}.png")
            raise TimeoutError(f"Timeout cargando {url}")
            
        except Exception as e:
            logger.error(f"Error navegador dinámico: {e}")
            raise e
            
        finally:
            browser.close()
