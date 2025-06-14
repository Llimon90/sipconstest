document.addEventListener('DOMContentLoaded', async () => {
  // Elementos del DOM
  const filtroCliente = document.getElementById('filtro-cliente');
  const filtroFecha = document.getElementById('filtro-fecha');
  const btnBuscar = document.getElementById('btn-buscar');
  const btnExportar = document.getElementById('btn-exportar');
  const tablaVentas = document.getElementById('tabla-ventas').querySelector('tbody');
  const modal = document.getElementById('modal-edicion');
  const btnCerrarModal = document.querySelector('.cerrar-modal');
  const btnGuardarCambios = document.getElementById('btn-guardar-cambios');
  const formularioEdicion = document.getElementById('formulario-edicion');

  // Cargar clientes en el filtro
  async function cargarClientes() {
    try {
      const response = await fetch('../backend/obtener-clientes.php');
      const clientes = await response.json();
      
      clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nombre;
        filtroCliente.appendChild(option);
      });
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      alert('Error al cargar clientes');
    }
  }

  // Buscar ventas según filtros
  async function buscarVentas() {
    const params = new URLSearchParams();
    if (filtroCliente.value) params.append('cliente_id', filtroCliente.value);
    if (filtroFecha.value) params.append('fecha', filtroFecha.value);

    try {
      const response = await fetch(`../backend/consultar_ventas.php?${params.toString()}`);
      const ventas = await response.json();
      
      mostrarVentas(ventas);
    } catch (error) {
      console.error('Error al buscar ventas:', error);
      alert('Error al buscar ventas');
    }
  }

  // Mostrar ventas en la tabla
  function mostrarVentas(ventas) {
    tablaVentas.innerHTML = '';
    
    ventas.forEach(venta => {
      const fila = document.createElement('tr');
      fila.dataset.id = venta.id;
      
      fila.innerHTML = `
        <td>${venta.id}</td>
        <td>${new Date(venta.fecha).toLocaleDateString()}</td>
        <td>${venta.cliente}</td>
        <td>${venta.sucursal}</td>
        <td>${venta.equipo}</td>
        <td>${venta.modelo}</td>
        <td>${venta.garantia} meses</td>
        <td>
          <button class="btn-editar" data-id="${venta.id}">Editar</button>
          <button class="btn-eliminar" data-id="${venta.id}">Eliminar</button>
          <button class="btn-detalle" data-id="${venta.id}">Detalle</button>
        </td>
      `;
      
      tablaVentas.appendChild(fila);
    });

    // Agregar eventos a los botones
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', () => cargarFormularioEdicion(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', () => eliminarVenta(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-detalle').forEach(btn => {
      btn.addEventListener('click', () => verDetalleVenta(btn.dataset.id));
    });
  }

  // Cargar formulario de edición
  async function cargarFormularioEdicion(idVenta) {
    try {
      const response = await fetch(`../backend/obtener_venta.php?id=${idVenta}`);
      const venta = await response.json();
      
      formularioEdicion.innerHTML = `
        <input type="hidden" id="venta-id" value="${venta.id}">
        <div class="form-group">
          <label for="edit-cliente">Cliente:</label>
          <input type="text" id="edit-cliente" value="${venta.cliente}" readonly>
        </div>
        <div class="form-group">
          <label for="edit-sucursal">Sucursal:</label>
          <input type="text" id="edit-sucursal" value="${venta.sucursal}">
        </div>
        <div class="form-group">
          <label for="edit-equipo">Equipo:</label>
          <input type="text" id="edit-equipo" value="${venta.equipo}">
        </div>
        <div class="form-group">
          <label for="edit-marca">Marca:</label>
          <input type="text" id="edit-marca" value="${venta.marca}">
        </div>
        <div class="form-group">
          <label for="edit-modelo">Modelo:</label>
          <input type="text" id="edit-modelo" value="${venta.modelo}">
        </div>
        <div class="form-group">
          <label for="edit-garantia">Garantía (meses):</label>
          <input type="number" id="edit-garantia" value="${venta.garantia}">
        </div>
        <div class="form-group">
          <label for="edit-calibracion">Calibración (meses):</label>
          <input type="number" id="edit-calibracion" value="${venta.calibracion}">
        </div>
        <div class="form-group">
          <label for="edit-servicio">Cláusula de servicio:</label>
          <input type="checkbox" id="edit-servicio" ${venta.servicio ? 'checked' : ''}>
        </div>
        <div class="form-group">
          <label for="edit-notas">Notas:</label>
          <textarea id="edit-notas">${venta.notas}</textarea>
        </div>
        <div class="form-group">
          <h4>Números de Serie:</h4>
          <div id="series-container"></div>
        </div>
      `;
      
      // Mostrar números de serie
      const seriesContainer = document.getElementById('series-container');
      venta.numero_series.forEach((serie, index) => {
        const div = document.createElement('div');
        div.innerHTML = `
          <input type="text" value="${serie}" data-id="${index}" class="input-serie">
          <button class="btn-eliminar-serie" data-id="${index}">×</button>
        `;
        seriesContainer.appendChild(div);
      });
      
      modal.style.display = 'block';
    } catch (error) {
      console.error('Error al cargar venta:', error);
      alert('Error al cargar datos de la venta');
    }
  }

  // Guardar cambios de edición
  async function guardarCambios() {
    const id = document.getElementById('venta-id').value;
    const series = Array.from(document.querySelectorAll('.input-serie')).map(input => input.value);
    
    const datos = {
      id,
      sucursal: document.getElementById('edit-sucursal').value,
      equipo: document.getElementById('edit-equipo').value,
      marca: document.getElementById('edit-marca').value,
      modelo: document.getElementById('edit-modelo').value,
      garantia: document.getElementById('edit-garantia').value,
      calibracion: document.getElementById('edit-calibracion').value,
      servicio: document.getElementById('edit-servicio').checked,
      notas: document.getElementById('edit-notas').value,
      numero_series: series
    };
    
    try {
      const response = await fetch('../backend/actualizar_venta.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(datos)
      });
      
      const resultado = await response.json();
      if (resultado.success) {
        alert('Venta actualizada correctamente');
        modal.style.display = 'none';
        buscarVentas();
      } else {
        throw new Error(resultado.message || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar cambios: ' + error.message);
    }
  }

  // Eliminar venta
  async function eliminarVenta(id) {
    if (!confirm('¿Está seguro de eliminar esta venta?')) return;
    
    try {
      const response = await fetch(`../backend/eliminar_venta.php?id=${id}`);
      const resultado = await response.json();
      
      if (resultado.success) {
        alert('Venta eliminada correctamente');
        buscarVentas();
      } else {
        throw new Error(resultado.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      alert('Error al eliminar venta: ' + error.message);
    }
  }

  // Ver detalle completo de venta
  function verDetalleVenta(id) {
    // Implementar lógica para mostrar detalle completo
    alert(`Mostrando detalle de venta ID: ${id}`);
  }

  // Exportar a Excel
  async function exportarAExcel() {
    // Implementar lógica de exportación
    alert('Exportando datos a Excel...');
  }

  // Event Listeners
  btnBuscar.addEventListener('click', buscarVentas);
  btnExportar.addEventListener('click', exportarAExcel);
  btnCerrarModal.addEventListener('click', () => modal.style.display = 'none');
  btnGuardarCambios.addEventListener('click', guardarCambios);
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Inicialización
  cargarClientes();
  buscarVentas();
});