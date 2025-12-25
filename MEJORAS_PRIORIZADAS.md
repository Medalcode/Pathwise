# 🚀 MEJORAS PRIORIZADAS - BuyScraper

**Fecha:** 25 de diciembre de 2025  
**Proyecto:** BuyScraper  
**Estado Actual:** v1.0.0 - Funcional

---

## 📊 Criterios de Priorización

Cada mejora está clasificada según:

- **Prioridad:** 🔴 Alta | 🟡 Media | 🟢 Baja
- **Impacto:** 🎯 Alto | 📈 Medio | 📊 Bajo
- **Esfuerzo:** ⏱️ Rápido (<1h) | ⏳ Medio (1-4h) | ⏰ Alto (>4h)
- **Categoría:** 🐛 Bug Fix | ⚡ Performance | 🔐 Seguridad | ✨ Feature | 📚 Docs | 🧪 Testing

---

## 🔴 PRIORIDAD ALTA (Críticas)

### 1. Agregar pytest a requirements.txt

- **Categoría:** 🧪 Testing
- **Impacto:** 🎯 Alto (permite ejecutar tests fácilmente)
- **Esfuerzo:** ⏱️ Rápido (5 min)
- **Descripción:** Actualmente pytest no está en requirements.txt, lo que dificulta ejecutar los tests.
- **Implementación:**
  ```diff
  # requirements.txt
  requests>=2.28.0
  beautifulsoup4>=4.12.0
  pandas>=2.0.0
  plotly>=5.0.0
  matplotlib>=3.6.0
  pyyaml>=6.0
  python-dateutil>=2.8.0
  + pytest>=7.0.0
  + pytest-cov>=4.0.0  # Para coverage reports
  ```
- **Beneficios:**
  - Tests ejecutables con `pytest`
  - Coverage reports automáticos
  - Mejor experiencia de desarrollo

---

### 2. Implementar Sistema de Logging

- **Categoría:** 📚 Docs / 🐛 Debugging
- **Impacto:** 🎯 Alto (debugging y monitoreo)
- **Esfuerzo:** ⏳ Medio (1 hora)
- **Descripción:** Reemplazar `print()` por sistema de logging profesional.
- **Implementación:**

  ```python
  import logging
  from logging.handlers import RotatingFileHandler

  def setup_logger(name: str = 'buyscraper', log_file: str = 'scraper.log'):
      logger = logging.getLogger(name)
      logger.setLevel(logging.INFO)

      # Console handler
      console = logging.StreamHandler()
      console.setLevel(logging.INFO)

      # File handler con rotación
      file_handler = RotatingFileHandler(
          log_file, maxBytes=10*1024*1024, backupCount=5
      )
      file_handler.setLevel(logging.DEBUG)

      # Formato
      formatter = logging.Formatter(
          '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
      )
      console.setFormatter(formatter)
      file_handler.setFormatter(formatter)

      logger.addHandler(console)
      logger.addHandler(file_handler)

      return logger

  # Uso:
  logger = setup_logger()
  logger.info(f"Fetching {url}")
  logger.error(f"Error scraping {url}: {e}")
  logger.debug(f"Raw price text: {price_text}")
  ```

- **Beneficios:**
  - Niveles de log (DEBUG, INFO, WARNING, ERROR)
  - Logs a archivo para debugging
  - Rotación automática de archivos
  - Timestamps precisos

---

### 3. Respetar robots.txt

- **Categoría:** 🔐 Seguridad / Ética
- **Impacto:** 🎯 Alto (compliance legal)
- **Esfuerzo:** ⏳ Medio (1-2 horas)
- **Descripción:** Verificar robots.txt antes de scrapear para respetar políticas del sitio.
- **Implementación:**

  ```python
  from urllib.robotparser import RobotFileParser
  from urllib.parse import urlparse

  class RobotsChecker:
      def __init__(self):
          self._parsers = {}

      def can_fetch(self, url: str, user_agent: str = USER_AGENT) -> bool:
          """Verifica si está permitido scrapear la URL según robots.txt"""
          parsed = urlparse(url)
          base_url = f"{parsed.scheme}://{parsed.netloc}"
          robots_url = f"{base_url}/robots.txt"

          if base_url not in self._parsers:
              rp = RobotFileParser()
              rp.set_url(robots_url)
              try:
                  rp.read()
                  self._parsers[base_url] = rp
              except Exception as e:
                  logger.warning(f"Could not read robots.txt from {robots_url}: {e}")
                  # Si no podemos leer robots.txt, asumimos permitido
                  return True

          return self._parsers[base_url].can_fetch(user_agent, url)

  # Uso en fetch_html:
  robots_checker = RobotsChecker()

  def fetch_html(url: str, timeout: int = 10) -> str:
      if not robots_checker.can_fetch(url):
          raise ValueError(f"robots.txt disallows fetching {url}")

      headers = {"User-Agent": USER_AGENT}
      resp = requests.get(url, headers=headers, timeout=timeout)
      resp.raise_for_status()
      return resp.text
  ```

- **Beneficios:**
  - Respeto a políticas de sitios
  - Evita problemas legales
  - Mejor ciudadanía web
  - Cache de robots.txt para performance

---

### 4. Implementar Rate Limiting

- **Categoría:** ⚡ Performance / 🔐 Seguridad
- **Impacto:** 🎯 Alto (evita bloqueos de IP)
- **Esfuerzo:** ⏳ Medio (2 horas)
- **Descripción:** Delays configurables entre requests para no sobrecargar servidores.
- **Implementación:**

  ```python
  import time
  from collections import defaultdict
  from datetime import datetime, timedelta

  class RateLimiter:
      def __init__(self, requests_per_minute: int = 10):
          self.requests_per_minute = requests_per_minute
          self.min_delay = 60.0 / requests_per_minute
          self._last_request = defaultdict(lambda: datetime.min)

      def wait_if_needed(self, domain: str):
          """Espera si es necesario para respetar rate limit"""
          elapsed = (datetime.now() - self._last_request[domain]).total_seconds()
          if elapsed < self.min_delay:
              sleep_time = self.min_delay - elapsed
              logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s for {domain}")
              time.sleep(sleep_time)
          self._last_request[domain] = datetime.now()

  # Uso:
  rate_limiter = RateLimiter(requests_per_minute=10)

  def fetch_html(url: str, timeout: int = 10) -> str:
      domain = urlparse(url).netloc
      rate_limiter.wait_if_needed(domain)

      headers = {"User-Agent": USER_AGENT}
      resp = requests.get(url, headers=headers, timeout=timeout)
      resp.raise_for_status()
      return resp.text
  ```

- **Configuración en YAML:**
  ```yaml
  global:
    requests_per_minute: 10

  sites:
    - url: "https://ejemplo.tld/producto"
      price_selector: ".price"
      rate_limit: 5 # Override global: 5 req/min para este sitio
  ```
- **Beneficios:**
  - Evita bloqueos de IP
  - Respeta servidores
  - Configurable por sitio
  - Tracking por dominio

---

### 5. Manejo de Errores HTTP con Retry Logic

- **Categoría:** 🐛 Bug Fix / ⚡ Performance
- **Impacto:** 🎯 Alto (robustez)
- **Esfuerzo:** ⏳ Medio (2 horas)
- **Descripción:** Reintentos automáticos con backoff exponencial para errores temporales.
- **Implementación:**

  ```python
  import time
  from typing import Optional
  import requests
  from requests.exceptions import RequestException

  def fetch_html_with_retry(
      url: str,
      timeout: int = 10,
      max_retries: int = 3,
      backoff_factor: float = 2.0
  ) -> str:
      """
      Fetch HTML con retry logic y exponential backoff.

      Args:
          url: URL to fetch
          timeout: Request timeout en segundos
          max_retries: Número máximo de reintentos
          backoff_factor: Multiplicador para backoff (2.0 = duplica cada vez)

      Returns:
          HTML content

      Raises:
          RequestException: Si todos los reintentos fallan
      """
      headers = {"User-Agent": USER_AGENT}

      for attempt in range(max_retries + 1):
          try:
              resp = requests.get(url, headers=headers, timeout=timeout)
              resp.raise_for_status()
              logger.info(f"Successfully fetched {url} on attempt {attempt + 1}")
              return resp.text

          except requests.exceptions.HTTPError as e:
              # Errores 4xx no deben reintentar (client error)
              if 400 <= e.response.status_code < 500:
                  logger.error(f"Client error {e.response.status_code} for {url}")
                  raise

              # Errores 5xx pueden reintentar (server error)
              if attempt < max_retries:
                  wait_time = backoff_factor ** attempt
                  logger.warning(
                      f"HTTP {e.response.status_code} for {url}. "
                      f"Retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})"
                  )
                  time.sleep(wait_time)
              else:
                  logger.error(f"Max retries reached for {url}")
                  raise

          except requests.exceptions.Timeout as e:
              if attempt < max_retries:
                  wait_time = backoff_factor ** attempt
                  logger.warning(
                      f"Timeout for {url}. "
                      f"Retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})"
                  )
                  time.sleep(wait_time)
              else:
                  logger.error(f"Max retries reached for {url} (timeout)")
                  raise

          except RequestException as e:
              if attempt < max_retries:
                  wait_time = backoff_factor ** attempt
                  logger.warning(
                      f"Request error for {url}: {e}. "
                      f"Retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})"
                  )
                  time.sleep(wait_time)
              else:
                  logger.error(f"Max retries reached for {url}: {e}")
                  raise
  ```

- **Beneficios:**
  - Manejo de errores temporales de red
  - Backoff exponencial evita sobrecargar servidores
  - Diferencia entre errores 4xx (no reintentar) y 5xx (reintentar)
  - Logging detallado de reintentos

---

## 🟡 PRIORIDAD MEDIA (Importantes)

### 6. Expandir Cobertura de Tests

- **Categoría:** 🧪 Testing
- **Impacto:** 📈 Medio (calidad de código)
- **Esfuerzo:** ⏳ Medio (3 horas)
- **Descripción:** Aumentar coverage de tests desde solo `parse_price` a todas las funciones.
- **Tests a Implementar:**

  ```python
  # tests/test_scraper.py
  import unittest
  from unittest.mock import patch, MagicMock
  from src.scraper.scrape import (
      fetch_html, extract_price_and_name, save_row,
      run_from_config, run_single
  )

  class TestFetchHtml(unittest.TestCase):
      @patch('src.scraper.scrape.requests.get')
      def test_fetch_html_success(self, mock_get):
          mock_response = MagicMock()
          mock_response.text = '<html><body>Test</body></html>'
          mock_get.return_value = mock_response

          html = fetch_html('http://example.com')

          self.assertEqual(html, '<html><body>Test</body></html>')
          mock_get.assert_called_once()

      @patch('src.scraper.scrape.requests.get')
      def test_fetch_html_404(self, mock_get):
          mock_response = MagicMock()
          mock_response.raise_for_status.side_effect = requests.HTTPError()
          mock_get.return_value = mock_response

          with self.assertRaises(requests.HTTPError):
              fetch_html('http://example.com/404')

  class TestExtractPriceAndName(unittest.TestCase):
      def test_extract_price_success(self):
          html = '<div class="price">$1,234.56</div>'
          price, name = extract_price_and_name(html, '.price')

          self.assertEqual(price, 1234.56)
          self.assertIsNone(name)

      def test_extract_price_and_name(self):
          html = '''
          <div class="product-title">Cool Product</div>
          <div class="price">$99.99</div>
          '''
          price, name = extract_price_and_name(html, '.price', '.product-title')

          self.assertEqual(price, 99.99)
          self.assertEqual(name, 'Cool Product')

      def test_extract_price_not_found(self):
          html = '<div>No price here</div>'
          price, name = extract_price_and_name(html, '.price')

          self.assertIsNone(price)
          self.assertIsNone(name)

  class TestSaveRow(unittest.TestCase):
      def test_save_creates_file_with_header(self):
          import tempfile
          import csv

          with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
              temp_path = f.name

          try:
              row = {
                  'timestamp': '2025-01-01T00:00:00',
                  'site': 'http://example.com',
                  'product': 'Test Product',
                  'price': 99.99,
                  'currency': 'USD',
                  'url': 'http://example.com/product'
              }

              save_row(temp_path, row)

              with open(temp_path, 'r') as f:
                  reader = csv.DictReader(f)
                  rows = list(reader)

              self.assertEqual(len(rows), 1)
              self.assertEqual(rows[0]['product'], 'Test Product')
          finally:
              import os
              os.unlink(temp_path)
  ```

- **Coverage Target:** 80%+
- **Beneficios:**
  - Detecta bugs temprano
  - Refactoring seguro
  - Documentación viva del comportamiento

---

### 7. Migrar de CSV a SQLite

- **Categoría:** ✨ Feature / ⚡ Performance
- **Impacto:** 📈 Medio (escalabilidad)
- **Esfuerzo:** ⏰ Alto (6 horas)
- **Descripción:** Base de datos para queries más eficientes y manejo de grandes volúmenes.
- **Implementación:**

  ```python
  import sqlite3
  from contextlib import contextmanager

  @contextmanager
  def get_db_connection(db_path: str = 'data/prices.db'):
      conn = sqlite3.connect(db_path)
      conn.row_factory = sqlite3.Row
      try:
          yield conn
      finally:
          conn.close()

  def init_db(db_path: str = 'data/prices.db'):
      """Inicializa la base de datos con schema"""
      with get_db_connection(db_path) as conn:
          conn.execute('''
              CREATE TABLE IF NOT EXISTS prices (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  timestamp TEXT NOT NULL,
                  site TEXT NOT NULL,
                  product TEXT NOT NULL,
                  price REAL,
                  currency TEXT,
                  url TEXT NOT NULL,
                  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE(timestamp, url)
              )
          ''')

          conn.execute('''
              CREATE INDEX IF NOT EXISTS idx_timestamp ON prices(timestamp)
          ''')

          conn.execute('''
              CREATE INDEX IF NOT EXISTS idx_product ON prices(product)
          ''')

          conn.commit()

  def save_to_db(row: dict, db_path: str = 'data/prices.db'):
      """Guarda registro en SQLite"""
      with get_db_connection(db_path) as conn:
          try:
              conn.execute('''
                  INSERT INTO prices (timestamp, site, product, price, currency, url)
                  VALUES (?, ?, ?, ?, ?, ?)
              ''', (
                  row['timestamp'],
                  row['site'],
                  row['product'],
                  row['price'],
                  row['currency'],
                  row['url']
              ))
              conn.commit()
          except sqlite3.IntegrityError:
              logger.warning(f"Duplicate entry for {row['url']} at {row['timestamp']}")

  def query_prices(
      product: Optional[str] = None,
      start_date: Optional[str] = None,
      end_date: Optional[str] = None,
      db_path: str = 'data/prices.db'
  ) -> list:
      """Query prices con filtros opcionales"""
      with get_db_connection(db_path) as conn:
          query = "SELECT * FROM prices WHERE 1=1"
          params = []

          if product:
              query += " AND product LIKE ?"
              params.append(f"%{product}%")

          if start_date:
              query += " AND timestamp >= ?"
              params.append(start_date)

          if end_date:
              query += " AND timestamp <= ?"
              params.append(end_date)

          query += " ORDER BY timestamp DESC"

          cursor = conn.execute(query, params)
          return [dict(row) for row in cursor.fetchall()]
  ```

- **Migración de CSV existente:**
  ```python
  def migrate_csv_to_sqlite(csv_path: str, db_path: str = 'data/prices.db'):
      """Migra datos de CSV a SQLite"""
      init_db(db_path)

      import csv
      with open(csv_path, 'r', encoding='utf-8') as f:
          reader = csv.DictReader(f)
          for row in reader:
              save_to_db(row, db_path)

      logger.info(f"Migrated {csv_path} to {db_path}")
  ```
- **Beneficios:**
  - Queries complejas eficientes
  - Prevención de duplicados (UNIQUE constraint)
  - Índices para performance
  - Transacciones ACID
  - Escalable a millones de registros

---

### 8. Crear API REST con FastAPI

- **Categoría:** ✨ Feature
- **Impacto:** 📈 Medio (nuevos casos de uso)
- **Esfuerzo:** ⏰ Alto (8 horas)
- **Descripción:** API para scraping remoto y consulta de datos.
- **Implementación:**

  ```python
  # src/api/main.py
  from fastapi import FastAPI, BackgroundTasks, HTTPException
  from pydantic import BaseModel, HttpUrl
  from typing import Optional, List
  from datetime import datetime
  import uuid

  app = FastAPI(title="BuyScraper API", version="1.0.0")

  # Models
  class ScrapeRequest(BaseModel):
      url: HttpUrl
      price_selector: str
      name_selector: Optional[str] = None
      product: Optional[str] = None
      currency: Optional[str] = "USD"

  class ScrapeResponse(BaseModel):
      job_id: str
      status: str
      message: str

  class PriceRecord(BaseModel):
      timestamp: str
      site: str
      product: str
      price: Optional[float]
      currency: str
      url: str

  # In-memory job storage (en producción usar Redis/DB)
  jobs = {}

  # Endpoints
  @app.post("/scrape", response_model=ScrapeResponse)
  async def create_scrape_job(
      request: ScrapeRequest,
      background_tasks: BackgroundTasks
  ):
      """Inicia un job de scraping asíncrono"""
      job_id = str(uuid.uuid4())

      jobs[job_id] = {
          "status": "pending",
          "created_at": datetime.utcnow().isoformat(),
          "request": request.dict()
      }

      # Ejecutar scraping en background
      background_tasks.add_task(
          execute_scrape,
          job_id,
          request.url,
          request.price_selector,
          request.name_selector,
          request.product,
          request.currency
      )

      return ScrapeResponse(
          job_id=job_id,
          status="pending",
          message="Scraping job created"
      )

  @app.get("/jobs/{job_id}")
  async def get_job_status(job_id: str):
      """Obtiene el estado de un job"""
      if job_id not in jobs:
          raise HTTPException(status_code=404, detail="Job not found")

      return jobs[job_id]

  @app.get("/prices", response_model=List[PriceRecord])
  async def get_prices(
      product: Optional[str] = None,
      start_date: Optional[str] = None,
      end_date: Optional[str] = None,
      limit: int = 100
  ):
      """Consulta precios con filtros"""
      from src.scraper.scrape import query_prices

      results = query_prices(product, start_date, end_date)
      return results[:limit]

  @app.get("/health")
  async def health_check():
      """Health check endpoint"""
      return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

  # Background task
  async def execute_scrape(
      job_id: str,
      url: str,
      selector: str,
      name_selector: Optional[str],
      product: Optional[str],
      currency: str
  ):
      """Ejecuta scraping en background"""
      try:
          jobs[job_id]["status"] = "running"

          from src.scraper.scrape import run_single
          run_single(url, selector, product or '', 'data/prices.csv', name_selector, currency)

          jobs[job_id]["status"] = "completed"
          jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()

      except Exception as e:
          jobs[job_id]["status"] = "failed"
          jobs[job_id]["error"] = str(e)
          jobs[job_id]["failed_at"] = datetime.utcnow().isoformat()
  ```

- **Ejecución:**

  ```bash
  # Instalar FastAPI
  pip install fastapi uvicorn[standard]

  # Ejecutar servidor
  uvicorn src.api.main:app --reload --port 8000
  ```

- **Ejemplos de uso:**

  ```bash
  # Crear job de scraping
  curl -X POST "http://localhost:8000/scrape" \
    -H "Content-Type: application/json" \
    -d '{
      "url": "https://example.com/product",
      "price_selector": ".price",
      "product": "Test Product"
    }'

  # Consultar estado del job
  curl "http://localhost:8000/jobs/{job_id}"

  # Obtener precios
  curl "http://localhost:8000/prices?product=Notebook&limit=10"
  ```

- **Beneficios:**
  - Scraping remoto vía HTTP
  - Procesamiento asíncrono
  - API documentada automáticamente (Swagger UI)
  - Integración con otros sistemas

---

### 9. Dashboard Interactivo con Streamlit

- **Categoría:** ✨ Feature
- **Impacto:** 📈 Medio (UX)
- **Esfuerzo:** ⏰ Alto (6 horas)
- **Descripción:** Interfaz web para visualización y gestión.
- **Implementación:**

  ```python
  # src/dashboard/app.py
  import streamlit as st
  import pandas as pd
  import plotly.express as px
  from datetime import datetime, timedelta

  st.set_page_config(
      page_title="BuyScraper Dashboard",
      page_icon="📊",
      layout="wide"
  )

  st.title("📊 BuyScraper Dashboard")

  # Sidebar
  st.sidebar.header("Configuración")

  # Cargar datos
  @st.cache_data(ttl=60)
  def load_data():
      df = pd.read_csv('data/prices.csv')
      df['timestamp'] = pd.to_datetime(df['timestamp'])
      return df

  df = load_data()

  # Filtros
  products = ['Todos'] + list(df['product'].unique())
  selected_product = st.sidebar.selectbox("Producto", products)

  date_range = st.sidebar.date_input(
      "Rango de fechas",
      value=(df['timestamp'].min(), df['timestamp'].max())
  )

  # Filtrar datos
  filtered_df = df.copy()
  if selected_product != 'Todos':
      filtered_df = filtered_df[filtered_df['product'] == selected_product]

  # Métricas principales
  col1, col2, col3, col4 = st.columns(4)

  with col1:
      st.metric("Total Registros", len(filtered_df))

  with col2:
      st.metric("Productos", filtered_df['product'].nunique())

  with col3:
      avg_price = filtered_df['price'].mean()
      st.metric("Precio Promedio", f"${avg_price:,.2f}")

  with col4:
      if len(filtered_df) > 0:
          price_change = filtered_df.iloc[-1]['price'] - filtered_df.iloc[0]['price']
          st.metric(
              "Cambio",
              f"${price_change:,.2f}",
              delta=f"{(price_change/filtered_df.iloc[0]['price']*100):.1f}%"
          )

  # Gráfico de evolución de precios
  st.subheader("📈 Evolución de Precios")
  fig = px.line(
      filtered_df,
      x='timestamp',
      y='price',
      color='product',
      title='Precio en el Tiempo'
  )
  st.plotly_chart(fig, use_container_width=True)

  # Tabla de datos
  st.subheader("📋 Datos Detallados")
  st.dataframe(
      filtered_df.sort_values('timestamp', ascending=False),
      use_container_width=True
  )

  # Nuevo scraping
  st.sidebar.markdown("---")
  st.sidebar.header("🔍 Nuevo Scraping")

  with st.sidebar.form("scrape_form"):
      url = st.text_input("URL")
      selector = st.text_input("Selector CSS", placeholder=".price")
      product_name = st.text_input("Nombre Producto")

      submitted = st.form_submit_button("Scrapear")

      if submitted:
          if url and selector:
              with st.spinner("Scrapeando..."):
                  try:
                      from src.scraper.scrape import run_single
                      run_single(url, selector, product_name, 'data/prices.csv', None, 'ARS')
                      st.success("✅ Scraping exitoso!")
                      st.cache_data.clear()
                      st.rerun()
                  except Exception as e:
                      st.error(f"❌ Error: {e}")
          else:
              st.warning("Por favor completa URL y Selector")
  ```

- **Ejecución:**
  ```bash
  pip install streamlit
  streamlit run src/dashboard/app.py
  ```
- **Beneficios:**
  - UI amigable para no-técnicos
  - Visualizaciones interactivas
  - Scraping manual desde UI
  - Auto-refresh de datos

---

### 10. Soporte para JavaScript-rendered Pages (Selenium)

- **Categoría:** ✨ Feature
- **Impacto:** 📈 Medio (más sitios soportados)
- **Esfuerzo:** ⏰ Alto (8 horas)
- **Descripción:** Scrapear sitios que cargan precios con JavaScript.
- **Implementación:**

  ```python
  # src/scraper/selenium_scraper.py
  from selenium import webdriver
  from selenium.webdriver.common.by import By
  from selenium.webdriver.support.ui import WebDriverWait
  from selenium.webdriver.support import expected_conditions as EC
  from selenium.webdriver.chrome.options import Options
  from typing import Optional

  class SeleniumScraper:
      def __init__(self, headless: bool = True):
          self.options = Options()
          if headless:
              self.options.add_argument('--headless')
          self.options.add_argument('--no-sandbox')
          self.options.add_argument('--disable-dev-shm-usage')
          self.options.add_argument(f'user-agent={USER_AGENT}')

          self.driver = None

      def __enter__(self):
          self.driver = webdriver.Chrome(options=self.options)
          return self

      def __exit__(self, exc_type, exc_val, exc_tb):
          if self.driver:
              self.driver.quit()

      def fetch_html(self, url: str, wait_for_selector: Optional[str] = None, timeout: int = 10) -> str:
          """
          Fetch HTML renderizado con JavaScript

          Args:
              url: URL to scrape
              wait_for_selector: CSS selector to wait for before returning
              timeout: Max wait time en segundos

          Returns:
              Rendered HTML
          """
          self.driver.get(url)

          if wait_for_selector:
              try:
                  WebDriverWait(self.driver, timeout).until(
                      EC.presence_of_element_located((By.CSS_SELECTOR, wait_for_selector))
                  )
              except TimeoutException:
                  logger.warning(f"Timeout waiting for {wait_for_selector} on {url}")

          return self.driver.page_source

      def extract_price_and_name(
          self,
          url: str,
          price_selector: str,
          name_selector: Optional[str] = None,
          wait_timeout: int = 10
      ) -> tuple[Optional[float], Optional[str]]:
          """Extrae precio y nombre usando Selenium"""
          html = self.fetch_html(url, price_selector, wait_timeout)

          # Ahora usar BeautifulSoup como antes
          from src.scraper.scrape import extract_price_and_name
          return extract_price_and_name(html, price_selector, name_selector)

  # Uso:
  with SeleniumScraper(headless=True) as scraper:
      price, name = scraper.extract_price_and_name(
          'https://spa-site.com/product',
          '.price',
          '.product-name'
      )
  ```

- **Configuración en YAML:**
  ```yaml
  sites:
    - url: "https://spa-site.com/product"
      price_selector: ".price"
      use_selenium: true # Flag para usar Selenium
      wait_for_selector: ".price" # Esperar a que cargue
  ```
- **Beneficios:**
  - Soporta SPAs (React, Vue, Angular)
  - Espera a elementos dinámicos
  - Puede interactuar con la página (clicks, scroll)

---

## 🟢 PRIORIDAD BAJA (Nice to Have)

### 11. Notificaciones por Email/SMS

- **Categoría:** ✨ Feature
- **Impacto:** 📊 Bajo (conveniencia)
- **Esfuerzo:** ⏳ Medio (3 horas)
- **Descripción:** Notificar cuando el precio baja un porcentaje configurable.

---

### 12. Machine Learning para Predicción de Precios

- **Categoría:** ✨ Feature
- **Impacto:** 📊 Bajo (experimental)
- **Esfuerzo:** ⏰ Alto (20+ horas)
- **Descripción:** Modelo predictivo para estimar precios futuros.

---

### 13. Exportación a Múltiples Formatos

- **Categoría:** ✨ Feature
- **Impacto:** 📊 Bajo (conveniencia)
- **Esfuerzo:** ⏱️ Rápido (1 hora)
- **Descripción:** Exportar a JSON, Excel, Parquet además de CSV.

---

### 14. Healthchecks Automáticos

- **Categoría:** 🐛 Bug Fix / ⚡ Performance
- **Impacto:** 📊 Bajo
- **Esfuerzo:** ⏳ Medio (2 horas)
- **Descripción:** Verificar periódicamente que los selectores CSS siguen funcionando.

---

### 15. Containerización con Docker

- **Categoría:** 📚 Docs / DevOps
- **Impacto:** 📊 Bajo (deploy más fácil)
- **Esfuerzo:** ⏳ Medio (2 horas)
- **Implementación:**

  ```dockerfile
  FROM python:3.13-slim

  WORKDIR /app

  # Instalar dependencias del sistema
  RUN apt-get update && apt-get install -y \
      gcc \
      && rm -rf /var/lib/apt/lists/*

  # Copiar requirements e instalar
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt

  # Copiar código
  COPY src/ ./src/
  COPY config/ ./config/
  COPY data/ ./data/

  # Crear volumen para datos persistentes
  VOLUME ["/app/data"]

  # Default command
  CMD ["python", "src/scraper/scrape.py", "--sites", "config/sites.yaml", "--output", "data/prices.csv"]
  ```

  ```yaml
  # docker-compose.yml
  version: "3.8"

  services:
    scraper:
      build: .
      volumes:
        - ./data:/app/data
        - ./config:/app/config
      environment:
        - TZ=America/Argentina/Buenos_Aires
      restart: unless-stopped
  ```

---

## 📊 MATRIZ DE PRIORIZACIÓN

| #   | Mejora                    | Prioridad | Impacto  | Esfuerzo  | ROI        |
| --- | ------------------------- | --------- | -------- | --------- | ---------- |
| 1   | pytest en requirements    | 🔴 Alta   | 🎯 Alto  | ⏱️ Rápido | ⭐⭐⭐⭐⭐ |
| 2   | Sistema de Logging        | 🔴 Alta   | 🎯 Alto  | ⏳ Medio  | ⭐⭐⭐⭐⭐ |
| 3   | Respetar robots.txt       | 🔴 Alta   | 🎯 Alto  | ⏳ Medio  | ⭐⭐⭐⭐⭐ |
| 4   | Rate Limiting             | 🔴 Alta   | 🎯 Alto  | ⏳ Medio  | ⭐⭐⭐⭐⭐ |
| 5   | Retry Logic               | 🔴 Alta   | 🎯 Alto  | ⏳ Medio  | ⭐⭐⭐⭐⭐ |
| 6   | Expandir Tests            | 🟡 Media  | 📈 Medio | ⏳ Medio  | ⭐⭐⭐⭐   |
| 7   | Migrar a SQLite           | 🟡 Media  | 📈 Medio | ⏰ Alto   | ⭐⭐⭐     |
| 8   | API REST (FastAPI)        | 🟡 Media  | 📈 Medio | ⏰ Alto   | ⭐⭐⭐     |
| 9   | Dashboard (Streamlit)     | 🟡 Media  | 📈 Medio | ⏰ Alto   | ⭐⭐⭐     |
| 10  | Soporte Selenium          | 🟡 Media  | 📈 Medio | ⏰ Alto   | ⭐⭐⭐     |
| 11  | Notificaciones            | 🟢 Baja   | 📊 Bajo  | ⏳ Medio  | ⭐⭐       |
| 12  | ML Predicciones           | 🟢 Baja   | 📊 Bajo  | ⏰ Alto   | ⭐         |
| 13  | Export Múltiples Formatos | 🟢 Baja   | 📊 Bajo  | ⏱️ Rápido | ⭐⭐⭐     |
| 14  | Health Checks             | 🟢 Baja   | 📊 Bajo  | ⏳ Medio  | ⭐⭐       |
| 15  | Docker                    | 🟢 Baja   | 📊 Bajo  | ⏳ Medio  | ⭐⭐       |

---

## 🎯 ROADMAP SUGERIDO

### Sprint 1 (Quick Wins - 1 día)

1. ✅ Agregar pytest a requirements.txt (5 min)
2. ✅ Implementar sistema de logging (1 hora)
3. ✅ Respetar robots.txt (2 horas)
4. ✅ Implementar rate limiting (2 horas)
5. ✅ Retry logic (2 horas)

**Total: ~7 horas** | **Impacto: Muy Alto**

### Sprint 2 (Quality & Testing - 2 días)

1. ✅ Expandir cobertura de tests (3 horas)
2. ✅ Export a múltiples formatos (1 hora)
3. ✅ Health checks automáticos (2 horas)
4. ✅ Documentación mejorada (2 horas)

**Total: ~8 horas** | **Impacto: Alto**

### Sprint 3 (Database & Persistence - 2 días)

1. ✅ Migrar a SQLite (6 horas)
2. ✅ Script de migración CSV → SQLite (1 hora)
3. ✅ Tests para DB layer (2 horas)

**Total: ~9 horas** | **Impacto: Medio**

### Sprint 4 (Web Features - 1 semana)

1. ✅ API REST con FastAPI (8 horas)
2. ✅ Dashboard con Streamlit (6 horas)
3. ✅ Documentación API (2 horas)

**Total: ~16 horas** | **Impacto: Medio**

### Sprint 5 (Advanced - Opcional)

1. ✅ Soporte Selenium (8 horas)
2. ✅ Notificaciones (3 horas)
3. ✅ Docker (2 horas)
4. ✅ CI/CD con GitHub Actions (3 horas)

**Total: ~16 horas** | **Impacto: Bajo-Medio**

---

## 🚀 QUICK START - Implementar Top 5

Si solo tienes **1 día**, implementa estas 5 mejoras críticas:

```bash
# 1. Agregar pytest (5 min)
echo "pytest>=7.0.0" >> requirements.txt
pip install pytest

# 2-5. Implementar las otras 4 mejoras siguiendo el código proporcionado
# Ver secciones 2, 3, 4, 5 arriba
```

**Resultado:** Aplicación mucho más robusta, profesional y production-ready.

---

## 📝 NOTAS FINALES

- **Prioriza según tu objetivo:**

  - Portfolio → Sprint 1 + Sprint 2
  - Producción → Todos los sprints
  - Aprendizaje → Sprint 4 + Sprint 5

- **No sobre-ingenierices:**

  - Para scraping personal, Sprint 1 es suficiente
  - Para portfolio profesional, Sprint 1 + 2 es ideal
  - Solo implementa features avanzadas si las necesitas

- **Mantén la simplicidad:**
  - El valor actual del proyecto es su simplicidad
  - No agregues complejidad innecesaria
  - Cada feature debe resolver un problema real

**¿Alguna mejora que quieras implementar primero? ¡Puedo ayudarte a desarrollarla!**
