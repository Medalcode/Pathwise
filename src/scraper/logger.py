"""
Sistema de logging centralizado para BuyScraper.

Proporciona configuración de logging con múltiples handlers:
- Console output (INFO y superior)
- File output con rotación automática (DEBUG y superior)
- Formato consistente con timestamps
"""

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional


def setup_logger(
    name: str = 'buyscraper',
    log_file: Optional[str] = None,
    console_level: int = logging.INFO,
    file_level: int = logging.DEBUG,
    log_dir: str = 'logs'
) -> logging.Logger:
    """
    Configura y retorna un logger con handlers de consola y archivo.
    
    Args:
        name: Nombre del logger
        log_file: Nombre del archivo de log (None = nombre basado en timestamp)
        console_level: Nivel de logging para consola (default: INFO)
        file_level: Nivel de logging para archivo (default: DEBUG)
        log_dir: Directorio donde guardar logs
    
    Returns:
        Logger configurado
    
    Example:
        >>> logger = setup_logger('buyscraper')
        >>> logger.info("Iniciando scraping")
        >>> logger.debug("Detalles técnicos del proceso")
        >>> logger.error("Error al procesar URL")
    """
    logger = logging.getLogger(name)
    
    # Si ya está configurado, retornar
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.DEBUG)
    
    # Formato de log
    log_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(console_level)
    console_handler.setFormatter(log_format)
    logger.addHandler(console_handler)
    
    # File Handler (con rotación)
    if log_file is None:
        from datetime import datetime
        log_file = f"scraper_{datetime.now().strftime('%Y%m%d')}.log"
    
    # Crear directorio de logs si no existe
    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)
    
    file_handler = RotatingFileHandler(
        log_path / log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(file_level)
    file_handler.setFormatter(log_format)
    logger.addHandler(file_handler)
    
    logger.info(f"Logger '{name}' configurado correctamente")
    logger.debug(f"Log file: {log_path / log_file}")
    
    return logger


def get_logger(name: str = 'buyscraper') -> logging.Logger:
    """
    Obtiene un logger existente o crea uno nuevo si no existe.
    
    Args:
        name: Nombre del logger
    
    Returns:
        Logger instance
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        return setup_logger(name)
    return logger
