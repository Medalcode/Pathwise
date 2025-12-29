# 🚀 ROADMAP TÉCNICO - Hacia BuyScraper v3.0

Este documento recopila decisiones estratégicas y arquitectónicas para la próxima evolución mayor del proyecto, enfocada en escalar a una herramienta de nivel empresarial con Playwright, arquitecturas desacopladas y validación robusta.

**Fecha de Propuesta:** 28 de diciembre de 2025

---

## 🏗️ 1. Abstracción de Selectores (Engine Decoupling)

**Problema Actual:** Los selectores CSS se pasan como argumentos o config básica, lo que acopla el código a la estructura HTML actual.
**Solución Propuesta:** Sistema de **"Recetas"** declarativas (JSON/YAML).

- Separar la definición de extracción del motor de ejecución.
- Permitir actualización de lógica de extracción "en caliente" (sin redeploy).

**Ejemplo de Receta v3:**

```yaml
domain: "tienda-ejemplo.com"
meta:
  version: "1.0"
  author: "Medalcode"
selectors:
  price:
    css: "span.price-tag-fraction"
    regex: "(\d+[\.,]\d+)" # Opcional: Regex post-extracción
  title:
    css: "h1.product-title"
  stock:
    xpath: "//div[@id='stock-status']"
```

---

## 🛡️ 2. User-Agent Rotation & Evasión

**Problema Actual:** User-Agent estático (simula Chrome Windows) que es fácil de identificar y bloquear (fingerprinting).
**Solución Propuesta:**

- Integrar `fake-useragent` para rotación dinámica.
- Implementar perfiles de navegador completos (headers + UA consistentes).
- Aumentar drásticamente la tasa de éxito en sitios con protección antibot básica.

---

## ✅ 3. Validación de Datos (Pydantic Strict Mode)

**Problema Actual:** Validación ad-hoc en `parse_price` y conversión implícita.
**Solución Propuesta:**

- Usar **Pydantic Models** en el núcleo de la extracción.
- Definir contratos estrictos para los datos antes de persistencia.
- Manejo de tipos garantizado (Float, Decimal, Currency Enum).

```python
class ProductData(BaseModel):
    title: str = Field(..., min_length=1)
    price: Decimal = Field(..., gt=0)
    currency: CurrencyCode
    in_stock: bool = True
```

---

## 🎭 4. Migración a Playwright (Reemplazo de Selenium)

**Decisión Estratégica:**

- **Estado Actual:** Planeado "Selenium" para SPAs.
- **Cambio de Rumbo:** Adoptar **Playwright**.

**¿Por qué Playwright?**

1.  **Velocidad:** Engine moderno, más rápido que Selenium WebDriver.
2.  **Async Nativo:** Se integra perfectamente con FastAPI (`async def`).
3.  **Modern Web:** Mejor manejo de Shadow DOM y SPAs complejos (React/Vue/Angular).
4.  **Stealth:** Herramientas de evasión de bots más avanzadas y difíciles de detectar.
5.  **Codegen:** Generador de selectores automático.

---

## 📊 5. Análisis Profesional

**Mensaje al Cliente/Empleador:**

- **Responsabilidad:** Ratelimit/Robots.txt nativos demuestran ética y madurez.
- **Ciclo de Vida:** Integración Data-Analysis (Pandas/Plotly) muestra visión end-to-end.
- **Resiliencia:** Diseño "Failure-First" (Retries, Logging, Backoff) demuestra experiencia real.

---

## 📅 Plan de Acción Sugerido

1.  **Fase 1 (Refactor):** Implementar sistema de Recetas YAML y validación Pydantic en el engine actual (`bs4`).
2.  **Fase 2 (Playwright):** Crear un nuevo `PlaywrightEngine` que consuma las mismas Recetas pero ejecute browser headless.
3.  **Fase 3 (Orquestación):** API v3 para administrar scraping jobs distribuidos.
