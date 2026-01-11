/**
 * Ejemplo de integración del generador de perfiles profesionales
 * en el frontend (Dashboard)
 */

class ProfileGenerator {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
  }

  /**
   * Genera 3 perfiles profesionales basados en el CV cargado
   * @returns {Promise<Object>} Respuesta con los perfiles generados
   */
  async generateProfiles() {
    try {
      const response = await fetch(`${this.apiUrl}/api/profile/generate-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error generando perfiles');
      }

      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  /**
   * Renderiza los perfiles en el DOM
   * @param {Array} profiles - Array de perfiles profesionales
   * @param {string} containerId - ID del contenedor donde renderizar
   */
  renderProfiles(profiles, containerId = 'profiles-container') {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Contenedor ${containerId} no encontrado`);
      return;
    }

    container.innerHTML = '';

    profiles.forEach((profile, index) => {
      const profileCard = this.createProfileCard(profile, index + 1);
      container.appendChild(profileCard);
    });
  }

  /**
   * Crea una tarjeta HTML para un perfil
   * @param {Object} profile - Datos del perfil
   * @param {number} number - Número del perfil (1, 2, 3)
   * @returns {HTMLElement} Elemento DOM de la tarjeta
   */
  createProfileCard(profile, number) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.innerHTML = `
      <div class="profile-header">
        <span class="profile-number">Perfil ${number}</span>
        <span class="profile-level ${profile.experienceLevel.toLowerCase()}">${profile.experienceLevel}</span>
      </div>
      
      <h3 class="profile-title">${profile.title}</h3>
      
      <p class="profile-description">${profile.description}</p>
      
      <div class="profile-section">
        <h4>🎯 Habilidades Clave</h4>
        <div class="skills-container">
          ${profile.keySkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>
      
      <div class="profile-section">
        <h4>🔍 Palabras Clave</h4>
        <div class="keywords-container">
          ${profile.searchKeywords.map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
        </div>
      </div>
      
      <div class="profile-section">
        <h4>💼 Roles Objetivo</h4>
        <ul class="roles-list">
          ${profile.targetRoles.map(role => `<li>${role}</li>`).join('')}
        </ul>
      </div>
      
      <div class="profile-actions">
        <button class="btn-primary" onclick="useProfile(${number})">
          Usar este perfil
        </button>
        <button class="btn-secondary" onclick="editProfile(${number})">
          Editar
        </button>
      </div>
    `;
    
    return card;
  }
}

// ============================================
// EJEMPLO DE USO
// ============================================

// Inicializar el generador
const generator = new ProfileGenerator();

// Función para generar y mostrar perfiles
async function generateAndShowProfiles() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const profilesContainer = document.getElementById('profiles-container');

  try {
    // Mostrar loading
    if (loadingEl) loadingEl.style.display = 'block';
    if (errorEl) errorEl.style.display = 'none';
    if (profilesContainer) profilesContainer.innerHTML = '';

    console.log('🤖 Generando perfiles profesionales...');

    // Generar perfiles
    const result = await generator.generateProfiles();

    console.log('✅ Perfiles generados:', result);

    // Ocultar loading
    if (loadingEl) loadingEl.style.display = 'none';

    // Renderizar perfiles
    generator.renderProfiles(result.data);

    // Mostrar metadata
    if (result.metadata) {
      console.log('📊 Metadata:', {
        modelo: result.metadata.model,
        tokens: result.metadata.tokensUsed,
        fecha: new Date(result.metadata.generatedAt).toLocaleString()
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);

    // Ocultar loading
    if (loadingEl) loadingEl.style.display = 'none';

    // Mostrar error
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = error.message;
    }
  }
}

// Funciones auxiliares para las acciones de los perfiles
function useProfile(profileNumber) {
  console.log(`Usando perfil ${profileNumber} para búsqueda de empleo`);
  // Aquí iría la lógica para usar el perfil
  // Por ejemplo: iniciar búsqueda automática de empleos
}

function editProfile(profileNumber) {
  console.log(`Editando perfil ${profileNumber}`);
  // Aquí iría la lógica para editar el perfil
  // Por ejemplo: abrir modal de edición
}

// ============================================
// ESTILOS CSS SUGERIDOS
// ============================================

const styles = `
<style>
.profile-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.profile-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.profile-number {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.profile-level {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.profile-level.junior {
  background: #e3f2fd;
  color: #1976d2;
}

.profile-level.mid-level {
  background: #fff3e0;
  color: #f57c00;
}

.profile-level.senior {
  background: #f3e5f5;
  color: #7b1fa2;
}

.profile-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.profile-description {
  font-size: 16px;
  line-height: 1.6;
  color: #555;
  margin-bottom: 24px;
}

.profile-section {
  margin-bottom: 20px;
}

.profile-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.skills-container,
.keywords-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag,
.keyword-tag {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.skill-tag {
  background: #e8f5e9;
  color: #2e7d32;
}

.keyword-tag {
  background: #e3f2fd;
  color: #1565c0;
}

.roles-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.roles-list li {
  padding: 8px 0;
  padding-left: 24px;
  position: relative;
  color: #555;
}

.roles-list li:before {
  content: "💼";
  position: absolute;
  left: 0;
}

.profile-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

#loading {
  text-align: center;
  padding: 40px;
}

#error {
  background: #ffebee;
  color: #c62828;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}
</style>
`;

// ============================================
// HTML SUGERIDO
// ============================================

const htmlTemplate = `
<div class="profiles-generator">
  <div class="header">
    <h2>🎯 Perfiles Profesionales</h2>
    <p>Genera perfiles optimizados para búsqueda de empleo basados en tu CV</p>
  </div>
  
  <button onclick="generateAndShowProfiles()" class="btn-generate">
    🤖 Generar Perfiles con IA
  </button>
  
  <div id="loading" style="display: none;">
    <div class="spinner"></div>
    <p>Generando perfiles profesionales...</p>
  </div>
  
  <div id="error" style="display: none;"></div>
  
  <div id="profiles-container"></div>
</div>
`;

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProfileGenerator };
}
