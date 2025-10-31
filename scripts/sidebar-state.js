// scripts/sidebar-state.js
class SidebarStateManager {
    constructor() {
        this.storageKey = 'sidebarState';
        this.init();
    }

    init() {
        // Aplicar estado guardado al cargar la página
        this.applySavedState();
        
        // Configurar event listeners
        this.setupEventListeners();
    }

    getState() {
        const savedState = localStorage.getItem(this.storageKey);
        // Respetar EXACTAMENTE lo que esté guardado
        // Si no hay nada guardado, null = expandida (280px)
        // 'contraida' = 70px, cualquier otro valor = 280px
        return savedState === 'contraida';
    }

    saveState(isContraida) {
        localStorage.setItem(this.storageKey, isContraida ? 'contraida' : 'expandida');
    }

    applySavedState() {
        const isContraida = this.getState();
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.getElementById('mainContent');

        if (sidebar) {
            if (isContraida) {
                sidebar.classList.add('contraida');
                if (mainContent) {
                    mainContent.classList.add('contraido');
                }
            } else {
                sidebar.classList.remove('contraida');
                if (mainContent) {
                    mainContent.classList.remove('contraido');
                }
            }
            this.updateToggleIcon(isContraida);
        }
    }

    setupEventListeners() {
        const toggleButton = document.getElementById('toggleSidebar');
        
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Asegurar que los enlaces mantengan el estado
        this.setupNavigationLinks();
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.getElementById('mainContent');
        const isContraida = sidebar.classList.contains('contraida');

        if (isContraida) {
            // Expandir
            sidebar.classList.remove('contraida');
            if (mainContent) {
                mainContent.classList.remove('contraido');
            }
            this.saveState(false);
        } else {
            // Contraer
            sidebar.classList.add('contraida');
            if (mainContent) {
                mainContent.classList.add('contraido');
            }
            this.saveState(true);
        }

        this.updateToggleIcon(!isContraida);
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

    setupNavigationLinks() {
        // Los enlaces navegarán normalmente, el estado se mantiene en localStorage
        const navLinks = document.querySelectorAll('a[href]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // No prevenir el comportamiento por defecto
                // El estado se mantendrá automáticamente por localStorage
            });
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new SidebarStateManager();
});