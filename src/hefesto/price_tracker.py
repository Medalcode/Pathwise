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
    
    # DEBUG: Imprimir todo lo que ve para entender la estructura
    logger.info("--- DUMP DE VISTA (Primeros 50 nodos de texto) ---")
    count = 0
    for node in inspector.root.iter('node'):
        txt = node.attrib.get('text', '') or node.attrib.get('content-desc', '')
        if txt and len(txt) > 2: # Ignorar cositas chicas
            logger.info(f"[{count}] Text: '{txt}' | ID: {node.attrib.get('resource-id', 'N/A')}")
            count += 1
            if count > 50: break
    logger.info("------------------------------------------------")

    # 3. Buscar Precio (Estrategia Accesibilidad: "X pesos con Y centavos")
    # Capturamos "658424 pesos"
    regex_accessible = r"(\d+)\s+pesos"
    
    candidates = inspector.find_all_nodes_by_regex(regex_accessible)
    
    price_val = 0.0
    found_text = ""
    
    if candidates:
        logger.info(f"🔎 Encontrados {len(candidates)} nodos de accesibilidad 'pesos'.")
        
        # Tomamos el primer candidato válido (usualmente el precio principal aparece primero o cerca del botón comprar)
        for cand in candidates:
            txt = cand['text'] or cand['content_desc']
            match = re.search(regex_accessible, txt, re.IGNORECASE)
            if match:
                val_str = match.group(1)
                val = float(val_str)
                logger.info(f"   - Candidato: '{txt}' -> {val}")
                
                # Descartar precios ridículamente bajos (ej: "0 pesos")
                if val > 1000: 
                    price_val = val
                    found_text = txt
                    break # Encontramos el precio principal
    
    if price_val == 0.0:
        logger.warning("⚠️ Falló patrón 'pesos'. Probando métodos antiguos...")
        # Fallback 1: Regex numérico clásico ($ 1.250.000)
        regex_price = r"\$\s?[\d]{1,3}(?:[.,]\d{3})+"
        candidates_v2 = inspector.find_all_nodes_by_regex(regex_price)
        # (Lógica simplificada para fallback)
        for cand in candidates_v2: 
            val = clean_price(cand['text'])
            if val > 100000: 
                price_val = val 
                break

    logger.info(f"🏷️ Precio FINAL extraído: {price_val}")
    
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
