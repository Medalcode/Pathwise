/**
 * PDF Validator Module
 * Valida el contenido de archivos PDF antes de procesarlos
 */

const PDFValidator = {
    /**
     * Validar si el PDF contiene texto extraíble
     */
    async validatePDFContent(file) {
        const validation = {
            isValid: true,
            hasText: false,
            isEncrypted: false,
            pageCount: 0,
            warnings: [],
            errors: []
        };
        
        try {
            // Leer el archivo como ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Convertir a string para análisis básico
            const pdfString = new TextDecoder('utf-8').decode(uint8Array);
            
            // 1. Verificar si es un PDF válido
            if (!pdfString.startsWith('%PDF-')) {
                validation.isValid = false;
                validation.errors.push('El archivo no es un PDF válido');
                return validation;
            }
            
            // 2. Detectar si está encriptado
            if (pdfString.includes('/Encrypt')) {
                validation.isEncrypted = true;
                validation.warnings.push('El PDF está protegido o encriptado');
            }
            
            // 3. Estimar número de páginas (aproximado)
            const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
            validation.pageCount = pageMatches ? pageMatches.length : 1;
            
            if (validation.pageCount > 10) {
                validation.warnings.push(`El PDF tiene ${validation.pageCount} páginas. Se recomienda un CV de 1-3 páginas.`);
            }
            
            // 4. Detectar si tiene texto extraíble
            // Buscar streams de texto comunes en PDFs
            const hasTextStreams = pdfString.includes('/Contents') || 
                                   pdfString.includes('BT') || // Begin Text
                                   pdfString.includes('Tj') || // Show Text
                                   pdfString.includes('TJ');   // Show Text Array
            
            validation.hasText = hasTextStreams;
            
            if (!hasTextStreams) {
                validation.warnings.push('El PDF parece ser una imagen escaneada. La extracción de texto puede ser limitada.');
            }
            
            // 5. Detectar idioma aproximado (español/inglés)
            const spanishWords = (pdfString.match(/\b(experiencia|educación|habilidades|resumen|perfil)\b/gi) || []).length;
            const englishWords = (pdfString.match(/\b(experience|education|skills|summary|profile)\b/gi) || []).length;
            
            if (spanishWords > englishWords) {
                validation.language = 'es';
            } else if (englishWords > spanishWords) {
                validation.language = 'en';
            } else {
                validation.language = 'unknown';
            }
            
            // 6. Verificar tamaño razonable
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 5) {
                validation.warnings.push(`El archivo es grande (${fileSizeMB.toFixed(1)}MB). Considera optimizarlo.`);
            }
            
        } catch (error) {
            console.error('Error validating PDF:', error);
            validation.isValid = false;
            validation.errors.push('Error al analizar el PDF: ' + error.message);
        }
        
        return validation;
    },
    
    /**
     * Mostrar resultados de validación al usuario
     */
    showValidationResults(validation) {
        if (!validation.isValid) {
            validation.errors.forEach(error => {
                showToast(error, 'error');
            });
            return false;
        }
        
        // Mostrar warnings si existen
        if (validation.warnings.length > 0) {
            const warningMsg = validation.warnings.join(' | ');
            showToast('⚠️ ' + warningMsg, 'warning');
        }
        
        // Mensaje de éxito
        let successMsg = '✓ PDF válido';
        if (validation.pageCount > 0) {
            successMsg += ` (${validation.pageCount} página${validation.pageCount > 1 ? 's' : ''})`;
        }
        if (validation.language) {
            const langName = validation.language === 'es' ? 'Español' : 
                           validation.language === 'en' ? 'Inglés' : 'Desconocido';
            successMsg += ` - Idioma detectado: ${langName}`;
        }
        
        console.log(successMsg);
        
        return true;
    }
};

// Exponer globalmente
window.PDFValidator = PDFValidator;
