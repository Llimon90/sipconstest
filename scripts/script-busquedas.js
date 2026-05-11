// script-busquedas.js
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

  document.getElementById("btn-prev").addEventListener("click", (e) => { 
    e.preventDefault(); 
    if (paginaActual > 1) { paginaActual--; mostrarIncidenciasPagina(); } 
  });
  
  document.getElementById("btn-next").addEventListener("click", (e) => { 
    e.preventDefault(); 
    if (paginaActual < Math.ceil(incidenciasTotales.length / registrosPorPagina)) { paginaActual++; mostrarIncidenciasPagina(); } 
  });

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
    document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8" class="text-center">Consultando...</td></tr>`;
    const response = await fetch(url);
    const data = await response.json();
    incidenciasTotales = data.message ? [] : data;
    mostrarIncidenciasPagina();
  } catch (error) {
    document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8" class="text-center">Error al conectar con servidor</td></tr>`;
  }
}

function mostrarIncidenciasPagina() {
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const items = incidenciasTotales.slice(inicio, inicio + registrosPorPagina);
  const tablaBody = document.getElementById("tabla-body");
  tablaBody.innerHTML = "";

  if (items.length === 0) {
    tablaBody.innerHTML = `<tr><td colspan="8" class="text-center">Sin resultados</td></tr>`;
    return;
  }

  items.forEach((inc, indexArray) => {
    const row = document.createElement("tr");
    const esProgramado = inc.estatus === 'Programado';
    const esActiva = ['Abierto', 'Asignado', 'Pendiente', 'Completado', 'Programado'].includes(inc.estatus);
    const indiceGlobal = inicio + indexArray;

    let enlaceHTML = esProgramado 
      ? `<a href="#" class="fw-bold text-primary" onclick="abrirModalProgramada(${indiceGlobal}); return false;"><i class="bi bi-eye-fill"></i> ${inc.numero_incidente}</a>`
      : `<a href="detalle.html?id=${inc.id}">${inc.numero_incidente || "N/A"}</a>`;

    row.innerHTML = `
      <td>${enlaceHTML}</td>
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

function abrirModalProgramada(indice) {
  const d = incidenciasTotales[indice];
  const lista = d.detalles_completos ? d.detalles_completos.split('||') : [];
  
  let equiposHTML = '<ul class="list-group list-group-flush border rounded">';
  lista.forEach(e => { equiposHTML += `<li class="list-group-item"><i class="bi bi-cpu text-primary me-2"></i>${e}</li>`; });
  equiposHTML += '</ul>';

  document.getElementById("modalProgramadaLabel").innerHTML = `Programación: ${d.numero_incidente} - ${d.numero}`;
  document.getElementById("modalProgramadaBody").innerHTML = `
    <div class="row g-3 mb-3">
      <div class="col-md-6">
        <label class="text-muted small d-block">CLIENTE</label>
        <p class="fw-bold mb-0">${d.cliente}</p>
        <label class="text-muted small d-block mt-2">SUCURSAL</label>
        <p class="mb-0">${d.sucursal}</p>
      </div>
      <div class="col-md-6">
        <label class="text-muted small d-block">FECHA AGENDADA</label>
        <p class="mb-0"><span class="badge bg-warning text-dark px-3 py-2">${d.fecha}</span></p>
        <label class="text-muted small d-block mt-2">TIPO</label>
        <p class="mb-0 fw-bold">${d.numero_incidente === 'PROG-CAL' ? 'CALIBRACIÓN' : 'MANTENIMIENTO'}</p>
      </div>
    </div>
    <div class="bg-light p-3 rounded">
      <h6 class="fw-bold mb-3"><i class="bi bi-list-check"></i> Equipos vinculados a la visita:</h6>
      ${equiposHTML}
    </div>
  `;

  new bootstrap.Modal(document.getElementById('modalProgramada')).show();
}

function actualizarControlesPaginacion() {
  const total = incidenciasTotales.length;
  document.getElementById("btn-prev").classList.toggle("disabled", paginaActual === 1);
  document.getElementById("btn-next").classList.toggle("disabled", paginaActual >= Math.ceil(total / registrosPorPagina));
  document.getElementById("contador-registros").textContent = `Total: ${total} registros`;
}

async function cargarClientes() {
  try {
    const response = await fetch(`../backend/obtener-clientes.php`);
    const clientes = await response.json();
    const select = document.getElementById('cliente');
    clientes.forEach(c => { select.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`; });
  } catch(e) {}
}

function limpiarFiltros() {
  document.getElementById("report-form").reset();
  document.querySelectorAll('.btn-filtro-rapido').forEach(btn => btn.classList.remove('active'));
  paginaActual = 1;
  cargarIncidencias();
}