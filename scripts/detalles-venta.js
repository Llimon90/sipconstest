/**
 * scripts/detalles-venta.js
 * Módulo de Administración y Edición de Ventas - SIPCONS
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener ID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const ventaId = urlParams.get('id');

    if (!ventaId) {
        alert("Error: ID de venta no válido.");
        window.location.href = 'ventas.html';
        return;
    }

    // Asignar el ID al input oculto del formulario
    const inputVentaId = document.getElementById('venta_id');
    if(inputVentaId) inputVentaId.value = ventaId;

    // ==========================================
    // 2. CARGAR DATOS DE LA VENTA
    // ==========================================
    const cargarDatos = async () => {
        try {
            const resp = await fetch(`../backend/obtener_venta_full.php?id=${ventaId}`);
            const data = await resp.json();

            if (data.exito) {
                // Llenar Cabecera
                document.getElementById('txt-folio').textContent = data.venta.folio;
                document.getElementById('cliente').value = data.venta.cliente;
                document.getElementById('sucursal').value = data.venta.sucursal;

                // Llenar Detalles Generales (Tomamos la primera serie como referencia)
                if(data.series.length > 0) {
                    const detalle = data.series[0];
                    document.getElementById('equipo').value = detalle.equipo || '';
                    document.getElementById('marca').value = detalle.marca || '';
                    document.getElementById('modelo').value = detalle.modelo || '';
                    document.getElementById('garantia').value = detalle.garantia || 0;
                    document.getElementById('calibracion').value = detalle.calibracion || 0;
                    document.getElementById('servicio').checked = (detalle.servicio == 1);
                    document.getElementById('notas').value = detalle.notas || '';
                }

                // Generar Inputs de Series Dinámicas
                const contSeries = document.getElementById('container-series-edit');
                contSeries.innerHTML = data.series.map((s, index) => `
                    <div>
                        <label style="font-size: 0.8rem; color: #7f8c8d; font-weight: 600;">Equipo ${index + 1}</label>
                        <input type="text" class="serie-edit-input filtro-input" data-id="${s.id}" value="${s.numero_serie}" required style="width:100%; box-sizing: border-box;">
                    </div>
                `).join('');

                // Generar Cuadrícula de Archivos (Miniaturas)
                const contArchivos = document.getElementById('grid-archivos-admin');
                contArchivos.innerHTML = data.archivos.map(a => {
                    // Detectar tipo de archivo
                    const ext = a.ruta_archivo.split('.').pop().toLowerCase();
                    const esImagen = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                    const esPdf = ext === 'pdf';

                    // Definir qué mostrar en la tarjeta
                    let elementoVisual = '';
                    let accionClickPreview = `abrirVistaPrevia('${a.ruta_archivo}', 'defecto')`;

                    if (esImagen) {
                        elementoVisual = `<img src="${a.ruta_archivo}" style="width: 100%; height: 120px; object-fit: cover;">`;
                        accionClickPreview = `abrirVistaPrevia('${a.ruta_archivo}', 'imagen')`;
                    } else if (esPdf) {
                        elementoVisual = `<div style="display: flex; justify-content: center; align-items: center; height: 120px; background: #fee2e2;"><i class="fas fa-file-pdf" style="font-size: 50px; color: #e74c3c;"></i></div>`;
                        accionClickPreview = `abrirVistaPrevia('${a.ruta_archivo}', 'pdf')`;
                    } else {
                        elementoVisual = `<div style="display: flex; justify-content: center; align-items: center; height: 120px; background: #f0f2f5;"><i class="fas fa-file-alt" style="font-size: 50px; color: #95a5a6;"></i></div>`;
                        accionClickPreview = `window.open('${a.ruta_archivo}', '_blank')`; // Fallback para Word, Excel, etc.
                    }

                    // Retornar la tarjeta HTML
                    return `
                    <div class="card-archivo-wrapper">
                        <button type="button" class="close-icon-overlap" onclick="borrarArchivo(${a.id}, '${a.ruta_archivo}')" title="Eliminar archivo permanentemente">
                            <i class="fas fa-times"></i>
                        </button>
                        
                        <div style="cursor: pointer;" onclick="${accionClickPreview}">
                            ${elementoVisual}
                        </div>
                        
                        <div style="padding: 10px; text-align: center; border-top: 1px solid #e2e8f0; background: #fff;">
                            <a href="${a.ruta_archivo}" target="_blank" style="color:#2c3e50; text-decoration:none; font-weight: 600; font-size: 12px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${a.nombre_archivo}">
                                ${a.nombre_archivo}
                            </a>
                        </div>
                    </div>
                    `;
                }).join('') || '<div style="grid-column: 1 / -1; text-align: center; color: #95a5a6; padding: 20px;">No hay archivos adjuntos en esta venta.</div>';
            }
        } catch (e) {
            console.error("Error al cargar la venta:", e);
        }
    };

    cargarDatos();

    // ==========================================
    // 3. GUARDAR CAMBIOS (Formulario + Archivos)
    // ==========================================
    document.getElementById('btn-guardar-cambios').addEventListener('click', async () => {
        const btn = document.getElementById('btn-guardar-cambios');
        const form = document.getElementById('form-editar-venta');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Crear FormData para poder enviar archivos y texto juntos
        const formData = new FormData(form);
        
        // Forzar el valor del checkbox (FormData no envía checkboxes desmarcados)
        formData.set('servicio', document.getElementById('servicio').checked ? 1 : 0);

        // Recolectar las series editadas y empaquetarlas en un JSON string
        const inputsSeries = document.querySelectorAll('.serie-edit-input');
        const seriesData = Array.from(inputsSeries).map(input => ({
            id_detalle: input.getAttribute('data-id'),
            serie: input.value.trim().toUpperCase()
        }));
        formData.append('series_json', JSON.stringify(seriesData));

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            const resp = await fetch('../backend/actualizar-venta.php', {
                method: 'POST',
                body: formData // Nota: No se pone Content-Type, el navegador lo asigna automáticamente al usar FormData
            });

            const res = await resp.json();
            if (res.exito) {
                alert("✅ " + res.mensaje);
                location.reload(); // Recargar para ver los cambios y los nuevos archivos
            } else {
                alert("❌ Error: " + res.mensaje);
            }
        } catch (e) {
            console.error("Error Fetch:", e);
            alert("❌ Error de comunicación con el servidor.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        }
    });

    // ==========================================
    // 4. ELIMINAR VENTA COMPLETA
    // ==========================================
    document.getElementById('btn-eliminar-venta').addEventListener('click', async () => {
        if(confirm("¡ATENCIÓN! Esto borrará permanentemente la venta, sus series y todos los archivos físicos asociados. ¿Deseas proceder?")) {
            try {
                const resp = await fetch('../backend/eliminar_venta.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: ventaId })
                });
                const res = await resp.json();
                
                if(res.exito) {
                    alert("Venta eliminada correctamente.");
                    window.location.href = 'ventas.html';
                } else {
                    alert("Error: " + res.mensaje);
                }
            } catch (e) {
                alert("Error de conexión al intentar eliminar.");
            }
        }
    });
});

// ==========================================
// 5. FUNCIONES GLOBALES (Borrado Individual y Modal)
// ==========================================

// Borrar un archivo físico (Usando tu backend universal)
window.borrarArchivo = async (id, ruta) => {
    if(confirm("¿Seguro que deseas eliminar este archivo? No se puede deshacer.")) {
        try {
            const resp = await fetch('../backend/eliminar_archivo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // La magia universal: le decimos al backend que somos el módulo de ventas
                body: JSON.stringify({ id: id, ruta: ruta, modulo: 'ventas' }) 
            });
            const res = await resp.json();
            
            if(res.success || res.exito) {
                location.reload();
            } else {
                alert("Error: " + (res.error || res.mensaje));
            }
        } catch (e) {
            alert("Error de red al intentar borrar el archivo.");
        }
    }
};

// Abrir el Modal de Vista Previa
window.abrirVistaPrevia = (ruta, tipo) => {
    const modal = document.getElementById('modal-preview');
    const container = document.getElementById('preview-content');

    if (tipo === 'imagen') {
        container.innerHTML = `<img src="${ruta}" style="max-width: 100%; max-height: 75vh; object-fit: contain; border-radius: 5px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">`;
    } else if (tipo === 'pdf') {
        container.innerHTML = `<iframe src="${ruta}" width="100%" height="600px" style="border: none; border-radius: 5px; background: white;"></iframe>`;
    } else {
        container.innerHTML = `<p style="padding: 40px; color: #7f8c8d;">No hay vista previa para este archivo.</p>`;
    }

    modal.style.display = 'flex';
};

// Cerrar el Modal y limpiar iframe/imagen
window.cerrarPreview = () => {
    document.getElementById('modal-preview').style.display = 'none';
    document.getElementById('preview-content').innerHTML = ''; 
};