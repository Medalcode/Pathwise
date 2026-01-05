from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import pandas as pd
import glob
import os
from typing import List, Dict

app = FastAPI(title="Panoptes API", version="3.1.0")

# Permitir acceso desde Dashboard Hestia u otros
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/dashboard", response_class=HTMLResponse)
def serve_dashboard():
    """Serves the local visualization dashboard."""
    with open("src/dashboard/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/")
def health_check():
    return {"status": "online", "system": "Panoptes Data Intelligence", "dashboard": "http://localhost:8000/dashboard"}

@app.get("/reports/latest")
def get_latest_report():
    """Devuelve los datos del último reporte Excel generado."""
    try:
        # Buscar archivo más reciente en reports/
        list_of_files = glob.glob('reports/*.xlsx') 
        if not list_of_files:
            return {"error": "No reports found"}
            
        latest_file = max(list_of_files, key=os.path.getctime)
        
        # Leer con Pandas y convertir a JSON
        df = pd.read_excel(latest_file)
        # Convertir NaN a null para JSON válido
        data = df.where(pd.notnull(df), None).to_dict(orient='records')
        
        return {
            "file": os.path.basename(latest_file),
            "generated_at": os.path.getctime(latest_file),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/targets")
def get_targets():
    """Lee la configuración actual de objetivos móviles."""
    import yaml
    try:
        with open("config/mobile_targets.yaml", "r") as f:
            return yaml.safe_load(f)
    except Exception as e:
        return {"error": str(e)}
