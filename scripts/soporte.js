// scripts/soporte.js - Versión actualizada con mejor manejo de errores
class DocumentacionManager {
    constructor() {
        this.marcas = [];
        this.modelos = {};
        this.documentos = {};
        this.currentMarca = null;
        this.currentModelo = null;
        
        this.initializeElements();
        this.bindEvents();
        this.cargarDatos();
    }

    initializeElements() {
        this.marcasContainer = document.getElementById('marcas-container');
        this.modelosContainer = document.getElementById('modelos-container');
        this.documentosContainer = document.getElementById('documentos-container');
        this.breadcrumb = document.getElementById('breadcrumb');
        this.modeloTitle = document.getElementById('modelo-title');
        this.docList = document.getElementById('doc-list');
        this.addModelModal = document.getElementById('addModelModal');
        this.modelForm = document.getElementById('modelForm');
        this.marcaSelect = document.getElementById('marca');
    }

    bindEvents() {
        // Navegación
        document.getElementById('back-to-models').addEventListener('click', () => {
            this.showModelos(this.currentMarca);
        });

        // Modal
        document.getElementById('addModelBtn').addEventListener('click', () => {
            this.addModelModal.style.display = 'block';
        });

        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });

        document.getElementById('cancelAddModel').addEventListener('click', () => {
            this.addModelModal.style.display = 'none';
        });

        // Formulario
        this.modelForm.addEventListener('submit', (e) => this.agregarModelo(e));
    }

    async cargarDatos() {
        try {
            this.showLoading(this.marcasContainer, 'Cargando datos...');
            
            const response = await fetch('../backend/obtener_datos.php');
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
            }
            
            const text = await response.text();
            
            if (!text) {
                throw new Error('Respuesta vacía del servidor');
            }
            
            const data = JSON.parse(text);
            
            if (data.success) {
                this.marcas = data.marcas || [];
                this.modelos = data.modelos || {};
                this.documentos = data.documentos || {};
                this.loadMarcas();
                this.llenarSelectMarcas();
            } else {
                throw new Error(data.error || 'Error desconocido del servidor');
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.showError(this.marcasContainer, `Error cargando los datos: ${error.message}`);
        }
    }

    showLoading(container, message = 'Cargando...') {
        container.innerHTML = `<div class="loading">${message}</div>`;
    }

    showError(container, message) {
        container.innerHTML = `
            <div class="error">
                <p>${message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 10px;">
                    Reintentar
                </button>
                <button onclick="window.open('../backend/test_conexion.php', '_blank')" class="btn-secondary" style="margin-top: 10px;">
                    Probar Conexión
                </button>
            </div>
        `;
    }

    llenarSelectMarcas() {
        this.marcaSelect.innerHTML = '<option value="">Seleccionar marca</option>';
        this.marcas.forEach(marca => {
            const option = document.createElement('option');
            option.value = marca.id;
            option.textContent = marca.nombre;
            this.marcaSelect.appendChild(option);
        });
    }

    loadMarcas() {
        this.marcasContainer.innerHTML = '';
        
        if (this.marcas.length === 0) {
            this.marcasContainer.innerHTML = '<p>No hay marcas registradas.</p>';
            return;
        }
        
        this.marcas.forEach(marca => {
            const card = this.crearMarcaCard(marca);
            this.marcasContainer.appendChild(card);
        });
        
        this.updateBreadcrumb('Marcas');
        this.showView('marcas');
    }

    crearMarcaCard(marca) {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.innerHTML = `
            <div class="model-icon"><i class="fas fa-industry"></i></div>
            <h3>${marca.nombre}</h3>
        `;
        card.addEventListener('click', () => this.showModelos(marca));
        return card;
    }

    showModelos(marca) {
        this.currentMarca = marca;
        this.modelosContainer.innerHTML = '';
        
        if(this.modelos[marca.id] && this.modelos[marca.id].length > 0) {
            this.modelos[marca.id].forEach(modelo => {
                const card = this.crearModeloCard(modelo);
                this.modelosContainer.appendChild(card);
            });
        } else {
            this.modelosContainer.innerHTML = '<p>No hay modelos registrados para esta marca.</p>';
        }
        
        this.updateBreadcrumb('Modelos', marca.nombre);
        this.showView('modelos');
    }

    crearModeloCard(modelo) {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.innerHTML = `
            <div class="model-icon"><i class="fas fa-cube"></i></div>
            <h3>${modelo.nombre}</h3>
            <p>${modelo.tipo}</p>
        `;
        card.addEventListener('click', () => this.showDocumentos(modelo));
        return card;
    }

    showDocumentos(modelo) {
        this.currentModelo = modelo;
        this.modeloTitle.textContent = `${this.currentMarca.nombre} ${modelo.nombre}`;
        this.docList.innerHTML = '';
        
        if(this.documentos[modelo.id] && this.documentos[modelo.id].length > 0) {
            this.documentos[modelo.id].forEach(doc => {
                const docEl = this.crearDocumentoElement(doc);
                this.docList.appendChild(docEl);
            });
        } else {
            this.docList.innerHTML = '<p>No hay documentos registrados para este modelo.</p>';
        }
        
        this.updateBreadcrumb('Documentos', this.currentMarca.nombre, modelo.nombre);
        this.showView('documentos');
    }

    crearDocumentoElement(doc) {
        const docEl = document.createElement('div');
        docEl.className = 'doc-type';
        
        let icon = 'fa-file';
        if(doc.tipo === 'manual') icon = 'fa-book';
        else if(doc.tipo === 'partes') icon = 'fa-list-ol';
        else if(doc.tipo === 'tutorial') icon = 'fa-video';
        
        docEl.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${doc.nombre}</span>
            <div style="flex-grow:1"></div>
            <button class="btn-download"><i class="fas fa-download"></i></button>
            ${doc.tipo !== 'tutorial' ? '<button class="btn-preview"><i class="far fa-eye"></i></button>' : ''}
        `;
        
        // Funcionalidad de botones
        if(doc.tipo !== 'tutorial') {
            docEl.querySelector('.btn-preview').addEventListener('click', () => {
                this.mostrarVistaPrevia(doc);
            });
        }
        
        docEl.querySelector('.btn-download').addEventListener('click', () => {
            this.descargarDocumento(doc);
        });
        
        return docEl;
    }

    mostrarVistaPrevia(doc) {
        const ruta = `../manuales/${doc.marca_nombre}/${doc.modelo_nombre}/${doc.archivo}`;
        document.getElementById('pdfViewer').src = ruta;
        document.getElementById('previewModal').style.display = 'block';
    }

    descargarDocumento(doc) {
        const ruta = `../manuales/${doc.marca_nombre}/${doc.modelo_nombre}/${doc.archivo}`;
        window.open(ruta, '_blank');
    }

    updateBreadcrumb(vista, marcaNombre = '', modeloNombre = '') {
        let breadcrumbHTML = '<a href="soporte.html">Inicio</a>';
        
        if (vista === 'Marcas') {
            breadcrumbHTML += ' > <span>Marcas</span>';
        } else if (vista === 'Modelos') {
            breadcrumbHTML += ` > <a href="#" id="back-to-marcas">Marcas</a> > <span>${marcaNombre}</span>`;
            
            document.getElementById('back-to-marcas').addEventListener('click', (e) => {
                e.preventDefault();
                this.loadMarcas();
            });
        } else if (vista === 'Documentos') {
            breadcrumbHTML += ` > <a href="#" id="back-to-marcas">Marcas</a> > <a href="#" id="back-to-modelos">${marcaNombre}</a> > <span>${modeloNombre}</span>`;
            
            document.getElementById('back-to-marcas').addEventListener('click', (e) => {
                e.preventDefault();
                this.loadMarcas();
            });
            
            document.getElementById('back-to-modelos').addEventListener('click', (e) => {
                e.preventDefault();
                this.showModelos(this.currentMarca);
            });
        }
        
        this.breadcrumb.innerHTML = breadcrumbHTML;
    }

    showView(viewName) {
        this.marcasContainer.style.display = viewName === 'marcas' ? 'grid' : 'none';
        this.modelosContainer.style.display = viewName === 'modelos' ? 'grid' : 'none';
        this.documentosContainer.style.display = viewName === 'documentos' ? 'block' : 'none';
    }

    async agregarModelo(e) {
        e.preventDefault();
        
        const formData = new FormData(this.modelForm);
        
        try {
            const response = await fetch('../backend/agregar_modelo.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.mostrarMensaje(result.message, 'success');
                this.addModelModal.style.display = 'none';
                this.modelForm.reset();
                await this.cargarDatos(); // Recargar datos
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            this.mostrarMensaje('Error al agregar el modelo: ' + error.message, 'error');
        }
    }

    mostrarMensaje(mensaje, tipo) {
        const message = document.createElement('div');
        message.className = `message ${tipo}`;
        message.textContent = mensaje;
        document.querySelector('.encabezado').appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new DocumentacionManager();
});