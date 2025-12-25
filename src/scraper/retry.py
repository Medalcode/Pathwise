"""
Sistema de reintentos con backoff exponencial para requests HTTP.

Maneja errores temporales de red con estrategia de reintentos inteligente:
- Backoff exponencial para evitar sobrecargar servidores
- Diferenciación entre errores 4xx (no reintentar) y 5xx (reintentar)
- Manejo de timeouts y errores de conexión
"""

import time
import logging
from typing import Callable, Any, Optional, Type, Tuple
from functools import wraps


class RetryableError(Exception):
    """Error que puede justificar un reintento."""
    pass


class NonRetryableError(Exception):
    """Error que no debe reintentarse."""
    pass


def with_retry(
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
    logger: Optional[logging.Logger] = None
):
    """
    Decorador para agregar retry logic con backoff exponencial a funciones.
    
    Args:
        max_retries: Número máximo de reintentos
        backoff_factor: Factor multiplicador para backoff (2.0 = duplica cada vez)
        initial_delay: Delay inicial en segundos
        max_delay: Delay máximo en segundos
        retryable_exceptions: Tupla de excepciones que justifican reintento
        logger: Logger a usar (None = crear uno nuevo)
    
    Returns:
        Función decorada con retry logic
    
    Example:
        >>> @with_retry(max_retries=3, backoff_factor=2.0)
        ... def fetch_data(url):
        ...     return requests.get(url)
        
        >>> result = fetch_data('https://example.com')  # Se reintentará automáticamente
    """
    if logger is None:
        logger = logging.getLogger('buyscraper.retry')
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    result = func(*args, **kwargs)
                    
                    if attempt > 0:
                        logger.info(
                            f"{func.__name__} succeeded on attempt {attempt + 1}/{max_retries + 1}"
                        )
                    
                    return result
                
                except retryable_exceptions as e:
                    last_exception = e
                    
                    # Si es el último intento, no esperar
                    if attempt >= max_retries:
                        logger.error(
                            f"{func.__name__} failed after {max_retries + 1} attempts: {e}"
                        )
                        raise
                    
                    # Calcular delay con backoff exponencial
                    delay = min(
                        initial_delay * (backoff_factor ** attempt),
                        max_delay
                    )
                    
                    logger.warning(
                        f"{func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}): {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    
                    time.sleep(delay)
            
            # No deberíamos llegar aquí, pero por si acaso
            if last_exception:
                raise last_exception
        
        return wrapper
    return decorator


class RetryHandler:
    """
    Manejador de reintentos para requests HTTP con lógica específica.
    
    Diferencia entre errores HTTP 4xx (client error - no reintentar)
    y 5xx (server error - reintentar).
    """
    
    def __init__(
        self,
        max_retries: int = 3,
        backoff_factor: float = 2.0,
        initial_delay: float = 1.0,
        logger: Optional[logging.Logger] = None
    ):
        """
        Inicializa el retry handler.
        
        Args:
            max_retries: Número máximo de reintentos
            backoff_factor: Factor de backoff exponencial
            initial_delay: Delay inicial en segundos
            logger: Logger opcional
        """
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.initial_delay = initial_delay
        self.logger = logger or logging.getLogger('buyscraper.retry')
    
    def should_retry(self, exception: Exception, attempt: int) -> bool:
        """
        Determina si un error debe reintentarse.
        
        Args:
            exception: Excepción ocurrida
            attempt: Número de intento actual (0-indexed)
        
        Returns:
            True si debe reintentarse, False si no
        """
        # No reintentar si alcanzamos el límite
        if attempt >= self.max_retries:
            return False
        
        # Lógica específica para requests.HTTPError
        try:
            import requests
            if isinstance(exception, requests.exceptions.HTTPError):
                # No reintentar errores 4xx (client error)
                if hasattr(exception, 'response') and exception.response is not None:
                    status_code = exception.response.status_code
                    if 400 <= status_code < 500:
                        self.logger.debug(
                            f"Not retrying HTTP {status_code} (client error)"
                        )
                        return False
                    # Reintentar errores 5xx (server error)
                    elif 500 <= status_code < 600:
                        self.logger.debug(
                            f"Will retry HTTP {status_code} (server error)"
                        )
                        return True
            
            # Reintentar timeouts y errores de conexión
            if isinstance(exception, (
                requests.exceptions.Timeout,
                requests.exceptions.ConnectionError,
                requests.exceptions.RequestException
            )):
                return True
        
        except ImportError:
            pass
        
        # Por defecto, reintentar excepciones genéricas
        return isinstance(exception, Exception)
    
    def get_delay(self, attempt: int) -> float:
        """
        Calcula el delay para un intento dado.
        
        Args:
            attempt: Número de intento (0-indexed)
        
        Returns:
            Delay en segundos
        """
        return self.initial_delay * (self.backoff_factor ** attempt)
    
    def execute_with_retry(self, func: Callable, *args, **kwargs) -> Any:
        """
        Ejecuta una función con retry logic.
        
        Args:
            func: Función a ejecutar
            *args: Argumentos posicionales para la función
            **kwargs: Argumentos nombrados para la función
        
        Returns:
            Resultado de la función
        
        Raises:
            Última excepción si todos los reintentos fallan
        
        Example:
            >>> handler = RetryHandler()
            >>> result = handler.execute_with_retry(requests.get, 'https://example.com')
        """
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                result = func(*args, **kwargs)
                
                if attempt > 0:
                    self.logger.info(
                        f"Success on attempt {attempt + 1}/{self.max_retries + 1}"
                    )
                
                return result
            
            except Exception as e:
                last_exception = e
                
                if not self.should_retry(e, attempt):
                    self.logger.error(f"Non-retryable error: {e}")
                    raise
                
                if attempt >= self.max_retries:
                    self.logger.error(
                        f"Max retries ({self.max_retries}) reached. Last error: {e}"
                    )
                    raise
                
                delay = self.get_delay(attempt)
                
                self.logger.warning(
                    f"Attempt {attempt + 1}/{self.max_retries + 1} failed: {e}. "
                    f"Retrying in {delay:.2f}s..."
                )
                
                time.sleep(delay)
        
        # Fallback (no debería llegar aquí)
        if last_exception:
            raise last_exception
