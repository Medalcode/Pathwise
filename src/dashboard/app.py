"""
Dashboard interactivo para BuyScraper usando Streamlit.
Permite visualizar precios históricos y ejecutar scrapers manuales.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import sys
from pathlib import Path
from datetime import datetime

# Configuración de página
st.set_page_config(
    page_title="BuyScraper Dashboard",
    page_icon="🛒",
    layout="wide"
)

# Agregar raíz del proyecto al path para importar módulos internos
project_root = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.scraper.database import get_db_connection, DEFAULT_DB_PATH
from src.scraper.scrape import run_single
from src.scraper.ua import ua_rotator

# --- Funciones de Datos ---

@st.cache_data(ttl=60) # Cache por 60 segundos
def load_data():
    """Carga todos los datos de precios desde la DB."""
    try:
        conn = get_db_connection(DEFAULT_DB_PATH) 
        # Hack: get_db_connection es un context manager, lo usamos manual aquí o con 'with' dentro de la funcion
        with conn as c:
            query = "SELECT * FROM prices ORDER BY timestamp DESC"
            df = pd.read_sql_query(query, c)
            
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['price'] = pd.to_numeric(df['price'], errors='coerce')
        return df
    except Exception as e:
        st.error(f"Error cargando datos: {e}")
        return pd.DataFrame()

def run_scraper_action(url, selector, product):
    """Ejecuta el scraper para una URL específica."""
    try:
        with st.spinner(f'Scrapeando {product}...'):
            # Ejecutamos scraping directo (usando lógica v3 implícita en scrape.py)
            run_single(
                url=url,
                selector=selector,
                product=product,
                output="data/prices.csv", # Legacy backup
                name_selector=None,
                currency="USD"
            )
        st.success(f"✅ Scraping completado para {product}")
        st.cache_data.clear() # Limpiar cache para recargar datos nuevos
        return True
    except Exception as e:
        st.error(f"❌ Error durante scraping: {e}")
        return False

# --- UI Principal ---

st.title("🛒 BuyScraper Dashboard")

# Sidebar
st.sidebar.header("Acciones")
mode = st.sidebar.radio("Modo", ["Visualización", "Scraping Manual", "Configuración"])

# Cargar datos
df = load_data()

if mode == "Visualización":
    # KPIs
    col1, col2, col3 = st.columns(3)
    
    total_records = len(df)
    unique_products = df['product'].nunique() if not df.empty else 0
    last_update = df['timestamp'].max() if not df.empty else "N/A"
    
    col1.metric("Total Registros", total_records)
    col2.metric("Productos Rasteados", unique_products)
    col3.metric("Última Actualización", str(last_update)[:19])
    
    st.divider()
    
    if not df.empty:
        # Filtros
        products = st.multiselect("Filtrar por Producto", options=df['product'].unique(), default=df['product'].unique())
        
        filtered_df = df[df['product'].isin(products)]
        
        # Gráfico de Tendencia
        st.subheader("📈 Tendencia de Precios")
        fig = px.line(
            filtered_df, 
            x='timestamp', 
            y='price', 
            color='product', 
            markers=True,
            title='Evolución de Precios por Producto',
            hover_data=['site', 'url']
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Tabla de Datos
        st.subheader("📋 Datos Recientes")
        st.dataframe(filtered_df.sort_values('timestamp', ascending=False), use_container_width=True)
    else:
        st.info("No hay datos en la base de datos. ¡Inicia un scraping!")

elif mode == "Scraping Manual":
    st.header("🕷️ Lanzar Scraper")
    
    with st.form("scrape_form"):
        url = st.text_input("URL del Producto http://...")
        selector = st.text_input("Selector CSS del Precio (ej: .price-tag)")
        product_name = st.text_input("Nombre del Producto (ej: iPhone 15)")
        
        submitted = st.form_submit_button("Scrapear Ahora")
        
        if submitted:
            if url and selector and product_name:
                run_scraper_action(url, selector, product_name)
            else:
                st.warning("Por favor completa todos los campos")

elif mode == "Configuración":
    st.header("⚙️ Configuración del Sistema")
    
    st.subheader("Información del Sistema")
    st.code(f"""
    Python Path: {sys.executable}
    Project Root: {project_root}
    Database: {DEFAULT_DB_PATH}
    """)
    
    st.subheader("User-Agent Actual (Simulado)")
    if st.button("Generar Nuevo UA"):
        st.code(ua_rotator.get_random_ua())
