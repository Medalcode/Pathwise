#!/usr/bin/env python3
"""
BuyScraper CLI (Compatibility Layer).
Punto de entrada para la línea de comandos. 
Traduce argumentos a Recetas V3 y usa el nuevo ScraperEngine.
"""

import sys
import yaml
import argparse
import logging
from typing import Optional

# Importar Motor V3 y Modelos
from .engine import engine
from .models import ScrapeRecipe, SelectorConfig, SelectorType
from .recipes import load_recipe
from .logger import setup_logger

# Configurar logger (necesario para ver output en CLI)
logger = setup_logger('buyscraper')

def create_ad_hoc_recipe(domain: str, selector: str, name_selector: Optional[str] = None, dynamic: bool = False) -> ScrapeRecipe:
    """Crea una receta temporal para ejecuciones de una sola vez."""
    selectors = {
        "price": SelectorConfig(type=SelectorType.CSS, value=selector)
    }
    
    if name_selector:
        selectors["product_title"] = SelectorConfig(type=SelectorType.CSS, value=name_selector)
        
    return ScrapeRecipe(
        domain=domain,
        selectors=selectors,
        meta={"dynamic": dynamic, "ad_hoc": True}
    )

def run_single(url: str, selector: str, product_name: str, name_selector: Optional[str] = None, currency: str = "USD", dynamic: bool = False):
    """Ejecuta scraping para una URL única usando el Engine V3."""
    try:
        # 1. Crear Receta al vuelo
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        
        recipe = create_ad_hoc_recipe(domain, selector, name_selector, dynamic)
        
        # 2. Ejecutar Engine
        logger.info(f"Iniciando scraping V3 para: {url}")
        
        # Hack de compatibilidad: pasar product_name si no se encuentra en la página
        result = engine.process(recipe, override_url=url)
        
        # Si el selector de nombre falló o no existe, usar el fallback
        if result.product_title == 'Unknown Product' and product_name:
            result.product_title = product_name

        # 3. Output
        logger.info(f"✅ ÉXITO: {result.product_title} -> {result.price} {result.currency}")
        
    except Exception as e:
        logger.error(f"❌ FALLO: {e}")
        sys.exit(1)

def run_from_config(config_path: str):
    """Ejecuta scraping basado en archivo YAML legacy de sitios."""
    # Nota: Esto mantiene soporte para el formato viejo de 'sites.yaml'
    try:
        with open(config_path, 'r') as f:
            data = yaml.safe_load(f)
            
        sites = data.get('sites', [])
        logger.info(f"Procesando {len(sites)} sitios desde configuración legacy...")
        
        success_count = 0
        for site in sites:
            try:
                url = site['url']
                selector = site['price_selector']
                dynamic = site.get('dynamic', False)
                name_selector = site.get('name_selector')
                product_fallback = site.get('product', '')
                
                # Adaptar a receta
                from urllib.parse import urlparse
                domain = urlparse(url).netloc
                recipe = create_ad_hoc_recipe(domain, selector, name_selector, dynamic)
                
                # Ejecutar
                res = engine.process(recipe, override_url=url)
                
                # Fallback de nombre si es necesario
                # Nota: engine.process ya guarda en DB, así que esto es solo para log
                if res.product_title == 'Unknown Product':
                     logger.warning(f"  Nombre no encontrado, usando fallback: {product_fallback}")

                logger.info(f"  Saved: {res.url} -> {res.price}")
                success_count += 1
                
            except Exception as e:
                logger.error(f"  Error en {site.get('url')}: {e}")
                
        logger.info(f"Lote completado. Éxitos: {success_count}/{len(sites)}")

    except Exception as e:
        logger.error(f"Error procesando archivo config: {e}")
        sys.exit(1)

def main():
    """CLI Entrypoint compatible V3."""
    parser = argparse.ArgumentParser(description="BuyScraper V3 CLI")
    
    # Modos de operación (mutuamente exclusivos)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--url', help='URL única a scrapear')
    group.add_argument('--sites', help='Archivo YAML de sitios (formato legacy)')
    group.add_argument('--recipe', help='Archivo de Receta YAML (Nuevo formato V3)')
    
    # Argumentos para modo --url
    parser.add_argument('--selector', help='Selector CSS del precio (Requerido con --url)')
    parser.add_argument('--name-selector', help='Selector CSS del nombre')
    parser.add_argument('--product', help='Nombre manual del producto (fallback)')
    parser.add_argument('--dynamic', action='store_true', help='Usar navegador real (Playwright)')
    
    # Argumentos legacy ignorados o adaptados
    parser.add_argument('--currency', help='Moneda (Default: USD)')
    parser.add_argument('--output', help='Ignorado en V3 (siempre guarda en DB/CSV)', default='ignored')
    
    args = parser.parse_args()

    if args.url:
        if not args.selector:
            parser.error("--selector es requerido cuando se usa --url")
        run_single(
            args.url, 
            args.selector, 
            args.product or "Unknown", 
            args.name_selector,
            dynamic=args.dynamic
        )
        
    elif args.sites:
        run_from_config(args.sites)
        
    elif args.recipe:
        # Modo nativo V3
        logger.info(f"Cargando receta V3: {args.recipe}")
        recipe = load_recipe(args.recipe)
        logger.warning("El modo --recipe directo requiere integración con orquestador. Usando CLI como prueba.")
        # Aquí podríamos pedir una URL para probar la receta
        logger.info("Por favor usa --url con una Receta en la version V3.1 del CLI.")

if __name__ == '__main__':
    main()
