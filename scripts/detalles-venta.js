document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ventaId = urlParams.get('id');

    if (!ventaId) {
        alert("Error: ID de venta no encontrado");
        window.location.href = 'ventas.html';
        return;
    }

    const cargarVentaFull = async () => {
        const resp = await fetch(`../backend/obtener_venta_full.php?id=${ventaId}`);
        const data = await resp.json();

        if (data.exito) {
            // Llenar datos generales
            document.getElementById('txt-folio').textContent = data.venta.folio;
            document.getElementById('edit-cliente').value = data.venta.cliente;
            document.getElementById('edit-equipo').value = data.series[0].equipo; // Tomamos el primero como base
            document.getElementById('edit-marca').value = data.series[0].marca;

            // Llenar Series
            const containerSeries = document.getElementById('container-series-edit');
            containerSeries.innerHTML = data.series.map(s => `
                <div class="edit-serie-item" style="display:flex; gap:10px; margin-bottom:8px;">
                    <input type="text" value="${s.numero_serie}" class="serie-input-edit filtro-input" data-id="${s.id}">
                </div>
            `).join('');

            // Llenar Archivos
            const containerArchivos = document.getElementById('lista-archivos-admin');
            containerArchivos.innerHTML = data.archivos.map(a => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #eee;">
                    <a href="${a.ruta_archivo}" target="_blank" style="font-size:0.85rem; color:#3498db;"><i class="fas fa-file"></i> ${a.nombre_archivo}</a>
                    <button onclick="borrarArchivo(${a.id}, '${a.ruta_archivo}')" style="background:none; border:none; color:#e74c3c; cursor:pointer;">
                        <i class="fas fa-times-circle"></i>
                    </button>
                </div>
            `).join('') || '<p style="color:#95a5a6; font-size:0.9rem;">Sin archivos adjuntos</p>';
        }
    };

    cargarVentaFull();
});

// FUNCIÓN PARA BORRAR ARCHIVO INDIVIDUAL
window.borrarArchivo = async (archivoId, ruta) => {
    if(confirm("¿Seguro que deseas eliminar este archivo permanentemente?")) {
        const resp = await fetch('../backend/eliminar_archivo.php', {
            method: 'POST',
            body: JSON.stringify({ id: archivoId, ruta: ruta })
        });
        const res = await resp.json();
        if(res.exito) location.reload();
    }
};

// FUNCIÓN PARA ELIMINAR TODA LA VENTA
document.getElementById('btn-eliminar-venta').addEventListener('click', async () => {
    if(confirm("¡ADVERTENCIA! Esto borrará la venta, todas sus series y todos sus archivos del servidor. ¿Proceder?")) {
        // Fetch a eliminar_venta.php
        alert("Venta eliminada (Lógica de backend pendiente)");
        window.location.href = 'ventas.html';
    }
});