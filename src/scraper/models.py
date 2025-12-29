"""
Modelos de datos Pydantic para BuyScraper v3.
Define la estructura estricta para Recetas de scraping y Datos extraídos.
"""

from typing import Dict, Optional, Any
from pydantic import BaseModel, Field, HttpUrl, validator
from enum import Enum
from decimal import Decimal

class SelectorType(str, Enum):
    CSS = "css"
    XPATH = "xpath" # Preparado para futuro soporte
    REGEX = "regex"

class SelectorConfig(BaseModel):
    """Configuración de un selector específico"""
    type: SelectorType = SelectorType.CSS
    value: str
    attribute: Optional[str] = None # Ej: "href" para links, None para texto
    regex: Optional[str] = None     # Para limpieza post-extracción

class ScrapeRecipe(BaseModel):
    """
    Receta de Scraping (v3).
    Define cómo extraer datos de un dominio específico sin acoplar código.
    """
    domain: str
    selectors: Dict[str, SelectorConfig]
    meta: Dict[str, Any] = Field(default_factory=dict)
    
    @validator('selectors')
    def validate_required_selectors(cls, v):
        if 'price' not in v:
            raise ValueError("La receta debe incluir al menos un selector para 'price'")
        return v

class ExtractedProduct(BaseModel):
    """
    Modelo canónico de producto extraído.
    Garantiza que lo que guardamos en DB siempre tenga el formato correcto.
    """
    site: str
    product_title: str
    price: Optional[Decimal]
    currency: str = "USD"
    url: HttpUrl
    timestamp: str 
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }
