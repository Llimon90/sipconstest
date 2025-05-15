document.addEventListener('DOMContentLoaded', function() {
    const inputBusqueda = document.getElementById('busqueda');
    
    if (inputBusqueda) {
        // Cargar todos los clientes al inicio
        cargarClientes();
        
        // Búsqueda en tiempo real con debounce
        inputBusqueda.addEventListener('input', debounce(function(e) {
            const termino = e.target.value.trim();
            
            if (termino.length >= 2) {
                buscarClientes(termino);
            } else if (termino.length === 0) {
                cargarClientes();
            }
        }, 300));
    }
});

// Función debounce para mejorar rendimiento
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Función para cargar todos los clientes
async function cargarClientes() {
    try {
        const response = await fetch('../backend/obtener-busqueda-clientes.php');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || "Error al cargar clientes");
        }
        
        mostrarClientes(data.data);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar clientes: ' + error.message);
    }
}

// Función para buscar clientes
async function buscarClientes(termino) {
    try {
        const response = await fetch('../backend/busqueda-clientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ consulta: termino }),
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || "Error en la búsqueda");
        }
        
        mostrarClientes(data.data);
    } catch (error) {
        console.error('Error en búsqueda:', error);
        mostrarError('Error en búsqueda: ' + error.message);
        
        // Recargar clientes como fallback
        await cargarClientes();
    }
}

// Mostrar clientes en la tabla
function mostrarClientes(clientes) {
    const tbody = document.getElementById('lista-clientes');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No se encontraron resultados</td></tr>';
        return;
    }
    
    clientes.forEach(cliente => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cliente.nombre || ''}</td>
            <td>${cliente.rfc || ''}</td>
            <td>${cliente.direccion || ''}</td>
            <td>${cliente.telefono || ''}</td>
            <td>${cliente.contactos || ''}</td>
            <td>${cliente.email || ''}</td>
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

// Mostrar mensaje de error
function mostrarError(mensaje) {
    const tbody = document.getElementById('lista-clientes');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="error">${mensaje}</td></tr>`;
    }
}