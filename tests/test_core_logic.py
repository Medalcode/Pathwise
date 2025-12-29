"""
Tests unitarios para la lógica core del scraper (scrape.py).
Cubre fetch_html, extract_price_and_name, save_row y ejecuciones principales.
"""

import unittest
import os
import csv
import tempfile
import requests
from unittest.mock import patch, MagicMock, mock_open
from src.scraper.scrape import (
    fetch_html, 
    extract_price_and_name, 
    save_row,
    run_single
)

class TestScraperCore(unittest.TestCase):
    
    # --- Tests para extract_price_and_name ---
    
    def test_extract_price_simple(self):
        """Test extracción simple de precio"""
        html = '<html><body><div class="price">$ 1.234,50</div></body></html>'
        price, name = extract_price_and_name(html, '.price')
        self.assertEqual(price, 1234.50)
        self.assertIsNone(name)
        
    def test_extract_price_and_name(self):
        """Test extracción de precio y nombre"""
        html = '''
        <html>
            <body>
                <h1 id="title">Producto Genial</h1>
                <span class="cost">USD 99.99</span>
            </body>
        </html>
        '''
        price, name = extract_price_and_name(html, '.cost', '#title')
        self.assertEqual(price, 99.99)
        self.assertEqual(name, 'Producto Genial')
        
    def test_extract_not_found(self):
        """Test cuando selectores no encuentran nada"""
        html = '<html><body><div>Nada por aquí</div></body></html>'
        price, name = extract_price_and_name(html, '.missing')
        self.assertIsNone(price)
        self.assertIsNone(name)

    # --- Tests para save_row ---

    def test_save_row_creates_file_with_header(self):
        """Test que save_row crea archivo y header si no existen"""
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = os.path.join(temp_dir, 'test.csv')
            
            row = {
                'timestamp': '2025-01-01T12:00:00',
                'site': 'example.com',
                'product': 'Test',
                'price': 100.0,
                'currency': 'USD',
                'url': 'http://example.com'
            }
            
            save_row(csv_path, row)
            
            self.assertTrue(os.path.exists(csv_path))
            
            with open(csv_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                self.assertEqual(len(lines), 2)  # Header + 1 row
                self.assertIn('timestamp,site,product,price,currency,url', lines[0])
                self.assertIn('100.0', lines[1])

    def test_save_row_appends(self):
        """Test que save_row agrega filas sin reescribir header"""
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = os.path.join(temp_dir, 'test.csv')
            row = {
                'timestamp': '2025-01-01', 'site': 's', 'product': 'p', 
                'price': 1, 'currency': 'C', 'url': 'u'
            }
            
            # Primera escritura
            save_row(csv_path, row)
            # Segunda escritura
            save_row(csv_path, row)
            
            with open(csv_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                self.assertEqual(len(lines), 3)  # Header + 2 rows

    # --- Tests para fetch_html (Mocking Network) ---

    @patch('src.scraper.scrape.requests.get')
    @patch('src.scraper.scrape.robots_checker')
    @patch('src.scraper.scrape.rate_limiter')
    def test_fetch_html_success(self, mock_limiter, mock_robots, mock_get):
        """Test fetch_html exitoso con mocks"""
        # Configurar Mocks
        mock_robots.can_fetch.return_value = True
        mock_robots.get_crawl_delay.return_value = None
        
        mock_response = MagicMock()
        mock_response.text = "<html>Success</html>"
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Ejecutar
        html = fetch_html("http://example.com")
        
        # Verificar
        self.assertEqual(html, "<html>Success</html>")
        mock_robots.can_fetch.assert_called_with("http://example.com", unittest.mock.ANY)
        mock_limiter.wait_if_needed.assert_called()
        mock_get.assert_called()

    @patch('src.scraper.scrape.robots_checker')
    def test_fetch_html_robots_blocked(self, mock_robots):
        """Test fetch_html bloqueado por robots.txt"""
        mock_robots.can_fetch.return_value = False
        
        with self.assertRaises(ValueError) as cm:
            fetch_html("http://forbidden.com")
        
        self.assertIn("robots.txt disallows", str(cm.exception))

    # --- Tests para run_single (Integration Lite) ---
    
    @patch('src.scraper.scrape.fetch_html')
    @patch('src.scraper.scrape.save_row')
    def test_run_single(self, mock_save, mock_fetch):
        """Test run_single orquesta correctamente"""
        mock_fetch.return_value = '<html><div class="p">$10</div></html>'
        
        run_single(
            url="http://site.com", 
            selector=".p", 
            product="Default", 
            output="out.csv", 
            name_selector=None, 
            currency="USD"
        )
        
        mock_fetch.assert_called_once_with("http://site.com")
        mock_save.assert_called_once()
        
        # Verificar que se extrajo el precio y se pasó a save_row
        args, _ = mock_save.call_args
        path, row = args
        self.assertEqual(path, "out.csv")
        self.assertEqual(row['price'], 10.0)
        self.assertEqual(row['url'], "http://site.com")


if __name__ == '__main__':
    unittest.main()
