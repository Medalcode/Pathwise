#!/usr/bin/env python3
"""
Panoptes CLI v3.
Herramienta de Inteligencia Competitiva y Scraping.
Traduce argumentos a Recetas y orquesta la extracción.
"""

import sys
import yaml
import argparse
import logging
from typing import Optional, List

# Importar Motor y Componentes
from .engine import engine
from .models import ScrapeRecipe, SelectorConfig, SelectorType
from .recipes import load_recipe
from .logger import setup_logger
from src.reporting.exporter import save_to_excel

# Configurar logger
logger = setup_logger('panoptes')

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

def run_single(url: str, selector: str, product_name: str, name_selector: Optional[str] = None, currency: str = "USD", dynamic: bool = False, export_excel: bool = False):
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
        
        # 4. Exportar a Excel (Reporte Data-as-a-Service)
        if export_excel:
            data_dict = {
                'timestamp': result.timestamp,
                'site': result.site,
                'product': result.product_title,
                'price': float(result.price) if result.price else None,
                'currency': result.currency,
                'url': str(result.url)
            }
            save_to_excel([data_dict])
        
    except Exception as e:
        logger.error(f"❌ FALLO: {e}")
        sys.exit(1)

def run_from_config(config_path: str, export_excel: bool = False):
    """Ejecuta scraping basado en archivo YAML legacy de sitios."""
    # Nota: Esto mantiene soporte para el formato viejo de 'sites.yaml'
    try:
        with open(config_path, 'r') as f:
            data = yaml.safe_load(f)
            
        sites = data.get('sites', [])
        logger.info(f"Procesando {len(sites)} sitios desde configuración legacy...")
        
        success_count = 0
        collected_data = [] # Para reporte Excel
        
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
                if res.product_title == 'Unknown Product':
                     logger.warning(f"  Nombre no encontrado, usando fallback: {product_fallback}")
                     res.product_title = product_fallback

                logger.info(f"  Saved: {res.url} -> {res.price}")
                success_count += 1
                
                if export_excel:
                    collected_data.append({
                        'timestamp': res.timestamp,
                        'site': res.site,
                        'product': res.product_title,
                        'price': float(res.price) if res.price else None,
                        'currency': res.currency,
                        'url': str(res.url)
                    })
                
            except Exception as e:
                logger.error(f"  Error en {site.get('url')}: {e}")
                
        logger.info(f"Lote completado. Éxitos: {success_count}/{len(sites)}")

        if export_excel and collected_data:
            save_to_excel(collected_data)

    except Exception as e:
        logger.error(f"Error procesando archivo config: {e}")
        sys.exit(1)

def main():
    """CLI Entrypoint compatible V3 via Panoptes."""
    parser = argparse.ArgumentParser(description="Panoptes V3 CLI - Intelligent Scraping")
    
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
    
    # Argumentos de reporte
    parser.add_argument('--excel', action='store_true', help='Generar reporte Excel (.xlsx) automáticamente')

    
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
            dynamic=args.dynamic,
            export_excel=args.excel
        )
        
    elif args.sites:
        run_from_config(args.sites, export_excel=args.excel)
        
    elif args.recipe:
        # Modo nativo V3
        logger.info(f"Cargando receta V3: {args.recipe}")
        recipe = load_recipe(args.recipe)
        logger.warning("El modo --recipe directo requiere integración con orquestador. Usando CLI como prueba.")
        logger.info("Por favor usa --url con una Receta en la version V3.1 del CLI.")

if __name__ == '__main__':
    main()
