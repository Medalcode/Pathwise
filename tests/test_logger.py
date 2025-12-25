"""
Tests para el sistema de logging de BuyScraper.
"""

import unittest
import logging
import os
import tempfile
from pathlib import Path
from src.scraper.logger import setup_logger, get_logger


class TestLogger(unittest.TestCase):
    
    def setUp(self):
        """Setup temporal para cada test"""
        self.temp_dir = tempfile.mkdtemp()
        # Limpiar handlers existentes
        logger = logging.getLogger('test_logger')
        logger.handlers.clear()
    
    def tearDown(self):
        """Cleanup después de cada test"""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def test_setup_logger_creates_logger(self):
        """Test que setup_logger crea un logger correctamente"""
        logger = setup_logger(
            name='test_logger',
            log_dir=self.temp_dir
        )
        
        self.assertIsNotNone(logger)
        self.assertEqual(logger.name, 'test_logger')
        self.assertTrue(len(logger.handlers) >= 2)  # Console + File
    
    def test_logger_writes_to_file(self):
        """Test que el logger escribe al archivo"""
        log_file = 'test.log'
        logger = setup_logger(
            name='test_file_logger',
            log_file=log_file,
            log_dir=self.temp_dir
        )
        
        test_message = "Test log message"
        logger.info(test_message)
        
        log_path = Path(self.temp_dir) / log_file
        self.assertTrue(log_path.exists())
        
        with open(log_path, 'r') as f:
            content = f.read()
            self.assertIn(test_message, content)
    
    def test_get_logger_returns_existing(self):
        """Test que get_logger retorna logger existente"""
        logger1 = setup_logger(name='persistent_logger', log_dir=self.temp_dir)
        logger2 = get_logger('persistent_logger')
        
        self.assertIs(logger1, logger2)
    
    def test_log_levels(self):
        """Test que diferentes niveles de log funcionan"""
        logger = setup_logger(
            name='level_test_logger',
            log_file='levels.log',
            log_dir=self.temp_dir
        )
        
        logger.debug("Debug message")
        logger.info("Info message")
        logger.warning("Warning message")
        logger.error("Error message")
        
        log_path = Path(self.temp_dir) / 'levels.log'
        with open(log_path, 'r') as f:
            content = f.read()
            # Archivo debe tener DEBUG (file_level=DEBUG por default)
            self.assertIn("Debug message", content)
            self.assertIn("Info message", content)
            self.assertIn("Warning message", content)
            self.assertIn("Error message", content)


if __name__ == '__main__':
    unittest.main()
