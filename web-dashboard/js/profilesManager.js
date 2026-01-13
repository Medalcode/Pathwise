/**
 * Profiles Manager
 * Maneja la selección y gestión de múltiples perfiles
 */

const ProfilesManager = {
  currentProfile: null,
  profiles: [],
  isDropdownOpen: false,

  /**
   * Inicializar el gestor de perfiles
   */
  async init() {
    console.log('🔄 Inicializando ProfilesManager...');
    
    // Cargar perfiles
    await this.loadProfiles();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('✅ ProfilesManager inicializado');
  },

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    const currentProfileBtn = document.getElementById('currentProfileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const createProfileBtn = document.getElementById('createProfileBtn');
    const manageProfilesBtn = document.getElementById('manageProfilesBtn');

    // Toggle dropdown
    if (currentProfileBtn) {
      currentProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-selector')) {
        this.closeDropdown();
      }
    });

    // Botón crear perfil
    if (createProfileBtn) {
      createProfileBtn.addEventListener('click', () => {
        this.closeDropdown();
        this.showCreateProfileModal();
      });
    }

    // Botón gestionar perfiles
    if (manageProfilesBtn) {
      manageProfilesBtn.addEventListener('click', () => {
        this.closeDropdown();
        this.showManageProfilesModal();
      });
    }
  },

  /**
   * Cargar perfiles desde la API
   */
  async loadProfiles() {
    try {
      const response = await fetch('/api/profiles?userId=1');
      const data = await response.json();

      if (data.success) {
        this.profiles = data.profiles;
        
        // Encontrar perfil por defecto o usar el primero
        this.currentProfile = this.profiles.find(p => p.isDefault) || this.profiles[0];
        
        // Actualizar UI
        this.updateCurrentProfileDisplay();
        this.renderProfileList();
        
        console.log('✅ Perfiles cargados:', this.profiles.length);
      } else {
        throw new Error(data.error || 'Error cargando perfiles');
      }
    } catch (error) {
      console.error('❌ Error cargando perfiles:', error);
      showToast('Error cargando perfiles', 'error');
      
      // Mostrar estado de error
      this.showProfilesError();
    }
  },

  /**
   * Actualizar display del perfil actual
   */
  updateCurrentProfileDisplay() {
    const profileNameEl = document.getElementById('currentProfileName');
    const profileBadgeEl = document.getElementById('currentProfileBadge');

    if (this.currentProfile) {
      if (profileNameEl) {
        profileNameEl.textContent = this.currentProfile.name;
      }
      
      if (profileBadgeEl) {
        profileBadgeEl.style.display = this.currentProfile.isDefault ? 'inline-block' : 'none';
      }
    }
  },

  /**
   * Renderizar lista de perfiles en el dropdown
   */
  renderProfileList() {
    const profileList = document.getElementById('profileList');
    
    if (!profileList) return;

    if (this.profiles.length === 0) {
      profileList.innerHTML = `
        <div class="profile-empty">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <p>No hay perfiles creados</p>
        </div>
      `;
      return;
    }

    profileList.innerHTML = this.profiles.map(profile => {
      const isActive = this.currentProfile && this.currentProfile.id === profile.id;
      const initials = this.getInitials(profile.name);
      const typeLabel = this.getTypeLabel(profile.type);

      return `
        <div class="profile-item ${isActive ? 'active' : ''}" data-profile-id="${profile.id}">
          <div class="profile-item-icon">${initials}</div>
          <div class="profile-item-info">
            <div class="profile-item-name">
              ${profile.name}
              ${profile.isDefault ? '<span class="profile-badge default">Default</span>' : ''}
            </div>
            <div class="profile-item-meta">
              ${typeLabel ? `<span class="profile-item-type">${typeLabel}</span>` : ''}
              <span>${new Date(profile.createdAt).toLocaleDateString('es-CL')}</span>
            </div>
          </div>
          ${isActive ? '<div class="profile-item-check">✓</div>' : ''}
        </div>
      `;
    }).join('');

    // Agregar event listeners a los items
    profileList.querySelectorAll('.profile-item').forEach(item => {
      item.addEventListener('click', () => {
        const profileId = parseInt(item.dataset.profileId);
        this.switchProfile(profileId);
      });
    });
  },

  /**
   * Obtener iniciales del nombre del perfil
   */
  getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  },

  /**
   * Obtener etiqueta del tipo de perfil
   */
  getTypeLabel(type) {
    const labels = {
      'frontend': 'Frontend',
      'backend': 'Backend',
      'fullstack': 'Full Stack',
      'mobile': 'Mobile',
      'devops': 'DevOps',
      'general': ''
    };
    return labels[type] || type;
  },

  /**
   * Cambiar de perfil
   */
  async switchProfile(profileId) {
    try {
      const profile = this.profiles.find(p => p.id === profileId);
      
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }

      // Actualizar perfil actual
      this.currentProfile = profile;
      
      // Actualizar UI
      this.updateCurrentProfileDisplay();
      this.renderProfileList();
      this.closeDropdown();

      // Cargar datos del perfil
      await this.loadProfileData(profileId);

      showToast(`Perfil cambiado a: ${profile.name}`, 'success');
      
      console.log('✅ Perfil cambiado:', profile.name);
    } catch (error) {
      console.error('❌ Error cambiando perfil:', error);
      showToast('Error cambiando de perfil', 'error');
    }
  },

  /**
   * Cargar datos de un perfil específico
   */
  async loadProfileData(profileId) {
    try {
      const response = await fetch(`/api/profiles/${profileId}`);
      const data = await response.json();

      if (data.success) {
        // Actualizar datos en la aplicación
        if (typeof populateForm === 'function') {
          populateForm(data.profile.data);
        }
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('profileChanged', {
          detail: { profile: data.profile }
        }));
      } else {
        throw new Error(data.error || 'Error cargando datos del perfil');
      }
    } catch (error) {
      console.error('❌ Error cargando datos del perfil:', error);
      throw error;
    }
  },

  /**
   * Toggle dropdown
   */
  toggleDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const btn = document.getElementById('currentProfileBtn');

    if (!dropdown || !btn) return;

    this.isDropdownOpen = !this.isDropdownOpen;

    if (this.isDropdownOpen) {
      dropdown.classList.add('active');
      btn.classList.add('active');
    } else {
      dropdown.classList.remove('active');
      btn.classList.remove('active');
    }
  },

  /**
   * Cerrar dropdown
   */
  closeDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const btn = document.getElementById('currentProfileBtn');

    if (dropdown) dropdown.classList.remove('active');
    if (btn) btn.classList.remove('active');
    
    this.isDropdownOpen = false;
  },

  /**
   * Mostrar modal de crear perfil
   */
  showCreateProfileModal() {
    // TODO: Implementar modal de creación
    const name = prompt('Nombre del nuevo perfil:');
    
    if (name && name.trim()) {
      this.createProfile(name.trim());
    }
  },

  /**
   * Crear nuevo perfil
   */
  async createProfile(name, type = 'general', copyFromProfile = null) {
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          name,
          type,
          copyFromProfile
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Perfil creado exitosamente', 'success');
        
        // Recargar perfiles
        await this.loadProfiles();
        
        // Cambiar al nuevo perfil
        await this.switchProfile(data.profile.id);
      } else {
        throw new Error(data.error || 'Error creando perfil');
      }
    } catch (error) {
      console.error('❌ Error creando perfil:', error);
      showToast('Error creando perfil', 'error');
    }
  },

  /**
   * Mostrar modal de gestión de perfiles
   */
  showManageProfilesModal() {
    // TODO: Implementar modal de gestión completo
    showToast('Modal de gestión en desarrollo', 'info');
  },

  /**
   * Mostrar estado de error
   */
  showProfilesError() {
    const profileList = document.getElementById('profileList');
    const profileNameEl = document.getElementById('currentProfileName');

    if (profileList) {
      profileList.innerHTML = `
        <div class="profile-empty">
          <p style="color: var(--danger);">Error cargando perfiles</p>
        </div>
      `;
    }

    if (profileNameEl) {
      profileNameEl.textContent = 'Error';
    }
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ProfilesManager.init();
  });
} else {
  ProfilesManager.init();
}
