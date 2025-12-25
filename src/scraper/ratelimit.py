"""
Sistema de rate limiting para control de requests por dominio.

Implementa delays configurables entre requests al mismo dominio para:
- Evitar sobrecargar servidores
- Prevenir bloqueos de IP
- Respetar políticas de los sitios
"""

import time
import logging
from collections import defaultdict
from datetime import datetime
from typing import Dict, Optional


class RateLimiter:
    """
    Controla la tasa de requests por dominio.
    
    Mantiene timestamps del último request por dominio y aplica delays
    para respetar límites configurados.
    """
    
    def __init__(self, requests_per_minute: int = 10, global_delay: float = 1.0):
        """
        Inicializa el rate limiter.
        
        Args:
            requests_per_minute: Máximo de requests por minuto por dominio
            global_delay: Delay mínimo entre cualquier request (segundos)
        
        Example:
            >>> limiter = RateLimiter(requests_per_minute=10)
            >>> limiter.wait_if_needed('example.com')  # Esperará si es necesario
        """
        self.requests_per_minute = requests_per_minute
        self.min_delay = max(60.0 / requests_per_minute, global_delay)
        self.global_delay = global_delay
        
        # Timestamps del último request por dominio
        self._last_request: Dict[str, datetime] = defaultdict(lambda: datetime.min)
        
        # Timestamp del último request global
        self._last_global_request: datetime = datetime.min
        
        self.logger = logging.getLogger('buyscraper.ratelimit')
        
        self.logger.info(
            f"Rate limiter initialized: {requests_per_minute} req/min "
            f"(min delay: {self.min_delay:.2f}s, global delay: {global_delay:.2f}s)"
        )
    
    def wait_if_needed(self, domain: str, custom_delay: Optional[float] = None):
        """
        Espera si es necesario para respetar rate limit del dominio.
        
        Args:
            domain: Dominio (ej: 'example.com')
            custom_delay: Delay personalizado para este dominio (sobrescribe default)
        
        Example:
            >>> limiter = RateLimiter()
            >>> limiter.wait_if_needed('example.com')
            >>> # Ahora es seguro hacer el request
        """
        now = datetime.now()
        
        # Calcular delay requerido
        delay = custom_delay if custom_delay is not None else self.min_delay
        
        # Verificar delay por dominio
        elapsed_domain = (now - self._last_request[domain]).total_seconds()
        
        # Verificar delay global
        elapsed_global = (now - self._last_global_request).total_seconds()
        
        # Tomar el delay más restrictivo
        required_wait_domain = max(0, delay - elapsed_domain)
        required_wait_global = max(0, self.global_delay - elapsed_global)
        required_wait = max(required_wait_domain, required_wait_global)
        
        if required_wait > 0:
            self.logger.debug(
                f"Rate limiting for {domain}: sleeping {required_wait:.2f}s "
                f"(domain: {elapsed_domain:.2f}s ago, global: {elapsed_global:.2f}s ago)"
            )
            time.sleep(required_wait)
        
        # Actualizar timestamps
        self._last_request[domain] = datetime.now()
        self._last_global_request = datetime.now()
    
    def set_domain_rate(self, domain: str, requests_per_minute: int):
        """
        Configura una tasa específica para un dominio.
        
        Args:
            domain: Dominio a configurar
            requests_per_minute: Requests por minuto para este dominio
        
        Note:
            Esta funcionalidad requiere tracking adicional por dominio.
            Por ahora, usar custom_delay en wait_if_needed().
        """
        delay = 60.0 / requests_per_minute
        self.logger.info(f"Custom rate for {domain}: {requests_per_minute} req/min ({delay:.2f}s delay)")
        # Nota: Esta implementación simplificada usa custom_delay en wait_if_needed
        # Para implementación completa, necesitaríamos dict de delays por dominio
    
    def get_stats(self, domain: Optional[str] = None) -> dict:
        """
        Obtiene estadísticas del rate limiter.
        
        Args:
            domain: Dominio específico (None = stats globales)
        
        Returns:
            Dict con estadísticas
        """
        if domain:
            last_request = self._last_request.get(domain, datetime.min)
            elapsed = (datetime.now() - last_request).total_seconds()
            return {
                'domain': domain,
                'last_request': last_request.isoformat() if last_request != datetime.min else None,
                'elapsed_seconds': elapsed,
                'can_request_now': elapsed >= self.min_delay
            }
        else:
            return {
                'requests_per_minute': self.requests_per_minute,
                'min_delay': self.min_delay,
                'global_delay': self.global_delay,
                'domains_tracked': len(self._last_request),
                'last_global_request': self._last_global_request.isoformat()
            }
    
    def reset(self, domain: Optional[str] = None):
        """
        Resetea el rate limiter.
        
        Args:
            domain: Dominio específico a resetear (None = resetear todo)
        """
        if domain:
            if domain in self._last_request:
                del self._last_request[domain]
                self.logger.info(f"Rate limit reset for domain: {domain}")
        else:
            self._last_request.clear()
            self._last_global_request = datetime.min
            self.logger.info("Rate limiter fully reset")
