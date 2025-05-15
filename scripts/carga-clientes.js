// Función principal para cargar clientes
document.addEventListener('DOMContentLoaded', function() {
  cargarClientes();
  configurarEventos();
});

// Configura todos los event listeners necesarios
function configurarEventos() {
  // Evento para el formulario de nuevo cliente
  document.getElementById('new-incidencia-form')?.addEventListener('submit', guardarCliente);
  
  // Evento para el botón cancelar en el modal
  document.getElementById('cancelar-edicion')?.addEventListener('click', function() {
    document.getElementById('modal-edicion').style.display = 'none';
  });
}

// Función para obtener y mostrar clientes
async function cargarClientes() {
  try {
    const response = await fetch('../backend/obtener-clientes.php');
    if (!response.ok) throw new Error('Error en la respuesta del servidor');
    
    const clientes = await response.json();
    const listaClientes = document.getElementById('lista-clientes');
    
    listaClientes.innerHTML = clientes.map(cliente => `
      <tr>
        <td>${escapeHtml(cliente.nombre)}</td>
        <td>${escapeHtml(cliente.rfc)}</td>
        <td>${escapeHtml(cliente.direccion)}</td>
        <td>${escapeHtml(cliente.telefono)}</td>
        <td>${escapeHtml(cliente.contactos)}</td>
        <td>${escapeHtml(cliente.email)}</td>
        <td>
          <div class="acciones-cliente">
            <button class="btn-editar" data-id="${cliente.id}" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-eliminar" data-id="${cliente.id}" title="Eliminar">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Asignar eventos a los botones dinámicos
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', () => cargarFormularioEdicion(btn.dataset.id));
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', () => confirmarEliminacion(btn.dataset.id));
    });

  } catch (error) {
    console.error('Error al cargar clientes:', error);
    mostrarError('Error al cargar clientes');
  }
}

// Función para guardar nuevo cliente
async function guardarCliente(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const datos = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('../backend/guardar-cliente.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await response.json();
    
    if (resultado.success) {
      alert('Cliente guardado correctamente');
      e.target.reset();
      cargarClientes();
    } else {
      throw new Error(resultado.error || 'Error al guardar el cliente');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError(error.message);
  }
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
    document.getElementById('form-editar-cliente').addEventListener('submit', (e) => {
      e.preventDefault();
      actualizarCliente();
    });

  } catch (error) {
    console.error('Error:', error);
    mostrarError(error.message);
  }
}

// Función para actualizar cliente
async function actualizarCliente() {
  const form = document.getElementById('form-editar-cliente');
  const formData = new FormData(form);
  const datos = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('../backend/actualiza-cliente.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await response.json();
    
    if (resultado.success) {
      alert('Cliente actualizado correctamente');
      document.getElementById('modal-edicion').style.display = 'none';
      cargarClientes();
    } else {
      throw new Error(resultado.error || 'Error al actualizar el cliente');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError(error.message);
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
    
    if (resultado.success) {
      alert('Cliente eliminado correctamente');
      cargarClientes();
    } else {
      throw new Error(resultado.error || 'Error al eliminar el cliente');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError(error.message);
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

// Función para mostrar errores
function mostrarError(mensaje) {
  alert(`Error: ${mensaje}`);
}