# Usar imagen oficial de Playwright (incluye Python y navegadores)
FROM mcr.microsoft.com/playwright/python:v1.35.0-jammy

# Variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo
WORKDIR /app

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# Copiar código fuente
COPY . .

# Crear directorios necesarios para logs y datos
RUN mkdir -p logs data && chmod 777 logs data

# Exponer puertos (API: 8000, Streamlit: 8501)
EXPOSE 8000 8501

# Comando por defecto (sobrescrito por docker-compose)
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
