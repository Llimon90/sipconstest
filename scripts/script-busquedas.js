// Variables globales para control de paginación
let paginaActual = 1;
let registrosPorPagina = 10;
let incidenciasTotales = [];

/**
 * Función que se ejecuta al cargar el DOM
 */
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar campos de fecha con Flatpickr
  flatpickr("#fecha-inicio", {
    dateFormat: "Y-m-d",
    allowInput: true
  });
  flatpickr("#fecha-fin", {
    dateFormat: "Y-m-d",
    allowInput: true
  });

  // Inicializar tooltips de Bootstrap (si los usas)
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(el => new bootstrap.Tooltip(el));

  // Cargar datos iniciales
  cargarIncidencias();
  cargarClientes();

  // Evento submit del formulario de filtros
  document.getElementById("report-form").addEventListener("submit", function (e) {
    e.preventDefault();
    paginaActual = 1;
    cargarIncidencias();
  });

  // Botón “Anterior”
  document.getElementById("btn-prev").addEventListener("click", function(e) {
    e.preventDefault();
    if (paginaActual > 1) {
      paginaActual--;
      mostrarIncidenciasPagina();
    }
  });

  // Botón “Siguiente”
  document.getElementById("btn-next").addEventListener("click", function(e) {
    e.preventDefault();
    const totalPaginas = Math.ceil(incidenciasTotales.length / registrosPorPagina);
    if (paginaActual < totalPaginas) {
      paginaActual++;
      mostrarIncidenciasPagina();
    }
  });

  // Cambio en cantidad de registros por página
  document.getElementById("select-registros").addEventListener("change", function(e) {
    registrosPorPagina = parseInt(e.target.value);
    paginaActual = 1;
    mostrarIncidenciasPagina();
  });

  // Filtros rápidos (botones para “Mr Tienda/Mr Chef”, “Otros”, “Todos”)
  document.querySelectorAll('.btn-filtro-rapido').forEach(button => {
    button.addEventListener('click', function() {
      const filtro = this.getAttribute('data-filtro');

      // Quitar clase “active” de todos los botones rápidos
      document.querySelectorAll('.btn-filtro-rapido').forEach(btn => {
        btn.classList.remove('active');
      });
      // Marcar este botón como activo
      this.classList.add('active');

      // Resetear formulario completo
      document.getElementById("report-form").reset();

      // Referencia al checkbox “solo activas”
      const soloActivasCheckbox = document.getElementById("solo-activas");

      // Aplicar filtro rápido
      switch (filtro) {
        case 'mr-tienda-chef':
          document.getElementById("tipo-equipo").value = "mr-tienda-chef";
          soloActivasCheckbox.checked = true;
          break;
        case 'otros':
          document.getElementById("tipo-equipo").value = "otros";
          soloActivasCheckbox.checked = true;
          break;
        case 'todos':
          document.getElementById("tipo-equipo").value = "";
          soloActivasCheckbox.checked = false;
          break;
      }

      // Volver a primera página y recargar
      paginaActual = 1;
      cargarIncidencias();
    });
  });

  // Lógica para filtros avanzados plegables (ahora con clases)
  // Supongamos que el encabezado tiene la clase `.encabezado-filtros-avanzados`
  // y la sección de filtros tiene la clase `.filtros-avanzados`
  const encabezados = document.querySelectorAll(".encabezado-filtros-avanzados");
  const seccionesFiltros = document.querySelectorAll(".filtros-avanzados");

  // Ocultar inicialmente todas las secciones de filtros avanzados
  seccionesFiltros.forEach(sec => {
    sec.style.display = "none";
  });

  encabezados.forEach(enc => {
    enc.addEventListener("click", () => {
      // Al hacer clic en este encabezado, encontrar la sección correspondiente (hermana, contenedor, etc.)
      // Aquí asumimos que el encabezado y la sección están relacionadas de alguna forma (por proximidad en el DOM)
      // Por simplicidad, vamos a alternar *todas* las secciones de filtros avanzados; si quieres relacionarlas
      // de forma más específica, puedes hacer una búsqueda relativa al encabezado (por ejemplo, nextElementSibling).

      seccionesFiltros.forEach(sec => {
        if (sec.style.display === "none") {
          sec.style.display = "block";
        } else {
          sec.style.display = "none";
        }
      });
    });
  });
});


/**
 * Función que solicita al backend las incidencias según los filtros
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

  // Validar fechas
  if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
    alert("❌ La fecha de fin no puede ser menor que la fecha de inicio.");
    return;
  }

  // Construir URL con parámetros
  let url = `../backend/buscar_reportes.php?cliente=${encodeURIComponent(cliente)}&fecha_inicio=${encodeURIComponent(fechaInicio)}&fecha_fin=${encodeURIComponent(fechaFin)}&estatus=${encodeURIComponent(estatus)}&sucursal=${encodeURIComponent(sucursal)}&tecnico=${encodeURIComponent(tecnico)}`;
  
  if (tipoEquipo) {
    url += `&tipo_equipo=${encodeURIComponent(tipoEquipo)}`;
  }
  if (soloActivas) {
    url += `&solo_activas=1`;
  }

  console.log("URL de búsqueda:", url);

  try {
    // Mostrar mensaje de carga
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
 * Muestra las incidencias de la página actual
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

      // Columna con enlace al detalle
      const celdaInterna = document.createElement("td");
      const enlace = document.createElement("a");
      enlace.href = `detalle.html?id=${incidencia.id}`;
      enlace.textContent = incidencia.numero_incidente || "N/A";
      enlace.className = "text-decoration-none";
      celdaInterna.appendChild(enlace);
      row.appendChild(celdaInterna);

      // Otras columnas (cliente, sucursal, falla, fecha, estatus)
      const columnas = ['numero', 'cliente', 'sucursal', 'falla', 'fecha', 'estatus'];
      columnas.forEach(campo => {
        const td = document.createElement("td");
        td.textContent = incidencia[campo] || "N/A";
        row.appendChild(td);
      });

      // Columna de estado activo / inactivo
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
 * Actualiza los controles de paginación y el contador
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
 * Carga los clientes desde el backend para llenar el <select>
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
 * Limpia los filtros, remueve clases “active” y recarga incidencias
 */
function limpiarFiltros() {
  document.getElementById("report-form").reset();
  document.querySelectorAll('.btn-filtro-rapido').forEach(btn => {
    btn.classList.remove('active');
  });
  paginaActual = 1;
  cargarIncidencias();
}
