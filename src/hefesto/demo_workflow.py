import time
import logging
from .adb_wrapper import ADBWrapper
from .inspector import UIInspector

# Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('hefesto.demo')

def run_demo_search():
    bot = ADBWrapper()
    if not bot.device_id:
        return

    logger.info("🚀 Iniciando Demo Hefesto: Búsqueda en MercadoLibre")

    # 1. Abrir App (Intent explícito para abrir la web en Chrome/Browser si no tenemos la app instalada, 
    # o podríamos intentar lanzar la app de ML si supiéramos el package. 
    # Por seguridad, abrimos navegador a la web mobile).
    target_url = "https://www.mercadolibre.com.ar"
    logger.info(f"Navegando a {target_url}...")
    bot.open_url(target_url)
    
    # Esperar carga
    time.sleep(5)

    # 2. Analizar donde estamos
    logger.info("Analizando pantalla...")
    xml_path = bot.dump_hierarchy()
    inspector = UIInspector(xml_path)

    # 3. Buscar barra de búsqueda (heurística: buscar nodo con texto 'buscar' o clase edit)
    # Nota: En web mobile, esto depende de que los inputs tengan accesibilidad. 
    # Si no, usamos coordenadas fijas o OCR en el futuro.
    search_node = inspector.find_node_by_text("buscar", partial=True)
    
    if search_node:
        logger.info(f"🔍 Barra de búsqueda encontrada en: {search_node['center_x']}, {search_node['center_y']}")
        
        # Click
        bot.tap(search_node['center_x'], search_node['center_y'])
        time.sleep(1)
        
        # Escribir
        bot.text("PlayStation 5")
        bot.key_event(66) # ENTER
        
        logger.info("✅ Búsqueda enviada.")
    else:
        logger.warning("⚠️ No se encontró la barra de búsqueda por texto. Se intentará coordenada genérica (top screen).")
        # Fallback para demo
        # bot.tap(500, 200) 

if __name__ == "__main__":
    run_demo_search()
