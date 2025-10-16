// Variables globales para control de paginación
let paginaActual = 1;
let registrosPorPagina = 10;
let incidenciasTotales = [];

/**
 * Función principal que se ejecuta al cargar el DOM
 */
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar los campos de fecha con Flatpickr
  flatpickr("#fecha-inicio", {
    dateFormat: "Y-m-d",
    allowInput: true
  });
  flatpickr("#fecha-fin", {
    dateFormat: "Y-m-d",
    allowInput: true
  });

  // Inicializar tooltips de Bootstrap (si usas Bootstrap)
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(el => new bootstrap.Tooltip(el));

  // Iniciar carga de datos
  cargarIncidencias();
  cargarClientes();

  // Evento submit del formulario de filtros
  document.getElementById("report-form").addEventListener("submit", function (e) {
    e.preventDefault();
    paginaActual = 1;  // volver a la primera página cuando aplicas filtros
    cargarIncidencias();
  });

  // Botones de paginación: anterior
  document.getElementById("btn-prev").addEventListener("click", function(e) {
    e.preventDefault();
    if (paginaActual > 1) {
      paginaActual--;
      mostrarIncidenciasPagina();
    }
  });

  // Botón siguiente
  document.getElementById("btn-next").addEventListener("click", function(e) {
    e.preventDefault();
    const totalPaginas = Math.ceil(incidenciasTotales.length / registrosPorPagina);
    if (paginaActual < totalPaginas) {
      paginaActual++;
      mostrarIncidenciasPagina();
    }
  });

  // Cambio de cantidad de registros por página
  document.getElementById("select-registros").addEventListener("change", function(e) {
    registrosPorPagina = parseInt(e.target.value);
    paginaActual = 1;
    mostrarIncidenciasPagina();
  });

  // Filtros rápidos (botones tipo “Mr Tienda/Mr Chef”, “Otros”, “Todos”)
  document.querySelectorAll('.btn-filtro-rapido').forEach(button => {
    button.addEventListener('click', function() {
      const filtro = this.getAttribute('data-filtro');

      // Quitar clase “active” de todos
      document.querySelectorAll('.btn-filtro-rapido').forEach(btn => {
        btn.classList.remove('active');
      });
      // Marcar el botón actual como activo
      this.classList.add('active');

      // Resetear el formulario de filtros avanzados
      document.getElementById("report-form").reset();

      // Referencia al checkbox “solo activas”
      const soloActivasCheckbox = document.getElementById("solo-activas");

      // Aplicar el filtro rápido correspondiente
      switch (filtro) {
        case 'mr-tienda-chef':
          document.getElementById("tipo-equipo").value = "mr-tienda-chef";
          soloActivasCheckbox.checked = true;  // activar checkbox
          break;
        case 'otros':
          document.getElementById("tipo-equipo").value = "otros";
          soloActivasCheckbox.checked = true;
          break;
        case 'todos':
          document.getElementById("tipo-equipo").value = "";
          soloActivasCheckbox.checked = false; // desactivar checkbox
          break;
      }

      // Resetear la página y recargar
      paginaActual = 1;
      cargarIncidencias();
    });
  });

  // Lógica para filtros avanzados plegables
  const encabezadoFiltros = document.getElementById("encabezado-filtros-avanzados");
  const seccionFiltros = document.getElementById("filtros-avanzados");
  // Ocultar inicialmente
  seccionFiltros.style.display = "none";

  encabezadoFiltros.addEventListener("click", () => {
    // Alternar entre mostrar / ocultar
    if (seccionFiltros.style.display === "none") {
      seccionFiltros.style.display = "block";
    } else {
      seccionFiltros.style.display = "none";
    }
  });
});

/**
 * Función que pide las incidencias al backend según los filtros actuales
 */
async function cargarIncidencias() {
  const cliente = document.getElementById("cliente").value;
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;
  const estatus = document.getElementById("estatus").value;
  const sucursal = document.getElementById("sucursal").value;
  const tecnico = document.getElementById("tecnico").value;
  const tipoEquipo = document.getElementById("tipo-equipo").value;
  const soloActivas = document.getElementById("solo-activas").checked;

  console.log("Filtros aplicados:", {
    tipoEquipo: tipoEquipo,
    cliente: cliente,
    estatus: estatus,
    soloActivas: soloActivas
  });

  // Validar rango de fechas
  if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
    alert("❌ La fecha de fin no puede ser menor que la fecha de inicio.");
    return;
  }

  // Construir la URL de la petición con parámetros
  let url = `../backend/buscar_reportes.php?cliente=${encodeURIComponent(cliente)}&fecha_inicio=${encodeURIComponent(fechaInicio)}&fecha_fin=${encodeURIComponent(fechaFin)}&estatus=${encodeURIComponent(estatus)}&sucursal=${encodeURIComponent(sucursal)}&tecnico=${encodeURIComponent(tecnico)}`;
  
  if (tipoEquipo) {
    url += `&tipo_equipo=${encodeURIComponent(tipoEquipo)}`;
  }
  if (soloActivas) {
    url += `&solo_activas=1`;
  }

  console.log("URL de búsqueda:", url);

  try {
    // Mostrar mensaje de carga en la tabla
    document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8" class="text-center">Buscando incidencias...</td></tr>`;
    const response = await fetch(url);
    const data = await response.json();

    console.log("Datos recibidos:", data);

    if (data.message) {
      document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8">${data.message}</td></tr>`;
      incidenciasTotales = [];
      actualizarControlesPaginacion();
      return;
    }

    incidenciasTotales = data;
    mostrarIncidenciasPagina();
  } catch (error) {
    console.error("❌ Error al cargar las incidencias:", error);
    document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8">Error al cargar los datos.</td></tr>`;
    incidenciasTotales = [];
    actualizarControlesPaginacion();
  }
}

/**
 * Muestra las incidencias correspondientes a la página actual
 */
function mostrarIncidenciasPagina() {
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const incidenciasPagina = incidenciasTotales.slice(inicio, fin);

  const tablaBody = document.getElementById("tabla-body");
  tablaBody.innerHTML = "";

  if (incidenciasPagina.length === 0) {
    tablaBody.innerHTML = `<tr><td colspan="8" class="text-center">No se encontraron incidencias con los filtros aplicados</td></tr>`;
  } else {
    incidenciasPagina.forEach(incidencia => {
      const row = document.createElement("tr");

      // Columna con enlace al detalle de la incidencia
      const celdaInterna = document.createElement("td");
      const enlace = document.createElement("a");
      enlace.href = `detalle.html?id=${incidencia.id}`;
      enlace.textContent = incidencia.numero_incidente || "N/A";
      enlace.className = "text-decoration-none";
      celdaInterna.appendChild(enlace);
      row.appendChild(celdaInterna);

      // Otras columnas (cliente, sucursal, falla, fecha, estatus, etc.)
      const columnas = ['numero', 'cliente', 'sucursal', 'falla', 'fecha', 'estatus'];
      columnas.forEach(campo => {
        const td = document.createElement("td");
        td.textContent = incidencia[campo] || "N/A";
        row.appendChild(td);
      });

      // Columna de estado activo/inactivo
      const tdEstado = document.createElement("td");
      const esActiva = ['Abierto', 'Asignado', 'Pendiente', 'Completado'].includes(incidencia.estatus);
      const badge = document.createElement("span");
      badge.className = esActiva ? "badge-activo" : "badge-inactivo";
      badge.textContent = esActiva ? "Activa" : "Inactiva";
      tdEstado.appendChild(badge);
      row.appendChild(tdEstado);

      tablaBody.appendChild(row);
    });
  }

  actualizarControlesPaginacion();
}

/**
 * Actualiza los botones de paginación y el contador de registros
 */
function actualizarControlesPaginacion() {
  const totalPaginas = Math.ceil(incidenciasTotales.length / registrosPorPagina) || 1;
  const totalRegistros = incidenciasTotales.length;
  const inicio = Math.min((paginaActual - 1) * registrosPorPagina + 1, totalRegistros);
  const fin = Math.min(inicio + registrosPorPagina - 1, totalRegistros);

  document.getElementById("contador-registros").textContent =
    `Mostrando ${inicio}-${fin} de ${totalRegistros} registros`;

  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");

  btnPrev.classList.toggle("disabled", paginaActual <= 1);
  btnNext.classList.toggle("disabled", paginaActual >= totalPaginas);
}

/**
 * Carga los clientes desde el backend (para llenar el <select> de cliente)
 */
async function cargarClientes() {
  try {
    const response = await fetch('../backend/obtener-clientes.php');
    const clientes = await response.json();
    const selectClientes = document.getElementById('cliente');
    selectClientes.innerHTML = '<option value="">Seleccionar Cliente</option><option value="todos">Todos los clientes</option>';

    clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.nombre;
      option.textContent = cliente.nombre;
      selectClientes.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar clientes:', error);
    alert('Error al cargar clientes en el select');
  }
}

/**
 * Limpia los filtros, desmarca botones rápidos, y recarga incidencias
 */
function limpiarFiltros() {
  document.getElementById("report-form").reset();
  document.querySelectorAll('.btn-filtro-rapido').forEach(btn => {
    btn.classList.remove('active');
  });
  paginaActual = 1;
  cargarIncidencias();
}
