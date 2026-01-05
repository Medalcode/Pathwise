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
    Recorre la lista de objetivos configurada en mobile_targets.yaml (o remota de Hestia).
    """
    import yaml
    
    targets = []
    
    # 1. Intentar Cargar Config Remota (Hestia Brain)
    remote_config = zeus.get_config("mobile_targets")
    if remote_config:
        logger.info("🧠 Configuración descargada desde Hestia!")
        targets = remote_config
    else:
        # Fallback local
        logger.info("⚠️ Hestia offline o sin config. Usando respaldo local.")
        try:
            with open("config/mobile_targets.yaml", "r") as f:
                config = yaml.safe_load(f)
                targets = config.get('targets', [])
        except FileNotFoundError:
            targets = []

    if not targets:
        zeus.log("Hefesto: Lista de objetivos vacía.", "WARNING")
        return

    bot = ADBWrapper()
    if not bot.device_id:
        zeus.log("Hefesto no detectó dispositivo móvil.", "ERROR")
        return

    collected_data = []

    zeus.log(f"🚀 Hefesto Lanzado: {len(targets)} objetivos en cola.", "INFO")
    
    for item in targets:
        product_name = item['name']
        url = item['url']
        
        logger.info(f"📱 Procesando: {product_name}...")
        
        # 1. Navegar
        bot.open_url(url)
        time.sleep(10) # Wait for load
        
        # 2. Dump UI
        xml_path = bot.dump_hierarchy()
        inspector = UIInspector(xml_path)
        
        # 3. Buscar Precio
        regex_accessible = r"(\d+)\s+pesos"
        candidates = inspector.find_all_nodes_by_regex(regex_accessible)
        
        price_val = 0.0
        found_text = ""
        
        if candidates:
            for cand in candidates:
                txt = cand['text'] or cand['content_desc']
                match = re.search(regex_accessible, txt, re.IGNORECASE)
                if match:
                    val = float(match.group(1))
                    if val > 1000: 
                        price_val = val
                        found_text = txt
                        break 
        
        if price_val == 0.0:
            regex_price = r"\$\s?[\d]{1,3}(?:[.,]\d{3})+"
            cands_v2 = inspector.find_all_nodes_by_regex(regex_price)
            for cand in cands_v2:
                 val = clean_price(cand['text'])
                 if val > 10000: 
                     price_val = val 
                     found_text = cand['text']
                     break

        # Guardar en memoria local
        collected_data.append({
            'timestamp': datetime.now().isoformat(),
            'site': 'MercadoLibre Mobile',
            'product': product_name,
            'price': price_val,
            'currency': 'ARS',
            'url': url,
            'raw_text': found_text
        })
        
        # Reportar a Hestia (Dashboard)
        if price_val > 0:
            zeus.reportar_hallazgo(product_name, price_val, "MercadoLibre Mobile")
            logger.info(f"✅ Reportado: {product_name} -> ${price_val:,.2f}")
        else:
            zeus.log(f"Hefesto falló en obtener precio de: {product_name}", "WARNING")

        time.sleep(2)

    # 4. Guardar Reporte Final Local
    report_path = save_to_excel(collected_data, sheet_name="Mobile Batch")
    zeus.log(f"Hefesto: Ronda finalizada. Reporte Excel guardado.", "INFO")

if __name__ == "__main__":
    run_batch_tracker()
