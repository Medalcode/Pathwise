"""
Módulo de Exportación y Reportes - Panoptes.
Transforma datos crudos en entregables de valor (Excel).
"""

import pandas as pd
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict

logger = logging.getLogger('panoptes.exporter')

def save_to_excel(data: List[Dict], filename: str = None, sheet_name: str = "Datos Extraídos"):
    """
    Guarda una lista de diccionarios en un archivo Excel formateado.
    
    Args:
        data: Lista de diccionarios con los datos.
        filename: Ruta de salida. Si es None, genera uno con timestamp.
        sheet_name: Nombre de la hoja en Excel.
    """
    if not data:
        logger.warning("No hay datos para exportar a Excel.")
        return

    try:
        # 1. Crear DataFrame
        df = pd.DataFrame(data)
        
        # 2. Reordenar columnas para legibilidad (si existen)
        cols_order = ['timestamp', 'product', 'price', 'currency', 'site', 'url']
        # Intersección para evitar errores si faltan columnas
        cols = [c for c in cols_order if c in df.columns] + [c for c in df.columns if c not in cols_order]
        df = df[cols]

        # 3. Generar nombre de archivo si no existe
        if not filename:
            date_str = datetime.now().strftime("%Y-%m-%d_%H%M")
            # Crear directorio de reportes
            Path("reports").mkdir(exist_ok=True)
            filename = f"reports/Panoptes_Report_{date_str}.xlsx"

        # 4. Guardar con Pandas (usando engine openpyxl)
        # index=False quita la columna de números de fila (0, 1, 2...)
        df.to_excel(filename, index=False, sheet_name=sheet_name)
        
        logger.info(f"📊 Reporte Excel generado exitosamente: {filename}")
        return filename

    except Exception as e:
        logger.error(f"Error generando Excel: {e}")
        raise
