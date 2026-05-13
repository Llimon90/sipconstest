// scripts/perfil-cliente.js
let equiposPadron = []; // Array global para almacenar los equipos y poder filtrarlos

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('id');

    if (!clientId) {
        alert("No se especificó un cliente.");
        window.location.href = 'clientes.html';
        return;
    }

    document.getElementById('ext-fecha').valueAsDate = new Date();

    // 1. Cargar Datos del Cliente
    try {
        const resp = await fetch(`../backend/detalle-cliente.php?id=${clientId}`);
        const cliente = await resp.json();

        if (cliente.error) {
            alert("Cliente no encontrado.");
            window.location.href = 'clientes.html';
            return;
        }

        // Llenar datos
        document.getElementById('titulo-nombre-cliente').textContent = cliente.nombre;
        document.getElementById('ext-cliente').value = cliente.nombre;
        
        document.getElementById('edit-id').value = cliente.id;
        document.getElementById('edit-nombre').value = cliente.nombre;
        document.getElementById('edit-rfc').value = cliente.rfc || '';
        document.getElementById('edit-direccion').value = cliente.direccion || '';
        document.getElementById('edit-telefono').value = cliente.telefono || '';
        document.getElementById('edit-contactos').value = cliente.contactos || '';
        document.getElementById('edit-email').value = cliente.email || '';

        // 2. Cargar los equipos
        cargarEquipos(cliente.nombre);

    } catch (error) {
        console.error("Error cargando perfil:", error);
    }

    // 3. Guardar Cambios del Cliente
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

    // 4. Guardar Nuevo Equipo Externo
    document.getElementById('form-equipo-externo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const response = await fetch('../backend/registro_externo.php', { method: 'POST', body: formData });
            const result = await response.json();

            if (result.exito) {
                alert('Equipo registrado con éxito en el padrón.');
                cerrarModalEquipo();
                e.target.reset();
                document.getElementById('ext-fecha').valueAsDate = new Date();
                document.getElementById('ext-cliente').value = document.getElementById('edit-nombre').value;
                
                // Recargar tabla de equipos
                cargarEquipos(document.getElementById('edit-nombre').value);
                document.getElementById('buscador-padron').value = ''; // Limpiar el buscador
            } else {
                alert(`Error: ${result.mensaje}`);
            }
        } catch (error) {
            console.error("Error al guardar equipo:", error);
            alert("Hubo un error de conexión.");
        }
    });

    // 5. Lógica del Buscador del Padrón
    const buscador = document.getElementById('buscador-padron');
    if(buscador) {
        buscador.addEventListener('input', (e) => {
            const texto = e.target.value.toLowerCase();
            const equiposFiltrados = equiposPadron.filter(eq => {
                return (
                    (eq.equipo && eq.equipo.toLowerCase().includes(texto)) ||
                    (eq.marca && eq.marca.toLowerCase().includes(texto)) ||
                    (eq.modelo && eq.modelo.toLowerCase().includes(texto)) ||
                    (eq.numero_serie && eq.numero_serie.toLowerCase().includes(texto)) ||
                    (eq.sucursal && eq.sucursal.toLowerCase().includes(texto))
                );
            });
            renderizarTablaEquipos(equiposFiltrados);
        });
    }
});

// Función que va a la base de datos
async function cargarEquipos(nombreCliente) {
    const tbody = document.getElementById('tabla-padron-cliente');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Consultando inventario...</td></tr>';

    try {
        const resp = await fetch(`../backend/obtener_equipos_cliente.php?cliente=${encodeURIComponent(nombreCliente)}`);
        const data = await resp.json();

        if (data.error) throw new Error(data.error);

        equiposPadron = data; // Guardamos en la variable global
        renderizarTablaEquipos(equiposPadron); // Dibujamos la tabla

    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#e74c3c;">Error al cargar el padrón de equipos.</td></tr>';
    }
}

// Función que dibuja el HTML de la tabla
function renderizarTablaEquipos(equipos) {
    const tbody = document.getElementById('tabla-padron-cliente');
    tbody.innerHTML = '';

    if (!equipos || equipos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#7f8c8d; padding:20px;">No se encontraron equipos para este cliente.</td></tr>';
        return;
    }

    equipos.forEach(eq => {
        let periodos = [];
        if (eq.calibracion > 0) periodos.push(`Cal: ${eq.calibracion}m`);
        if (eq.servicio > 0 && eq.frecuencia_servicio > 0) periodos.push(`Serv: ${eq.frecuencia_servicio}m`);
        let txtPeriodo = periodos.length > 0 ? periodos.join(' | ') : 'Sin programa';

        let badgeOrigen = eq.origen === 'Venta Lumina' 
            ? `<span style="background:#e8f4f8; color:#2980b9; padding:3px 6px; border-radius:4px; font-size:0.8rem; font-weight:bold;">Venta #${eq.venta_id}</span>`
            : `<span style="background:#fef5e7; color:#d35400; padding:3px 6px; border-radius:4px; font-size:0.8rem; font-weight:bold;">Externo</span>`;

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td><strong>${eq.marca || ''} ${eq.modelo || ''}</strong><br><small style="color:#7f8c8d;">${eq.equipo}</small></td>
                <td>${eq.numero_serie || 'S/N'}</td>
                <td>${eq.sucursal || '-'}</td>
                <td>${badgeOrigen}</td>
                <td style="font-size:0.85rem; font-weight:bold; color:#2c3e50;">${txtPeriodo}</td>
            </tr>
        `;
    });
}

// Control del Modal
window.abrirModalEquipo = function() {
    document.getElementById('modalEquipoExterno').style.display = 'flex';
};

window.cerrarModalEquipo = function() {
    document.getElementById('modalEquipoExterno').style.display = 'none';
};