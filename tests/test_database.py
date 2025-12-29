"""
Tests para el módulo de base de datos (SQLite).
"""

import unittest
import os
import sqlite3
import tempfile
from src.scraper.database import init_db, save_price, get_price_history, get_stats

class TestDatabase(unittest.TestCase):
    
    def setUp(self):
        """Crear DB temporal para cada test"""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, 'test.db')
        init_db(self.db_path)
    
    def tearDown(self):
        self.temp_dir.cleanup()
        
    def test_init_db(self):
        """Test que la DB se inicializa con tablas correctas"""
        self.assertTrue(os.path.exists(self.db_path))
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='prices';")
        self.assertIsNotNone(cursor.fetchone())
        conn.close()

    def test_save_and_retrieve(self):
        """Test guardar y recuperar precios"""
        row = {
            'timestamp': '2025-01-01T10:00:00',
            'site': 'test_site',
            'product': 'test_product',
            'price': 99.99,
            'currency': 'USD',
            'url': 'http://url'
        }
        
        save_price(row, self.db_path)
        
        # Verificar recuperación
        history = get_price_history('test_product', db_path=self.db_path)
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]['price'], 99.99)
        self.assertEqual(history[0]['product'], 'test_product')

    def test_get_stats(self):
        """Test estadísticas"""
        row1 = {'timestamp': '2025-01-01', 'site': 's1', 'product': 'p1', 'price': 10, 'currency': 'C', 'url': 'u1'}
        row2 = {'timestamp': '2025-01-02', 'site': 's1', 'product': 'p2', 'price': 20, 'currency': 'C', 'url': 'u2'}
        
        save_price(row1, self.db_path)
        save_price(row2, self.db_path)
        
        stats = get_stats(self.db_path)
        self.assertEqual(stats['total_records'], 2)
        self.assertEqual(stats['products'], 2)
        self.assertEqual(stats['sites'], 1)

if __name__ == '__main__':
    unittest.main()
