// Variables globales para paginación
let paginaActual = 1;
let registrosPorPagina = 10;
let incidenciasTotales = [];

document.addEventListener("DOMContentLoaded", function () {
  // Configuración de Flatpickr
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
  document.getElementById("btn-prev").addEventListener("click", function(e) {
    e.preventDefault();
    if (paginaActual > 1) { paginaActual--; mostrarIncidenciasPagina(); }
  });

  document.getElementById("btn-next").addEventListener("click", function(e) {
    e.preventDefault();
    const totalPaginas = Math.ceil(incidenciasTotales.length / registrosPorPagina);
    if (paginaActual < totalPaginas) { paginaActual++; mostrarIncidenciasPagina(); }
  });

  document.getElementById("select-registros").addEventListener("change", function(e) {
    registrosPorPagina = parseInt(e.target.value);
    paginaActual = 1;
    mostrarIncidenciasPagina();
  });

  // Filtros rápidos
  document.querySelectorAll('.btn-filtro-rapido').forEach(button => {
    button.addEventListener('click', function() {
      const filtro = this.getAttribute('data-filtro');
      document.querySelectorAll('.btn-filtro-rapido').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      document.getElementById("report-form").reset();
      const soloActivasCheckbox = document.getElementById("solo-activas");

      switch(filtro) {
        case 'Mr. Tienda/Mr. Chef':
          document.getElementById("tipo-equipo").value = "Mr. Tienda/Mr. Chef";
          soloActivasCheckbox.checked = true;
          break;
        case 'Distribuidora el Florido':
          document.getElementById("tipo-equipo").value = "Distribuidora el Florido";
          soloActivasCheckbox.checked = true;
          break;
        case 'Calimax':
          document.getElementById("tipo-equipo").value = "Calimax";
          soloActivasCheckbox.checked = true;
          break;
        case 'Recolección':
          document.getElementById("tipo-equipo").value = "Recolección";
          soloActivasCheckbox.checked = true;
          break;
        case 'Otros':
          document.getElementById("tipo-equipo").value = "Otros";
          soloActivasCheckbox.checked = true;
          break;
        case 'todos':
          document.getElementById("tipo-equipo").value = "";
          soloActivasCheckbox.checked = false;
          break;
      }
      paginaActual = 1;
      cargarIncidencias();
    });
  });
});

async function cargarIncidencias() {
  const cliente = document.getElementById("cliente").value;
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;
  const estatus = document.getElementById("estatus").value;
  const sucursal = document.getElementById("sucursal").value;
  const tecnico = document.getElementById("tecnico").value;
  const tipoEquipo = document.getElementById("tipo-equipo").value;
  const soloActivas = document.getElementById("solo-activas").checked;
  // NUEVO: Capturar checkbox de programadas
  const soloProgramadas = document.getElementById("solo-programadas").checked;

  if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
    alert("❌ La fecha de fin no puede ser menor que la fecha de inicio.");
    return;
  }

  // Construir URL
  let url = `../backend/buscar_reportes.php?cliente=${encodeURIComponent(cliente)}&fecha_inicio=${encodeURIComponent(fechaInicio)}&fecha_fin=${encodeURIComponent(fechaFin)}&estatus=${encodeURIComponent(estatus)}&sucursal=${encodeURIComponent(sucursal)}&tecnico=${encodeURIComponent(tecnico)}`;

  if (tipoEquipo) url += `&tipo_equipo=${encodeURIComponent(tipoEquipo)}`;
  if (soloActivas) url += `&solo_activas=1`;
  // NUEVO: Agregar a la URL
  if (soloProgramadas) url += `&solo_programadas=1`;

  url += `&t=${Date.now()}`;

  try {
    document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8" class="text-center">Buscando...</td></tr>`;
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    if (data.message) {
      document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8">${data.message}</td></tr>`;
      incidenciasTotales = [];
      actualizarControlesPaginacion();
      return;
    }
    incidenciasTotales = data;
    mostrarIncidenciasPagina();
  } catch (error) {
    document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8">Error al cargar datos.</td></tr>`;
  }
}

function mostrarIncidenciasPagina() {
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const items = incidenciasTotales.slice(inicio, inicio + registrosPorPagina);
  const tablaBody = document.getElementById("tabla-body");
  tablaBody.innerHTML = "";

  if (items.length === 0) {
    tablaBody.innerHTML = `<tr><td colspan="8" class="text-center">No se encontraron incidencias</td></tr>`;
  } else {
    items.forEach(inc => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><a href="detalle.html?id=${inc.id}" class="text-decoration-none">${inc.numero_incidente || "N/A"}</a></td>
        <td>${inc.numero || "N/A"}</td>
        <td>${inc.cliente}</td>
        <td>${inc.sucursal}</td>
        <td>${inc.falla}</td>
        <td>${inc.fecha}</td>
        <td>${inc.estatus}</td>
        <td><span class="${['Abierto', 'Asignado', 'Pendiente', 'Completado'].includes(inc.estatus) ? "badge-activo" : "badge-inactivo"}">${['Abierto', 'Asignado', 'Pendiente', 'Completado'].includes(inc.estatus) ? "Activa" : "Inactiva"}</span></td>
      `;
      tablaBody.appendChild(row);
    });
  }
  actualizarControlesPaginacion();
}

function actualizarControlesPaginacion() {
  const total = incidenciasTotales.length;
  const inicio = Math.min((paginaActual - 1) * registrosPorPagina + 1, total);
  const fin = Math.min(inicio + registrosPorPagina - 1, total);
  document.getElementById("contador-registros").textContent = `Mostrando ${inicio}-${fin} de ${total} registros`;
  document.getElementById("btn-prev").classList.toggle("disabled", paginaActual <= 1);
  document.getElementById("btn-next").classList.toggle("disabled", paginaActual >= Math.ceil(total / registrosPorPagina));
}

async function cargarClientes() {
  try {
    const response = await fetch(`../backend/obtener-clientes.php?t=${Date.now()}`);
    const clientes = await response.json();
    const select = document.getElementById('cliente');
    select.innerHTML = '<option value="">Seleccionar Cliente</option><option value="todos">Todos los clientes</option>';
    clientes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.nombre; opt.textContent = c.nombre; select.appendChild(opt);
    });
  } catch (e) { console.error(e); }
}

function limpiarFiltros() {
  document.getElementById("report-form").reset();
  if(document.getElementById("solo-programadas")) document.getElementById("solo-programadas").checked = false;
  document.querySelectorAll('.btn-filtro-rapido').forEach(btn => btn.classList.remove('active'));
  paginaActual = 1;
  cargarIncidencias();
}