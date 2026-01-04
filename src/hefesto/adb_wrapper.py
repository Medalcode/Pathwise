import subprocess
import logging
import time
from typing import Optional, Tuple

logger = logging.getLogger('panoptes.hefesto')

class ADBWrapper:
    """
    Wrapper profesional para Android Debug Bridge (ADB).
    Permite controlar el dispositivo 'Hefesto' para extracción de datos móvil.
    """
    
    def __init__(self, device_id: Optional[str] = None):
        """
        Inicializa el controlador ADB.
        
        Args:
            device_id: ID del dispositivo (ej: 'ZE222GMD2B'). 
                       Si es None, usa el primer dispositivo encontrado.
        """
        self.device_id = device_id
        if not self.device_id:
            self.device_id = self._get_first_device()
        
        if self.device_id:
            logger.info(f"🔨 Hefesto conectado a: {self.device_id}")
        else:
            logger.error("❌ No se encontró ningún dispositivo Android conectado.")

    def _get_first_device(self) -> Optional[str]:
        """Detecta automáticamente el primer dispositivo conectado."""
        try:
            result = subprocess.run(['adb', 'devices'], capture_output=True, text=True)
            lines = result.stdout.strip().split('\n')[1:]
            for line in lines:
                if 'device' in line and not 'offline' in line:
                    return line.split('\t')[0]
            return None
        except Exception as e:
            logger.error(f"Error detectando dispositivos: {e}")
            return None

    def _run(self, command: str) -> str:
        """Ejecuta un comando raw de ADB."""
        if not self.device_id:
            raise RuntimeError("Dispositivo no conectado.")
            
        full_cmd = f"adb -s {self.device_id} {command}"
        try:
            # logger.debug(f"ADB Exec: {command}")
            result = subprocess.run(
                full_cmd, 
                shell=True, 
                capture_output=True, 
                text=True
            )
            if result.stderr:
                logger.debug(f"ADB Stderr: {result.stderr.strip()}")
            return result.stdout.strip()
        except Exception as e:
            logger.error(f"Fallo en comando ADB '{command}': {e}")
            return ""

    # --- Acciones de Interacción ---

    def tap(self, x: int, y: int):
        """Simula un toque en la pantalla."""
        self._run(f"shell input tap {x} {y}")

    def swipe(self, x1: int, y1: int, x2: int, y2: int, duration_ms: int = 300):
        """Simula un deslizamiento (scroll)."""
        self._run(f"shell input swipe {x1} {y1} {x2} {y2} {duration_ms}")

    def text(self, text: str):
        """Escribe texto (escapa espacios automáticamente)."""
        escaped_text = text.replace(" ", "%s")
        self._run(f"shell input text '{escaped_text}'")

    def key_event(self, key_code: int):
        """
        Envía un código de tecla físico.
        3: HOME, 4: BACK, 66: ENTER, 26: POWER
        """
        self._run(f"shell input keyevent {key_code}")

    # --- Extracción de Datos ---

    def dump_hierarchy(self, output_path: str = "/tmp/window_dump.xml") -> str:
        """
        Descarga la jerarquía UI actual (XML).
        Vital para encontrar coordenadas de botones dinámicamente.
        """
        self._run("shell uiautomator dump /data/local/tmp/uidump.xml")
        self._run(f"pull /data/local/tmp/uidump.xml {output_path}")
        return output_path

    def screenshot(self, local_path: str = "screenshot.png"):
        """Toma una captura de pantalla y la guarda localmente."""
        self._run("shell screencap -p /data/local/tmp/screen.png")
        self._run(f"pull /data/local/tmp/screen.png {local_path}")
        logger.info(f"📸 Screenshot guardado en {local_path}")

    # --- Utilidades ---

    def get_device_info(self):
        """Obtiene modelo y versión de Android."""
        model = self._run("shell getprop ro.product.model")
        version = self._run("shell getprop ro.build.version.release")
        return f"{model} (Android {version})"

    def open_url(self, url: str):
        """Abre una URL en el navegador predeterminado del móvil."""
        self._run(f"shell am start -a android.intent.action.VIEW -d '{url}'")

if __name__ == "__main__":
    # Test rápido si se ejecuta el archivo directamente
    logging.basicConfig(level=logging.INFO)
    hefesto = ADBWrapper()
    if hefesto.device_id:
        print(f"Info del Dispositivo: {hefesto.get_device_info()}")
        print("Tomando screenshot de prueba...")
        hefesto.screenshot("hefesto_test.png")
