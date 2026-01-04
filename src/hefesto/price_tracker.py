import time
import logging
import re
from datetime import datetime
from .adb_wrapper import ADBWrapper
from .inspector import UIInspector
from src.reporting.exporter import save_to_excel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('hefesto.tracker')

def clean_price(price_text: str) -> float:
    """Limpia el texto del precio (ej: '$ 1.299.999' -> 1299999.0)"""
    try:
        # Remover símbolos de moneda y separadores de miles (asumimos formato latino/europeo o US)
        # Estrategia simple: dejar solo digitos y punto decimal si existe
        # Caso ARS/CLP: 1.299.999 (sin decimales usualmente) -> eliminar puntos
        clean = re.sub(r'[^\d]', '', price_text)
        return float(clean)
    except:
        return 0.0

def run_mobile_tracker():
    """
    Flujo:
    1. Abrir producto en navegador móvil.
    2. Esperar carga.
    3. Leer pantalla.
    4. Extraer precio usando Regex.
    5. Guardar en Excel.
    """
    bot = ADBWrapper()
    if not bot.device_id:
        return

    # Producto Demo: iPhone 15 en MercadoLibre Argentina
    # Usamos una búsqueda directa para asegurar que sea una página de producto o listado
    product_url = "https://articulo.mercadolibre.com.ar/MLA-1419356063-apple-iphone-15-128-gb-dual-esim-negro-distribuidor-autorizado-_JM"
    product_name = "iPhone 15 128GB"
    
    logger.info(f"📱 Iniciando rastreo móvil para: {product_name}")
    
    # 1. Navegar
    bot.open_url(product_url)
    logger.info("Esperando carga de página (8s)...")
    time.sleep(8) # Dar tiempo extra para carga de JS y assets
    
    # 2. Dump UI
    logger.info("📸 Analizando vista actual...")
    xml_path = bot.dump_hierarchy()
    inspector = UIInspector(xml_path)
    
    # 3. Buscar Precio (Estrategia Mejorada)
    # Regex para formatos: 1.250.000 / 1,250,000 / 1250000
    # Evita fechas (2025) y specs simples (128) pidiendo longitud mínima o puntos
    regex_price = r"[\d]{1,3}(?:[.,]\d{3})+"
    
    candidates = inspector.find_all_nodes_by_regex(regex_price)
    
    price_val = 0.0
    found_text = ""
    
    if candidates:
        logger.info(f"🔎 Encontrados {len(candidates)} candidatos de precio.")
        best_candidate = None
        max_price = 0.0
        
        for cand in candidates:
            txt = cand['text'] or cand['content_desc']
            val = clean_price(txt)
            logger.info(f"   - Candidato: '{txt}' -> {val}")
            
            # Heurística: El precio de un iPhone 15 debe ser alto (> 100000 ARS)
            # y queremos el valor más alto visible (a menos que haya descuentos mostrando precio anterior)
            # Pero cuidado con precios tachados.
            # Por ahora, tomamos el valor válido más alto encontrado como 'Precio Detectado'
            if val > 100000 and val > max_price:
                max_price = val
                best_candidate = cand
        
        if best_candidate:
            price_val = max_price
            found_text = best_candidate['text'] or best_candidate['content_desc']
            logger.info(f"🎯 Ganador: '{found_text}'")
    
    if price_val == 0.0:
        logger.warning("Ampliando búsqueda a números simples...")
        # Fallback: buscar cualquier número grande sin puntos
        candidates_simple = inspector.find_all_nodes_by_regex(r"\d{4,}")
        for cand in candidates_simple:
             val = clean_price(cand['text'] or cand['content_desc'])
             if val > 100000: # Filtro de ruido
                 price_val = val
                 found_text = cand['text'] or cand['content_desc']
                 break

    logger.info(f"🏷️ Precio extraído: {price_val}")
    
    # 4. Guardar Reporte
    data = [{
        'timestamp': datetime.now().isoformat(),
        'site': 'MercadoLibre Mobile',
        'product': product_name,
        'price': price_val,
        'currency': 'ARS', # Asumido por dominio .com.ar
        'url': product_url,
        'raw_text': found_text
    }]
    
    report_path = save_to_excel(data, sheet_name="Mobile Scraping")
    logger.info(f"✅ Misión Cumplida. Reporte guardado en: {report_path}")

if __name__ == "__main__":
    run_mobile_tracker()
