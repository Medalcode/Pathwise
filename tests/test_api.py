"""
Tests para la API REST de BuyScraper.
"""

import unittest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from src.api.main import app

class TestBuyScraperAPI(unittest.TestCase):
    
    def setUp(self):
        self.client = TestClient(app)
        
    def test_health_check(self):
        """Test endpoint /"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')

    @patch('src.api.main.get_price_history')
    def test_get_prices(self, mock_history):
        """Test endpoint /prices"""
        mock_history.return_value = [
            {
                'timestamp': '2025-01-01',
                'site': 'test',
                'product': 'p1',
                'price': 100.0,
                'currency': 'USD',
                'url': 'u1'
            }
        ]
        
        response = self.client.get("/prices")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['product'], 'p1')

    @patch('src.api.main.run_single') # Mockear el scraper real
    def test_trigger_scrape(self, mock_run):
        """Test endpoint POST /scrape"""
        payload = {
            "url": "https://example.com/item",
            "selector": ".price",
            "product": "Test Item",
            "currency": "USD"
        }
        
        response = self.client.post("/scrape", json=payload)
        
        # Verificar respuesta inmediata
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'accepted')
        
        # Nota: BackgroundTasks son difíciles de testear unitariamente sin ejecutar realmente,
        # pero verificamos que el endpoint acepta la request correctamente.

    @patch('src.api.main.get_stats')
    def test_get_stats(self, mock_stats):
        """Test endpoint /stats"""
        mock_stats.return_value = {
            'total_records': 10,
            'products': 5,
            'sites': 2,
            'last_update': '2025-01-01'
        }
        
        response = self.client.get("/stats")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['total_records'], 10)

if __name__ == '__main__':
    unittest.main()
