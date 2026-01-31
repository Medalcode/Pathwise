# Diagnóstico de Escalabilidad y Arquitectura - Pathwise

## Resumen Ejecutivo

El sistema actual es un **monolito distribuido frágil**. Aunque funcional para un caso de uso estático o de un solo usuario (local), posee bloqueos arquitectónicos fundamentales que impedirán su despliegue en producción real (multi-instancia/cloud) y el trabajo colaborativo.

## 1. Riesgos Críticos de Escalabilidad

### A. Persistencia y Estado (Riesgo Extremo)

- **Modelo "Sync" SQLite**: El sistema descarga una DB SQLite al inicio y la sube al final.
  - **Consecuencia**: En un entorno escalado (e.g., Cloud Run con 2+ instancias), **la pérdida de datos es garantizada**. La Instancia A sobrescribirá los datos de la Instancia B al sincronizar.
  - **Bloqueo**: Impide totalmente tener más de 1 instancia activa ateniendo tráfico.
- **Ventana de Pérdida de Datos**: El backup corre cada 5 minutos. Si el servidor falla en el minuto 4:59, se pierden 5 minutos de trabajo del usuario.

### B. Arquitectura de Backend (Alta Estática)

- **Acoplamiento Fuerte**: `server.js` conoce demasiados detalles: configuración de Express, lógica de sincronización de DB, servicio de estáticos y manejo de errores.
- **Inyección de Dependencias Global**: El módulo `db.js` exporta una variable mutable `let db`. Si el orden de importación cambia o la inicialización falla, el sistema queda en un estado inconsistente.
- **Hardcoding de Usuario**: Se detectó `userId = 1` hardcodeado en las rutas. Esto limita la aplicación a un solo tenant/usuario para siempre.

### C. Frontend (Deuda Técnica)

- **Infierno de Scripts**: `index.html` carga manualmente ~25 archivos JS. El orden es implícito y frágil. Agregar una librería nueva requiere modificar el HTML.
- **Contaminación Global**: Al no usar módulos (ESM) ni bundler, todas las funciones y variables son globales (`window`). El riesgo de conflictos de nombres es altísimo al crecer el equipo.

## 2. Recomendaciones Arquitectónicas

### Corto Plazo (Refactorización de Estabilidad)

1.  **Abstraer la Capa de Datos**: Dejar de exponer `sqlite3` directamente. Crear un `Repository Pattern` que separe la lógica de negocio de la implementación (SQLite vs Postgres).
2.  **Limpiar el Entry Point**: `server.js` debe solo orquestar. La lógica de "Sync" debe estar encapsulada.
3.  **Modularización Frontend**: Agrupar scripts relacionados y usar un patrón de Namespaces (e.g., `Panoptes.Profile`, `Panoptes.Auth`) para reducir polución global.

### Medio Plazo (Escalabilidad Real)

1.  **Base de Datos Real**: Migrar a PostgreSQL o MySQL gestionado. Eliminar el modelo de "bajar/subir archivo .db".
2.  **API Layering**: Implementar Controladores reales separados de las Rutas.
    - _Actual_: Ruta -> Lógica BD.
    - _Ideal_: Ruta -> Controlador -> Servicio -> Repositorio.

## 3. Plan de Acción Inmediato (Refactorización Mínima)

Aplicaremos la regla de **"Separación de Responsabilidades"** para sanear el Backend sin reescribir todo.

1.  **Refactorizar `server.js`**: Extraer `App` (Lógica Express) de `Server` (Ejecución y Sync).
2.  **Estandarizar Inicialización**: Asegurar que la DB esté lista antes de aceptar tráfico, sin lógica espagueti en el arranque.

---

_Autor: Arquitecto de Software | Fecha: 2026-01-31_
