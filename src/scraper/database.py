"""
Módulo de persistencia usando SQLite para BuyScraper.
Maneja almacenamiento eficiente de precios y consultas históricas.
"""

import sqlite3
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
from contextlib import contextmanager
from datetime import datetime

logger = logging.getLogger('buyscraper.db')

DEFAULT_DB_PATH = 'data/prices.db'

@contextmanager
def get_db_connection(db_path: str = DEFAULT_DB_PATH):
    """Context manager para conexión a base de datos."""
    # Asegurar que el directorio existe
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Para acceder a columnas por nombre
    try:
        yield conn
    finally:
        conn.close()

def init_db(db_path: str = DEFAULT_DB_PATH):
    """Inicializa la base de datos con el esquema necesario."""
    schema = """
    CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        site TEXT NOT NULL,
        product TEXT NOT NULL,
        price REAL,
        currency TEXT,
        url TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Índices para optimizar consultas comunes
    CREATE INDEX IF NOT EXISTS idx_timestamp ON prices(timestamp);
    CREATE INDEX IF NOT EXISTS idx_product ON prices(product);
    CREATE INDEX IF NOT EXISTS idx_url ON prices(url);
    """
    
    try:
        with get_db_connection(db_path) as conn:
            conn.executescript(schema)
            logger.info(f"Base de datos optimizada e inicializada en: {db_path}")
    except Exception as e:
        logger.error(f"Error inicializando DB: {e}")
        raise

def save_price(row: Dict[str, Any], db_path: str = DEFAULT_DB_PATH):
    """
    Guarda un registro de precio en la base de datos.
    
    Args:
        row: Diccionario con llaves: timestamp, site, product, price, currency, url
        db_path: Ruta a la DB
    """
    query = """
    INSERT INTO prices (timestamp, site, product, price, currency, url)
    VALUES (?, ?, ?, ?, ?, ?)
    """
    
    try:
        with get_db_connection(db_path) as conn:
            conn.execute(query, (
                row['timestamp'],
                row['site'],
                row['product'],
                row['price'],
                row['currency'],
                row['url']
            ))
            conn.commit()
    except Exception as e:
        logger.error(f"Error guardando en DB: {e}")
        raise

def get_price_history(
    product: Optional[str] = None, 
    limit: int = 100, 
    db_path: str = DEFAULT_DB_PATH
) -> List[Dict[str, Any]]:
    """
    Obtiene historial de precios, opcionalmente filtrado por producto.
    """
    query = "SELECT * FROM prices WHERE 1=1"
    params = []
    
    if product:
        query += " AND product LIKE ?"
        params.append(f"%{product}%")
    
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    with get_db_connection(db_path) as conn:
        cursor = conn.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

def get_stats(db_path: str = DEFAULT_DB_PATH) -> Dict[str, Any]:
    """Obtiene estadísticas generales de la base de datos."""
    stats = {}
    with get_db_connection(db_path) as conn:
        stats['total_records'] = conn.execute("SELECT COUNT(*) FROM prices").fetchone()[0]
        stats['products'] = conn.execute("SELECT COUNT(DISTINCT product) FROM prices").fetchone()[0]
        stats['sites'] = conn.execute("SELECT COUNT(DISTINCT site) FROM prices").fetchone()[0]
        
        last_update = conn.execute("SELECT MAX(timestamp) FROM prices").fetchone()[0]
        stats['last_update'] = last_update
        
    return stats
