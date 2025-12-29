"""
Sistema de Notificaciones para alertas de precio.
Diseño modular para soportar Email, Telegram, Slack, etc.
"""

import logging
from typing import Protocol, List
from decimal import Decimal

logger = logging.getLogger('buyscraper.notify')

class Notifier(Protocol):
    def send(self, subject: str, message: str) -> bool:
        ...

class ConsoleNotifier:
    """Notificador simple que escribe en logs/consola."""
    def send(self, subject: str, message: str) -> bool:
        logger.info(f"🔔 ALERT [{subject}]: {message}")
        print(f"\n🔔 ALERT [{subject}]: {message}\n")
        return True

class NotificationManager:
    def __init__(self):
        self.notifiers: List[Notifier] = []
        # Agregar default
        self.notifiers.append(ConsoleNotifier())
        
    def add_notifier(self, notifier: Notifier):
        self.notifiers.append(notifier)
        
    def notify_price_drop(self, product: str, old_price: float, new_price: float, url: str):
        """Envía alerta si el precio bajó."""
        drop_pct = ((old_price - new_price) / old_price) * 100
        
        subject = f"Bajada de precio: {product}"
        message = (
            f"El producto '{product}' bajó un {drop_pct:.1f}%!\n"
            f"Antes: {old_price}\n"
            f"Ahora: {new_price}\n"
            f"Link: {url}"
        )
        
        for notifier in self.notifiers:
            try:
                notifier.send(subject, message)
            except Exception as e:
                logger.error(f"Error enviando notificación: {e}")

# Instancia global
notification_manager = NotificationManager()
