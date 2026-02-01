# Contrato de Interfaz: Módulo "Upload CV"

## Endpoint: `POST /api/upload/cv`

Este endpoint procesa un archivo PDF de currículum vitae, extrae su información estructurada (usando IA o Regex) y almacena el perfil resultante.

---

### 1. Inputs Esperados

**Headers:**

- `Content-Type`: `multipart/form-data`

**Body (Form Data):**

| Campo        | Tipo   | Requerido | Restricciones                                                                  |
| ------------ | ------ | --------- | ------------------------------------------------------------------------------ |
| `cv`         | File   | **SÍ**    | - Formato: **Solo PDF** (`application/pdf`)<br>- Tamaño Máx: **10 MB**         |
| `groqApiKey` | String | No        | API Key opcional de Groq. Si se omite, usa la del servidor o fallback a Regex. |

---

### 2. Outputs Garantizados

#### ✅ Éxito (HTTP 200 OK)

Retorna la información estructurada extraída del CV.

**Estructura JSON:**

```json
{
  "success": true,
  "message": "CV procesado exitosamente",
  "data": {
    "personalInfo": {
      "email": "string | null",
      "phone": "string | null",
      "firstName": "string | null",
      "lastName": "string | null",
      "currentTitle": "string | null",
      "linkedin": "string | null",
      "portfolio": "string | null",
      "city": "string | null",
      "country": "string | null"
    },
    "experience": [
      {
        "title": "string",
        "company": "string",
        "startDate": "YYYY-MM (aprox)",
        "endDate": "YYYY-MM | Presente",
        "current": boolean,
        "description": "string"
      }
    ],
    "education": [
      {
        "degree": "string",
        "school": "string",
        "startDate": "number (Year)",
        "endDate": "number (Year)",
        "current": boolean
      }
    ],
    "skills": ["string"]
  },
  "stats": {
    "pages": number,
    "textLength": number,
    "method": "AI_GROQ" | "REGEX_FALLBACK"
  }
}
```

---

### 3. Estados de Error & Mapping

El backend garantiza los siguientes códigos de estado para permitir manejo granular en UI.

| Código HTTP | Error (Internal Code)  | Mensaje UI Sugerido                                                         | Causa Técnica                                                       |
| ----------- | ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **400**     | `MISSING_FILE`         | "Por favor selecciona un archivo."                                          | `req.file` es undefined.                                            |
| **422**     | `INVALID_FILE_CONTENT` | "El archivo parece ser una imagen encuadrada o está dañado."                | PDF parseado tiene < 50 caracteres (ej. escaneo como imagen).       |
| **422**     | `EXTRACTION_FAILED`    | "No pudimos leer tu contacto. Revisa que el PDF tenga texto seleccionable." | Validación falló: sin email/teléfono Y sin nombre.                  |
| **500**     | `INTERNAL_ERROR`       | "Error del servidor. Intenta en unos minutos."                              | Fallo en `pdf-parse`, `fs` system, o corrupción de DB.              |
| **500**     | `MULTER_ERROR`         | "El archivo no es válido (Solo PDF < 10MB)."                                | Error atrapado por middleware global (ej. tipo archivo incorrecto). |

---

### 4. Edge Cases & Comportamiento

1. **PDF Escaneado (Imagen)**
   - **Backend:** Detecta `textLength < 50`.
   - **Respuesta:** `422 Unprocessable Entity` - `El PDF no contiene texto legible...`.
   - **Frontend:** Debe advertir al usuario que suba un PDF con texto seleccionable (OCR no soportado).

2. **Fallo de IA (Groq)**
   - **Backend:** Catch silencioso en el bloque de IA -> Loguea error -> Fallback automático a `REGEX_FALLBACK`.
   - **Respuesta:** `200 OK` con datos parciales (Regex es menos preciso).
   - **Frontend:** Transparente para el usuario, pero puede notar menor calidad en la extracción.

3. **Concurrencia de Archivos**
   - **Backend:** Backend limpia (`unlink`) el archivo temporal en el bloque `finally` **siempre**, incluso si hay crash.
   - **Garantía:** No habrá fugas de espacio en disco que degraden el servicio.

4. **Bloqueo de Persistencia (Cloud Storage)**
   - **Backend:** La subida a Cloud Storage se dispara de forma "Fire & Forget" (no-blocking) tras la respuesta.
   - **Respuesta:** El usuario recibe `200 OK` rápido, aunque el backup tarde o falle silenciosamente (se loguea en backend).
