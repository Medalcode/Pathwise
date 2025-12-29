"""
Gestor de User-Agents para evasión de detección básica.
"""

import logging
import random
from typing import Optional

logger = logging.getLogger('buyscraper.ua')

# Fallback list por si fake-useragent falla o no hay internet
FALLBACK_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
]

class UserAgentRotator:
    """Provee User-Agents rotativos para simular tráfico orgánico."""
    
    def __init__(self, use_external_lib: bool = True):
        self.ua_provider = None
        if use_external_lib:
            try:
                from fake_useragent import UserAgent
                self.ua_provider = UserAgent(fallback=FALLBACK_AGENTS[0])
                logger.info("fake-useragent inicializado correctamente")
            except ImportError:
                logger.warning("fake-useragent no instalado, usando lista estática")
            except Exception as e:
                logger.warning(f"Error inicializando fake-useragent: {e}. Usando fallback.")

    def get_random_ua(self) -> str:
        """Retorna un User-Agent aleatorio."""
        if self.ua_provider:
            try:
                return self.ua_provider.random
            except Exception:
                pass
        
        return random.choice(FALLBACK_AGENTS)

# Instancia global
ua_rotator = UserAgentRotator()
