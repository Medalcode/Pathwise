"""
Tests para funcionalidades v3 (Pydantic Models, Recipes, UA Rotation).
"""

import unittest
import tempfile
import os
from src.scraper.models import ScrapeRecipe, ExtractedProduct, SelectorType
from src.scraper.recipes import load_recipe
from src.scraper.ua import ua_rotator, FALLBACK_AGENTS

class TestV3Features(unittest.TestCase):
    
    def test_extracted_product_decimal_handling(self):
        """Test que Pydantic maneja float -> Decimal correctamente"""
        product = ExtractedProduct(
            site="example.com",
            product_title="Test Product",
            price=199.99, # Input float
            url="http://example.com/item",
            timestamp="2025-01-01"
        )
        self.assertEqual(float(product.price), 199.99)
        self.assertEqual(product.currency, "USD") # Default

    def test_recipe_validation(self):
        """Test validación de recetas"""
        # Receta válida
        valid_data = {
            "domain": "valid.com",
            "selectors": {
                "price": {"value": ".price"}
            }
        }
        recipe = ScrapeRecipe(**valid_data)
        self.assertEqual(recipe.domain, "valid.com")
        self.assertEqual(recipe.selectors['price'].type, SelectorType.CSS)
        
        # Receta inválida (falta price)
        invalid_data = {
            "domain": "invalid.com",
            "selectors": {
                "title": {"value": "h1"}
            }
        }
        with self.assertRaises(ValueError):
            ScrapeRecipe(**invalid_data)

    def test_load_recipe_from_yaml(self):
        """Test carga desde archivo YAML"""
        yaml_content = """
        domain: yaml.test
        selectors:
          price:
            value: .cost
          title:
            value: h1
            type: css
        """
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as tmp:
            tmp.write(yaml_content)
            tmp_path = tmp.name
            
        try:
            recipe = load_recipe(tmp_path)
            self.assertEqual(recipe.domain, "yaml.test")
            self.assertEqual(recipe.selectors['price'].value, ".cost")
        finally:
            os.remove(tmp_path)

    def test_ua_rotation(self):
        """Test rotación de UA"""
        # Test básico de que retorna algo tipo string y no vacío
        ua = ua_rotator.get_random_ua()
        self.assertIsInstance(ua, str)
        self.assertTrue(len(ua) > 10)
        
        # Test fallback
        # Si fake-useragent falla (ej. sin internet), debería usar fallback
        # Forzamos provider a None para simular fallo
        original_provider = ua_rotator.ua_provider
        ua_rotator.ua_provider = None
        
        ua_fallback = ua_rotator.get_random_ua()
        self.assertIn(ua_fallback, FALLBACK_AGENTS)
        
        # Restaurar
        ua_rotator.ua_provider = original_provider

if __name__ == '__main__':
    unittest.main()
