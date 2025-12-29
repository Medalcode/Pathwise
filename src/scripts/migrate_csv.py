#!/usr/bin/env python3
"""
Script de migración: Importa datos desde CSV a SQLite.
Uso: python src/scripts/migrate_csv.py [archivo_csv]
"""

import sys
import csv
import logging
from pathlib import Path

# Agregar raíz del proyecto al path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.scraper.database import init_db, save_price, get_stats
from src.scraper.scrape import parse_price

# Configurar logger simple para el script
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('migrate')

def migrate(csv_path: str, db_path: str = 'data/prices.db'):
    logger.info(f"Iniciando migración desde {csv_path} a {db_path}")
    
    if not Path(csv_path).exists():
        logger.error(f"Archivo CSV no encontrado: {csv_path}")
        return

    # Asegurar DB inicializada
    init_db(db_path)
    
    count = 0
    errors = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                # Normalizar precio
                price_val = row.get('price', '')
                try:
                    price = float(price_val) if price_val else None
                except ValueError:
                    price = None
                
                db_row = {
                    'timestamp': row['timestamp'],
                    'site': row.get('site', ''),
                    'product': row['product'],
                    'price': price,
                    'currency': row.get('currency', ''),
                    'url': row.get('url', row.get('site', '')) # Fallback a site si url falta
                }
                
                save_price(db_row, db_path)
                count += 1
                if count % 100 == 0:
                    logger.info(f"Procesados {count} registros...")
                    
            except Exception as e:
                logger.error(f"Error migrando fila {row}: {e}")
                errors += 1
    
    stats = get_stats(db_path)
    logger.info("Migración completada.")
    logger.info(f"Registros procesados: {count}")
    logger.info(f"Errores: {errors}")
    logger.info(f"Estado final DB: {stats}")

if __name__ == '__main__':
    csv_file = sys.argv[1] if len(sys.argv) > 1 else 'data/prices.csv'
    migrate(csv_file)
