"""
API REST para BuyScraper usando FastAPI.
Permite iniciar scraping y consultar datos históricos.
"""

from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
import logging
import sys
from pathlib import Path

# Agregar raíz del proyecto al path
project_root = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.scraper.database import get_price_history, get_stats, init_db
from src.scraper.scrape import run_single, logger as scraper_logger

# Configurar logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

app = FastAPI(
    title="BuyScraper API",
    description="API para monitoreo de precios y scraping automático",
    version="1.0.0"
)

# Inicializar DB al arranque
@app.on_event("startup")
def startup_event():
    init_db()

# --- Modelos Pydantic ---

class ScrapeRequest(BaseModel):
    url: HttpUrl
    selector: str
    product: str
    name_selector: Optional[str] = None
    currency: Optional[str] = "USD"

class ScrapeResponse(BaseModel):
    status: str
    message: str
    job_id: str  # Por ahora simulado, en el futuro UUID real

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

# --- Funciones Auxiliares ---

def execute_scraping_task(req: ScrapeRequest):
    """Función wrapper para ejecutar scraping en background"""
    try:
        logger.info(f"Background task: Scraping {req.url}")
        # Usamos run_single que ya integra toda la lógica de robots/limit/retry/db
        run_single(
            url=str(req.url),
            selector=req.selector,
            product=req.product,
            output="data/prices.csv", # Keep CSV sync for now
            name_selector=req.name_selector,
            currency=req.currency
        )
        logger.info(f"Background task finished: {req.url}")
    except Exception as e:
        logger.error(f"Background task failed for {req.url}: {e}")

# --- Endpoints ---

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/scrape", response_model=ScrapeResponse, tags=["Actions"])
async def trigger_scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """
    Inicia un proceso de scraping en segundo plano.
    Retorna inmediatamente mientras el servidor trabaja.
    """
    background_tasks.add_task(execute_scraping_task, request)
    return {
        "status": "accepted",
        "message": f"Scraping iniciado para {request.product}",
        "job_id": f"job_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    }

@app.get("/prices", response_model=List[PriceRecord], tags=["Data"])
def get_prices(
    product: Optional[str] = Query(None, description="Filtrar por nombre de producto (parcial)"),
    limit: int = Query(100, ge=1, le=1000)
):
    """Obtiene el historial de precios más reciente."""
    try:
        results = get_price_history(product=product, limit=limit)
        return results
    except Exception as e:
        logger.error(f"Error fetching prices: {e}")
        raise HTTPException(status_code=500, detail="Error interno consultando base de datos")

@app.get("/stats", response_model=StatsResponse, tags=["Data"])
def get_db_stats():
    """Obtiene estadísticas generales de la base de datos."""
    try:
        return get_stats()
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo estadísticas")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
