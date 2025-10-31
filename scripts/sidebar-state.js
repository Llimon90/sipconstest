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
        // Aplicar estado guardado al cargar la página
        this.applySavedState();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Marcar página activa
        this.setActivePage();
    }

    /**
     * Obtiene el nombre del archivo de la página actual.
     * @returns {string} El nombre de la página actual en minúsculas.
     */
    getCurrentPage() {
        const path = window.location.pathname;
        // Obtiene el último segmento del path o 'index.html' si está vacío
        const page = path.split('/').pop() || 'index.html';
        return page.toLowerCase();
    }

    /**
     * Obtiene el estado guardado de la barra lateral.
     * @returns {boolean} true si está contraída, false si está expandida.
     */
    getState() {
        const savedState = localStorage.getItem(this.storageKey);
        // Retorna true si el estado guardado es 'contraida'
        return savedState === 'contraida';
    }

    /**
     * Guarda el estado de la barra lateral en localStorage.
     * @param {boolean} isContraida - true si está contraída, false si está expandida.
     */
    saveState(isContraida) {
        localStorage.setItem(this.storageKey, isContraida ? 'contraida' : 'expandida');
    }

    /**
     * Aplica las clases CSS para el estado guardado de la barra lateral.
     */
    applySavedState() {
        const isContraida = this.getState();
        const sidebar = document.querySelector('.sidebar');
        // Usamos 'mainContent' como ID para el contenido principal
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

    /**
     * Configura los event listeners para el botón de toggle y los enlaces de navegación.
     */
    setupEventListeners() {
        const toggleButton = document.getElementById('toggleSidebar');
        
        if (toggleButton) {
            // Un solo listener para el botón de toggle
            toggleButton.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Asegurar que los enlaces mantengan el estado al navegar
        this.setupNavigationLinks();
    }

    /**
     * Cambia el estado de la barra lateral (toggle).
     */
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.getElementById('mainContent');
        // Determina el estado actual
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

        // Actualiza el icono del botón después del toggle
        this.updateToggleIcon(!isContraida);
    }

    /**
     * Actualiza el icono del botón de toggle (flecha).
     * @param {boolean} isContraida - Estado actual después del toggle.
     */
    updateToggleIcon(isContraida) {
        const toggleButton = document.getElementById('toggleSidebar');
        if (toggleButton) {
            const icon = toggleButton.querySelector('i');
            if (icon) {
                // Si está contraída, la flecha apunta a la derecha (para expandir)
                icon.className = isContraida ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            }
        }
    }

    /**
     * Marca el enlace de la página actual como 'activo'.
     */
    setActivePage() {
        const links = document.querySelectorAll('.sidebar a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const linkPage = href.split('/').pop().toLowerCase();
                
                // Lógica de comparación de página, incluyendo casos especiales
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

    /**
     * Agrega un listener a todos los enlaces para guardar el estado de la sidebar
     * justo antes de la navegación.
     */
    setupNavigationLinks() {
        // Selecciona todos los enlaces que tienen un atributo 'href'
        const navLinks = document.querySelectorAll('a[href]');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Guardar el estado actual antes de que el navegador cambie de página
                const sidebar = document.querySelector('.sidebar');
                // Asume que la sidebar existe en el momento del click
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