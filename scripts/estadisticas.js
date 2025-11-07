/**
 * Archivo: ../scripts/estadisticas.js
 * Descripción: Maneja la lógica de filtros, carga de datos desde el backend, y renderizado de gráficos.
 */

// 🛑 RUTA CORREGIDA: Desde ../scripts/ necesitas subir un nivel (..) y entrar a backend/
const API_URL = '../backend/estadisticas.php'; 

let charts = {}; // Objeto para almacenar instancias de Chart.js
let initialLoadDone = false;

// ===================================================================
// 1. FUNCIONES AUXILIARES DE MANEJO DE PETICIONES
// ===================================================================

async function fetchData(action, filters) {
    const url = new URL(API_URL, window.location.origin);
    url.searchParams.set('action', action);
    
    // Añadir todos los filtros a los parámetros de la URL
    for (const key in filters) {
        if (filters[key] !== null) {
            url.searchParams.set(key, filters[key]);
        }
    }

    try {
        // 
        const response = await fetch(url.toString());
        
        // Manejo de error de red o de HTTP (ej. 404, 500)
        if (!response.ok) {
            const errorText = await response.text(); 
            // Esto captura el error 404 o cualquier otro error de HTTP
            throw new Error(`Error HTTP ${response.status}: El servidor respondió de forma inesperada. Detalles: ${errorText.substring(0, 50)}...`);
        }
        
        const jsonResponse = await response.json();

        // Manejo de error lógico (si PHP devuelve success: false)
        if (!jsonResponse.success) {
            throw new Error(`Error en la API: ${jsonResponse.error}`);
        }
        
        return jsonResponse.data;

    } catch (error) {
        console.error(`Error al cargar datos para ${action}:`, error);
        // Muestra el error al usuario
        alert(`Error al cargar datos de estadísticas: ${error.message}`);
        return null; 
    }
}

// ===================================================================
// 2. FUNCIÓN DE FILTROS Y CONTROLES
// ===================================================================

function getFilters() {
    const rango = document.getElementById('rango').value;
    const tecnico = document.getElementById('tecnico').value;
    const sucursal = document.getElementById('sucursal').value;
    const estatus = document.getElementById('estatus').value;
    
    let fechaInicio = null;
    let fechaFin = null;

    if (rango === 'custom') {
        fechaInicio = document.getElementById('fechaInicio').value;
        fechaFin = document.getElementById('fechaFin').value;
        if (!fechaInicio || !fechaFin) {
            alert("Debes seleccionar un rango de fechas personalizado.");
            return null; // Indica un error de filtro
        }
    }

    return { rango, tecnico, sucursal, estatus, fechaInicio, fechaFin };
}

/** Carga y rellena los selectores de Técnico y Sucursal. */
async function loadFilterOptions() {
    const data = await fetchData('get_filtros', {}); // Petición específica para filtros
    
    if (data) {
        const tecnicoSelect = document.getElementById('tecnico');
        const sucursalSelect = document.getElementById('sucursal');

        // Limpiar selectores antes de rellenar
        tecnicoSelect.innerHTML = '<option value="all">Todos los Técnicos</option>';
        sucursalSelect.innerHTML = '<option value="all">Todas las Sucursales</option>';

        // Rellenar Técnicos
        data.tecnicos.forEach(t => {
            const option = new Option(t.nombre, t.id);
            tecnicoSelect.add(option);
        });

        // Rellenar Sucursales
        data.sucursales.forEach(s => {
            const option = new Option(s.nombre, s.id);
            sucursalSelect.add(option);
        });
    }
}


// ===================================================================
// 3. FUNCIONES DE CARGA POR SECCIÓN
// ===================================================================

async function loadGeneralStatistics() {
    const filters = getFilters();
    if (!filters) return;
    
    const data = await fetchData('estadisticas_generales', filters);
    
    if (data) {
        // 1. Actualización de KPIs
        document.getElementById('totalIncidencias').textContent = data.total_incidencias || 'N/A';
        document.getElementById('totalClientes').textContent = data.total_clientes || 'N/A';
        document.getElementById('resueltasEsteMes').textContent = data.incidencias_resueltas_rango || 'N/A';
        document.getElementById('tiempoPromedio').textContent = data.tiempo_promedio || 'N/A';
        document.getElementById('lastUpdated').textContent = `Última actualización: ${new Date().toLocaleTimeString()}`;
        
        // 2. Actualizar gráficos
        drawChart('chartTopClientes', data.top_clientes, 'bar', 'Incidencias', 'Top Clientes');
        drawChart('chartMensual', data.evolucion_mensual, 'line', 'Incidencias', 'Evolución Mensual');
    }
}

async function loadIncidenceAnalysis() {
    const filters = getFilters();
    if (!filters) return;

    const data = await fetchData('estadisticas_incidencias', filters);
    
    if (data) {
        // 1. Actualización de KPIs
        document.getElementById('incidenciasAbiertas').textContent = data.incidencias_abiertas_kpi || 'N/A';
        document.getElementById('incidenciasAsignadas').textContent = data.incidencias_asignadas_kpi || 'N/A';
        document.getElementById('incidenciasCompletadas').textContent = data.incidencias_resueltas_rango || 'N/A';
        document.getElementById('incidenciasFacturadas').textContent = data.incidencias_facturadas_kpi || 'N/A';

        // 2. Actualizar gráficos de incidencias
        drawChart('chartPorEstatus', data.incidencias_por_estatus, 'doughnut', 'Cantidad', 'Incidencias por Estatus');
        drawChart('chartPorSucursal', data.incidencias_por_sucursal, 'bar', 'Cantidad', 'Incidencias por Sucursal');
        drawChart('chartTopFallas', data.top_fallas_recurrentes, 'horizontalBar', 'Cantidad', 'Top 5 Fallas Recurrentes'); 
        drawChart('chartPorPrioridad', data.incidencias_por_prioridad, 'pie', 'Cantidad', 'Distribución por Prioridad');
    }
}

async function loadTechnicianPerformance() {
    const filters = getFilters();
    if (!filters) return;
    
    const data = await fetchData('estadisticas_tecnicos', filters);
    
    if (data) {
        // 1. Actualización de KPIs
        document.getElementById('tecnicoEficiente').textContent = data.tecnico_mas_eficiente || 'N/A';
        document.getElementById('tecnicoRapido').textContent = data.tecnico_mas_rapido || 'N/A';
        document.getElementById('tecnicoMes').textContent = data.tecnico_del_mes || 'N/A';
        document.getElementById('totalTecnicos').textContent = data.total_tecnicos_activos || 'N/A';

        // 2. Actualizar gráficos de técnicos
        drawChart('chartRendimiento', data.rendimiento_tecnicos, 'bar', 'Resueltas', 'Rendimiento por Técnico');
        drawChart('chartTiempos', data.tiempos_respuesta, 'bar', 'Días', 'Tiempos Promedio por Técnico');
        drawChart('chartSatisfaccion', data.satisfaccion_cliente, 'doughnut', 'Puntuación', 'Satisfacción del Cliente');
    }
}

// ===================================================================
// 4. FUNCIÓN MAESTRA DE CARGA
// ===================================================================

/** Carga todas las estadísticas */
function loadAllStatistics() {
    // Si no es la carga inicial, ejecuta las cargas de datos
    if (initialLoadDone) {
        loadGeneralStatistics();
        loadIncidenceAnalysis();
        loadTechnicianPerformance();
    }
}

/** Configura los eventos de escucha para los filtros */
function setupFilterListeners() {
    const filterElements = ['rango', 'tecnico', 'sucursal', 'estatus'];
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', loadAllStatistics);
        }
    });

    // Listener para el rango de fechas personalizado
    const customRangeDiv = document.getElementById('custom-date-range');
    const rangoSelect = document.getElementById('rango');
    
    if (rangoSelect) {
        rangoSelect.addEventListener('change', () => {
            if (rangoSelect.value === 'custom') {
                customRangeDiv.style.display = 'flex';
            } else {
                customRangeDiv.style.display = 'none';
            }
        });
        // Configuración inicial de visibilidad del rango personalizado
        if (rangoSelect.value === 'custom') {
            customRangeDiv.style.display = 'flex';
        } else {
            customRangeDiv.style.display = 'none';
        }
    }
    
    // Listener para los campos de fecha (para que cargue al cambiar la fecha)
    document.getElementById('fechaInicio')?.addEventListener('change', () => {
        if (document.getElementById('rango').value === 'custom') loadAllStatistics();
    });
    document.getElementById('fechaFin')?.addEventListener('change', () => {
        if (document.getElementById('rango').value === 'custom') loadAllStatistics();
    });
}

// ===================================================================
// 5. MANEJO DE GRÁFICOS (Chart.js)
// ===================================================================

/**
 * Función genérica para dibujar y actualizar gráficos.
 */
function drawChart(chartId, dataArray, type, yLabel, title) {
    const ctx = document.getElementById(chartId);
    if (!ctx || !dataArray || dataArray.length === 0) {
        // Opcional: Mostrar un mensaje de "Sin datos" en el contenedor
        if (charts[chartId]) charts[chartId].destroy();
        return;
    }

    // Destruir la instancia anterior si existe
    if (charts[chartId]) {
        charts[chartId].destroy();
    }
    
    // Preparar datos
    const labels = dataArray.map(item => item.label || item.cliente || item.tecnico || 'N/A');
    const values = dataArray.map(item => item.value || item.cantidad || item.resueltas || item.tiempo || 0);

    const isBar = (type === 'bar' || type === 'horizontalBar');
    // Definición de colores
    const primaryColor = '#4361ee'; 
    const secondaryColors = ['#4895ef', '#4cc9f0', '#b5179e', '#f72585', '#7209b7', '#3f37c9', '#4d908e'];

    const backgroundColors = isBar 
        ? [primaryColor, ...secondaryColors] 
        : secondaryColors; 

    const chartConfig = {
        type: type === 'horizontalBar' ? 'bar' : type,
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: values,
                backgroundColor: isBar ? backgroundColors : backgroundColors.slice(0, values.length),
                borderColor: isBar ? primaryColor : 'white',
                borderWidth: isBar ? 1 : 2,
                tension: type === 'line' ? 0.4 : undefined,
                fill: type === 'line' ? true : false,
                borderColor: type === 'line' ? primaryColor : undefined,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: type === 'horizontalBar' ? 'y' : 'x', 
            plugins: {
                legend: {
                    display: type !== 'bar' && type !== 'horizontalBar' && type !== 'line',
                    position: 'bottom',
                },
                title: {
                    display: false, 
                }
            },
            scales: isBar || type === 'line' ? {
                y: {
                    beginAtZero: true,
                    title: {
                        display: isBar,
                        text: yLabel
                    }
                }
            } : {}
        }
    };
    
    charts[chartId] = new Chart(ctx, chartConfig);
}

// ===================================================================
// 6. INICIALIZACIÓN
// ===================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Configurar listeners de filtros (para que reaccionen a los cambios)
    setupFilterListeners();
    
    // 2. Cargar opciones de filtros (Técnicos, Sucursales)
    await loadFilterOptions();

    // 3. Marcar la carga inicial como completada para activar los listeners
    initialLoadDone = true;
    
    // 4. Cargar datos iniciales (la primera carga)
    loadAllStatistics();
});

// ===================================================================
// 7. FUNCIONES DE EXPORTACIÓN (Placeholder)
// ===================================================================

function downloadChart(chartId) {
    const chart = charts[chartId];
    if (chart) {
        const a = document.createElement('a');
        a.href = chart.toBase64Image();
        a.download = `${chartId}_${new Date().toISOString()}.png`;
        a.click();
    } else {
        alert("Gráfico no encontrado para descargar.");
    }
}

function exportarPDF() {
    alert('Función de exportar a PDF no implementada. Requiere librerías como jsPDF o FPDF.');
}

function exportarExcel() {
    alert('Función de exportar a Excel no implementada. Requiere manipular datos en el DOM o usar librerías como SheetJS.');
}

function toggleExportOptions() {
    const exportOptions = document.getElementById('exportOptions');
    // Asume que exportOptions es un div con display: flex o none en tu CSS
    exportOptions.style.display = exportOptions.style.display === 'flex' ? 'none' : 'flex';
}