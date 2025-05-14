document.addEventListener('DOMContentLoaded', function() {
    // Cargar todos los clientes al inicio
    cargarClientes();
    
    // Configurar el evento de búsqueda en tiempo real
    const inputBusqueda = document.getElementById('busqueda');
    inputBusqueda.addEventListener('input', function() {
        buscarClientes(this.value);
    });
    
    // Resto de tu código existente...
});

function cargarClientes() {
    fetch('../backend/obtener-clientes.php')
        .then(response => response.json())
        .then(data => {
            mostrarClientes(data);
        })
        .catch(error => console.error('Error al cargar clientes:', error));
}

function buscarClientes(consulta) {
    if (consulta.trim() === '') {
        cargarClientes(); // Si el campo está vacío, cargar todos los clientes
        return;
    }
    
    fetch('../backend/busqueda-clientes.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ consulta }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        mostrarClientes(data);
    })
    .catch(error => {
        console.error('Error en la búsqueda:', error);
    });
}

function mostrarClientes(clientes) {
    const tbody = document.getElementById('lista-clientes');
    tbody.innerHTML = ''; // Limpiar la tabla
    
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

// Resto de tus funciones existentes (editarCliente, eliminarCliente, etc.)