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

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Configurar logger global
logger = setup_logger('buyscraper')

# Inicializar componentes globales
robots_checker = RobotsChecker(user_agent=USER_AGENT)
rate_limiter = RateLimiter(requests_per_minute=10, global_delay=1.0)
retry_handler = RetryHandler(max_retries=3, backoff_factor=2.0)


def fetch_html(url: str, timeout: int = 10, respect_robots: bool = True) -> str:
    """
    Obtiene HTML de una URL con todas las protecciones implementadas.
    
    Args:
        url: URL a scrapear
        timeout: Timeout en segundos
        respect_robots: Si True, verifica robots.txt antes de scrapear
    
    Returns:
        HTML content
    
    Raises:
        ValueError: Si robots.txt no permite scrapear
        requests.HTTPError: Si el request falla después de reintentos
    """
    # 1. Verificar robots.txt
    if respect_robots:
        if not robots_checker.can_fetch(url, USER_AGENT):
            error_msg = f"robots.txt disallows scraping {url}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Obtener y respetar Crawl-Delay si existe
        crawl_delay = robots_checker.get_crawl_delay(url, USER_AGENT)
    else:
        crawl_delay = None
    
    # 2. Aplicar rate limiting
    domain = urlparse(url).netloc
    custom_delay = crawl_delay if crawl_delay else None
    rate_limiter.wait_if_needed(domain, custom_delay=custom_delay)
    
    # 3. Realizar request con retry logic
    def _do_request():
        logger.info(f"Fetching {url}")
        headers = {"User-Agent": USER_AGENT}
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        logger.debug(f"Successfully fetched {url} ({len(resp.text)} bytes)")
        return resp.text
    
    try:
        return retry_handler.execute_with_retry(_do_request)
    except Exception as e:
        logger.error(f"Failed to fetch {url} after all retries: {e}")
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


def save_row(path: str, row: dict):
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


def run_from_config(sites_file: str, output: str):
    with open(sites_file, 'r', encoding='utf-8') as f:
        cfg = yaml.safe_load(f)
    for site in cfg.get('sites', []):
        url = site.get('url')
        selector = site.get('price_selector')
        product = site.get('product', '')
        currency = site.get('currency', '')
        name_selector = site.get('name_selector')
        if not url or not selector:
            logger.warning(f"Skipping site missing url/selector: {site}")
            continue
        try:
            html = fetch_html(url)
            price, name = extract_price_and_name(html, selector, name_selector)
            now = datetime.datetime.utcnow().isoformat()
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


def run_single(url: str, selector: str, product: str, output: str, name_selector: Optional[str], currency: str):
    html = fetch_html(url)
    price, name = extract_price_and_name(html, selector, name_selector)
    now = datetime.datetime.utcnow().isoformat()
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
    args = parser.parse_args(argv)

    if args.sites:
        run_from_config(args.sites, args.output)
    elif args.url and args.selector:
        run_single(args.url, args.selector, args.product or '', args.output, args.name_selector, args.currency or '')
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
