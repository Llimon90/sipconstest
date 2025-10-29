// Variables globales
let currentMarcaId = null;
let currentModeloId = null;
let searchTimeout = null;
let currentSearchTerm = '';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de soporte...');
    cargarMarcas();
    
    // Event listeners
    document.getElementById('addModelBtn').addEventListener('click', mostrarModalAgregarModelo);
    document.getElementById('cancelAddModel').addEventListener('click', cerrarModalAgregarModelo);
    document.getElementById('modelForm').addEventListener('submit', guardarModelo);
    
    // Búsqueda
    document.getElementById('searchInput').addEventListener('input', buscarContenido);
    document.getElementById('searchBtn').addEventListener('click', function() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        if (searchTerm) {
            ejecutarBusqueda(searchTerm);
        }
    });
    
    // Limpiar búsqueda
    document.getElementById('searchInput').addEventListener('search', function() {
        if (this.value === '') {
            ocultarResultadosBusqueda();
        }
    });
    
    // Modales
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    console.log('Sistema de soporte inicializado');
});

// Cargar marcas desde la BD
async function cargarMarcas() {
    console.log('Cargando marcas...');
    const container = document.getElementById('marcas-container');
    container.innerHTML = '<div class="loading">Cargando marcas...</div>';
    
    try {
        const response = await fetch('../backend/soporte_backend.php?action=get_marcas');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        let data;
        
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            throw new Error('Respuesta del servidor no es JSON válido');
        }
        
        if (data.success) {
            console.log(`Marcas cargadas: ${data.count}`);
            mostrarMarcas(data.marcas);
        } else {
            throw new Error(data.message || 'Error desconocido al cargar marcas');
        }
    } catch (error) {
        console.error('Error al cargar marcas:', error);
        container.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar las marcas</p>
                <small>${error.message}</small>
                <button class="btn-primary" onclick="cargarMarcas()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// Mostrar marcas en el grid
function mostrarMarcas(marcas) {
    const container = document.getElementById('marcas-container');
    
    if (!marcas || marcas.length === 0) {
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
        <div class="model-card">
            <div class="model-icon">
                <i class="fas fa-industry"></i>
            </div>
            <h3>${marca.nombre}</h3>
            <p>Ver modelos</p>
            <div class="model-actions">
                <button class="btn-small btn-primary" onclick="cargarModelos(${marca.id}, '${marca.nombre.replace(/'/g, "\\'")}')">
                    <i class="fas fa-folder-open"></i>
                </button>
                <button class="btn-small btn-danger" onclick="eliminarMarca(${marca.id}, '${marca.nombre.replace(/'/g, "\\'")}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    console.log(`Mostrando ${marcas.length} marcas`);
}

// Cargar modelos de una marca
async function cargarModelos(marcaId, marcaNombre) {
    console.log(`Cargando modelos para marca ${marcaId}: ${marcaNombre}`);
    currentMarcaId = marcaId;
    
    const modelosContainer = document.getElementById('modelos-container');
    modelosContainer.innerHTML = '<div class="loading">Cargando modelos...</div>';
    
    try {
        const response = await fetch(`../backend/soporte_backend.php?action=get_modelos&marca_id=${marcaId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`Modelos cargados: ${data.count}`);
            mostrarModelos(data.modelos, marcaNombre);
            actualizarBreadcrumb(marcaNombre);
        } else {
            throw new Error(data.message || 'Error desconocido al cargar modelos');
        }
    } catch (error) {
        console.error('Error al cargar modelos:', error);
        modelosContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar los modelos</p>
                <small>${error.message}</small>
                <button class="btn-secondary" onclick="volverAMarcas()">
                    <i class="fas fa-arrow-left"></i> Volver a Marcas
                </button>
            </div>
        `;
    }
}

// Mostrar modelos en el grid
function mostrarModelos(modelos, marcaNombre) {
    const marcasContainer = document.getElementById('marcas-container');
    const modelosContainer = document.getElementById('modelos-container');
    
    marcasContainer.style.display = 'none';
    modelosContainer.style.display = 'block';
    
    if (!modelos || modelos.length === 0) {
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
            <h3>Modelos de ${marcaNombre} (${modelos.length})</h3>
            <button class="btn-primary" onclick="mostrarModalAgregarModelo()">
                <i class="fas fa-plus"></i> Agregar Modelo
            </button>
        </div>
        <div class="model-grid-content">
            ${modelos.map(modelo => `
                <div class="model-card">
                    <div class="model-icon">
                        <i class="fas fa-laptop"></i>
                    </div>
                    <h3>${modelo.nombre}</h3>
                    <p>${modelo.tipo_equipo}</p>
                    <div class="model-actions">
                        <button class="btn-small btn-primary" onclick="cargarDocumentos(${modelo.id}, '${modelo.nombre.replace(/'/g, "\\'")}')">
                            <i class="fas fa-folder-open"></i>
                        </button>
                        <button class="btn-small btn-warning" onclick="editarModelo(${modelo.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-small btn-danger" onclick="eliminarModelo(${modelo.id}, '${modelo.nombre.replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Cargar documentos de un modelo
async function cargarDocumentos(modeloId, modeloNombre) {
    console.log(`Cargando documentos para modelo ${modeloId}: ${modeloNombre}`);
    currentModeloId = modeloId;
    
    const docList = document.getElementById('doc-list');
    docList.innerHTML = '<div class="loading">Cargando documentos...</div>';
    
    try {
        const response = await fetch(`../backend/soporte_backend.php?action=get_documentos&modelo_id=${modeloId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`Documentos cargados: ${data.count}`);
            mostrarDocumentos(data.documentos, modeloNombre);
            actualizarBreadcrumbDocumentos(modeloNombre);
        } else {
            throw new Error(data.message || 'Error desconocido al cargar documentos');
        }
    } catch (error) {
        console.error('Error al cargar documentos:', error);
        docList.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar los documentos</p>
                <small>${error.message}</small>
            </div>
        `;
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
    
    if (!documentos || documentos.length === 0) {
        docList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-file-pdf fa-3x"></i>
                <p>No hay documentos para este modelo</p>
                <button class="btn-primary" onclick="mostrarModalSubirDocumentos(${currentModeloId})">
                    <i class="fas fa-upload"></i> Subir Documentos
                </button>
            </div>
        `;
    } else {
        docList.innerHTML = `
            <div class="documentos-header">
                <button class="btn-primary" onclick="mostrarModalSubirDocumentos(${currentModeloId})">
                    <i class="fas fa-upload"></i> Subir Más Documentos
                </button>
            </div>
            ${documentos.map(doc => `
                <div class="doc-item" id="doc-${doc.id}">
                    <div class="doc-icon">
                        ${obtenerIconoTipoDocumento(doc.tipo_documento)}
                    </div>
                    <div class="doc-info">
                        <h4>${doc.nombre_archivo}</h4>
                        <p>Tipo: ${doc.tipo_documento.replace('_', ' ')}</p>
                        ${doc.descripcion ? `<p>Descripción: ${doc.descripcion}</p>` : ''}
                        <small>Subido: ${new Date(doc.fecha_subida).toLocaleDateString()}</small>
                    </div>
                    <div class="doc-actions">
                        <button class="btn-primary" onclick="verDocumento('${doc.ruta_publica || doc.ruta_archivo}')">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn-secondary" onclick="descargarDocumento('${doc.ruta_publica || doc.ruta_archivo}', '${doc.nombre_archivo}')">
                            <i class="fas fa-download"></i> Descargar
                        </button>
                        <button class="btn-danger" onclick="eliminarDocumento(${doc.id}, '${doc.nombre_archivo}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
    }
    
    document.getElementById('back-to-models').onclick = volverAModelos;
}

// Funciones de gestión de modelos
async function editarModelo(modeloId) {
    try {
        const response = await fetch(`../backend/soporte_backend.php?action=get_modelo_info&modelo_id=${modeloId}`);
        const data = await response.json();
        
        if (data.success) {
            mostrarModalEditarModelo(data.modelo);
        } else {
            throw new Error(data.message || 'Error al cargar información del modelo');
        }
    } catch (error) {
        console.error('Error al editar modelo:', error);
        alert('Error al cargar información del modelo: ' + error.message);
    }
}

async function eliminarModelo(modeloId, modeloNombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el modelo "${modeloNombre}"? Esta acción eliminará todos los documentos asociados y no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch('../backend/soporte_backend.php?action=delete_modelo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ modelo_id: modeloId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Modelo eliminado correctamente');
            cargarModelos(currentMarcaId, document.querySelector('#modelos-container h3').textContent.replace('Modelos de ', ''));
        } else {
            throw new Error(data.message || 'Error al eliminar modelo');
        }
    } catch (error) {
        console.error('Error al eliminar modelo:', error);
        alert('Error al eliminar el modelo: ' + error.message);
    }
}

async function eliminarMarca(marcaId, marcaNombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la marca "${marcaNombre}"? Solo se puede eliminar si no tiene modelos activos.`)) {
        return;
    }

    try {
        const response = await fetch('../backend/soporte_backend.php?action=delete_marca', {
            method: 'POST',
            headers: {
                'Content-Type: 'application/json',
            },
            body: JSON.stringify({ marca_id: marcaId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Marca eliminada correctamente');
            cargarMarcas();
        } else {
            throw new Error(data.message || 'Error al eliminar marca');
        }
    } catch (error) {
        console.error('Error al eliminar marca:', error);
        alert('Error al eliminar la marca: ' + error.message);
    }
}

async function eliminarDocumento(documentoId, nombreArchivo) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el documento "${nombreArchivo}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch('../backend/soporte_backend.php?action=delete_documento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ documento_id: documentoId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Eliminar del DOM
            document.getElementById(`doc-${documentoId}`).remove();
            alert('Documento eliminado correctamente');
        } else {
            throw new Error(data.message || 'Error al eliminar documento');
        }
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        alert('Error al eliminar el documento: ' + error.message);
    }
}

// Funciones de búsqueda (se mantienen igual)
function buscarContenido() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    if (searchTerm.length === 0) {
        ocultarResultadosBusqueda();
        return;
    }

    if (searchTerm.length < 2) {
        return;
    }

    currentSearchTerm = searchTerm;
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
        ejecutarBusqueda(searchTerm);
    }, 500);
}

async function ejecutarBusqueda(termino) {
    console.log('Buscando:', termino);
    
    const container = document.getElementById('marcas-container');
    container.innerHTML = '<div class="loading">Buscando...</div>';

    try {
        const response = await fetch(`../backend/soporte_backend.php?action=buscar&q=${encodeURIComponent(termino)}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.resultados) {
            mostrarResultadosBusqueda(data.resultados, termino);
        } else {
            throw new Error(data.message || 'Error en la búsqueda');
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        container.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error en la búsqueda</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

function mostrarResultadosBusqueda(resultados, termino) {
    const container = document.getElementById('marcas-container');
    const marcas = resultados.marcas || [];
    const modelos = resultados.modelos || [];
    const total = resultados.total || (marcas.length + modelos.length);

    if (total === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-search fa-3x"></i>
                <p>No se encontraron resultados para: "${termino}"</p>
                <small>Intenta con otros términos de búsqueda</small>
            </div>
        `;
        return;
    }

    let html = `
        <div class="search-results-header">
            <h3>Resultados de búsqueda: "${termino}"</h3>
            <div class="search-stats">
                ${marcas.length} marcas, ${modelos.length} modelos
            </div>
            <button class="btn-secondary" onclick="ocultarResultadosBusqueda()">
                <i class="fas fa-arrow-left"></i> Volver a todas las marcas
            </button>
        </div>
    `;

    if (marcas.length > 0) {
        html += `
            <div class="search-section">
                <h4><i class="fas fa-industry"></i> Marcas (${marcas.length})</h4>
                <div class="model-grid-content">
                    ${marcas.map(marca => `
                        <div class="model-card" onclick="cargarModelos(${marca.id}, '${(marca.nombre || '').replace(/'/g, "\\'")}')">
                            <div class="model-icon">
                                <i class="fas fa-industry"></i>
                            </div>
                            <h3>${resaltarTexto(marca.nombre || '', termino)}</h3>
                            <p>Ver modelos de la marca</p>
                            <div class="search-badge">Marca</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (modelos.length > 0) {
        html += `
            <div class="search-section">
                <h4><i class="fas fa-laptop"></i> Modelos (${modelos.length})</h4>
                <div class="model-grid-content">
                    ${modelos.map(modelo => `
                        <div class="model-card" onclick="cargarModelos(${modelo.marca_id || modelo.id}, '${(modelo.marca_nombre || '').replace(/'/g, "\\'")}')">
                            <div class="model-icon">
                                <i class="fas fa-laptop"></i>
                            </div>
                            <h3>${resaltarTexto(modelo.nombre || '', termino)}</h3>
                            <p>${resaltarTexto(modelo.tipo_equipo || '', termino)}</p>
                            <small>Marca: ${modelo.marca_nombre || 'N/A'}</small>
                            <div class="search-badge">Modelo</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function resaltarTexto(texto, termino) {
    if (!termino) return texto;
    const regex = new RegExp(`(${termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function ocultarResultadosBusqueda() {
    document.getElementById('searchInput').value = '';
    currentSearchTerm = '';
    cargarMarcas();
}

// Funciones auxiliares
function obtenerIconoTipoDocumento(tipo) {
    const iconos = {
        'manual': 'fas fa-book',
        'lista_partes': 'fas fa-list',
        'tutorial': 'fas fa-video',
        'imagen': 'fas fa-image',
        'diagrama': 'fas fa-project-diagram',
        'esquema': 'fas fa-sitemap',
        'firmware': 'fas fa-microchip',
        'software': 'fas fa-desktop',
        'otro': 'fas fa-file'
    };
    return `<i class="${iconos[tipo] || 'fas fa-file'}"></i>`;
}

// ... (el resto de las funciones se mantienen igual: Modal para agregar marca, agregarMarca, Modal para agregar modelo, guardarModelo, etc.)

// Funciones de navegación
function volverAMarcas() {
    console.log('Volviendo a marcas');
    document.getElementById('modelos-container').style.display = 'none';
    document.getElementById('documentos-container').style.display = 'none';
    document.getElementById('marcas-container').style.display = 'block';
    actualizarBreadcrumb();
    currentMarcaId = null;
    currentModeloId = null;
}

function volverAModelos() {
    console.log('Volviendo a modelos');
    document.getElementById('documentos-container').style.display = 'none';
    document.getElementById('modelos-container').style.display = 'block';
    actualizarBreadcrumb(document.querySelector('#marcas-container .model-card h3')?.textContent || '');
    currentModeloId = null;
}

function cerrarModalAgregarModelo() {
    console.log('Cerrando modal de agregar modelo');
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
    console.log('Viendo documento:', ruta);
    const modal = document.getElementById('previewModal');
    const pdfViewer = document.getElementById('pdfViewer');
    
    const url = `../backend/descargar_documento.php?archivo=${encodeURIComponent(ruta)}`;
    pdfViewer.src = url;
    modal.style.display = 'block';
}

function descargarDocumento(ruta, nombre) {
    console.log('Descargando documento:', nombre);
    const link = document.createElement('a');
    const url = `../backend/descargar_documento.php?archivo=${encodeURIComponent(ruta)}&download=1`;
    link.href = url;
    link.download = nombre;
    link.click();
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

// Exportar funciones para debugging
window.soporteApp = {
    cargarMarcas,
    cargarModelos,
    cargarDocumentos,
    mostrarModalAgregarMarca,
    mostrarModalAgregarModelo,
    editarModelo,
    eliminarModelo,
    eliminarMarca,
    eliminarDocumento
};