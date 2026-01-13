/**
 * Profiles Modals Manager
 * Maneja los modales de gestión de perfiles
 */

const ProfilesModals = {
  currentEditingProfile: null,

  /**
   * Inicializar event listeners de modales
   */
  init() {
    this.setupModalListeners();
  },

  /**
   * Configurar event listeners
   */
  setupModalListeners() {
    // Modal de gestión de perfiles
    const closeProfilesModal = document.getElementById('closeProfilesModal');
    const profilesModalOverlay = document.getElementById('profilesModalOverlay');
    const addProfileBtn = document.getElementById('addProfileBtn');

    if (closeProfilesModal) {
      closeProfilesModal.addEventListener('click', () => this.closeManageModal());
    }

    if (profilesModalOverlay) {
      profilesModalOverlay.addEventListener('click', (e) => {
        if (e.target === profilesModalOverlay) {
          this.closeManageModal();
        }
      });
    }

    if (addProfileBtn) {
      addProfileBtn.addEventListener('click', () => {
        this.closeManageModal();
        this.showProfileForm();
      });
    }

    // Modal de formulario de perfil
    const closeProfileFormModal = document.getElementById('closeProfileFormModal');
    const profileFormModalOverlay = document.getElementById('profileFormModalOverlay');
    const cancelProfileForm = document.getElementById('cancelProfileForm');
    const saveProfileForm = document.getElementById('saveProfileForm');

    if (closeProfileFormModal) {
      closeProfileFormModal.addEventListener('click', () => this.closeProfileForm());
    }

    if (cancelProfileForm) {
      cancelProfileForm.addEventListener('click', () => this.closeProfileForm());
    }

    if (profileFormModalOverlay) {
      profileFormModalOverlay.addEventListener('click', (e) => {
        if (e.target === profileFormModalOverlay) {
          this.closeProfileForm();
        }
      });
    }

    if (saveProfileForm) {
      saveProfileForm.addEventListener('click', () => this.saveProfile());
    }

    // ESC key para cerrar modales
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeManageModal();
        this.closeProfileForm();
      }
    });
  },

  /**
   * Mostrar modal de gestión de perfiles
   */
  async showManageModal() {
    const overlay = document.getElementById('profilesModalOverlay');
    const grid = document.getElementById('profilesGrid');

    if (!overlay || !grid) return;

    // Mostrar loading
    grid.innerHTML = `
      <div class="profiles-loading">
        <div class="spinner"></div>
        <p>Cargando perfiles...</p>
      </div>
    `;

    // Abrir modal
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Cargar perfiles
    try {
      const profiles = ProfilesManager.profiles;
      this.renderProfileCards(profiles);
    } catch (error) {
      console.error('Error cargando perfiles:', error);
      grid.innerHTML = `
        <div class="profiles-loading">
          <p style="color: var(--danger);">Error cargando perfiles</p>
        </div>
      `;
    }
  },

  /**
   * Renderizar cards de perfiles
   */
  renderProfileCards(profiles) {
    const grid = document.getElementById('profilesGrid');
    
    if (!grid) return;

    if (profiles.length === 0) {
      grid.innerHTML = `
        <div class="profiles-loading">
          <p>No hay perfiles creados</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = profiles.map(profile => {
      const initials = ProfilesManager.getInitials(profile.name);
      const typeLabel = ProfilesManager.getTypeLabel(profile.type);
      const isDefault = profile.isDefault;
      const isCurrent = ProfilesManager.currentProfile && ProfilesManager.currentProfile.id === profile.id;

      return `
        <div class="profile-card ${isDefault ? 'is-default' : ''}" data-profile-id="${profile.id}">
          <div class="profile-card-header">
            <div class="profile-card-avatar">${initials}</div>
            <div class="profile-card-info">
              <h3 class="profile-card-name">
                ${profile.name}
                ${isDefault ? '<span class="profile-badge default">Default</span>' : ''}
                ${isCurrent ? '<span class="profile-badge" style="background: var(--primary);">Activo</span>' : ''}
              </h3>
              <div class="profile-card-meta">
                ${typeLabel ? `<span class="profile-item-type">${typeLabel}</span>` : ''}
                <span>${new Date(profile.createdAt).toLocaleDateString('es-CL')}</span>
              </div>
            </div>
          </div>
          <div class="profile-card-actions">
            <button class="profile-card-btn" onclick="ProfilesModals.editProfile(${profile.id})">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2"/>
                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2"/>
              </svg>
              Editar
            </button>
            <button class="profile-card-btn" onclick="ProfilesModals.duplicateProfile(${profile.id})">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="currentColor" stroke-width="2"/>
                <path d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z" stroke="currentColor" stroke-width="2"/>
              </svg>
              Duplicar
            </button>
            ${!isDefault ? `
              <button class="profile-card-btn danger" onclick="ProfilesModals.deleteProfile(${profile.id})">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H5H21" stroke="currentColor" stroke-width="2"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Eliminar
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Cerrar modal de gestión
   */
  closeManageModal() {
    const overlay = document.getElementById('profilesModalOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /**
   * Mostrar formulario de perfil (crear o editar)
   */
  showProfileForm(profile = null) {
    const overlay = document.getElementById('profileFormModalOverlay');
    const title = document.getElementById('profileFormTitle');
    const form = document.getElementById('profileForm');
    const copyFromGroup = document.getElementById('copyFromGroup');

    if (!overlay || !form) return;

    // Resetear formulario
    form.reset();
    this.currentEditingProfile = profile;

    if (profile) {
      // Modo edición
      title.textContent = 'Editar Perfil';
      document.getElementById('profileId').value = profile.id;
      document.getElementById('profileName').value = profile.name;
      document.getElementById('profileType').value = profile.type || 'general';
      document.getElementById('profileIsDefault').checked = profile.isDefault;
      copyFromGroup.style.display = 'none';
    } else {
      // Modo creación
      title.textContent = 'Crear Nuevo Perfil';
      document.getElementById('profileId').value = '';
      copyFromGroup.style.display = 'block';
    }

    // Abrir modal
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus en nombre
    setTimeout(() => {
      document.getElementById('profileName').focus();
    }, 300);
  },

  /**
   * Cerrar formulario de perfil
   */
  closeProfileForm() {
    const overlay = document.getElementById('profileFormModalOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    this.currentEditingProfile = null;
  },

  /**
   * Guardar perfil (crear o actualizar)
   */
  async saveProfile() {
    const form = document.getElementById('profileForm');
    const profileId = document.getElementById('profileId').value;
    const name = document.getElementById('profileName').value.trim();
    const type = document.getElementById('profileType').value;
    const isDefault = document.getElementById('profileIsDefault').checked;
    const copyFrom = document.getElementById('profileCopyFrom')?.checked;

    // Validar
    if (!name) {
      showToast('El nombre del perfil es requerido', 'error');
      document.getElementById('profileName').focus();
      return;
    }

    try {
      if (profileId) {
        // Actualizar perfil existente
        await this.updateProfile(parseInt(profileId), { name, type, isDefault });
      } else {
        // Crear nuevo perfil
        const copyFromProfile = copyFrom && ProfilesManager.currentProfile 
          ? ProfilesManager.currentProfile.id 
          : null;
        
        await ProfilesManager.createProfile(name, type, copyFromProfile);
      }

      this.closeProfileForm();
      this.closeManageModal();
    } catch (error) {
      console.error('Error guardando perfil:', error);
      showToast('Error guardando perfil', 'error');
    }
  },

  /**
   * Actualizar perfil
   */
  async updateProfile(profileId, updates) {
    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Perfil actualizado exitosamente', 'success');
        await ProfilesManager.loadProfiles();
        
        // Si estamos en el modal de gestión, actualizar
        const overlay = document.getElementById('profilesModalOverlay');
        if (overlay.classList.contains('active')) {
          this.renderProfileCards(ProfilesManager.profiles);
        }
      } else {
        throw new Error(data.error || 'Error actualizando perfil');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  },

  /**
   * Editar perfil
   */
  editProfile(profileId) {
    const profile = ProfilesManager.profiles.find(p => p.id === profileId);
    if (profile) {
      this.showProfileForm(profile);
    }
  },

  /**
   * Duplicar perfil
   */
  async duplicateProfile(profileId) {
    const profile = ProfilesManager.profiles.find(p => p.id === profileId);
    if (!profile) return;

    const newName = prompt(`Duplicar perfil "${profile.name}".\nNuevo nombre:`, `${profile.name} (Copia)`);
    
    if (!newName || !newName.trim()) return;

    try {
      const response = await fetch(`/api/profiles/${profileId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Perfil duplicado exitosamente', 'success');
        await ProfilesManager.loadProfiles();
        this.renderProfileCards(ProfilesManager.profiles);
      } else {
        throw new Error(data.error || 'Error duplicando perfil');
      }
    } catch (error) {
      console.error('Error duplicando perfil:', error);
      showToast('Error duplicando perfil', 'error');
    }
  },

  /**
   * Eliminar perfil
   */
  async deleteProfile(profileId) {
    const profile = ProfilesManager.profiles.find(p => p.id === profileId);
    if (!profile) return;

    if (!confirm(`¿Estás seguro de eliminar el perfil "${profile.name}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showToast('Perfil eliminado exitosamente', 'success');
        await ProfilesManager.loadProfiles();
        this.renderProfileCards(ProfilesManager.profiles);
      } else {
        throw new Error(data.error || 'Error eliminando perfil');
      }
    } catch (error) {
      console.error('Error eliminando perfil:', error);
      showToast(error.message || 'Error eliminando perfil', 'error');
    }
  }
};

// Actualizar ProfilesManager para usar ProfilesModals
ProfilesManager.showCreateProfileModal = function() {
  ProfilesModals.showProfileForm();
};

ProfilesManager.showManageProfilesModal = function() {
  ProfilesModals.showManageModal();
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ProfilesModals.init();
  });
} else {
  ProfilesModals.init();
}
