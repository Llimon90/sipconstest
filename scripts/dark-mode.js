// Gestor de tema con persistencia mejorada
class TemaManager {
    constructor() {
        this.claveAlmacenamiento = 'modoOscuroSistema';
        this.inicializar();
    }

    inicializar() {
        this.crearInterruptor();
        this.aplicarTemaGuardado();
        this.configurarEventos();
        this.configurarObservadorNavegacion();
    }

    crearInterruptor() {
        // Evitar duplicados
        if (document.querySelector('.dark-mode-toggle')) {
            return;
        }

        const toggleHTML = `
            <div class="dark-mode-toggle">
                <label class="toggle-label">
                    <i class="fas fa-sun toggle-icon sun-icon"></i>
                    <div class="toggle-switch"></div>
                    <i class="fas fa-moon toggle-icon moon-icon"></i>
                    <span class="toggle-text"></span>
                </label>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', toggleHTML);
    }

    obtenerTemaGuardado() {
        const temaGuardado = localStorage.getItem(this.claveAlmacenamiento);
        
        // Si no hay tema guardado, usar preferencia del sistema
        if (temaGuardado === null) {
            return this.detectarPreferenciaSistema();
        }
        
        return temaGuardado === 'true';
    }

    detectarPreferenciaSistema() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    aplicarTemaGuardado() {
        const modoOscuro = this.obtenerTemaGuardado();
        this.cambiarTema(modoOscuro);
    }

    cambiarTema(modoOscuro) {
        if (modoOscuro) {
            document.body.classList.add('modo-oscuro');
        } else {
            document.body.classList.remove('modo-oscuro');
        }
        
        // Guardar preferencia
        localStorage.setItem(this.claveAlmacenamiento, modoOscuro);
        
        // Actualizar estado visual del interruptor
        this.actualizarEstadoInterruptor(modoOscuro);
    }

    actualizarEstadoInterruptor(modoOscuro) {
        const toggle = document.querySelector('.dark-mode-toggle');
        if (toggle) {
            // El estado visual se controla por CSS según la clase del body
            // Esta función es para posibles futuras extensiones
        }
    }

    configurarEventos() {
        const toggle = document.querySelector('.dark-mode-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const modoOscuroActual = document.body.classList.contains('modo-oscuro');
                this.cambiarTema(!modoOscuroActual);
            });
        }

        // Escuchar cambios en la preferencia del sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Solo aplicar si no hay preferencia guardada explícitamente
                const temaGuardado = localStorage.getItem(this.claveAlmacenamiento);
                if (temaGuardado === null) {
                    this.cambiarTema(e.matches);
                }
            });
        }
    }

    configurarObservadorNavegacion() {
        // Observar cambios en la URL para mantener el tema en navegación SPA
        if (window.history && window.history.pushState) {
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;

            // Interceptar pushState
            history.pushState = function() {
                originalPushState.apply(this, arguments);
                window.dispatchEvent(new Event('locationchange'));
            };

            // Interceptar replaceState
            history.replaceState = function() {
                originalReplaceState.apply(this, arguments);
                window.dispatchEvent(new Event('locationchange'));
            };

            // Escuchar cambios de popstate (navegación con botones atrás/adelante)
            window.addEventListener('popstate', () => {
                window.dispatchEvent(new Event('locationchange'));
            });

            // Asegurar que el tema se mantenga en cambios de ubicación
            window.addEventListener('locationchange', () => {
                this.verificarConsistenciaTema();
            });
        }

        // También verificar en eventos de carga de página
        window.addEventListener('load', () => {
            this.verificarConsistenciaTema();
        });
    }

    verificarConsistenciaTema() {
        // Pequeño retraso para asegurar que el DOM esté listo
        setTimeout(() => {
            const modoOscuroGuardado = this.obtenerTemaGuardado();
            const modoOscuroActual = document.body.classList.contains('modo-oscuro');
            
            // Corregir inconsistencia si la hay
            if (modoOscuroGuardado !== modoOscuroActual) {
                this.cambiarTema(modoOscuroGuardado);
            }
        }, 100);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new TemaManager();
});

// También inicializar si el DOM ya está listo (para scripts que se cargan después)
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    new TemaManager();
}

// Compatibilidad con jQuery
if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(() => {
        new TemaManager();
    });
}

// Exportar para uso global (opcional)
window.TemaManager = TemaManager;