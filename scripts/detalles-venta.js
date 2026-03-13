document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ventaId = urlParams.get('id');

    if (!ventaId) {
        alert("ID de venta no válido.");
        window.location.href = 'ventas.html';
        return;
    }

    document.getElementById('venta_id').value = ventaId;

    // 1. CARGAR DATOS DE LA VENTA
    const cargarDatos = async () => {
        try {
            const resp = await fetch(`../backend/obtener_venta_full.php?id=${ventaId}`);
            const data = await resp.json();

            if (data.exito) {
                // Llenar Cabecera
                document.getElementById('txt-folio').textContent = data.venta.folio;
                document.getElementById('cliente').value = data.venta.cliente;
                document.getElementById('sucursal').value = data.venta.sucursal;

                // Llenar Detalles (Tomamos el índice 0 asumiendo que el modelo/marca aplica a todos los equipos de ese folio)
                if(data.series.length > 0) {
                    const detalle = data.series[0];
                    document.getElementById('equipo').value = detalle.equipo || '';
                    document.getElementById('marca').value = detalle.marca || '';
                    document.getElementById('modelo').value = detalle.modelo || '';
                    document.getElementById('garantia').value = detalle.garantia || 0;
                    document.getElementById('calibracion').value = detalle.calibracion || 0;
                    document.getElementById('servicio').checked = detalle.servicio == 1;
                    document.getElementById('notas').value = detalle.notas || '';
                }

                // Generar Inputs de Series
                const contSeries = document.getElementById('container-series-edit');
                contSeries.innerHTML = data.series.map((s, index) => `
                    <div>
                        <label style="font-size: 0.8rem; color: #7f8c8d;">Equipo ${index + 1}</label>
                        <input type="text" class="serie-edit-input" data-id="${s.id}" value="${s.numero_serie}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                    </div>
                `).join('');

// Generar Lista de Archivos con Vista Previa
const contArchivos = document.getElementById('lista-archivos-admin');

contArchivos.innerHTML = data.archivos.map(a => {
    // 1. Detectar extensión
    const ext = a.ruta_archivo.split('.').pop().toLowerCase();
    const esImagen = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const esPdf = ext === 'pdf';

    // 2. Definir Miniatura o Icono
    let elementoVisual = '';
    if (esImagen) {
        elementoVisual = `<img src="${a.ruta_archivo}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 5px; cursor: pointer; border: 1px solid #ddd;" onclick="abrirVistaPrevia('${a.ruta_archivo}', 'imagen')">`;
    } else if (esPdf) {
        elementoVisual = `<i class="fas fa-file-pdf" style="font-size: 30px; color: #e74c3c; cursor: pointer;" onclick="abrirVistaPrevia('${a.ruta_archivo}', 'pdf')"></i>`;
    } else {
        elementoVisual = `<i class="fas fa-file-alt" style="font-size: 30px; color: #95a5a6;"></i>`;
    }

    // 3. Crear el bloque del archivo
    return `
    <li style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:12px 15px; margin-bottom:10px; border-radius:8px; border:1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        
        <div style="display: flex; align-items: center; gap: 15px;">
            ${elementoVisual}
            <div style="display: flex; flex-direction: column;">
                <a href="javascript:void(0)" onclick="${(esImagen || esPdf) ? `abrirVistaPrevia('${a.ruta_archivo}', '${esImagen ? 'imagen' : 'pdf'}')` : `window.open('${a.ruta_archivo}', '_blank')`}" style="color:#2c3e50; text-decoration:none; font-weight: 600; font-size: 14px;">
                    ${a.nombre_archivo}
                </a>
                <small style="color: #7f8c8d; font-size: 12px;">${esImagen || esPdf ? 'Haz clic para ver la vista previa' : 'Documento anexo'}</small>
            </div>
        </div>

        <div style="display: flex; gap: 8px;">
            <button type="button" onclick="window.open('${a.ruta_archivo}', '_blank')" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:8px 12px; border-radius:5px; color:#475569; cursor:pointer;" title="Abrir en pestaña nueva">
                <i class="fas fa-external-link-alt"></i>
            </button>
            <button type="button" onclick="borrarArchivo(${a.id}, '${a.ruta_archivo}')" style="background:#fef2f2; border:1px solid #fca5a5; padding:8px 12px; border-radius:5px; color:#ef4444; cursor:pointer;" title="Eliminar archivo">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    </li>
    `;
}).join('') || '<li style="color:#95a5a6; text-align:center; padding: 20px;">No hay archivos adjuntos en esta venta.</li>';
            }
        } catch (e) {
            console.error("Error al cargar la venta:", e);
        }
    };

    cargarDatos();

    // 2. GUARDAR CAMBIOS (Usamos FormData por si hay archivos nuevos)
    document.getElementById('btn-guardar-cambios').addEventListener('click', async () => {
        const btn = document.getElementById('btn-guardar-cambios');
        const form = document.getElementById('form-editar-venta');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        
        // Ajustar el checkbox manualmente (FormData ignora los checkboxes no marcados)
        formData.set('servicio', document.getElementById('servicio').checked ? 1 : 0);

        // Recopilar las series modificadas
        const inputsSeries = document.querySelectorAll('.serie-edit-input');
        const seriesData = Array.from(inputsSeries).map(input => ({
            id_detalle: input.getAttribute('data-id'),
            serie: input.value.trim().toUpperCase()
        }));
        formData.append('series_json', JSON.stringify(seriesData));

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            // Usamos un nuevo endpoint enfocado en FormData
            const resp = await fetch('../backend/actualizar-venta.php', {
                method: 'POST',
                body: formData
            });

            const res = await resp.json();
            if (res.exito) {
                alert("✅ Información actualizada correctamente.");
                location.reload();
            } else {
                alert("❌ Error: " + res.mensaje);
            }
        } catch (e) {
            alert("❌ Error de comunicación con el servidor.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        }
    });

    // 3. ELIMINAR VENTA COMPLETA
    document.getElementById('btn-eliminar-venta').addEventListener('click', async () => {
        if(confirm("¡ATENCIÓN! Esto borrará toda la venta, sus series y archivos físicos. ¿Estás seguro?")) {
            const resp = await fetch('../backend/eliminar_venta.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: ventaId })
            });
            const res = await resp.json();
            if(res.exito) {
                alert("Venta eliminada.");
                window.location.href = 'ventas.html';
            }
        }
    });
});

// Función global para borrar un archivo usando tu script universal
window.borrarArchivo = async (id, ruta) => {
    if(confirm("¿Seguro que deseas eliminar este archivo? No se puede deshacer.")) {
        const resp = await fetch('../backend/eliminar_archivo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, ruta: ruta })
        });
        const res = await resp.json();
        if(res.exito || res.success) location.reload();
        else alert("Error al borrar el archivo: " + (res.error || res.mensaje));
    }
};

// Función para proyectar la vista previa
window.abrirVistaPrevia = (ruta, tipo) => {
    const modal = document.getElementById('modal-preview');
    const container = document.getElementById('preview-content');

    // Dependiendo del tipo, inyectamos una etiqueta <img> o un <iframe>
    if (tipo === 'imagen') {
        container.innerHTML = `<img src="${ruta}" style="max-width: 100%; max-height: 75vh; object-fit: contain; border-radius: 5px;">`;
    } else if (tipo === 'pdf') {
        container.innerHTML = `<iframe src="${ruta}" width="100%" height="600px" style="border: none; border-radius: 5px;"></iframe>`;
    }

    modal.style.display = 'flex'; // Usamos flex para centrar el contenido
};

// Función para cerrar el modal y limpiar la memoria
window.cerrarPreview = () => {
    document.getElementById('modal-preview').style.display = 'none';
    // Limpiamos el HTML interno para que el PDF o video deje de cargarse en segundo plano
    document.getElementById('preview-content').innerHTML = ''; 
};