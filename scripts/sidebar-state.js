// scripts/sidebar-state.js
class SidebarStateManager {
    constructor() {
        this.storageKey = 'sidebarState';
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    init() {
        // Aplicar estado guardado al cargar la página
        this.applySavedState();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Marcar página activa
        this.setActivePage();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.toLowerCase();
    }

    getState() {
        const savedState = localStorage.getItem(this.storageKey);
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

    setActivePage() {
        const links = document.querySelectorAll('.sidebar a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const linkPage = href.split('/').pop().toLowerCase();
                if (linkPage === this.currentPage || 
                    (this.currentPage === 'index.html' && href === '../index.html') ||
                    (this.currentPage.includes('incidencia') && linkPage.includes('incidencia'))) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }

    setupNavigationLinks() {
        const navLinks = document.querySelectorAll('a[href]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Guardar el estado actual antes de navegar
                const sidebar = document.querySelector('.sidebar');
                const isContraida = sidebar.classList.contains('contraida');
                this.saveState(isContraida);
            });
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new SidebarStateManager();
});