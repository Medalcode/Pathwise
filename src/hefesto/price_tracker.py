import time
import logging
import re
from datetime import datetime
from .adb_wrapper import ADBWrapper
from .inspector import UIInspector
from src.reporting.exporter import save_to_excel
from src.panteon import Panteon

# Setup logging & Panteon
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('hefesto.tracker')

# Inicializar conexión con el Panteón (Cerebro Central)
# Intentará buscar 'hestia.db' localmente o conectarse a localhost:5000
zeus = Panteon("Hefesto")

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

def run_batch_tracker():
    """
    Recorre la lista de objetivos configurada en mobile_targets.yaml
    """
    import yaml
    
    # Cargar Config
    try:
        with open("config/mobile_targets.yaml", "r") as f:
            config = yaml.safe_load(f)
            targets = config.get('targets', [])
    except FileNotFoundError:
        logger.error("No se encontró config/mobile_targets.yaml. Creando demo.")
        targets = []
    
    if not targets:
        logger.warning("Lista de objetivos vacía.")
        return

    bot = ADBWrapper()
    if not bot.device_id:
        zeus.log("Hefesto no detectó dispositivo móvil.", "ERROR")
        return

    collected_data = []

    logger.info(f"🚀 Iniciando Misión Hefesto: {len(targets)} objetivos.")
    
    for item in targets:
        product_name = item['name']
        url = item['url']
        
        logger.info(f"📱 Procesando: {product_name}...")
        
        # 1. Navegar
        bot.open_url(url)
        # Random sleep para parecer humano (8-12 seg)
        wait_time = 10
        time.sleep(wait_time)
        
        # 2. Dump UI
        xml_path = bot.dump_hierarchy()
        inspector = UIInspector(xml_path)
        
        # 3. Buscar Precio (Lógica Accesibilidad)
        regex_accessible = r"(\d+)\s+pesos"
        candidates = inspector.find_all_nodes_by_regex(regex_accessible)
        
        price_val = 0.0
        found_text = ""
        
        if candidates:
            # Tomamos el primer candidato válido > 1000
            for cand in candidates:
                txt = cand['text'] or cand['content_desc']
                match = re.search(regex_accessible, txt, re.IGNORECASE)
                if match:
                    val = float(match.group(1))
                    if val > 1000: 
                        price_val = val
                        found_text = txt
                        break 
        
        # Fallback simple para listados (donde a veces el precio está visible sin la palabra 'pesos' pero con $)
        if price_val == 0.0:
            regex_price = r"\$\s?[\d]{1,3}(?:[.,]\d{3})+"
            cands_v2 = inspector.find_all_nodes_by_regex(regex_price)
            for cand in cands_v2:
                 val = clean_price(cand['text'])
                 if val > 10000: # Umbral más bajo para fallback
                     price_val = val 
                     found_text = cand['text']
                     break

        result_status = "SUCCESS" if price_val > 0 else "FAILED"
        logger.info(f"   Resultado: {result_status} -> {price_val}")
        
        # Guardar en memoria
        collected_data.append({
            'timestamp': datetime.now().isoformat(),
            'site': 'MercadoLibre Mobile',
            'product': product_name,
            'price': price_val,
            'currency': 'ARS',
            'url': url,
            'raw_text': found_text
        })
        
        # Reportar unitariamente a Hestia
        if price_val > 0:
            zeus.log(f"Hefesto extrajo: {product_name} -> ${price_val:,.2f}", "SUCCESS")
        else:
            zeus.log(f"Hefesto falló en: {product_name}", "WARNING")

        # Pequeña pausa entre productos
        time.sleep(3)

    # 4. Guardar Reporte Final
    report_path = save_to_excel(collected_data, sheet_name="Mobile Batch")
    logger.info(f"✅ Lote completado. Reporte guardado en: {report_path}")

if __name__ == "__main__":
    run_batch_tracker()
