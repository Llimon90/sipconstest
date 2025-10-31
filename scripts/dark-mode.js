// scripts/dark-mode.js
class DarkModeManager {
    constructor() {
        this.storageKey = 'modoOscuro';
        this.toggleButton = null;
        this.init();
    }

    init() {
        // Crear el interruptor si no existe
        this.createToggle();
        
        // Aplicar estado guardado
        this.applySavedState();
        
        // Configurar event listeners
        this.setupEventListeners();
    }

    createToggle() {
        // Verificar si ya existe el interruptor
        if (document.getElementById('modoOscuroToggle')) {
            this.toggleButton = document.getElementById('modoOscuroToggle');
            return;
        }

        // Crear el interruptor
        const toggleHTML = `
            <div class="modo-oscuro-toggle" id="modoOscuroToggle">
                <div class="modo-oscuro-tooltip">Modo Oscuro</div>
                <div class="modo-oscuro-switch">
                    <i class="fas fa-sun modo-oscuro-icon sun"></i>
                    <i class="fas fa-moon modo-oscuro-icon moon"></i>
                </div>
            </div>
        `;

        // Insertar en el body
        document.body.insertAdjacentHTML('beforeend', toggleHTML);
        this.toggleButton = document.getElementById('modoOscuroToggle');
    }

    getState() {
        const savedState = localStorage.getItem(this.storageKey);
        return savedState === 'activado';
    }

    saveState(isActive) {
        localStorage.setItem(this.storageKey, isActive ? 'activado' : 'desactivado');
    }

    applySavedState() {
        const isActive = this.getState();
        if (isActive) {
            this.activateDarkMode();
        } else {
            this.deactivateDarkMode();
        }
    }

    setupEventListeners() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }

        // También aplicar a nuevas páginas cargadas
        this.setupNavigationListener();
    }

    setupNavigationListener() {
        // Asegurar que el modo se mantenga al navegar
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && !link.href.startsWith('javascript:')) {
                // El estado se mantiene automáticamente por localStorage
            }
        });
    }

    toggleDarkMode() {
        const isActive = document.body.classList.contains('modo-oscuro');
        
        if (isActive) {
            this.deactivateDarkMode();
        } else {
            this.activateDarkMode();
        }
    }

    activateDarkMode() {
        document.body.classList.add('modo-oscuro');
        this.saveState(true);
        this.updateToggleVisual(true);
    }

    deactivateDarkMode() {
        document.body.classList.remove('modo-oscuro');
        this.saveState(false);
        this.updateToggleVisual(false);
    }

    updateToggleVisual(isActive) {
        if (this.toggleButton) {
            const tooltip = this.toggleButton.querySelector('.modo-oscuro-tooltip');
            if (tooltip) {
                tooltip.textContent = isActive ? 'Modo Claro' : 'Modo Oscuro';
            }
        }
    }

    // Método para forzar estado (útil para debugging)
    forceState(state) {
        if (state) {
            this.activateDarkMode();
        } else {
            this.deactivateDarkMode();
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new DarkModeManager();
});

// También exportar para uso global (opcional)
window.DarkModeManager = DarkModeManager;