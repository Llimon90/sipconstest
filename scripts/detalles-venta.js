/**
 * scripts/detalles-venta.js
 * Lógica Completa (Estilo Incidencias + Prevención Duplicados) para Detalles de Venta - SIPCONS
 */

// ==========================================
// 1. CONFIGURACIÓN Y UTILIDADES
// ==========================================
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

function getShortFileName(fileName, maxLength = 18) {
    return fileName.length > maxLength ? fileName.substring(0, maxLength) + '...' : fileName;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notificacion ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ==========================================
// 2. RENDERIZADO DE ARCHIVOS (Estilo Incidencias)
// ==========================================
async function renderPdfThumbnail(archivo, canvas) {
    try {
        const pdf = await pdfjsLib.getDocument(archivo).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport: viewport }).promise;
    } catch (error) {
        console.error('Error al renderizar miniatura de PDF:', error);
        throw error;
    }
}

function createFilePreview(archivo, ext) {
    let previewElement;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        previewElement = document.createElement('img');
        previewElement.src = archivo;
        previewElement.style.maxWidth = '100px';
        previewElement.style.maxHeight = '100px';
        previewElement.style.objectFit = 'contain';
        previewElement.style.cursor = 'pointer';
    } else if (ext === 'pdf') {
        previewElement = document.createElement('canvas');
        previewElement.style.maxWidth = '100px';
        previewElement.style.maxHeight = '100px';
        previewElement.style.cursor = 'pointer';
        previewElement.style.border = '1px solid #eee'; 
    } else {
        previewElement = document.createElement('i');
        previewElement.className = 'fas fa-file-alt';
        previewElement.style.fontSize = '60px';
        previewElement.style.color = '#95a5a6';
        previewElement.style.cursor = 'pointer';
    }
    return previewElement;
}

function createFileContainer(archivoObj) {
    const archivoUrl = archivoObj.ruta_archivo;
    const nombreOriginal = archivoObj.nombre_archivo;
    const idArchivo = archivoObj.id;
    const ext = archivoUrl.split('.').pop().toLowerCase();

    const archivoContainer = document.createElement('div');
    archivoContainer.className = 'archivo-container';
    archivoContainer.style.position = 'relative';
    archivoContainer.style.margin = '10px';
    archivoContainer.style.padding = '10px';
    archivoContainer.style.border = '1px solid #ddd';
    archivoContainer.style.borderRadius = '5px';
    archivoContainer.style.display = 'inline-block';
    archivoContainer.style.width = '130px'; 
    archivoContainer.style.height = '160px';
    archivoContainer.style.verticalAlign = 'top';
    archivoContainer.style.backgroundColor = '#fafafa';

    const link = document.createElement('a');
    link.href = archivoUrl;
    link.target = '_blank';
    link.style.textDecoration = 'none';
    link.style.color = '#333';
    link.style.display = 'flex';
    link.style.flexDirection = 'column';
    link.style.alignItems = 'center';
    link.style.height = '100%';

    const divCentrado = document.createElement('div');
    divCentrado.style.display = 'flex';
    divCentrado.style.justifyContent = 'center';
    divCentrado.style.alignItems = 'center';
    divCentrado.style.height = '100px';
    divCentrado.style.width = '100%';
    divCentrado.style.marginBottom = '8px';

    const previewElement = createFilePreview(archivoUrl, ext);
    if (previewElement) {
        divCentrado.appendChild(previewElement);
    }
    link.appendChild(divCentrado);

    const fileNameSpan = document.createElement('span');
    fileNameSpan.textContent = getShortFileName(nombreOriginal);
    fileNameSpan.title = nombreOriginal;
    fileNameSpan.style.display = 'block';
    fileNameSpan.style.textAlign = 'center';
    fileNameSpan.style.fontSize = '12px';
    fileNameSpan.style.lineHeight = '1.2';
    link.appendChild(fileNameSpan);

    // Botón rojo de eliminar (Blindado contra CSS global para ser un círculo perfecto)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'eliminar-archivo';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>'; 
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '-8px';
    deleteBtn.style.right = '-8px';
    deleteBtn.style.background = '#ff4d4f';
    deleteBtn.style.color = 'white';
    deleteBtn.style.border = 'none';
    deleteBtn.style.borderRadius = '50%';
    
    // Medidas estrictas para evitar el óvalo
    deleteBtn.style.width = '26px';
    deleteBtn.style.height = '26px';
    deleteBtn.style.minWidth = '26px';
    deleteBtn.style.minHeight = '26px';
    deleteBtn.style.maxWidth = '26px';
    deleteBtn.style.maxHeight = '26px';
    
    // Reseteo de espaciados globales
    deleteBtn.style.padding = '0';
    deleteBtn.style.margin = '0';
    deleteBtn.style.boxSizing = 'border-box';
    
    // Centrado perfecto del ícono
    deleteBtn.style.display = 'flex';
    deleteBtn.style.alignItems = 'center';
    deleteBtn.style.justifyContent = 'center';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    
    deleteBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        borrarArchivoVenta(idArchivo, archivoUrl, archivoContainer);
    };

    archivoContainer.appendChild(link);
    archivoContainer.appendChild(deleteBtn);

    return { container: archivoContainer, preview: previewElement, ext: ext, url: archivoUrl };
}

async function cargarArchivosAdjuntosVentas(archivosArray) {
    const contenedorArchivos = document.getElementById("contenedor-archivos");
    contenedorArchivos.innerHTML = "";

    if (archivosArray && archivosArray.length > 0) {
        for (const archivoObj of archivosArray) {
            const { container, preview, ext, url } = createFileContainer(archivoObj);

            if (ext === 'pdf' && preview) {
                try {
                    await renderPdfThumbnail(url, preview);
                } catch (error) {
                    const errorSpan = document.createElement('span');
                    errorSpan.textContent = 'PDF (Error preview)';
                    preview.replaceWith(errorSpan);
                }
            }
            contenedorArchivos.appendChild(container);
        }
    } else {
        contenedorArchivos.innerHTML = "<p style='color:#95a5a6; padding: 20px;'>No hay archivos adjuntos para esta venta.</p>";
    }
}

// ==========================================
// 3. LOGICA DEL SERVIDOR (FETCH)
// ==========================================

// Eliminar Archivo Individual
async function borrarArchivoVenta(idArchivo, urlArchivo, containerElement) {
    if (!confirm('¿Estás seguro de que deseas eliminar este archivo permanentemente?')) return;

    containerElement.classList.add('eliminando');

    try {
        const resp = await fetch("../backend/eliminar_archivo.php", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: idArchivo, ruta: urlArchivo, modulo: 'ventas' })
        });

        const data = await resp.json();

        if (data.success || data.exito) {
            containerElement.remove();
            showNotification('Archivo eliminado correctamente', 'success');
        } else {
            throw new Error(data.error || data.mensaje || 'Error al eliminar');
        }
    } catch (error) {
        showNotification(error.message, 'error');
        containerElement.classList.remove('eliminando');
    }
}

// Carga Inicial
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ventaId = urlParams.get('id');

    if (!ventaId) {
        alert("Error: ID no encontrado.");
        window.location.href = 'ventas.html';
        return;
    }
    document.getElementById('venta_id').value = ventaId;

    const cargarDatos = async () => {
        try {
            const resp = await fetch(`../backend/obtener_venta_full.php?id=${ventaId}`);
            const data = await resp.json();

            if (data.exito) {
                // Llenar Formulario
                document.getElementById('txt-folio').textContent = data.venta.folio;
                document.getElementById('cliente').value = data.venta.cliente;
                document.getElementById('sucursal').value = data.venta.sucursal;

                if(data.series.length > 0) {
                    const d = data.series[0];
                    document.getElementById('equipo').value = d.equipo || '';
                    document.getElementById('marca').value = d.marca || '';
                    document.getElementById('modelo').value = d.modelo || '';
                    document.getElementById('garantia').value = d.garantia || 0;
                    document.getElementById('calibracion').value = d.calibracion || 0;
                    document.getElementById('servicio').checked = (d.servicio == 1);
                    document.getElementById('notas').value = d.notas || '';
                }

                // Generar Inputs de Series
                const contSeries = document.getElementById('container-series-edit');
                contSeries.innerHTML = data.series.map((s, index) => `
                    <div style="background: white; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <label style="font-size: 0.8rem; color: #7f8c8d; font-weight: bold;">SERIE EQUIPO ${index + 1}</label>
                        <input type="text" class="serie-edit-input" data-id="${s.id}" value="${s.numero_serie}" required style="width: 100%; padding: 5px; margin-top: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                `).join('');

                // Renderizar Archivos
                cargarArchivosAdjuntosVentas(data.archivos);
            }
        } catch (e) {
            console.error("Error al cargar la venta:", e);
            showNotification("Error al cargar los datos", "error");
        }
    };

    cargarDatos();

    // Guardar Cambios Generales
    document.getElementById('btn-guardar-cambios').addEventListener('click', async () => {
        const btn = document.getElementById('btn-guardar-cambios');
        const form = document.getElementById('form-editar-venta');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // El FormData atrapa automáticamente el input de nuevos_facturas[] (evita doble subida)
        const formData = new FormData(form);
        formData.set('servicio', document.getElementById('servicio').checked ? 1 : 0);

        // ==========================================
        // VALIDACIÓN DE SERIES DUPLICADAS
        // ==========================================
        const inputsSeries = document.querySelectorAll('.serie-edit-input');
        const seriesValues = [];
        let hayDuplicados = false;

        const seriesData = Array.from(inputsSeries).map(input => {
            const serieLimpia = input.value.trim().toUpperCase();
            
            // Revisar si ya existe en nuestro arreglo temporal
            if (serieLimpia !== '') {
                if (seriesValues.includes(serieLimpia)) {
                    hayDuplicados = true;
                    input.style.border = '2px solid #e74c3c'; // Pintar de rojo el duplicado
                    input.style.backgroundColor = '#fdf0ed';
                } else {
                    seriesValues.push(serieLimpia);
                    input.style.border = '1px solid #ccc'; // Restaurar estilo normal
                    input.style.backgroundColor = '#fff';
                }
            }

            return {
                id_detalle: input.getAttribute('data-id'),
                serie: serieLimpia
            };
        });

        if (hayDuplicados) {
            showNotification("Hay números de serie duplicados. Corrígelos antes de guardar.", "error");
            return; // Detenemos la ejecución aquí, no se envía nada al servidor
        }

        formData.append('series_json', JSON.stringify(seriesData));

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            const resp = await fetch('../backend/actualizar-venta.php', {
                method: 'POST',
                body: formData 
            });

            const res = await resp.json();
            if (res.exito) {
                showNotification("Venta actualizada correctamente", "success");
                setTimeout(() => location.reload(), 1500); 
            } else {
                throw new Error(res.mensaje);
            }
        } catch (e) {
            showNotification(e.message || "Error al conectar con el servidor", "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios de la Venta';
        }
    });

    // Eliminar Venta Completa
    document.getElementById('btn-eliminar-venta').addEventListener('click', async () => {
        if(confirm("¡ATENCIÓN! Esto borrará permanentemente la venta, sus series y todos los archivos. ¿Proceder?")) {
            try {
                const resp = await fetch('../backend/eliminar_venta.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: ventaId })
                });
                const res = await resp.json();
                if(res.exito) {
                    alert("Venta eliminada del sistema.");
                    window.location.href = 'ventas.html';
                } else {
                    showNotification(res.mensaje, "error");
                }
            } catch(e) {
                showNotification("Error de conexión al eliminar", "error");
            }
        }
    });
});