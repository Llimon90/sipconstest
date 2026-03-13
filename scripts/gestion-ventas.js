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

// --- FUNCIONES GLOBALES DE ACCIÓN ---

// 1. Función para ver el detalle completo (Redirige a la página de edición)
window.verDetalle = (ventaId) => {
    console.log("Redirigiendo a edición de venta:", ventaId);
    // Cambia la URL y pasa el ID como parámetro GET
    window.location.href = `detalles-venta.html?id=${ventaId}`;
};

// 2. Función placeholder para imprimir ticket (Para evitar errores de consola)
window.imprimirTicket = (ventaId) => {
    console.log("Generando ticket para venta:", ventaId);
    alert(`La función para generar el PDF/Ticket de la venta ${ventaId} está en desarrollo.`);
    // Aquí a futuro puedes hacer un window.open('backend/generar_ticket.php?id=' + ventaId, '_blank');
};