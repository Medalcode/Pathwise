# 🚀 Guía de Opciones de Ejecución y Despliegue

Este documento explica las diferentes formas en que puedes "tener" y ejecutar BuyScraper, desde el uso personal hasta un despliegue empresarial.

## 1. Nivel Básico: Ejecución Local (Tu PC)

**Estado:** ✅ Configurado actualmente.

Ideal para desarrollo, pruebas, o uso personal bajo demanda.

**Cómo usar:**

```bash
# Opción A: Script Directo (Rápido)
python src/scraper/scrape.py --url "https://..." --selector ".price"

# Opción B: Dashboard Visual
streamlit run src/dashboard/app.py

# Opción C: Docker (Limpio)
docker-compose up
```

**Pros:** Gratis, control total.
**Contras:** Solo funciona si tu PC está encendida.

---

## 2. Nivel Intermedio: Repositorio (GitHub)

**Estado:** ⚠️ Pendiente de `git push`.

Ideal para resguardar el código, compartirlo como Open Source o usarlo en tu portafolio profesional.

**Pasos para subir:**

1. Crea un repositorio vacío en GitHub.
2. Conecta tu carpeta local:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/BuyScraper.git
   git branch -M main
   git push -u origin main
   ```

**Pros:** Backup seguro, visibilidad profesional.
**Contras:** El código "vive" ahí, pero no se "ejecuta" solo.

---

## 3. Nivel Avanzado: Despliegue 24/7 (VPS / Servidor)

**Estado:** 🏗️ Listo para desplegar (Dockerizado).

Ideal si necesitas monitoreo continuo de precios, alertas en tiempo real y API pública.

**Requisitos:**

- Un servidor VPS (DigitalOcean Droplet, AWS EC2, Raspberry Pi). ~5$/mes.
- Docker instalado en el servidor.

**Pasos de Despliegue:**

1. Clona tu repo en el servidor:
   ```bash
   git clone https://github.com/TU_USUARIO/BuyScraper.git
   cd BuyScraper
   ```
2. Crea un archivo `.env` con tus secrets (si los hubiera).
3. Lanza el stack:
   ```bash
   docker-compose up -d --build
   ```

**Arquitectura Activa:**

- **API y Dashboard:** Disponibles en la IP de tu servidor.
- **Worker:** Corriendo en background procesando colas de Redis.
- **Persistencia:** Los datos (`prices.db`) se guardan en el disco del servidor.

**Pros:** Automatización total, alertas mientras duermes.
**Contras:** Coste mensual del servidor, requiere mantenimiento de seguridad.
