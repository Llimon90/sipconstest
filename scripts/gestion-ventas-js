document.addEventListener('DOMContentLoaded', () => {
    const cargarGestion = async () => {
        try {
            const resp = await fetch('../backend/obtener_gestion_ventas.php');
            const data = await resp.json();

            if (data.exito) {
                // Actualizar KPIs
                document.getElementById('stat-total-ventas').textContent = data.stats.total_ventas;
                document.getElementById('stat-total-equipos').textContent = data.stats.total_equipos;
                document.getElementById('stat-con-servicio').textContent = data.stats.con_servicio;

                // Renderizar Tabla
                const tbody = document.getElementById('tabla-gestion-body');
                tbody.innerHTML = data.ventas.map(v => `
                    <tr>
                        <td><span class="badge-folio">${v.folio}</span></td>
                        <td>${new Date(v.fecha_registro).toLocaleDateString()}</td>
                        <td><strong>${v.cliente}</strong></td>
                        <td>${v.sucursal || '-'}</td>
                        <td>${v.cantidad_equipos}</td>
                        <td><small>${v.marcas}</small></td>
                        <td>
                            <span class="doc-count">
                                <i class="fas fa-file-alt"></i> ${v.total_archivos}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group">
                                <button onclick="verDetalle(${v.id})" class="btn-view" title="Ver Detalle">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="imprimirTicket(${v.id})" class="btn-print" title="Imprimir">
                                    <i class="fas fa-print"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (e) {
            console.error("Error cargando gestión:", e);
        }
    };

    cargarGestion();
});

// Función para ver el detalle completo (Series y Archivos)
window.verDetalle = async (ventaId) => {
    // Aquí abrirías un modal y harías un fetch a un nuevo endpoint 
    // que traiga: SELECT * FROM venta_detalles WHERE venta_id = ? 
    // y SELECT * FROM venta_archivos WHERE venta_id = ?
    console.log("Consultando detalle de venta:", ventaId);
};