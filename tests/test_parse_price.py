import unittest
from src.scraper.scrape import parse_price

class TestParsePrice(unittest.TestCase):
    def test_simple_integer(self):
        self.assertEqual(parse_price('1999'), 1999.0)

    def test_decimal_dot(self):
        self.assertEqual(parse_price('1,234.56'), 1234.56)

    def test_decimal_comma(self):
        self.assertEqual(parse_price('1.234,56'), 1234.56)

    def test_currency_symbol(self):
        self.assertEqual(parse_price('$ 12.345,67'), 12345.67)

    def test_no_number(self):
        self.assertIsNone(parse_price('sin precio'))

if __name__ == '__main__':
    unittest.main()
