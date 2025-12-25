"""
Tests para RateLimiter.
"""

import unittest
import time
from src.scraper.ratelimit import RateLimiter


class TestRateLimiter(unittest.TestCase):
    
    def test_rate_limiter_initialization(self):
        """Test inicialización del rate limiter"""
        limiter = RateLimiter(requests_per_minute=60)
        
        self.assertEqual(limiter.requests_per_minute, 60)
        self.assertEqual(limiter.min_delay, 1.0)  # 60 req/min = 1 req/sec
    
    def test_wait_if_needed_enforces_delay(self):
        """Test que wait_if_needed aplica delays"""
        limiter = RateLimiter(requests_per_minute=60, global_delay=0.1)
        
        start = time.time()
        
        limiter.wait_if_needed('example.com')
        limiter.wait_if_needed('example.com')
        
        elapsed = time.time() - start
        
        # Debe haber esperado al menos el global_delay
        self.assertGreaterEqual(elapsed, 0.1)
    
    def test_different_domains_no_wait(self):
        """Test que dominios diferentes no se bloquean entre sí"""
        limiter = RateLimiter(requests_per_minute=60, global_delay=0.05)
        
        start = time.time()
        
        limiter.wait_if_needed('domain1.com')
        limiter.wait_if_needed('domain2.com')
        limiter.wait_if_needed('domain3.com')
        
        elapsed = time.time() - start
        
        # Solo debería aplicar global_delay
        # 3 requests con 0.05s global delay = ~0.10s (2 delays)
        self.assertLess(elapsed, 0.25)
    
    def test_custom_delay(self):
        """Test que custom_delay sobrescribe el default"""
        limiter = RateLimiter(requests_per_minute=60, global_delay=0.01)
        
        start = time.time()
        
        limiter.wait_if_needed('example.com', custom_delay=0.2)
        limiter.wait_if_needed('example.com', custom_delay=0.2)
        
        elapsed = time.time() - start
        
        # Debe esperar 0.2s entre requests
        self.assertGreaterEqual(elapsed, 0.2)
    
    def test_get_stats(self):
        """Test que get_stats retorna información correcta"""
        limiter = RateLimiter(requests_per_minute=30)
        
        limiter.wait_if_needed('example.com')
        
        stats = limiter.get_stats('example.com')
        
        self.assertEqual(stats['domain'], 'example.com')
        self.assertIsNotNone(stats['last_request'])
        self.assertLessEqual(stats['elapsed_seconds'], 1.0)
        
        global_stats = limiter.get_stats()
        self.assertEqual(global_stats['requests_per_minute'], 30)
        self.assertEqual(global_stats['domains_tracked'], 1)
    
    def test_reset(self):
        """Test que reset limpia el tracking"""
        limiter = RateLimiter(requests_per_minute=60)
        
        limiter.wait_if_needed('domain1.com')
        limiter.wait_if_needed('domain2.com')
        
        self.assertEqual(limiter.get_stats()['domains_tracked'], 2)
        
        limiter.reset()
        
        self.assertEqual(limiter.get_stats()['domains_tracked'], 0)


if __name__ == '__main__':
    unittest.main()
