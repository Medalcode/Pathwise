"""
Gestor de Recetas de Scraping (v3).
Carga y valida configuraciones YAML usando los modelos Pydantic.
"""

import yaml
from pathlib import Path
from typing import List, Dict
from pydantic import ValidationError
from .models import ScrapeRecipe
from .logger import get_logger

logger = get_logger('buyscraper.recipes')

def load_recipe(path: str) -> ScrapeRecipe:
    """Carga y valida una receta desde un archivo YAML."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            
        recipe = ScrapeRecipe(**data)
        logger.info(f"Receta cargada y validada para: {recipe.domain}")
        return recipe
    except FileNotFoundError:
        logger.error(f"Archivo de receta no encontrado: {path}")
        raise
    except ValidationError as e:
        logger.error(f"Error de validación en receta {path}: {e}")
        raise
    except yaml.YAMLError as e:
        logger.error(f"Error de sintaxis YAML en {path}: {e}")
        raise

def load_recipes_from_dir(directory: str) -> Dict[str, ScrapeRecipe]:
    """Carga todas las recetas .yaml en un directorio."""
    recipes = {}
    p = Path(directory)
    if not p.exists() or not p.is_dir():
        return recipes

    for file in p.glob("*.yaml"):
        try:
            recipe = load_recipe(str(file))
            recipes[recipe.domain] = recipe
        except Exception:
            continue
            
    return recipes
