// scripts/sidebar-state.js

/**
 * Gestiona el estado de la barra lateral (contraída/expandida)
 * y su persistencia usando localStorage.
 */
class SidebarStateManager {
    constructor() {
        this.storageKey = 'sidebarState';
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    /**
     * Inicializa la clase: aplica el estado guardado,
     * configura listeners y marca la página activa.
     */
    init() {
        // Antes de aplicar el estado, deshabilitamos transiciones para evitar el "flash" inicial
        this.disableTransitions(); 
        
        // Aplicar estado guardado al cargar la página
        this.applySavedState();
        
        // Configuramos listeners
        this.setupEventListeners();
        
        // Marcar página activa
        this.setActivePage();

        // Reactivamos las transiciones después de un breve delay
        this.enableTransitions();
    }

    // --- Métodos de Estado y Almacenamiento ---

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

    // --- Métodos de Transición/Estilo (NUEVOS PARA SOLUCIONAR EL FLASH) ---

    disableTransitions() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.getElementById('mainContent');

        // Deshabilitar transiciones CSS para evitar el parpadeo inicial
        document.body.style.setProperty('transition', 'none', 'important');
        if (sidebar) sidebar.style.setProperty('transition', 'none', 'important');
        if (mainContent) mainContent.style.setProperty('transition', 'none', 'important');
    }

    enableTransitions() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.getElementById('mainContent');

        // Rehabilitar transiciones después de un breve delay
        setTimeout(() => {
            document.body.style.removeProperty('transition');
            if (sidebar) sidebar.style.removeProperty('transition');
            if (mainContent) mainContent.style.removeProperty('transition');
        }, 50); // Un pequeño delay (e.g., 50ms) es suficiente
    }

    // --- Métodos de Interacción DOM ---

    applySavedState() {
        const isContraida = this.getState();
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.getElementById('mainContent');

        if (sidebar) {
            // Aplicar las clases sin animaciones
            if (isContraida) {
                sidebar.classList.add('contraida');
                if (mainContent) mainContent.classList.add('contraido');
            } else {
                sidebar.classList.remove('contraida');
                if (mainContent) mainContent.classList.remove('contraido');
            }
            this.updateToggleIcon(isContraida);
        }
    }

    setupEventListeners() {
        // Asegúrate de usar el ID correcto: 'toggleSidebar' (basado en el código original de la clase)
        const toggleButton = document.getElementById('toggleSidebar'); 
        
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        this.setupNavigationLinks();
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.getElementById('mainContent');
        const isContraida = sidebar.classList.contains('contraida');

        if (isContraida) {
            // Expandir
            sidebar.classList.remove('contraida');
            if (mainContent) mainContent.classList.remove('contraido');
            this.saveState(false);
        } else {
            // Contraer
            sidebar.classList.add('contraida');
            if (mainContent) mainContent.classList.add('contraido');
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
                
                const isCurrentPage = (
                    linkPage === this.currentPage || 
                    (this.currentPage === 'index.html' && href === '../index.html') ||
                    (this.currentPage.includes('incidencia') && linkPage.includes('incidencia'))
                );

                if (isCurrentPage) {
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
            link.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                const isContraida = sidebar.classList.contains('contraida');
                this.saveState(isContraida);
            });
        });
    }
}

// Inicializar la clase cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    new SidebarStateManager();
});