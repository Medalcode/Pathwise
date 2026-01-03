"""
API REST para BuyScraper usando FastAPI.
Permite iniciar scraping y consultar datos históricos.
Protegido por API Key.
"""

from fastapi import FastAPI, HTTPException, Query, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
import logging
import sys
import os
from pathlib import Path

# Agregar raíz del proyecto al path
project_root = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.scraper.database import get_price_history, get_stats, init_db
from src.worker.tasks import scrape_task

# Configurar logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

# --- Seguridad ---
API_KEY = os.getenv("API_KEY", "secret-dev-key") # Default inseguro para dev
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    """Valida la API Key en el header X-API-Key"""
    if api_key_header == API_KEY:
        return api_key_header
    else:
        raise HTTPException(
            status_code=403, 
            detail="Credenciales inválidas. Provee header 'X-API-Key'"
        )

app = FastAPI(
    title="BuyScraper API",
    description="API Enterprise para monitoreo de precios",
    version="3.1.0"
)

# Inicializar DB al arranque
@app.on_event("startup")
def startup_event():
    logger.info("Iniciando API...")
    try:
        init_db()
    except Exception as e:
        logger.error(f"Error iniciando DB: {e}")

# --- Modelos Pydantic ---

class ScrapeRequest(BaseModel):
    url: HttpUrl
    selector: str
    product: str
    name_selector: Optional[str] = None
    currency: Optional[str] = "USD"
    dynamic: bool = False

class ScrapeResponse(BaseModel):
    status: str
    message: str
    job_id: str

class PriceRecord(BaseModel):
    timestamp: str
    site: str
    product: str
    price: Optional[float]
    currency: Optional[str]
    url: str

class StatsResponse(BaseModel):
    total_records: int
    products: int
    sites: int
    last_update: Optional[str]

# --- Endpoints ---

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/scrape", response_model=ScrapeResponse, tags=["Actions"])
async def trigger_scrape(request: ScrapeRequest, api_key: str = Depends(get_api_key)):
    """
    Encola una tarea de scraping al cluster de Celery workers.
    REQUIERE API KEY.
    """
    try:
        # Encolar tarea asíncrona en Redis/Celery
        task = scrape_task.delay(
            url=str(request.url),
            selector=request.selector,
            name_selector=request.name_selector,
            dynamic=request.dynamic,
            product_fallback=request.product
        )
        
        return {
            "status": "queued",
            "message": f"Tarea encolada en Celery (Mode: {'Dynamic' if request.dynamic else 'Static'})",
            "job_id": str(task.id)
        }
    except Exception as e:
        logger.error(f"Error encolando tarea: {e}")
        # Fallback de error claro
        raise HTTPException(status_code=500, detail=f"Error interno (Redis/Celery): {str(e)}")

@app.get("/prices", response_model=List[PriceRecord], tags=["Data"])
def get_prices(
    product: Optional[str] = Query(None, description="Filtrar por nombre"),
    limit: int = Query(100, ge=1, le=1000),
    api_key: str = Depends(get_api_key) # Proteger lectura también
):
    """Obtiene el historial de precios más reciente."""
    try:
        # Nota: get_price_history retorna dicts, Pydantic los convierte a PriceRecord
        results = get_price_history(product=product, limit=limit)
        return results
    except Exception as e:
        logger.error(f"Error fetching prices: {e}")
        raise HTTPException(status_code=500, detail="Error de base de datos")

@app.get("/stats", response_model=StatsResponse, tags=["Data"])
def get_db_stats(api_key: str = Depends(get_api_key)):
    """Obtiene estadísticas generales de la base de datos."""
    try:
        return get_stats()
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail="Error interno")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
