// script-busquedas.js

let paginaActual = 1;
let registrosPorPagina = 10;
let incidenciasTotales = [];

document.addEventListener("DOMContentLoaded", function () {
    // 1. Inicialización de Fechas
    flatpickr("#fecha-inicio", { dateFormat: "Y-m-d", allowInput: true });
    flatpickr("#fecha-fin", { dateFormat: "Y-m-d", allowInput: true });

    cargarIncidencias();
    cargarClientes();

    // 2. Evento del Formulario
    document.getElementById("report-form").addEventListener("submit", function (e) {
        e.preventDefault();
        paginaActual = 1;
        cargarIncidencias();
    });

    // 3. Controladores de Paginación
    document.getElementById("btn-prev").addEventListener("click", (e) => {
        e.preventDefault();
        if (paginaActual > 1) { paginaActual--; mostrarIncidenciasPagina(); }
    });

    document.getElementById("btn-next").addEventListener("click", (e) => {
        e.preventDefault();
        const totalPaginas = Math.ceil(incidenciasTotales.length / registrosPorPagina);
        if (paginaActual < totalPaginas) { paginaActual++; mostrarIncidenciasPagina(); }
    });

    document.getElementById("select-registros").addEventListener("change", (e) => {
        registrosPorPagina = parseInt(e.target.value);
        paginaActual = 1;
        mostrarIncidenciasPagina();
    });

    // 4. Lógica de Filtros Rápidos
    document.querySelectorAll('.btn-filtro-rapido').forEach(button => {
        button.addEventListener('click', function() {
            const filtro = this.getAttribute('data-filtro');
            
            // Estética de botones
            document.querySelectorAll('.btn-filtro-rapido').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const soloActivasCheckbox = document.getElementById("solo-activas");
            const soloProgramadasCheckbox = document.getElementById("solo-programadas");
            const tipoEquipoSelect = document.getElementById("tipo-equipo");

            // Resetear para filtro limpio
            if (filtro === 'todos') {
                limpiarFiltros();
                return;
            }

            // Aplicar lógica según el botón
            if (filtro === 'programadas') {
                soloProgramadasCheckbox.checked = true;
                soloActivasCheckbox.checked = false;
            } else {
                tipoEquipoSelect.value = filtro;
                soloActivasCheckbox.checked = true;
                soloProgramadasCheckbox.checked = false;
            }

            paginaActual = 1;
            cargarIncidencias();
        });
    });
});

async function cargarIncidencias() {
    // Captura de valores (Entrelazados)
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

    // Validación básica de fechas
    if (params.fecha_inicio && params.fecha_fin && params.fecha_fin < params.fecha_inicio) {
        alert("La fecha fin no puede ser anterior a la inicio.");
        return;
    }

    // Construcción de QueryString
    const queryString = new URLSearchParams(params).toString();
    const url = `../backend/buscar_reportes.php?${queryString}`;

    try {
        document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8" class="text-center">Cargando...</td></tr>`;
        
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
        console.error("Error:", error);
        document.getElementById("tabla-body").innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error de conexión</td></tr>`;
    }
}

function mostrarIncidenciasPagina() {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const items = incidenciasTotales.slice(inicio, fin);
    const tablaBody = document.getElementById("tabla-body");
    
    tablaBody.innerHTML = "";

    items.forEach(inc => {
        const row = document.createElement("tr");
        const esActiva = ['Abierto', 'Asignado', 'Pendiente', 'Completado'].includes(inc.estatus);
        
        row.innerHTML = `
            <td><a href="detalle.html?id=${inc.id}" class="text-decoration-none">${inc.numero_incidente || 'N/A'}</a></td>
            <td>${inc.numero || 'N/A'}</td>
            <td>${inc.cliente}</td>
            <td>${inc.sucursal}</td>
            <td>${inc.falla}</td>
            <td>${inc.fecha}</td>
            <td>${inc.estatus}</td>
            <td><span class="${esActiva ? 'badge-activo' : 'badge-inactivo'}">${esActiva ? 'Activa' : 'Inactiva'}</span></td>
        `;
        tablaBody.appendChild(row);
    });

    actualizarControlesPaginacion();
}

function actualizarControlesPaginacion() {
    const total = incidenciasTotales.length;
    const totalPaginas = Math.ceil(total / registrosPorPagina) || 1;
    
    document.getElementById("contador-registros").textContent = `Total: ${total} registros`;
    document.getElementById("btn-prev").classList.toggle("disabled", paginaActual === 1);
    document.getElementById("btn-next").classList.toggle("disabled", paginaActual === totalPaginas);
}

async function cargarClientes() {
    try {
        const response = await fetch('../backend/obtener-clientes.php');
        const clientes = await response.json();
        const select = document.getElementById('cliente');
        clientes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nombre;
            opt.textContent = c.nombre;
            select.appendChild(opt);
        });
    } catch (e) { console.error("Error clientes:", e); }
}

function limpiarFiltros() {
    document.getElementById("report-form").reset();
    document.querySelectorAll('.btn-filtro-rapido').forEach(btn => btn.classList.remove('active'));
    paginaActual = 1;
    cargarIncidencias();
}