// Variables globales
let currentMarcaId = null;
let currentModeloId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarMarcas();
    
    // Event listeners
    document.getElementById('addModelBtn').addEventListener('click', mostrarModalAgregarModelo);
    document.getElementById('cancelAddModel').addEventListener('click', cerrarModalAgregarModelo);
    document.getElementById('modelForm').addEventListener('submit', guardarModelo);
    document.getElementById('searchBtn').addEventListener('click', buscarContenido);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') buscarContenido();
    });
    
    // Modales
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
});

// Cargar marcas desde la BD
async function cargarMarcas() {
    try {
        const response = await fetch('../backend/soporte_backend.php?action=get_marcas');
        const data = await response.json();
        
        if (data.success) {
            mostrarMarcas(data.marcas);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al cargar marcas:', error);
        document.getElementById('marcas-container').innerHTML = '<div class="error">Error al cargar las marcas</div>';
    }
}

// Mostrar marcas en el grid
function mostrarMarcas(marcas) {
    const container = document.getElementById('marcas-container');
    
    if (marcas.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-industry fa-3x"></i>
                <p>No hay marcas registradas</p>
                <button class="btn-primary" onclick="mostrarModalAgregarMarca()">
                    <i class="fas fa-plus"></i> Agregar Primera Marca
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = marcas.map(marca => `
        <div class="model-card" onclick="cargarModelos(${marca.id}, '${marca.nombre}')">
            <div class="model-icon">
                <i class="fas fa-industry"></i>
            </div>
            <h3>${marca.nombre}</h3>
            <p>Ver modelos</p>
        </div>
    `).join('');
}

// Cargar modelos de una marca
async function cargarModelos(marcaId, marcaNombre) {
    currentMarcaId = marcaId;
    
    try {
        const response = await fetch(`soporte_backend.php?action=get_modelos&marca_id=${marcaId}`);
        const data = await response.json();
        
        if (data.success) {
            mostrarModelos(data.modelos, marcaNombre);
            actualizarBreadcrumb(marcaNombre);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al cargar modelos:', error);
        alert('Error al cargar los modelos');
    }
}

// Mostrar modelos en el grid
function mostrarModelos(modelos, marcaNombre) {
    const marcasContainer = document.getElementById('marcas-container');
    const modelosContainer = document.getElementById('modelos-container');
    
    marcasContainer.style.display = 'none';
    modelosContainer.style.display = 'block';
    
    if (modelos.length === 0) {
        modelosContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-tools fa-3x"></i>
                <p>No hay modelos registrados para ${marcaNombre}</p>
                <button class="btn-primary" onclick="mostrarModalAgregarModelo()">
                    <i class="fas fa-plus"></i> Agregar Primer Modelo
                </button>
                <button class="btn-secondary" onclick="volverAMarcas()">
                    <i class="fas fa-arrow-left"></i> Volver a Marcas
                </button>
            </div>
        `;
        return;
    }
    
    modelosContainer.innerHTML = `
        <div class="section-header">
            <button class="back-button" onclick="volverAMarcas()">
                <i class="fas fa-arrow-left"></i> Volver a Marcas
            </button>
            <h3>Modelos de ${marcaNombre}</h3>
        </div>
        <div class="model-grid-content">
            ${modelos.map(modelo => `
                <div class="model-card" onclick="cargarDocumentos(${modelo.id}, '${modelo.nombre}')">
                    <div class="model-icon">
                        <i class="fas fa-laptop"></i>
                    </div>
                    <h3>${modelo.nombre}</h3>
                    <p>${modelo.tipo_equipo}</p>
                    <div class="model-actions">
                        <button class="btn-small" onclick="event.stopPropagation(); editarModelo(${modelo.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Cargar documentos de un modelo
async function cargarDocumentos(modeloId, modeloNombre) {
    currentModeloId = modeloId;
    
    try {
        const response = await fetch(`soporte_backend.php?action=get_documentos&modelo_id=${modeloId}`);
        const data = await response.json();
        
        if (data.success) {
            mostrarDocumentos(data.documentos, modeloNombre);
            actualizarBreadcrumbDocumentos(modeloNombre);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al cargar documentos:', error);
        alert('Error al cargar los documentos');
    }
}

// Mostrar documentos
function mostrarDocumentos(documentos, modeloNombre) {
    const modelosContainer = document.getElementById('modelos-container');
    const documentosContainer = document.getElementById('documentos-container');
    
    modelosContainer.style.display = 'none';
    documentosContainer.style.display = 'block';
    
    const docList = document.getElementById('doc-list');
    const modeloTitle = document.getElementById('modelo-title');
    
    modeloTitle.textContent = `Documentos - ${modeloNombre}`;
    
    if (documentos.length === 0) {
        docList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-file-pdf fa-3x"></i>
                <p>No hay documentos para este modelo</p>
            </div>
        `;
    } else {
        docList.innerHTML = documentos.map(doc => `
            <div class="doc-item">
                <div class="doc-icon">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="doc-info">
                    <h4>${doc.nombre_archivo}</h4>
                    <p>Tipo: ${doc.tipo_documento.replace('_', ' ')}</p>
                </div>
                <div class="doc-actions">
                    <button class="btn-primary" onclick="verDocumento('${doc.ruta_archivo}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn-secondary" onclick="descargarDocumento('${doc.ruta_archivo}', '${doc.nombre_archivo}')">
                        <i class="fas fa-download"></i> Descargar
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Configurar botón volver
    document.getElementById('back-to-models').onclick = volverAModelos;
}

// Modal para agregar marca
function mostrarModalAgregarMarca() {
    const marcaNombre = prompt('Ingrese el nombre de la nueva marca:');
    if (marcaNombre && marcaNombre.trim()) {
        agregarMarca(marcaNombre.trim());
    }
}

// Agregar nueva marca
async function agregarMarca(nombre) {
    try {
        const response = await fetch('soporte_backend.php?action=add_marca', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre: nombre })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Marca agregada correctamente');
            cargarMarcas();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al agregar marca:', error);
        alert('Error al agregar la marca: ' + error.message);
    }
}

// Modal para agregar modelo
async function mostrarModalAgregarModelo() {
    // Cargar marcas para el select
    try {
        const response = await fetch('soporte_backend.php?action=get_marcas');
        const data = await response.json();
        
        if (data.success) {
            const selectMarca = document.getElementById('marca');
            selectMarca.innerHTML = '<option value="">Seleccionar marca</option>' +
                data.marcas.map(marca => `<option value="${marca.id}">${marca.nombre}</option>`).join('');
            
            // Agregar opción para nueva marca
            const optionNuevaMarca = document.createElement('option');
            optionNuevaMarca.value = 'new';
            optionNuevaMarca.textContent = '+ Agregar nueva marca';
            selectMarca.appendChild(optionNuevaMarca);
            
            // Si estamos en una marca específica, seleccionarla
            if (currentMarcaId) {
                selectMarca.value = currentMarcaId;
            }
            
            document.getElementById('addModelModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error al cargar marcas:', error);
        alert('Error al cargar las marcas');
    }
}

// Guardar nuevo modelo
async function guardarModelo(e) {
    e.preventDefault();
    
    const formData = new FormData(document.getElementById('modelForm'));
    
    try {
        const response = await fetch('soporte_backend.php?action=add_modelo', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Modelo agregado correctamente');
            cerrarModalAgregarModelo();
            
            // Recargar la vista actual
            if (currentMarcaId) {
                const marcaNombre = document.querySelector('#marca option:checked').textContent;
                cargarModelos(currentMarcaId, marcaNombre);
            } else {
                cargarMarcas();
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al agregar modelo:', error);
        alert('Error al agregar el modelo: ' + error.message);
    }
}

// Funciones de navegación
function volverAMarcas() {
    document.getElementById('modelos-container').style.display = 'none';
    document.getElementById('documentos-container').style.display = 'none';
    document.getElementById('marcas-container').style.display = 'block';
    actualizarBreadcrumb();
    currentMarcaId = null;
}

function volverAModelos() {
    document.getElementById('documentos-container').style.display = 'none';
    document.getElementById('modelos-container').style.display = 'block';
    actualizarBreadcrumb(document.querySelector('#marcas-container .model-card h3')?.textContent || '');
    currentModeloId = null;
}

function cerrarModalAgregarModelo() {
    document.getElementById('addModelModal').style.display = 'none';
    document.getElementById('modelForm').reset();
}

// Actualizar breadcrumb
function actualizarBreadcrumb(marcaNombre = '') {
    const breadcrumb = document.getElementById('breadcrumb');
    if (marcaNombre) {
        breadcrumb.innerHTML = `<a href="javascript:volverAMarcas()">Inicio</a> > <span>${marcaNombre}</span>`;
    } else {
        breadcrumb.innerHTML = `<a href="soporte.html">Inicio</a> > <span>Marcas</span>`;
    }
}

function actualizarBreadcrumbDocumentos(modeloNombre) {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = `
        <a href="javascript:volverAMarcas()">Inicio</a> > 
        <a href="javascript:volverAModelos()">Marcas</a> > 
        <span>${modeloNombre}</span>
    `;
}

// Funciones para documentos
function verDocumento(ruta) {
    const modal = document.getElementById('previewModal');
    const pdfViewer = document.getElementById('pdfViewer');
    
    pdfViewer.src = ruta.replace('../', '');
    modal.style.display = 'block';
}

function descargarDocumento(ruta, nombre) {
    const link = document.createElement('a');
    link.href = ruta.replace('../', '');
    link.download = nombre;
    link.click();
}

// Buscar contenido
function buscarContenido() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    // Implementar búsqueda según sea necesario
    alert('Funcionalidad de búsqueda en desarrollo');
}

// Cerrar modales al hacer click fuera
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}