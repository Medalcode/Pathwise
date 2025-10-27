# Economía en tiempo real: precios de productos en línea

Pequeño proyecto para el portafolio que recolecta precios de productos desde sitios web y analiza su evolución en el tiempo.

Contenido:
- `src/scraper/scrape.py` - scraper genérico que obtiene precio usando una URL y un selector CSS; guarda resultados en CSV.
- `config/sites.yaml` - ejemplo de configuración por sitio (URL, selector CSS, nombre de producto).
- `data/sample_prices.csv` - datos de ejemplo para probar el notebook.
- `notebooks/analysis.ipynb` - notebook con análisis temporal y visualizaciones (Plotly y matplotlib).

Requisitos

Instala las dependencias en un entorno virtual:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt
```

Uso

Ejecutar el scraper con un archivo de configuración YAML (o pasar URL + selector):

```powershell
python src\scraper\scrape.py --sites config\sites.yaml --output data/prices.csv
```

O correr para una única URL:

```powershell
python src\scraper\scrape.py --url "https://ejemplo.tld/producto" --selector ".price" --product "Mi Producto" --output data/prices.csv
```

Abrir el notebook `notebooks/analysis.ipynb` en JupyterLab/Notebook para ver los ejemplos de visualización.

Notas

- Este scraper es genérico y requiere que indiques el selector CSS correcto para cada sitio. Revisa las políticas de los sitios antes de hacer scraping y respeta sus términos y robots.txt.
- Puedes programar ejecuciones periódicas con el programador del sistema (Task Scheduler en Windows) o un cron en Linux.
