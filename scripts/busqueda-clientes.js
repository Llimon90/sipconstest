document.addEventListener('DOMContentLoaded', function() {
    const inputBusqueda = document.getElementById('busqueda');
    
    // Cargar todos los clientes al inicio
    cargarClientes();
    
    if (inputBusqueda) {
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
        const response = await fetch('../backend/obtener-clientes.php');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        mostrarClientes(data);
        configurarEventosClientes(); // Configurar eventos después de cargar
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
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        mostrarClientes(data);
        configurarEventosClientes(); // Configurar eventos después de buscar
    } catch (error) {
        console.error('Error en búsqueda:', error);
        mostrarError('Error en búsqueda: ' + error.message);
        await cargarClientes(); // Recargar clientes como fallback
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
            <td>${escapeHtml(cliente.nombre || '')}</td>
            <td>${escapeHtml(cliente.rfc || '')}</td>
            <td>${escapeHtml(cliente.direccion || '')}</td>
            <td>${escapeHtml(cliente.telefono || '')}</td>
            <td>${escapeHtml(cliente.contactos || '')}</td>
            <td>${escapeHtml(cliente.email || '')}</td>
            <td>
                <button class="btn-editar" data-id="${cliente.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-eliminar" data-id="${cliente.id}" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Configurar eventos para los botones de editar/eliminar
function configurarEventosClientes() {
    // Eventos para botones de editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            cargarFormularioEdicion(id);
        });
    });
    
    // Eventos para botones de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            confirmarEliminacion(id);
        });
    });
}

// Función para cargar formulario de edición
async function cargarFormularioEdicion(id) {
    try {
        const response = await fetch(`../backend/detalle-cliente.php?id=${id}`);
        if (!response.ok) throw new Error('Error al obtener datos del cliente');
        
        const cliente = await response.json();
        const formulario = document.getElementById('formulario-edicion');

        formulario.innerHTML = `
            <form id="form-editar-cliente">
                <input type="hidden" name="id" value="${escapeHtml(cliente.id)}">
                
                <div class="form-row">
                    <div>  
                        <label for="nombre-editar">Nombre:</label>
                        <input type="text" id="nombre-editar" name="nombre" value="${escapeHtml(cliente.nombre)}" required>
                    </div>
                    <div>
                        <label for="rfc-editar">RFC:</label>
                        <input type="text" id="rfc-editar" name="rfc" value="${escapeHtml(cliente.rfc)}">
                    </div>
                </div>

                <div class="form-row">
                    <div>  
                        <label for="direccion-editar">Dirección:</label>
                        <input type="text" id="direccion-editar" name="direccion" value="${escapeHtml(cliente.direccion)}">
                    </div>
                    <div>
                        <label for="telefono-editar">Teléfono:</label>
                        <input type="text" id="telefono-editar" name="telefono" value="${escapeHtml(cliente.telefono)}">
                    </div>
                </div>

                <div class="form-row">
                    <div>
                        <label for="contactos-editar">Contactos:</label>
                        <input type="text" id="contactos-editar" name="contactos" value="${escapeHtml(cliente.contactos)}">
                    </div>
                    <div>
                        <label for="email-editar">E-mail:</label>
                        <input type="email" id="email-editar" name="email" value="${escapeHtml(cliente.email)}">
                    </div>
                </div>
                
                <button type="submit">Guardar Cambios</button>
            </form>
        `;

        document.getElementById('modal-edicion').style.display = 'block';
        document.getElementById('form-editar-cliente').addEventListener('submit', function(e) {
            e.preventDefault();
            actualizarCliente();
        });

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar cliente: ' + error.message);
    }
}

// Función para actualizar cliente
async function actualizarCliente() {
    const form = document.getElementById('form-editar-cliente');
    const formData = new FormData(form);
    const datos = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('backend/registro_venta.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();
        
        if (resultado.error) {
            throw new Error(resultado.error);
        }
        
        alert('Cliente actualizado correctamente');
        document.getElementById('modal-edicion').style.display = 'none';
        cargarClientes();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al actualizar: ' + error.message);
    }
}

// Función para confirmar y eliminar cliente
async function confirmarEliminacion(id) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
        const response = await fetch(`../backend/eliminar-cliente.php?id=${id}`, {
            method: 'DELETE'
        });

        const resultado = await response.json();
        
        if (resultado.error) {
            throw new Error(resultado.error);
        }
        
        alert('Cliente eliminado correctamente');
        cargarClientes();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al eliminar: ' + error.message);
    }
}

// Función auxiliar para escapar HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    const tbody = document.getElementById('lista-clientes');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="error">${mensaje}</td></tr>`;
    }
}