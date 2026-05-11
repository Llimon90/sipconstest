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

  document.getElementById("btn-prev").addEventListener("click", (e) => { e.preventDefault(); if (paginaActual > 1) { paginaActual--; mostrarIncidenciasPagina(); } });
  document.getElementById("btn-next").addEventListener("click", (e) => { e.preventDefault(); if (paginaActual < Math.ceil(incidenciasTotales.length / registrosPorPagina)) { paginaActual++; mostrarIncidenciasPagina(); } });

  document.getElementById("select-registros").addEventListener("change", function(e) {
    registrosPorPagina = parseInt(e.target.value);
    paginaActual = 1;
    mostrarIncidenciasPagina();
  });

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

  const url = `../backend/buscar_reportes.php?${new URLSearchParams(params).toString()}`;

  try {
    document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8" class="text-center">Buscando datos...</td></tr>`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.message) {
      document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8" class="text-center">${data.message}</td></tr>`;
      incidenciasTotales = [];
    } else {
      incidenciasTotales = data;
    }
    mostrarIncidenciasPagina();
  } catch (error) {
    document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error de conexión</td></tr>`;
  }
}

function mostrarIncidenciasPagina() {
  const items = incidenciasTotales.slice((paginaActual - 1) * registrosPorPagina, paginaActual * registrosPorPagina);
  const tablaBody = document.getElementById("tabla-body");
  tablaBody.innerHTML = "";

  items.forEach(inc => {
    const row = document.createElement("tr");
    
    // El estatus Programado indica que viene de venta_detalles y aún no tiene ticket real.
    const esProgramado = inc.estatus === 'Programado';
    const esActiva = ['Abierto', 'Asignado', 'Pendiente', 'Completado', 'Programado'].includes(inc.estatus);
    
    // Si es programada, mostramos texto sin enlace para evitar errores de página no encontrada
    let celdaInternaHTML = esProgramado 
      ? `<span class="text-primary fw-bold" title="Aún sin ticket generado"><i class="bi bi-clock-history"></i> ${inc.numero_incidente || "N/A"}</span>`
      : `<a href="detalle.html?id=${inc.id}" class="text-decoration-none">${inc.numero_incidente || "N/A"}</a>`;

    row.innerHTML = `
      <td>${celdaInternaHTML}</td>
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
  document.getElementById("btn-prev").classList.toggle("disabled", paginaActual === 1);
  document.getElementById("btn-next").classList.toggle("disabled", paginaActual >= Math.ceil(total / registrosPorPagina));
}

async function cargarClientes() {
  try {
    const response = await fetch(`../backend/obtener-clientes.php`);
    const clientes = await response.json();
    const select = document.getElementById('cliente');
    clientes.forEach(c => { select.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`; });
  } catch(e) { }
}

function limpiarFiltros() {
  document.getElementById("report-form").reset();
  if (document.getElementById("solo-programadas")) document.getElementById("solo-programadas").checked = false;
  document.querySelectorAll('.btn-filtro-rapido').forEach(btn => btn.classList.remove('active'));
  paginaActual = 1;
  cargarIncidencias();
}