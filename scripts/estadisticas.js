/**
 * estadísticas.js
 * Script para manejar los filtros, peticiones AJAX y renderizado de gráficos y KPIs
 * en el panel de estadísticas.
 */

// URL base de la API PHP
const API_URL = '../backend/estadisticas.php';

// --- 1. FUNCIÓN PRINCIPAL DE CARGA Y FILTRADO ---

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar listeners para los filtros
    setupFilterListeners();
    // Cargar los datos iniciales
    loadAllStatistics();
});

/**
 * Configura los event listeners para todos los elementos de filtro.
 */
function setupFilterListeners() {
    const filters = document.querySelectorAll(
        '#rango, #tecnico, #sucursal, #estatus, #fechaInicio, #fechaFin'
    );
    filters.forEach(filter => {
        filter.addEventListener('change', () => {
            handleDateRangeChange(); // Maneja la visibilidad de las fechas personalizadas
            loadAllStatistics();
        });
    });
}

/**
 * Maneja el cambio del selector de rango de fecha para mostrar u ocultar
 * los campos de fecha de inicio y fin.
 */
function handleDateRangeChange() {
    const rango = document.getElementById('rango').value;
    const customDateContainer = document.getElementById('custom-date-range');
    
    if (customDateContainer) {
        if (rango === 'custom') {
            customDateContainer.style.display = 'flex';
        } else {
            customDateContainer.style.display = 'none';
        }
    }
}

/**
 * Recolecta todos los valores de los filtros actuales en un objeto.
 * @returns {URLSearchParams} Parámetros de consulta listos para ser usados en la URL.
 */
function getFilterParams() {
    const params = new URLSearchParams();
    
    // Obtener valores de los filtros principales
    const rango = document.getElementById('rango')?.value || '30';
    params.set('rango', rango);
    params.set('tecnico', document.getElementById('tecnico')?.value || 'all');
    params.set('sucursal', document.getElementById('sucursal')?.value || 'all');
    params.set('estatus', document.getElementById('estatus')?.value || 'all');
    
    // Si el rango es 'custom', añadir las fechas específicas
    if (rango === 'custom') {
        params.set('fechaInicio', document.getElementById('fechaInicio')?.value || '');
        params.set('fechaFin', document.getElementById('fechaFin')?.value || '');
    }
    
    return params;
}


/**
 * Carga todos los datos de las estadísticas desde la API.
 */
function loadAllStatistics() {
    // Usamos Promesas para cargar todos los datos en paralelo
    const params = getFilterParams().toString();

    // 1. Cargar KPIs y Top Clientes (Resumen General)
    const p1 = fetch(`${API_URL}?action=estadisticas_generales&${params}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                updateGeneralKPIs(data.data);
                renderTopClientsChart(data.data.top_clientes);
            } else {
                console.error("Error en estadísticas generales:", data.error);
            }
        });

    // 2. Cargar Gráficos de Incidencias (Gráficos)
    const p2 = fetch(`${API_URL}?action=estadisticas_incidencias&${params}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderIncidenciaCharts(data.data);
            } else {
                console.error("Error en estadísticas de incidencias:", data.error);
            }
        });
        
    // 3. Cargar KPIs y Gráficos de Técnicos (Pestaña Técnicos)
    const p3 = fetch(`${API_URL}?action=estadisticas_tecnicos&${params}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                updateTechnicianKPIs(data.data);
                renderTechnicianCharts(data.data.graficos);
            } else {
                console.error("Error en estadísticas de técnicos:", data.error);
            }
        });
        
    // Opcional: Mostrar un spinner mientras cargan todas las promesas
    // Promise.all([p1, p2, p3]).then(() => { /* Ocultar spinner */ });
}


// --- 2. ACTUALIZACIÓN DE KPIS (Cifras Grandes) ---

/**
 * Actualiza los valores de los indicadores clave generales.
 * @param {object} data - Datos recibidos de la API.
 */
function updateGeneralKPIs(data) {
    document.getElementById('totalIncidencias').textContent = data.total_incidencias || 0;
    document.getElementById('totalClientes').textContent = data.total_clientes || 0;
    document.getElementById('resueltasEsteMes').textContent = data.incidencias_resueltas_rango || 0; // Usado para "Completadas" o "Resueltas" en el rango
    document.getElementById('tiempoPromedio').textContent = data.tiempo_promedio || 'N/A';
    
    // Fila inferior
    document.getElementById('incidenciasAbiertas').textContent = data.incidencias_pendientes || 0;
    document.getElementById('incidenciasAsignadas').textContent = data.incidencias_asignadas || 0;
    document.getElementById('incidenciasCompletadas').textContent = data.incidencias_resueltas_rango || 0;
    document.getElementById('cerradasFactura').textContent = data.incidencias_facturadas || 0;
}

/**
 * Actualiza los valores de los indicadores clave de técnicos.
 * @param {object} data - Datos recibidos de la API.
 */
function updateTechnicianKPIs(data) {
    // El id del técnico más eficiente (mayor tasa de resolución)
    document.getElementById('tecnicoEficiente').textContent = data.tecnico_eficiente || 'N/A'; 
    // El id del técnico más rápido (menor tiempo promedio)
    document.getElementById('tecnicoRapido').textContent = data.tecnico_rapido || 'N/A'; 
    // El id del técnico del mes (puede ser el eficiente)
    document.getElementById('tecnicoMes').textContent = data.tecnico_mes || 'N/A'; 
    // El total de técnicos
    document.getElementById('totalTecnicos').textContent = data.total_tecnicos || 0;
}


// --- 3. FUNCIONES DE RENDERIZADO DE GRÁFICOS (CHART.JS) ---

// Inicializamos las variables de los gráficos fuera de la función para poder destruirlos y recrearlos
let chartPorEstatus;
let chartPorSucursal;
let chartTopClientes;
let chartRendimientoTecnicos;
let chartTiemposTecnicos;
let chartSatisfaccion;


/**
 * Dibuja un gráfico de barras/doughnut genérico.
 * @param {string} canvasId - ID del elemento <canvas>.
 * @param {string} type - Tipo de gráfico ('bar', 'doughnut', etc.).
 * @param {Array} labels - Etiquetas del eje X o secciones.
 * @param {Array} data - Valores de los datos.
 * @param {string} label - Etiqueta del conjunto de datos.
 * @param {object} existingChart - Referencia al objeto Chart existente para destruirlo.
 */
function renderChart(canvasId, type, labels, data, label, existingChart) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    // Si el gráfico existe, destrúyelo para evitar superposiciones
    if (existingChart) {
        existingChart.destroy();
    }
    
    const isDoughnut = type === 'doughnut';
    const isHorizontalBar = type === 'horizontalBar';

    const chartConfig = {
        type: isHorizontalBar ? 'bar' : type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: isDoughnut ? [
                    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
                    '#858796', '#f8f9fc', '#3b5998', '#55acee', '#ff6384'
                ] : '#4e73df',
                hoverBackgroundColor: isDoughnut ? [
                    '#2e59d9', '#17a673', '#2c9faf', '#dda200', '#be2617',
                    '#6e707e', '#d1d3e2', '#2d4373', '#3c93d5', '#cc416d'
                ] : '#2e59d9',
                borderColor: '#fff',
                borderWidth: 1,
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            layout: { padding: { left: 10, right: 25, top: 25, bottom: 0 } },
            tooltips: {
                backgroundColor: "rgb(255,255,255)",
                bodyFontColor: "#858796",
                borderColor: '#dddfeb',
                borderWidth: 1,
                cornerRadius: 3,
                displayColors: false,
            },
            legend: { display: isDoughnut },
            scales: {
                xAxes: [{
                    stacked: false,
                    display: !isDoughnut,
                    gridLines: { display: false, drawBorder: false },
                    ticks: { beginAtZero: true },
                    // Si es barra horizontal, invertir el eje X y Y (para Chart.js 2.x)
                    // Para Chart.js 3+, se usa el indexAxis: 'y' en la config principal
                }],
                yAxes: [{
                    stacked: false,
                    display: !isDoughnut,
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2], zeroLineBorderDash: [2] },
                    ticks: { beginAtZero: true },
                }],
            },
            indexAxis: isHorizontalBar ? 'y' : 'x', // Para Charts.js 3+
        }
    };
    
    // Crea el nuevo gráfico y retorna la referencia
    return new Chart(ctx, chartConfig);
}

/**
 * Renderiza todos los gráficos de la pestaña Incidencias.
 */
function renderIncidenciaCharts(data) {
    // Incidencias por Estatus (Doughnut)
    const estatusLabels = data.por_estatus.map(item => item.estatus);
    const estatusData = data.por_estatus.map(item => item.cantidad);
    chartPorEstatus = renderChart('chartPorEstatus', 'doughnut', estatusLabels, estatusData, 'Incidencias por Estatus', chartPorEstatus);

    // Incidencias por Sucursal (Barra)
    const sucursalLabels = data.por_sucursal.map(item => item.sucursal);
    const sucursalData = data.por_sucursal.map(item => item.cantidad);
    chartPorSucursal = renderChart('chartPorSucursal', 'bar', sucursalLabels, sucursalData, 'Incidencias por Sucursal', chartPorSucursal);
    
    // Top 5 Falla/Causa Raíz (Barra Horizontal)
    const fallaLabels = data.top_fallas.map(item => item.falla);
    const fallaData = data.top_fallas.map(item => item.cantidad);
    chartTopFallas = renderChart('chartTopFallas', 'horizontalBar', fallaLabels, fallaData, 'Incidencias por Falla', chartTopFallas);
    
    // Distribución por Prioridad (Pie)
    const prioridadLabels = data.por_prioridad.map(item => item.prioridad);
    const prioridadData = data.por_prioridad.map(item => item.cantidad);
    chartPorPrioridad = renderChart('chartPorPrioridad', 'doughnut', prioridadLabels, prioridadData, 'Incidencias por Prioridad', chartPorPrioridad);
    
    // Histórico Mensual (Línea)
    const mensualLabels = data.mensuales.map(item => item.mes);
    const mensualData = data.mensuales.map(item => item.cantidad);
    chartMensual = renderChart('chartMensual', 'line', mensualLabels, mensualData, 'Incidencias Creadas', chartMensual);
}

/**
 * Renderiza el gráfico Top 10 Clientes (Pestaña Resumen General).
 */
function renderTopClientsChart(top_clientes) {
    const labels = top_clientes.map(item => item.cliente);
    const data = top_clientes.map(item => item.cantidad);
    
    // Usamos 'horizontalBar' para mejor lectura de nombres largos
    chartTopClientes = renderChart('chartTopClientes', 'horizontalBar', labels, data, 'Incidencias por Cliente', chartTopClientes);
}

/**
 * Renderiza los gráficos de la pestaña Técnicos.
 */
function renderTechnicianCharts(graficos) {
    // Rendimiento de Técnicos (Resueltas)
    chartRendimientoTecnicos = renderChart(
        'chartRendimientoTecnicos', 
        'bar', 
        graficos.rendimiento.labels, 
        graficos.rendimiento.datos, 
        'Incidencias Resueltas', 
        chartRendimientoTecnicos
    );
    
    // Tiempos Promedio por Técnico (Barras, mostrando días)
    chartTiemposTecnicos = renderChart(
        'chartTiemposTecnicos', 
        'bar', 
        graficos.tiempos.labels, 
        graficos.tiempos.datos, 
        'Tiempo Promedio (Días)', 
        chartTiemposTecnicos
    );
    
    // Satisfacción del Cliente (Doughnut)
    chartSatisfaccion = renderChart(
        'chartSatisfaccion', 
        'doughnut', 
        graficos.satisfaccion.labels, 
        graficos.satisfaccion.datos, 
        'Nivel de Satisfacción', 
        chartSatisfaccion
    );
}