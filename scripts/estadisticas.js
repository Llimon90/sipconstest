// Variables globales
let charts = {};
let currentTab = 'overview'; // Inicia en el tab de Resumen General

// --- FUNCIÓN DE UTILIDAD: Obtener Parámetros de Filtro ---
function obtenerParametrosFiltro() {
    const rangoFecha = document.getElementById('rangoFecha')?.value || '30';
    const tecnico = document.getElementById('tecnico')?.value || '';
    const sucursal = document.getElementById('sucursal')?.value || '';
    const estatus = document.getElementById('estatus')?.value || '';
    
    let parametros = `&rango=${rangoFecha}&tecnico=${tecnico}&sucursal=${sucursal}&estatus=${estatus}`;

    if (rangoFecha === 'custom') {
        const fechaInicio = document.getElementById('fechaInicio')?.value || '';
        const fechaFin = document.getElementById('fechaFin')?.value || '';
        parametros += `&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }
    
    return parametros;
}

// --- FUNCIÓN DE UTILIDAD: Actualizar Elementos y Loading ---
function actualizarElementoSiExiste(id, valor, fallback = 'N/A') {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = valor === null || valor === undefined ? fallback : valor;
    } 
}

function mostrarLoading(mostrar) {
    const elementos = document.querySelectorAll('.stat-value, .chart-container');
    elementos.forEach(elemento => {
        // Opacidad simple para indicar carga
        elemento.style.opacity = mostrar ? '0.5' : '1';
    });
}

function mostrarError(mensaje) {
    console.error(mensaje);
    // Podrías añadir lógica para mostrar un mensaje visible al usuario aquí
}

// --- LÓGICA DE CARGA DE DATOS ---

async function cargarEstadisticas() {
    mostrarLoading(true);
    const filtros = obtenerParametrosFiltro();
    
    // Llamadas asíncronas para las 3 secciones (aunque solo la activa se mostrará, precargamos)
    const promises = [
        fetch(`../backend/estadisticas.php?action=estadisticas_generales${filtros}`).then(r => r.json()),
        fetch(`../backend/estadisticas.php?action=estadisticas_incidencias${filtros}`).then(r => r.json()),
        fetch(`../backend/estadisticas.php?action=estadisticas_tecnicos${filtros}`).then(r => r.json())
    ];

    try {
        const [dataGeneral, dataIncidencias, dataTecnicos] = await Promise.all(promises);

        // GENERAL & OVERVIEW
        if (dataGeneral.success) {
            actualizarEstadisticasGenerales(dataGeneral.data);
            crearGraficoTopClientes(dataGeneral.data.top_clientes);
        } else {
            mostrarError(dataGeneral.error || 'Error en datos generales');
        }

        // INCIDENCIAS TAB
        if (dataIncidencias.success) {
            crearGraficosIncidencias(dataIncidencias.data);
        } else {
            mostrarError(dataIncidencias.error || 'Error en datos de incidencias');
        }

        // TECNICOS TAB
        if (dataTecnicos.success) {
            actualizarEstadisticasTecnicos(dataTecnicos.data);
        } else {
            mostrarError(dataTecnicos.error || 'Error en datos de técnicos');
        }

    } catch (error) {
        mostrarError('Error general en la carga de estadísticas: ' + error.message);
    } finally {
        mostrarLoading(false);
        // Asegurar que el tab correcto se muestre después de cargar
        cambiarPestana(currentTab); 
    }
}

// --- ACTUALIZACIÓN DE ESTADÍSTICAS ---

function actualizarEstadisticasGenerales(data) {
    
    // Pestaña OVERVIEW
    actualizarElementoSiExiste('totalIncidencias', data.total_incidencias.toLocaleString());
    actualizarElementoSiExiste('totalClientes', data.total_clientes.toLocaleString());
    // ID corregido: resueltasMes (de tu HTML)
    actualizarElementoSiExiste('resueltasMes', data.incidencias_resueltas_rango.toLocaleString()); 
    actualizarElementoSiExiste('tiempoPromedio', data.tiempo_promedio);

    // Cálculo y actualización de Eficiencia Mensual
    const totalCreadas = data.total_incidencias || 1;
    const resueltasRango = data.incidencias_resueltas_rango || 0;
    const eficiencia = totalCreadas > 0 ? Math.round((resueltasRango / totalCreadas) * 100) : 0;
    actualizarElementoSiExiste('eficienciaMensual', `${eficiencia}% de eficiencia`);
    
    // Pestaña ANÁLISIS DE INCIDENCIAS
    actualizarElementoSiExiste('incidenciasAbiertas', data.incidencias_pendientes.toLocaleString());
    actualizarElementoSiExiste('incidenciasAsignadas', data.incidencias_asignadas.toLocaleString());
    actualizarElementoSiExiste('incidenciasCompletadas', data.incidencias_resueltas_rango.toLocaleString());
    actualizarElementoSiExiste('incidenciasFacturadas', data.incidencias_facturadas.toLocaleString());
    
    // Última actualización
    actualizarElementoSiExiste('lastUpdated', `Actualizado: ${new Date().toLocaleTimeString()}`);
}

function actualizarEstadisticasTecnicos(data) {
    const { tecnico_eficiente, tecnico_rapido, tecnico_mes, total_tecnicos, graficos } = data;

    actualizarElementoSiExiste('tecnicoEficiente', tecnico_eficiente);
    actualizarElementoSiExiste('tecnicoRapido', tecnico_rapido);
    actualizarElementoSiExiste('tecnicoMes', tecnico_mes);
    actualizarElementoSiExiste('totalTecnicos', total_tecnicos.toLocaleString());

    crearGraficosTecnicos(graficos);
}


// --- LÓGICA DE GRÁFICOS (DEBES AGREGAR ESTAS FUNCIONES COMPLETAS) ---

// Función para inicializar y destruir charts existentes
function destroyChart(id) {
    if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
    }
}

// --- Gráficos de OVERVIEW y Análisis de Incidencias ---
function crearGraficosIncidencias(data) {
    
    // Destruye los gráficos que se comparten entre tabs o que se van a recrear
    destroyChart('chartEstatus');
    destroyChart('chartTecnico');
    destroyChart('chartSucursal');
    destroyChart('chartMensual');
    destroyChart('chartFallas');
    destroyChart('chartPrioridad');

    // 1. Incidencias por Estatus (chartEstatus)
    // ... (Crear gráfico de Estatus, puede ser Pie o Donut) ...
    // Ejemplo de Estatus:
    const ctxEstatus = document.getElementById('chartEstatus');
    if (ctxEstatus && data.por_estatus && data.por_estatus.length > 0) {
        charts.chartEstatus = new Chart(ctxEstatus, {
            type: 'pie',
            data: {
                labels: data.por_estatus.map(item => item.estatus),
                datasets: [{
                    data: data.por_estatus.map(item => item.cantidad),
                    backgroundColor: ['#4361ee', '#4cc9f0', '#f72585', '#3f37c9', '#4895ef']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
    }

    // 2. Incidencias por Técnico (chartTecnico) - Bar
    const ctxTecnico = document.getElementById('chartTecnico');
    if (ctxTecnico && data.por_tecnico && data.por_tecnico.length > 0) {
        charts.chartTecnico = new Chart(ctxTecnico, {
            type: 'bar',
            data: {
                labels: data.por_tecnico.map(item => item.tecnico),
                datasets: [{
                    label: 'Incidencias Asignadas/Creadas',
                    data: data.por_tecnico.map(item => item.cantidad),
                    backgroundColor: '#4361ee'
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }
    
    // 3. Incidencias por Sucursal (chartSucursal) - Bar/Doughnut
    const ctxSucursal = document.getElementById('chartSucursal');
    if (ctxSucursal && data.por_sucursal && data.por_sucursal.length > 0) {
        charts.chartSucursal = new Chart(ctxSucursal, {
            type: 'bar',
            data: {
                labels: data.por_sucursal.map(item => item.sucursal),
                datasets: [{
                    label: 'Incidencias por Sucursal',
                    data: data.por_sucursal.map(item => item.cantidad),
                    backgroundColor: '#4cc9f0'
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    // 4. Evolución Mensual (chartMensual) - Line
    const ctxMensual = document.getElementById('chartMensual');
    if (ctxMensual && data.mensuales && data.mensuales.length > 0) {
        charts.chartMensual = new Chart(ctxMensual, {
            type: 'line',
            data: {
                labels: data.mensuales.map(item => item.mes),
                datasets: [{
                    label: 'Total Incidencias Creadas',
                    data: data.mensuales.map(item => item.cantidad),
                    borderColor: '#f72585',
                    fill: false,
                    tension: 0.1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }
    
    // 5. Tipos de Falla Más Comunes (chartFallas) - Bar
    const ctxFallas = document.getElementById('chartFallas');
    if (ctxFallas && data.top_fallas && data.top_fallas.length > 0) {
        charts.chartFallas = new Chart(ctxFallas, {
            type: 'bar',
            data: {
                labels: data.top_fallas.map(item => item.falla),
                datasets: [{
                    label: 'Fallas Recurrentes',
                    data: data.top_fallas.map(item => item.cantidad),
                    backgroundColor: '#3f37c9'
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    // 6. Distribución por Prioridad (chartPrioridad) - Doughnut
    const ctxPrioridad = document.getElementById('chartPrioridad');
    if (ctxPrioridad && data.por_prioridad && data.por_prioridad.length > 0) {
        charts.chartPrioridad = new Chart(ctxPrioridad, {
            type: 'doughnut',
            data: {
                labels: data.por_prioridad.map(item => item.prioridad),
                datasets: [{
                    data: data.por_prioridad.map(item => item.cantidad),
                    backgroundColor: ['#f72585', '#4361ee', '#4cc9f0', '#3f37c9']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
    }
}

// --- Gráfico Top Clientes (Bar Horizontal) ---
function crearGraficoTopClientes(dataClientes) {
    destroyChart('chartClientes'); // Usamos 'chartClientes' para el Top Clientes

    if (dataClientes && dataClientes.length > 0) {
        const ctxClientes = document.getElementById('chartClientes');
        if (ctxClientes) {
            charts.chartClientes = new Chart(ctxClientes, {
                type: 'bar',
                data: {
                    labels: dataClientes.map(item => item.cliente || 'Sin cliente'),
                    datasets: [{
                        label: 'Número de Incidencias',
                        data: dataClientes.map(item => item.cantidad),
                        backgroundColor: '#4895ef'
                    }]
                },
                options: {
                    responsive: true,
                    indexAxis: 'y', // Hace el gráfico horizontal
                    scales: { x: { beginAtZero: true } }
                }
            });
        }
    }
}

// --- Gráficos de Rendimiento de Técnicos ---
function crearGraficosTecnicos(graficosData) {
    destroyChart('chartRendimiento');
    destroyChart('chartTiempos');
    destroyChart('chartSatisfaccion');

    // 1. Rendimiento de Técnicos (Resueltas) - Bar
    const ctxRendimiento = document.getElementById('chartRendimiento');
    if (ctxRendimiento && graficosData.rendimiento.datos.length > 0) {
        charts.chartRendimiento = new Chart(ctxRendimiento, {
            type: 'bar',
            data: {
                labels: graficosData.rendimiento.labels,
                datasets: [{
                    label: 'Incidencias Resueltas',
                    data: graficosData.rendimiento.datos,
                    backgroundColor: '#4361ee'
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    // 2. Tiempos de Respuesta - Bar Horizontal
    const ctxTiempos = document.getElementById('chartTiempos');
    if (ctxTiempos && graficosData.tiempos.datos.length > 0) {
        charts.chartTiempos = new Chart(ctxTiempos, {
            type: 'bar',
            data: {
                labels: graficosData.tiempos.labels,
                datasets: [{
                    label: 'Tiempo Promedio (Días)',
                    data: graficosData.tiempos.datos,
                    backgroundColor: '#f72585'
                }]
            },
            options: { 
                responsive: true, 
                indexAxis: 'y', // Hace el gráfico horizontal
                scales: { x: { beginAtZero: true } } 
            }
        });
    }

    // 3. Satisfacción del Cliente - Doughnut
    const ctxSatisfaccion = document.getElementById('chartSatisfaccion');
    if (ctxSatisfaccion && graficosData.satisfaccion.datos.length > 0) {
        charts.chartSatisfaccion = new Chart(ctxSatisfaccion, {
            type: 'doughnut',
            data: {
                labels: graficosData.satisfaccion.labels,
                datasets: [{
                    data: graficosData.satisfaccion.datos,
                    backgroundColor: ['#28a745', '#4cc9f0', '#ffc107', '#dc3545']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
    }
}


// --- LÓGICA DE INTERFAZ (Tabs y Filtros) ---

function cambiarPestana(tabId) {
    // 1. Ocultar todos los contenidos de las pestañas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // 2. Desactivar todos los botones de pestaña
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // 3. Activar la pestaña y el contenido correspondientes
    const activeContent = document.getElementById(`${tabId}-tab`);
    const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);

    if (activeContent) activeContent.classList.add('active');
    if (activeTab) activeTab.classList.add('active');
    
    currentTab = tabId;
}

// Manejador de clic en pestañas
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        cambiarPestana(tabId);
    });
});


// Manejador para el Rango de Fechas Personalizado
document.getElementById('rangoFecha')?.addEventListener('change', function() {
    const customDisplay = this.value === 'custom' ? 'flex' : 'none';
    const customDateRange = document.getElementById('customDateRange');
    const customDateRangeEnd = document.getElementById('customDateRangeEnd');
    
    if (customDateRange) customDateRange.style.display = customDisplay;
    if (customDateRangeEnd) customDateRangeEnd.style.display = customDisplay;

    // Cargar estadísticas si el filtro no es personalizado (para actualizar al cambiar)
    if (this.value !== 'custom') {
        cargarEstadisticas();
    }
});

// Función para aplicar filtros (Llamada desde el botón "Actualizar")
function aplicarFiltros() {
    // Si la pestaña actual es 'tecnicos', recarga solo los datos de técnicos para mayor eficiencia,
    // de lo contrario, carga todos los datos generales.
    if (currentTab === 'tecnicos') {
        cargarDatosTecnicos(); // Se podría crear una función auxiliar si fuera necesario.
    } else {
        cargarEstadisticas();
    }
}

// Lógica de exportación (Placeholders, necesitas implementar estas funciones)
function exportarDatos() {
    const exportOptions = document.getElementById('exportOptions');
    exportOptions.style.display = exportOptions.style.display === 'flex' ? 'none' : 'flex';
}
function exportarPDF() { alert('Exportando a PDF...'); }
function exportarExcel() { alert('Exportando a Excel...'); }
function exportarImagen(chartId) { 
    if (charts[chartId]) {
        const a = document.createElement('a');
        a.href = charts[chartId].toBase64Image();
        a.download = `${chartId}_${new Date().toISOString().slice(0,10)}.png`;
        a.click();
    } else {
         // Lógica para descargar el dashboard completo (más complejo)
         alert('Descargando imagen del dashboard...');
    }
}

// Función para cambiar tipo de gráfico (Placeholder)
function toggleChartType(chartId) {
    alert(`Cambiando tipo de gráfico para ${chartId}`);
    // Implementación real: obtener el tipo actual y cambiar entre 'bar', 'line', 'pie', etc.
}

// Función para descargar un gráfico específico
function downloadChart(chartId) {
    if (charts[chartId]) {
        const a = document.createElement('a');
        a.href = charts[chartId].toBase64Image();
        a.download = `${chartId}.png`;
        a.click();
    }
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Carga los datos al iniciar
    cargarEstadisticas();
});

// Exponer funciones al scope global para que el HTML pueda llamarlas
window.cargarEstadisticas = cargarEstadisticas;
window.aplicarFiltros = cargarEstadisticas; // El botón de tu HTML llama a cargarEstadisticas() directamente
window.exportarDatos = exportarDatos;
window.exportarPDF = exportarPDF;
window.exportarExcel = exportarExcel;
window.exportarImagen = exportarImagen;
window.toggleChartType = toggleChartType;
window.downloadChart = downloadChart;