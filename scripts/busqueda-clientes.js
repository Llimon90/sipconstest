// busqueda-clientes.js - Versión 2.1
document.addEventListener('DOMContentLoaded', function() {
    // Configurar el evento de búsqueda en tiempo real
    const inputBusqueda = document.getElementById('busqueda');
    
    

// Función principal de búsqueda
function buscarClientes(consulta) {
    fetch('../backend/busqueda-clientes.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ consulta }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error en la búsqueda: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        mostrarResultadosClientes(data, true);
    })
    .catch(error => {
        console.error('Error en la búsqueda:', error);
        mostrarMensajeError('Error al realizar la búsqueda');
    });
}

// Mostrar resultados en la tabla
function mostrarResultadosClientes(clientes, limpiarTabla = true) {
    const tbody = document.getElementById('lista-clientes');
    
    if (!tbody) {
        console.error('No se encontró el elemento lista-clientes');
        return;
    }
    
    // Solo limpiamos la tabla si se especifica
    if (limpiarTabla) {
        tbody.innerHTML = '';
    }
    
    if (clientes.length === 0 && limpiarTabla) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="no-results">No se encontraron resultados</td>';
        tbody.appendChild(tr);
        return;
    }
    
    clientes.forEach(cliente => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${escapeHtml(cliente.nombre || '')}</td>
            <td>${escapeHtml(cliente.rfc || '')}</td>
            <td>${escapeHtml(cliente.direccion || '')}</td>
            <td>${escapeHtml(cliente.telefono || '')}</td>
            <td>${escapeHtml(cliente.contactos || '')}</td>
            <td>${escapeHtml(cliente.email || '')}</td>
            <td>
                <button onclick="editarCliente(${cliente.id})" class="btn-editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="eliminarCliente(${cliente.id})" class="btn-eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Resto de funciones auxiliares (mostrarMensajeError, escapeHtml) permanecen igual