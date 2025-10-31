// scripts/sidebar-state.js
class SidebarStateManager {
    constructor() {
        this.storageKey = 'sidebarState';
        this.init();
    }

    init() {
        // Aplicar estado guardado al cargar la página
        this.applySavedState();
        
        // Configurar event listeners para el toggle
        this.setupEventListeners();
    }

    getState() {
        const savedState = localStorage.getItem(this.storageKey);
        // Por defecto, empezar contraída
        if (savedState === null) {
            return true; // Contraída por defecto
        }
        return savedState === 'contraida';
    }

    saveState(isContraida) {
        localStorage.setItem(this.storageKey, isContraida ? 'contraida' : 'expandida');
    }

    applySavedState() {
        const isContraida = this.getState();
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.getElementById('mainContent');

        if (sidebar && isContraida) {
            sidebar.classList.add('contraida');
            if (mainContent) {
                mainContent.classList.add('expanded');
            }
            this.updateToggleIcon(true);
        }
    }

    setupEventListeners() {
        const toggleButton = document.getElementById('toggleSidebar');
        
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.getElementById('mainContent');
        const isContraida = sidebar.classList.contains('contraida');

        if (isContraida) {
            sidebar.classList.remove('contraida');
            if (mainContent) {
                mainContent.classList.remove('expanded');
            }
        } else {
            sidebar.classList.add('contraida');
            if (mainContent) {
                mainContent.classList.add('expanded');
            }
        }

        this.updateToggleIcon(!isContraida);
        this.saveState(!isContraida);
    }

    updateToggleIcon(isContraida) {
        const toggleButton = document.getElementById('toggleSidebar');
        if (toggleButton) {
            const icon = toggleButton.querySelector('i');
            if (icon) {
                icon.className = isContraida ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            }
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new SidebarStateManager();
});