"""
Scraper genérico: recibe URL y selector CSS para precio y opcionalmente nombre de producto.
Guarda resultados en CSV con columnas: timestamp, site, product, price, currency, url

Ejemplos de uso:
    python src/scraper/scrape.py --url "https://ejemplo.tld/producto" --selector ".price" --product "Mi Producto" --output data/prices.csv
    python src/scraper/scrape.py --sites config/sites.yaml --output data/prices.csv

Nota: este script es intencionalmente genérico: cada sitio puede requerir un selector distinto.
"""

from __future__ import annotations
import argparse
import csv
import datetime
import re
import sys
from typing import Optional

import requests
try:
    from bs4 import BeautifulSoup
except ImportError:
    # Provide a clear message and a very small fallback implementation so the script doesn't crash;
    # for full functionality install beautifulsoup4: pip install beautifulsoup4
    print("Missing dependency 'beautifulsoup4'. Install with: pip install beautifulsoup4", file=sys.stderr)

    # Minimal fallback supporting BeautifulSoup(html, "html.parser") and select_one for simple selectors:
    from html.parser import HTMLParser
    import re

    class _FallbackNode:
        def __init__(self, html_fragment: str):
            self._html = html_fragment

        def get_text(self) -> str:
            # strip tags naively
            return re.sub(r"<[^>]+>", "", self._html).strip()

    class _SimpleSoup:
        def __init__(self, html: str, parser: str = "html.parser"):
            self._html = html

        def select_one(self, selector: str):
            sel = selector.strip()
            # class selector: .classname
            if sel.startswith("."):
                cls = re.escape(sel[1:])
                m = re.search(rf"<([a-zA-Z0-9]+)[^>]*\bclass=[\"'][^\"']*\b{cls}\b[^\"']*[\"'][^>]*>(.*?)</\1>", self._html, re.S)
                if m:
                    return _FallbackNode(m.group(0))
            # id selector: #idvalue
            elif sel.startswith("#"):
                idv = re.escape(sel[1:])
                m = re.search(rf"<([a-zA-Z0-9]+)[^>]*\bid=[\"']{idv}[\"'][^>]*>(.*?)</\1>", self._html, re.S)
                if m:
                    return _FallbackNode(m.group(0))
            # tag selector: tagname
            else:
                tag = re.escape(sel)
                m = re.search(rf"<{tag}[^>]*>(.*?)</{tag}>", self._html, re.S)
                if m:
                    return _FallbackNode(m.group(0))
            return None

    def BeautifulSoup(html: str, parser: str = "html.parser"):
        return _SimpleSoup(html, parser)

import yaml
from urllib.parse import urlparse

# Importar módulos de las mejoras
from .logger import setup_logger, get_logger
from .robots import RobotsChecker
from .ratelimit import RateLimiter
from .retry import RetryHandler
from .database import init_db, save_price, get_price_history
from .ua import ua_rotator
from .browser import fetch_html_dynamic
from src.notification.notifier import notification_manager

# Configurar logger global
logger = setup_logger('buyscraper')

# Inicializar componentes globales
robots_checker = RobotsChecker(user_agent="*") # Default genérico
rate_limiter = RateLimiter(requests_per_minute=10, global_delay=1.0)
retry_handler = RetryHandler(max_retries=3, backoff_factor=2.0)

# Inicializar DB
try:
    init_db()
except Exception as e:
    logger.warning(f"No se pudo inicializar la base de datos: {e}")


def fetch_html(url: str, timeout: int = 10, respect_robots: bool = True, use_dynamic: bool = False, wait_selector: str = None) -> str:
    """
    Obtiene HTML de una URL con todas las protecciones implementadas.
    Soporta modo estático (requests) y dinámico (playwright).
    """
    # Obtener UA (compartido para validación y request)
    current_ua = ua_rotator.get_random_ua()
    
    # 1. Verificar robots.txt
    if respect_robots:
        if not robots_checker.can_fetch(url, current_ua):
            error_msg = f"robots.txt disallows scraping {url}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        crawl_delay = robots_checker.get_crawl_delay(url, current_ua)
    else:
        crawl_delay = None
    
    # 2. Rate limiting
    domain = urlparse(url).netloc
    custom_delay = crawl_delay if crawl_delay else None
    rate_limiter.wait_if_needed(domain, custom_delay=custom_delay)
    
    # 3. Request (Dinámico o Estático)
    if use_dynamic:
        try:
            return retry_handler.execute_with_retry(
                lambda: fetch_html_dynamic(url, wait_selector, timeout=timeout*1000)
            )
        except Exception as e:
            logger.error(f"Failed dynamic fetch {url}: {e}")
            raise

    # Modo Estático Standard
    def _do_request():
        logger.info(f"Fetching {url} (Static, UA: {current_ua[:30]}...)")
        headers = {"User-Agent": current_ua}
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        logger.debug(f"Successfully fetched {url} ({len(resp.text)} bytes)")
        return resp.text
    
    try:
        return retry_handler.execute_with_retry(_do_request)
    except Exception as e:
        logger.error(f"Failed static fetch {url}: {e}")
        raise



def parse_price(text: str) -> Optional[float]:
    """Extrae un número decimal desde un string que contiene símbolos de moneda.
    Retorna None si no se puede parsear.
    """
    if not text:
        return None
    # Normalizar: quitar espacios y newlines
    s = re.sub(r"[\n\r\t]", " ", text)
    s = s.strip()
    # Buscar patrón de número con separadores , o .
    # Reemplazamos puntos en miles y comas decimales si corresponde.
    # Estrategia simple: extraer la parte numérica y cambiar comas por puntos si hay comas y no puntos.
    num = re.findall(r"[0-9]+[\.,]?[0-9]*([\.,][0-9]{3})*", s)
    # Otra estrategia más directa:
    m = re.search(r"[0-9\.,]+", s)
    if not m:
        return None
    raw = m.group(0)
    # Si tiene both '.' and ',' decide formato: si '.' comes before ',' assume '.' thousands and ',' decimal
    if "." in raw and "," in raw:
        if raw.find('.') < raw.find(','):
            # 1.234,56 -> remove dots, replace comma
            normalized = raw.replace('.', '').replace(',', '.')
        else:
            # 1,234.56 -> remove commas
            normalized = raw.replace(',', '')
    else:
        # only one of them
        if "," in raw:
            # Could be 1234,56 or 1,234 -- assume comma decimal if there are 1-2 decimal digits afterwards
            after = raw.split(',')[-1]
            if len(after) in (1, 2):
                normalized = raw.replace(',', '.')
            else:
                normalized = raw.replace(',', '')
        else:
            normalized = raw
    try:
        return float(normalized)
    except ValueError:
        return None


def extract_price_and_name(html: str, price_selector: str, name_selector: Optional[str] = None) -> tuple[Optional[float], Optional[str]]:
    soup = BeautifulSoup(html, "html.parser")
    price_node = soup.select_one(price_selector)
    price = None
    if price_node:
        price = parse_price(price_node.get_text())
    name = None
    if name_selector:
        name_node = soup.select_one(name_selector)
        if name_node:
            name = name_node.get_text().strip()
    return price, name



def check_and_notify(product: str, current_price: float, url: str):
    """Verifica si el precio bajó comparado con el historial y notifica."""
    if current_price is None:
        return

    try:
        # Obtener último precio (limit 1)
        history = get_price_history(product=product, limit=1)
        if not history:
            return # Primer registro
            
        last_record = history[0]
        last_price = last_record['price']
        
        if last_price and current_price < last_price:
            # Calcular % caída
            drop_pct = ((last_price - current_price) / last_price) * 100
            if drop_pct >= 1.0: # Notificar si baja 1% o más
                logger.info(f"Price drop detected for {product}: {last_price} -> {current_price} (-{drop_pct:.1f}%)")
                notification_manager.notify_price_drop(product, last_price, current_price, url)
                
    except Exception as e:
        logger.warning(f"Error checking price drop: {e}")


def save_row(path: str, row: dict):
    """Guarda registro en CSV y Base de Datos (SQLite)."""
    # 1. Guardar en CSV
    header = ["timestamp", "site", "product", "price", "currency", "url"]
    write_header = False
    try:
        with open(path, 'r', encoding='utf-8') as f:
            pass
    except FileNotFoundError:
        write_header = True
    
    with open(path, 'a', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=header)
        if write_header:
            writer.writeheader()
        writer.writerow(row)
        
    # 2. Guardar en DB
    try:
        # Normalizar precio para DB (que espera float o None)
        db_row = row.copy()
        if isinstance(db_row['price'], str) and not db_row['price']:
            db_row['price'] = None
        
        # Verificar alertas ANTES de guardar el nuevo registro
        if db_row['price'] is not None:
             check_and_notify(db_row['product'], db_row['price'], db_row['url'])

        save_price(db_row)
        logger.debug(f"Saved to DB: {db_row['url']}")
    except Exception as e:
        # No bloquear si falla DB, logger ya registró error en save_price
        logger.warning(f"Failed to save to DB (CSV saved ok): {e}")


def run_from_config(sites_file: str, output: str):
    with open(sites_file, 'r', encoding='utf-8') as f:
        cfg = yaml.safe_load(f)
    for site in cfg.get('sites', []):
        url = site.get('url')
        selector = site.get('price_selector')
        product = site.get('product', '')
        currency = site.get('currency', '')
        name_selector = site.get('name_selector')
        use_dynamic = site.get('dynamic', False)
        wait_selector = site.get('wait_selector', selector) # Default: esperar el precio

        if not url or not selector:
            logger.warning(f"Skipping site missing url/selector: {site}")
            continue
        try:
            html = fetch_html(url, use_dynamic=use_dynamic, wait_selector=wait_selector)
            price, name = extract_price_and_name(html, selector, name_selector)
            
            # Usar timezone-aware datetime para evitar warning
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            
            row = {
                'timestamp': now,
                'site': url,
                'product': name or product,
                'price': price if price is not None else '',
                'currency': currency or '',
                'url': url,
            }
            save_row(output, row)
            logger.info(f"Saved: {url} -> {row['price']} {row['currency']}")
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")


def run_single(url: str, selector: str, product: str, output: str, name_selector: Optional[str], currency: str, use_dynamic: bool = False):
    html = fetch_html(url, use_dynamic=use_dynamic, wait_selector=selector)
    price, name = extract_price_and_name(html, selector, name_selector)
    
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    row = {
        'timestamp': now,
        'site': url,
        'product': name or product,
        'price': price if price is not None else '',
        'currency': currency or '',
        'url': url,
    }
    save_row(output, row)
    logger.info(f"Saved: {url} -> {row['price']} {row['currency']}")


def main(argv=None):
    parser = argparse.ArgumentParser(description='Scraper genérico de precios')
    parser.add_argument('--sites', help='Archivo YAML con lista de sitios (config/sites.yaml)')
    parser.add_argument('--url', help='URL única a scrapear')
    parser.add_argument('--selector', help='Selector CSS para el precio (p.ej. ".price")')
    parser.add_argument('--name-selector', help='Selector CSS para el nombre del producto (opcional)')
    parser.add_argument('--product', help='Nombre de producto (fallback)')
    parser.add_argument('--currency', help='Moneda (opcional)')
    parser.add_argument('--output', default='data/prices.csv', help='Archivo CSV de salida')
    parser.add_argument('--dynamic', action='store_true', help='Usar navegador real (Playwright) para renderizado JS')
    args = parser.parse_args(argv)

    if args.sites:
        run_from_config(args.sites, args.output)
    elif args.url and args.selector:
        run_single(
            args.url, 
            args.selector, 
            args.product or '', 
            args.output, 
            args.name_selector, 
            args.currency or '',
            use_dynamic=args.dynamic
        )
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
