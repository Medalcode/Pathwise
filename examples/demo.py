#!/usr/bin/env python3
"""
Demo script mostrando las nuevas funcionalidades de BuyScraper v2.0

Este script demuestra:
1. Sistema de logging
2. Verificación de robots.txt
3. Rate limiting
4. Retry logic
5. Integración completa
"""

import sys
import time
from pathlib import Path

# Agregar src al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.scraper import setup_logger, RobotsChecker, RateLimiter, RetryHandler
from src.scraper.scrape import fetch_html, parse_price, extract_price_and_name


def demo_logging():
    """Demuestra el sistema de logging"""
    print("\n" + "="*70)
    print("DEMO 1: Sistema de Logging")
    print("="*70)
    
    logger = setup_logger('demo', log_file='demo.log', log_dir='logs')
    
    logger.debug("Este es un mensaje DEBUG (solo en archivo)")
    logger.info("Este es un mensaje INFO (consola y archivo)")
    logger.warning("Este es un WARNING (consola y archivo)")
    logger.error("Este es un ERROR (consola y archivo)")
    
    print(f"\n✅ Logs guardados en: logs/demo.log")
    print("💡 DEBUG solo va al archivo, INFO+ va a consola y archivo")


def demo_robots_checker():
    """Demuestra verificación de robots.txt"""
    print("\n" + "="*70)
    print("DEMO 2: Verificación de robots.txt")
    print("="*70)
    
    checker = RobotsChecker(user_agent="BuyScraper/2.0")
    
    # Sitios de prueba
    test_urls = [
        "https://www.google.com/search",  # Probablemente disallowed para scrapers
        "https://en.wikipedia.org/wiki/Web_scraping",  # Generalmente permitido
        "https://httpbin.org/html",  # Test API, sin robots.txt
    ]
    
    for url in test_urls:
        can_fetch = checker.can_fetch(url)
        status = "✅ PERMITIDO" if can_fetch else "❌ BLOQUEADO"
        print(f"{status}: {url}")
        
        crawl_delay = checker.get_crawl_delay(url)
        if crawl_delay:
            print(f"  → Crawl-Delay: {crawl_delay}s")
    
    print("\n💡 robots.txt se verifica automáticamente en fetch_html()")


def demo_rate_limiter():
    """Demuestra rate limiting"""
    print("\n" + "="*70)
    print("DEMO 3: Rate Limiting")
    print("="*70)
    
    limiter = RateLimiter(requests_per_minute=30, global_delay=0.5)
    
    print("Simulando 3 requests a example.com...")
    
    for i in range(3):
        start = time.time()
        limiter.wait_if_needed('example.com')
        elapsed = time.time() - start
        
        print(f"  Request {i+1}: esperó {elapsed:.2f}s")
    
    # Stats
    stats = limiter.get_stats('example.com')
    print(f"\n📊 Estadísticas de example.com:")
    print(f"  - Último request: {stats['elapsed_seconds']:.2f}s atrás")
    print(f"  - Puede hacer request ahora: {stats['can_request_now']}")
    
    global_stats = limiter.get_stats()
    print(f"\n📊 Estadísticas globales:")
    print(f"  - Requests por minuto: {global_stats['requests_per_minute']}")
    print(f"  - Dominios trackeados: {global_stats['domains_tracked']}")
    
    print("\n💡 Rate limiting se aplica automáticamente en fetch_html()")


def demo_retry_handler():
    """Demuestra retry logic"""
    print("\n" + "="*70)
    print("DEMO 4: Retry Logic con Backoff Exponencial")
    print("="*70)
    
    from src.scraper.retry import with_retry
    import requests
    
    # Función que falla las primeras 2 veces
    attempt_count = [0]
    
    @with_retry(max_retries=3, backoff_factor=1.5, initial_delay=0.5)
    def flaky_function():
        attempt_count[0] += 1
        print(f"  Intento {attempt_count[0]}")
        
        if attempt_count[0] < 3:
            raise requests.exceptions.ConnectionError("Simulated connection error")
        
        return "¡Éxito!"
    
    try:
        result = flaky_function()
        print(f"\n✅ Resultado: {result}")
        print(f"💡 Tomó {attempt_count[0]} intentos (con backoff exponencial)")
    except Exception as e:
        print(f"❌ Falló después de todos los reintentos: {e}")
    
    print("\n💡 Retry logic se aplica automáticamente en fetch_html()")


def demo_integrated_fetch():
    """Demuestra fetch_html con todas las protecciones"""
    print("\n" + "="*70)
    print("DEMO 5: fetch_html() Integrado (TODAS las protecciones)")
    print("="*70)
    
    logger = setup_logger('integrated_demo', console_level=20)  # INFO
    
    # URL de prueba que no bloquea scrapers
    test_url = "https://httpbin.org/html"
    
    print(f"\nFetching: {test_url}")
    print("\nEsta llamada incluye automáticamente:")
    print("  1. ✅ Verificación de robots.txt")
    print("  2. ✅ Rate limiting")
    print("  3. ✅ Retry logic con backoff")
    print("  4. ✅ Logging completo")
    print("\nEjecutando...\n")
    
    try:
        html = fetch_html(test_url)
        print(f"\n✅ Éxito! HTML recibido: {len(html)} bytes")
        
        # Mostrar primeras líneas
        lines = html.split('\n')[:5]
        print("\nPrimeras líneas del HTML:")
        for line in lines:
            print(f"  {line[:70]}...")
    
    except ValueError as e:
        print(f"❌ Bloqueado por robots.txt: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")


def demo_price_parsing():
    """Demuestra parsing de precios (feature existente)"""
    print("\n" + "="*70)
    print("DEMO 6: Parsing Robusto de Precios (Feature Existente)")
    print("="*70)
    
    test_prices = [
        "1999",
        "$1,234.56",
        "$ 12.345,67",
        "€ 1.999,99",
        "sin precio",
        "Price: 45.50",
    ]
    
    for price_text in test_prices:
        parsed = parse_price(price_text)
        result = f"{parsed:.2f}" if parsed is not None else "None"
        print(f"  '{price_text}' → {result}")
    
    print("\n💡 Soporta formatos US ($1,234.56) y EU (1.234,56€)")


def main():
    """Ejecuta todas las demos"""
    print("\n" + "🎯"*35)
    print("  BUYSCRAPER v2.0 - DEMOS DE NUEVAS FUNCIONALIDADES")
    print("🎯"*35)
    
    try:
        demo_logging()
        demo_robots_checker()
        demo_rate_limiter()
        demo_retry_handler()
        demo_integrated_fetch()
        demo_price_parsing()
        
        print("\n" + "="*70)
        print("✅ TODAS LAS DEMOS COMPLETADAS")
        print("="*70)
        print("\n📚 Para más información, ver:")
        print("  - README.md (documentación completa)")
        print("  - SPRINT1_COMPLETE.md (resumen de mejoras)")
        print("  - logs/demo.log (logs generados)")
        print("\n🚀 BuyScraper v2.0 está listo para producción!")
        print("")
        
    except Exception as e:
        print(f"\n❌ Error en demo: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
