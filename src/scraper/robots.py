"""
Verificador de robots.txt para cumplimiento ético de web scraping.

Clase que verifica si está permitido scrapear una URL según el archivo robots.txt
del sitio. Incluye cache para evitar requests repetidos al mismo robots.txt.
"""

from urllib.robotparser import RobotFileParser
from urllib.parse import urlparse
from typing import Dict, Optional
import logging


class RobotsChecker:
    """
    Verifica permisos de scraping según robots.txt.
    
    Mantiene un cache de parsers por dominio para evitar requests repetidos.
    """
    
    def __init__(self, user_agent: str = "*"):
        """
        Inicializa el verificador de robots.txt.
        
        Args:
            user_agent: User agent a usar para verificación
        """
        self._parsers: Dict[str, RobotFileParser] = {}
        self.user_agent = user_agent
        self.logger = logging.getLogger('buyscraper.robots')
    
    def can_fetch(self, url: str, user_agent: Optional[str] = None) -> bool:
        """
        Verifica si está permitido scrapear la URL según robots.txt.
        
        Args:
            url: URL completa a verificar
            user_agent: User agent a usar (None = usar default del init)
        
        Returns:
            True si está permitido, False si está bloqueado
        
        Example:
            >>> checker = RobotsChecker()
            >>> if checker.can_fetch('https://example.com/product'):
            ...     # Proceder con scraping
            ...     pass
        """
        if user_agent is None:
            user_agent = self.user_agent
        
        # Parsear URL para obtener base
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        robots_url = f"{base_url}/robots.txt"
        
        # Obtener o crear parser para este dominio
        if base_url not in self._parsers:
            self.logger.debug(f"Fetching robots.txt from {robots_url}")
            rp = RobotFileParser()
            rp.set_url(robots_url)
            
            try:
                rp.read()
                self._parsers[base_url] = rp
                self.logger.info(f"Successfully loaded robots.txt from {base_url}")
            except Exception as e:
                self.logger.warning(
                    f"Could not read robots.txt from {robots_url}: {e}. "
                    f"Assuming scraping is allowed."
                )
                # Si no podemos leer robots.txt, asumimos que está permitido
                # (principio de permisividad)
                return True
        
        # Verificar permiso
        rp = self._parsers[base_url]
        can_fetch = rp.can_fetch(user_agent, url)
        
        if not can_fetch:
            self.logger.warning(f"robots.txt disallows fetching {url} for user-agent '{user_agent}'")
        else:
            self.logger.debug(f"robots.txt allows fetching {url}")
        
        return can_fetch
    
    def get_crawl_delay(self, url: str, user_agent: Optional[str] = None) -> Optional[float]:
        """
        Obtiene el Crawl-Delay especificado en robots.txt para el dominio.
        
        Args:
            url: URL del sitio
            user_agent: User agent a verificar
        
        Returns:
            Delay en segundos, o None si no está especificado
        
        Example:
            >>> checker = RobotsChecker()
            >>> delay = checker.get_crawl_delay('https://example.com')
            >>> if delay:
            ...     time.sleep(delay)
        """
        if user_agent is None:
            user_agent = self.user_agent
        
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        # Asegurar que tenemos el parser
        if base_url not in self._parsers:
            self.can_fetch(url, user_agent)  # Esto cargará el parser
        
        if base_url in self._parsers:
            rp = self._parsers[base_url]
            delay = rp.crawl_delay(user_agent)
            if delay:
                self.logger.info(f"Crawl-Delay for {base_url}: {delay}s")
            return delay
        
        return None
    
    def clear_cache(self):
        """Limpia el cache de parsers de robots.txt."""
        self._parsers.clear()
        self.logger.debug("robots.txt cache cleared")
