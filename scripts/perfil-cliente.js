// scripts/perfil-cliente.js
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Obtener ID de la URL
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('id');

    if (!clientId) {
        alert("No se especificó un cliente.");
        window.location.href = 'clientes.html';
        return;
    }

    // Poner fecha de hoy en el modal por defecto
    document.getElementById('ext-fecha').valueAsDate = new Date();

    // 2. Cargar Datos del Cliente
    try {
        const resp = await fetch(`../backend/detalle-cliente.php?id=${clientId}`);
        const cliente = await resp.json();

        if (cliente.error) {
            alert("Cliente no encontrado.");
            window.location.href = 'clientes.html';
            return;
        }

        // Llenar formulario de datos
        document.getElementById('titulo-nombre-cliente').textContent = cliente.nombre;
        document.getElementById('ext-cliente').value = cliente.nombre; // Para el modal de equipos
        
        document.getElementById('edit-id').value = cliente.id;
        document.getElementById('edit-nombre').value = cliente.nombre;
        document.getElementById('edit-rfc').value = cliente.rfc || '';
        document.getElementById('edit-direccion').value = cliente.direccion || '';
        document.getElementById('edit-telefono').value = cliente.telefono || '';
        document.getElementById('edit-contactos').value = cliente.contactos || '';
        document.getElementById('edit-email').value = cliente.email || '';

        // 3. Cargar los equipos (El Padrón)
        cargarEquipos(cliente.nombre);

    } catch (error) {
        console.error("Error cargando perfil:", error);
    }

    // 4. Guardar Cambios del Cliente
    document.getElementById('form-editar-cliente').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch('../backend/actualiza-cliente.php', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                alert('Datos del cliente actualizados correctamente.');
                document.getElementById('titulo-nombre-cliente').textContent = document.getElementById('edit-nombre').value;
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error al actualizar:", error);
        }
    });

    // 5. Guardar Nuevo Equipo Externo
    document.getElementById('form-equipo-externo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            // Este archivo es el que creamos en el paso anterior
            const response = await fetch('../backend/registro_externo.php', { method: 'POST', body: formData });
            const result = await response.json();

            if (result.exito) {
                alert('Equipo externo registrado con éxito y programado para mantenimiento.');
                cerrarModalEquipo();
                e.target.reset();
                document.getElementById('ext-fecha').valueAsDate = new Date();
                document.getElementById('ext-cliente').value = document.getElementById('edit-nombre').value;
                
                // Recargar tabla de equipos
                cargarEquipos(document.getElementById('edit-nombre').value);
            } else {
                alert(`Error: ${result.mensaje}`);
            }
        } catch (error) {
            console.error("Error al guardar equipo:", error);
            alert("Hubo un error de conexión.");
        }
    });
});

async function cargarEquipos(nombreCliente) {
    const tbody = document.getElementById('tabla-padron-cliente');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Consultando inventario...</td></tr>';

    try {
        const resp = await fetch(`../backend/obtener_equipos_cliente.php?cliente=${encodeURIComponent(nombreCliente)}`);
        const equipos = await resp.json();

        if (!equipos || equipos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#7f8c8d;">Este cliente no tiene equipos registrados en el padrón.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        equipos.forEach(eq => {
            // Construir texto de periodicidad
            let periodos = [];
            if (eq.calibracion > 0) periodos.push(`Cal: ${eq.calibracion}m`);
            if (eq.servicio > 0 && eq.frecuencia_servicio > 0) periodos.push(`Serv: ${eq.frecuencia_servicio}m`);
            let txtPeriodo = periodos.length > 0 ? periodos.join(' | ') : 'Sin programa';

            // Etiqueta de Origen
            let badgeOrigen = eq.origen === 'Venta Lumina' 
                ? `<span style="background:#e8f4f8; color:#2980b9; padding:3px 6px; border-radius:4px; font-size:0.8rem;">Venta #${eq.venta_id}</span>`
                : `<span style="background:#fef5e7; color:#d35400; padding:3px 6px; border-radius:4px; font-size:0.8rem;">Externo</span>`;

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td><strong>${eq.marca || ''} ${eq.modelo || ''}</strong><br><small style="color:#7f8c8d;">${eq.equipo}</small></td>
                    <td>${eq.numero_serie || 'S/N'}</td>
                    <td>${eq.sucursal || '-'}</td>
                    <td>${badgeOrigen}</td>
                    <td style="font-size:0.85rem; font-weight:bold;">${txtPeriodo}</td>
                </tr>
            `;
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#e74c3c;">Error al cargar equipos.</td></tr>';
    }
}

// Control del Modal Nativo
window.abrirModalEquipo = function() {
    document.getElementById('modalEquipoExterno').style.display = 'flex';
};

window.cerrarModalEquipo = function() {
    document.getElementById('modalEquipoExterno').style.display = 'none';
};