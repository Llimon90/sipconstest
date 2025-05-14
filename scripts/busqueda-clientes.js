// busqueda-clientes.js - Versión 2.0
document.addEventListener('DOMContentLoaded', function() {
    // Configurar el evento de búsqueda en tiempo real
    const inputBusqueda = document.getElementById('busqueda');
    
    if (inputBusqueda) {
        // Cargar todos los clientes al inicio
        cargarTodosClientes();
        
        // Evento para búsqueda en tiempo real
        inputBusqueda.addEventListener('input', function() {
            const consulta = this.value.trim();
            
            if (consulta === '') {
                cargarTodosClientes();
            } else {
                buscarClientes(consulta);
            }
        });
        
        // Opcional: agregar un pequeño retardo para no saturar el servidor
        // inputBusqueda.addEventListener('input', debounce(function() {
        //     const consulta = this.value.trim();
        //     if (consulta === '') {
        //         cargarTodosClientes();
        //     } else {
        //         buscarClientes(consulta);
        //     }
        // }, 300));
    }
});

// Función para cargar todos los clientes
function cargarTodosClientes() {
    fetch('../php/obtener-clientes.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar clientes');
            }
            return response.json();
        })
        .then(data => {
            mostrarResultadosClientes(data);
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarMensajeError('No se pudieron cargar los clientes');
        });
}

// Función principal de búsqueda
function buscarClientes(consulta) {
    fetch('busqueda-clientes.php', {
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
        mostrarResultadosClientes(data);
    })
    .catch(error => {
        console.error('Error en la búsqueda:', error);
        mostrarMensajeError('Error al realizar la búsqueda');
    });
}

// Mostrar resultados en la tabla
function mostrarResultadosClientes(clientes) {
    const tbody = document.getElementById('lista-clientes');
    
    if (!tbody) {
        console.error('No se encontró el elemento lista-clientes');
        return;
    }
    
    tbody.innerHTML = ''; // Limpiar tabla
    
    if (clientes.length === 0) {
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

// Función para mostrar mensajes de error
function mostrarMensajeError(mensaje) {
    const tbody = document.getElementById('lista-clientes');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="error">${mensaje}</td></tr>`;
    }
}

// Función para escapar HTML (seguridad XSS)
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Opcional: Función debounce para mejorar rendimiento
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}