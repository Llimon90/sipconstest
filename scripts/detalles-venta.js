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

                // Generar Lista de Archivos
                const contArchivos = document.getElementById('lista-archivos-admin');
                contArchivos.innerHTML = data.archivos.map(a => `
                    <li style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:10px; margin-bottom:5px; border-radius:5px; border:1px solid #eee;">
                        <a href="${a.ruta_archivo}" target="_blank" style="color:#2980b9; text-decoration:none;"><i class="fas fa-file-pdf"></i> ${a.nombre_archivo}</a>
                        <button type="button" onclick="borrarArchivo(${a.id}, '${a.ruta_archivo}')" style="background:none; border:none; color:#e74c3c; cursor:pointer;" title="Eliminar archivo">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </li>
                `).join('') || '<li style="color:#95a5a6;">No hay archivos adjuntos en esta venta.</li>';
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