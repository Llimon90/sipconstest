// scripts/sidebar-state.js
class SidebarStateManager {
    constructor() {
        this.storageKey = 'sidebarState';
        // Inicializar inmediatamente, no esperar DOMContentLoaded
        this.init();
    }

    init() {
        // Aplicar estado inmediatamente
        this.applySavedStateImmediately();
        
        // Configurar event listeners cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
        } else {
            this.setupEventListeners();
        }
    }

    getState() {
        const savedState = localStorage.getItem(this.storageKey);
        // Por defecto, empezar contraída (true = contraída)
        return savedState !== 'expandida'; // Si no está guardado o es 'contraida', retorna true
    }

    saveState(isContraida) {
        localStorage.setItem(this.storageKey, isContraida ? 'contraida' : 'expandida');
    }

    applySavedStateImmediately() {
        const isContraida = this.getState();
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('main');

        if (sidebar) {
            if (!isContraida) {
                // Si debe estar expandida, agregar la clase
                sidebar.classList.add('expandida');
                if (mainContent) {
                    mainContent.classList.add('expandido');
                    mainContent.classList.remove('contraido');
                }
                this.updateToggleIcon(false);
            } else {
                // Ya está contraída por el CSS inicial
                if (mainContent) {
                    mainContent.classList.add('contraido');
                    mainContent.classList.remove('expandido');
                }
                this.updateToggleIcon(true);
            }
        }
    }

    setupEventListeners() {
        const toggleButton = document.getElementById('toggleSidebar');
        
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Prevenir el comportamiento por defecto de los enlaces
        this.preventLinkFlash();
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('main');
        const isContraida = !sidebar.classList.contains('expandida');

        if (isContraida) {
            // Expandir
            sidebar.classList.add('expandida');
            if (mainContent) {
                mainContent.classList.add('expandido');
                mainContent.classList.remove('contraido');
            }
        } else {
            // Contraer
            sidebar.classList.remove('expandida');
            if (mainContent) {
                mainContent.classList.add('contraido');
                mainContent.classList.remove('expandido');
            }
        }

        this.updateToggleIcon(isContraida);
        this.saveState(isContraida);
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

    preventLinkFlash() {
        // Asegurar que los enlaces mantengan el estado
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            if (link.href && !link.href.startsWith('javascript:')) {
                link.addEventListener('click', (e) => {
                    // El estado ya está guardado en localStorage
                    // No hacer nada, dejar que la navegación ocurra normalmente
                });
            }
        });
    }
}

// Inicializar inmediatamente
new SidebarStateManager();