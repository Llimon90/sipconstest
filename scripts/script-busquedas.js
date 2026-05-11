let paginaActual = 1;
let registrosPorPagina = 10;
let incidenciasTotales = [];

document.addEventListener("DOMContentLoaded", function () {
  flatpickr("#fecha-inicio", { dateFormat: "Y-m-d", allowInput: true });
  flatpickr("#fecha-fin", { dateFormat: "Y-m-d", allowInput: true });

  cargarIncidencias();
  cargarClientes();

  document.getElementById("report-form").addEventListener("submit", function (e) {
    e.preventDefault();
    paginaActual = 1;
    cargarIncidencias();
  });

  // Paginación
  document.getElementById("btn-prev").addEventListener("click", (e) => { e.preventDefault(); if (paginaActual > 1) { paginaActual--; mostrarIncidenciasPagina(); } });
  document.getElementById("btn-next").addEventListener("click", (e) => { e.preventDefault(); if (paginaActual < Math.ceil(incidenciasTotales.length / registrosPorPagina)) { paginaActual++; mostrarIncidenciasPagina(); } });

  // Filtros rápidos
  document.querySelectorAll('.btn-filtro-rapido').forEach(button => {
    button.addEventListener('click', function() {
      const filtro = this.getAttribute('data-filtro');
      document.querySelectorAll('.btn-filtro-rapido').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      document.getElementById("report-form").reset();
      
      if (filtro === 'programadas') {
        document.getElementById("solo-programadas").checked = true;
      } else if (filtro !== 'todos') {
        document.getElementById("tipo-equipo").value = filtro;
        document.getElementById("solo-activas").checked = true;
      }

      paginaActual = 1;
      cargarIncidencias();
    });
  });
});

async function cargarIncidencias() {
  const params = {
    cliente: document.getElementById("cliente").value,
    fecha_inicio: document.getElementById("fecha-inicio").value,
    fecha_fin: document.getElementById("fecha-fin").value,
    estatus: document.getElementById("estatus").value,
    sucursal: document.getElementById("sucursal").value,
    tecnico: document.getElementById("tecnico").value,
    tipo_equipo: document.getElementById("tipo-equipo").value,
    solo_activas: document.getElementById("solo-activas").checked ? '1' : '',
    solo_programadas: document.getElementById("solo-programadas").checked ? '1' : '',
    t: Date.now()
  };

  let url = `../backend/buscar_reportes.php?${new URLSearchParams(params).toString()}`;

  try {
    document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8" class="text-center">Buscando...</td></tr>`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.message) {
      document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8">${data.message}</td></tr>`;
      incidenciasTotales = [];
    } else {
      incidenciasTotales = data;
    }
    mostrarIncidenciasPagina();
  } catch (error) {
    document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8">Error de conexión</td></tr>`;
  }
}

function mostrarIncidenciasPagina() {
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const items = incidenciasTotales.slice(inicio, inicio + registrosPorPagina);
  const tablaBody = document.getElementById("tabla-body");
  tablaBody.innerHTML = "";

  items.forEach(inc => {
    const row = document.createElement("tr");
    const esActiva = ['Abierto', 'Asignado', 'Pendiente', 'Completado'].includes(inc.estatus);
    row.innerHTML = `
      <td><a href="detalle.html?id=${inc.id}">${inc.numero_incidente || "N/A"}</a></td>
      <td>${inc.numero || "N/A"}</td>
      <td>${inc.cliente}</td>
      <td>${inc.sucursal}</td>
      <td>${inc.falla}</td>
      <td>${inc.fecha}</td>
      <td>${inc.estatus}</td>
      <td><span class="${esActiva ? "badge-activo" : "badge-inactivo"}">${esActiva ? "Activa" : "Inactiva"}</span></td>
    `;
    tablaBody.appendChild(row);
  });
  actualizarControlesPaginacion();
}

function actualizarControlesPaginacion() {
  const total = incidenciasTotales.length;
  document.getElementById("btn-prev").parentElement.classList.toggle("disabled", paginaActual === 1);
  document.getElementById("btn-next").parentElement.classList.toggle("disabled", paginaActual >= Math.ceil(total / registrosPorPagina));
}

async function cargarClientes() {
  const response = await fetch(`../backend/obtener-clientes.php`);
  const clientes = await response.json();
  const select = document.getElementById('cliente');
  clientes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.nombre; opt.textContent = c.nombre; select.appendChild(opt);
  });
}

function limpiarFiltros() {
  document.getElementById("report-form").reset();
  document.querySelectorAll('.btn-filtro-rapido').forEach(btn => btn.classList.remove('active'));
  paginaActual = 1;
  cargarIncidencias();
}