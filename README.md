# 🛒 BuyScraper - Economía en tiempo real

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](tests/)

Scraper genérico y ético de precios de productos en línea con análisis temporal. Versión 2.0 con mejoras profesionales de robustez y compliance.

## ✨ Características

### 🔐 Scraping Ético y Robusto

- ✅ **Respeto a robots.txt**: Verificación automática antes de cada scraping
- ✅ **Rate limiting**: Control de requests por dominio para evitar sobrecargar servidores
- ✅ **Retry logic**: Reintentos automáticos con backoff exponencial
- ✅ **Logging profesional**: Sistema de logs con rotación automática

### 🎯 Funcionalidad Core

- ✅ **Scraping genérico**: Configuración vía selectores CSS
- ✅ **Multi-sitio**: Procesa múltiples sitios desde archivo YAML
- ✅ **Parsing robusto**: Maneja formatos de precio US y EU
- ✅ **Análisis temporal**: Notebook Jupyter con visualizaciones

## 📦 Requisitos

```bash
Python 3.8+
```

## 🚀 Instalación Rápida

```bash
# 1. Clonar repositorio
git clone https://github.com/Medalcode/BuyScraper.git
cd BuyScraper

# 2. Crear entorno virtual
python3 -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Ejecutar
python src/scraper/scrape.py --sites config/sites.yaml --output data/prices.csv
```

## 🎮 Uso

### Modo 1: Múltiples Sitios (Configuración YAML)

```bash
python src/scraper/scrape.py --sites config/sites.yaml --output data/prices.csv
```

**Configuración (`config/sites.yaml`):**

```yaml
sites:
  - url: "https://ejemplo.com/producto"
    price_selector: ".price"
    name_selector: ".product-title"
    product: "Nombre del Producto"
    currency: "ARS"
```

### Modo 2: URL Única (Ad-hoc)

```bash
python src/scraper/scrape.py \
  --url "https://ejemplo.com/producto" \
  --selector ".price" \
  --product "Mi Producto" \
  --output data/prices.csv
```

### Modo 3: Análisis de Datos

```bash
jupyter notebook notebooks/analysis.ipynb
```

## 📊 Formato de Datos

Los datos se guardan en CSV con el siguiente esquema:

```csv
timestamp,site,product,price,currency,url
2025-12-25T14:00:00,https://ejemplo.com,Producto X,1999.99,ARS,https://ejemplo.com/producto
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
pytest

# Con coverage
pytest --cov=src --cov-report=html

# Test específico
pytest tests/test_parse_price.py -v
```

## 🔧 Configuración Avanzada

### Logging

Los logs se guardan automáticamente en `logs/scraper_YYYYMMDD.log`:

```python
from src.scraper import setup_logger

logger = setup_logger(
    name='buyscraper',
    console_level=logging.INFO,
    file_level=logging.DEBUG
)
```

### Rate Limiting

Configuración global en `scrape.py`:

```python
rate_limiter = RateLimiter(
    requests_per_minute=10,  # 10 requests por minuto
    global_delay=1.0          # 1 segundo entre requests
)
```

### Retry Logic

Configuración de reintentos:

```python
retry_handler = RetryHandler(
    max_retries=3,         # 3 reintentos
    backoff_factor=2.0,    # Backoff exponencial (1s, 2s, 4s)
    initial_delay=1.0      # Delay inicial
)
```

## 🏗️ Estructura del Proyecto

```
BuyScraper/
├── src/
│   └── scraper/
│       ├── __init__.py       # Módulo principal
│       ├── scrape.py         # Script de scraping
│       ├── logger.py         # Sistema de logging
│       ├── robots.py         # Verificador de robots.txt
│       ├── ratelimit.py      # Rate limiter
│       └── retry.py          # Retry logic
├── config/
│   └── sites.yaml            # Configuración de sitios
├── data/
│   └── sample_prices.csv     # Datos de ejemplo
├── notebooks/
│   └── analysis.ipynb        # Análisis y visualizaciones
├── tests/
│   ├── test_parse_price.py   # Tests de parsing
│   ├── test_logger.py        # Tests de logging
│   └── test_ratelimit.py     # Tests de rate limiting
├── logs/                     # Logs (auto-generado)
├── requirements.txt          # Dependencias
├── .gitignore               # Git ignore
└── README.md                # Este archivo
```

## 📚 Documentación Adicional

- **[Reporte de Estado](REPORTE_DESARROLLO.md)**: Estado completo del desarrollo
- **[Mejoras Priorizadas](MEJORAS_PRIORIZADAS.md)**: Roadmap de mejoras futuras
- **[Notebook de Análisis](notebooks/analysis.ipynb)**: Ejemplos de visualización

## 🎯 Casos de Uso

### 1. Monitoreo de Competencia

```bash
# Configurar sitios competidores en sites.yaml
# Programar con cron para ejecución diaria
0 2 * * * cd /path/to/BuyScraper && python src/scraper/scrape.py --sites config/sites.yaml
```

### 2. Detección de Ofertas

```python
# Analizar histórico y comprar cuando precio < promedio
import pandas as pd

df = pd.read_csv('data/prices.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])

product_df = df[df['product'] == 'Mi Producto']
avg_price = product_df['price'].mean()
current_price = product_df.iloc[-1]['price']

if current_price < avg_price * 0.9:
    print("¡Buen momento para comprar!")
```

### 3. Análisis de Mercado

```bash
# Recolectar datos por semanas/meses
# Analizar tendencias en notebook
jupyter notebook notebooks/analysis.ipynb
```

## ⚠️ Consideraciones Legales

### ⚖️ Uso Responsable

Este scraper incluye protecciones éticas:

1. **robots.txt**: Verifica automáticamente permisos antes de scrapear
2. **Rate limiting**: Evita sobrecargar servidores
3. **User-Agent honesto**: Identifica como navegador estándar
4. **Delays configurables**: Respeta políticas de los sitios

### 📜 Responsabilidad del Usuario

- ✅ Verifica que el scraping está permitido por términos de servicio
- ✅ Usa delays razonables entre requests
- ✅ No uses para fines comerciales sin permiso
- ✅ Respeta la privacidad y propiedad intelectual

## 🐛 Troubleshooting

### Error: `ImportError: No module named 'bs4'`

```bash
pip install beautifulsoup4
```

### Error: `robots.txt disallows scraping`

```python
# Usar respect_robots=False solo si estás seguro
python src/scraper/scrape.py --url "..." --selector "..." # Usa robots.txt por defecto
```

### Error: Selector CSS no encuentra precio

```bash
# 1. Inspeccionar página con DevTools (F12)
# 2. Usar Inspector para encontrar elemento
# 3. Copiar selector CSS correcto
# 4. Actualizar sites.yaml
```

## 📈 Changelog

### v2.0.0 (2025-12-25) - Sprint 1 Complete

- ✅ Sistema de logging profesional con rotación
- ✅ Verificación automática de robots.txt
- ✅ Rate limiting por dominio y global
- ✅ Retry logic con backoff exponencial
- ✅ Tests unitarios expandidos
- ✅ Documentación mejorada

### v1.0.0 (2025-10-01) - Initial Release

- ✅ Scraper genérico con selectores CSS
- ✅ Configuración multi-sitio vía YAML
- ✅ Parsing robusto de precios
- ✅ Notebook de análisis
- ✅ Tests unitarios básicos

## 🤝 Contribuciones

Las contribuciones son bienvenidas:

1. Fork el repositorio
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más detalles.

## 👤 Autor

**Medalcode**

- GitHub: [@Medalcode](https://github.com/Medalcode)
- Proyecto: [BuyScraper](https://github.com/Medalcode/BuyScraper)

## 🙏 Agradecimientos

- BeautifulSoup4 por el excelente HTML parsing
- Plotly y Matplotlib por visualizaciones
- Pandas por manipulación de datos
- Comunidad Python por las mejores prácticas

---

**⭐ Si este proyecto te resultó útil, considera darle una estrella en GitHub!**
