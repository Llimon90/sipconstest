// Variables globales para los charts
let charts = {};
let currentTab = 'overview';

// --- FUNCIONES DE UTILIDAD PARA FILTROS Y ELEMENTOS ---

/**
 * Recopila los valores de los filtros de la interfaz.
 * @returns {string} Una cadena de consulta para la URL (ej: '&rango=custom&inicio=2023-01-01...')
 */
function obtenerParametrosFiltro() {
    const rangoFecha = document.getElementById('rangoFecha')?.value || '';
    const tecnico = document.getElementById('tecnico')?.value || '';
    const sucursal = document.getElementById('sucursal')?.value || '';
    const estatus = document.getElementById('estatus')?.value || '';
    
    let parametros = `&rango=${rangoFecha}&tecnico=${tecnico}&sucursal=${sucursal}&estatus=${estatus}`;

    // Incluir fechas personalizadas si el rango es 'custom'
    if (rangoFecha === 'custom') {
        const fechaInicio = document.getElementById('fechaInicio')?.value || '';
        const fechaFin = document.getElementById('fechaFin')?.value || '';
        parametros += `&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }
    
    return parametros;
}

function actualizarElementoSiExiste(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = valor;
    } else {
        console.warn(`Elemento con ID '${id}' no encontrado`);
    }
}

function mostrarLoading(mostrar) {
    const elementos = document.querySelectorAll('.stat-value, .chart-container');
    elementos.forEach(elemento => {
        if (mostrar) {
            elemento.style.opacity = '0.5';
        } else {
            elemento.style.opacity = '1';
        }
    });
}

function mostrarError(mensaje) {
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        errorDiv.style.cssText = `
            background: #dc3545;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
        `;
        const mainContent = document.getElementById('mainContent');
        const filters = document.querySelector('.filters');
        if (mainContent && filters) {
            mainContent.insertBefore(errorDiv, filters);
        }
    }
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${mensaje}`;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}


// --- INICIALIZACIÓN Y CAMBIO DE PESTAÑAS (SIN CAMBIOS RELEVANTES) ---

document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando carga de estadísticas...');
    inicializarInterfaz();
    cambiarPestaña(currentTab); 
});

function inicializarInterfaz() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            cambiarPestaña(tabId);
        });
    });

    const rangoFecha = document.getElementById('rangoFecha');
    if (rangoFecha) {
        rangoFecha.addEventListener('change', function() {
            const customDateRange = document.getElementById('customDateRange');
            const customDateRangeEnd = document.getElementById('customDateRangeEnd');
            
            if (this.value === 'custom') {
                if (customDateRange) customDateRange.style.display = 'flex';
                if (customDateRangeEnd) customDateRangeEnd.style.display = 'flex';
            } else {
                if (customDateRange) customDateRange.style.display = 'none';
                if (customDateRangeEnd) customDateRangeEnd.style.display = 'none';
            }
        });
    }

    const exportBtn = document.querySelector('.btn-outline');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const exportOptions = document.getElementById('exportOptions');
            if (exportOptions) {
                exportOptions.style.display = exportOptions.style.display === 'none' ? 'flex' : 'none';
            }
        });
    }

    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    
    if (fechaInicio) fechaInicio.value = hace30Dias.toISOString().split('T')[0];
    if (fechaFin) fechaFin.value = hoy.toISOString().split('T')[0];
}

function cambiarPestaña(tabId) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const tabElement = document.querySelector(`[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(`${tabId}-tab`);
    
    if (tabElement) tabElement.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
    
    if (currentTab !== tabId || tabId === 'overview') {
        currentTab = tabId;
        
        if (tabId === 'overview') {
            cargarEstadisticas();
        } else if (tabId === 'tecnicos') {
            cargarDatosTecnicos();
        }
    }
}


// --- CARGA DE DATOS DESDE EL BACKEND (MISMAS FUNCIONES, MEJOR LOGGING) ---

async function cargarEstadisticas() {
    const filtros = obtenerParametrosFiltro();

    try {
        mostrarLoading(true);
        
        const urlGeneral = `../backend/estadisticas.php?action=estadisticas_generales${filtros}`;
        const responseGeneral = await fetch(urlGeneral);
        if (!responseGeneral.ok) throw new Error('Error en la respuesta del servidor (General): ' + responseGeneral.status);
        const dataGeneral = await responseGeneral.json();
        
        if (dataGeneral.success) {
            actualizarEstadisticasGenerales(dataGeneral.data);
        } else {
            throw new Error(dataGeneral.error || 'Error en los datos generales');
        }
        
        const urlIncidencias = `../backend/estadisticas.php?action=estadisticas_incidencias${filtros}`;
        const responseIncidencias = await fetch(urlIncidencias);
        if (!responseIncidencias.ok) throw new Error('Error en la respuesta del servidor (Incidencias): ' + responseIncidencias.status);
        const dataIncidencias = await responseIncidencias.json();
        
        if (dataIncidencias.success) {
            crearGraficos(dataIncidencias.data);
        } else {
            throw new Error(dataIncidencias.error || 'Error en los datos de incidencias');
        }
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        mostrarError('Error al cargar las estadísticas: ' + error.message);
    } finally {
        mostrarLoading(false);
    }
}

async function cargarDatosTecnicos() {
    const filtros = obtenerParametrosFiltro();
    
    try {
        mostrarLoading(true);
        
        const urlTecnicos = `../backend/estadisticas.php?action=estadisticas_tecnicos${filtros}`;
        const responseTecnicos = await fetch(urlTecnicos);
        
        if (!responseTecnicos.ok) throw new Error('Error en la respuesta del servidor (Técnicos): ' + responseTecnicos.status);
        const dataTecnicos = await responseTecnicos.json();
        
        if (dataTecnicos.success) {
            const data = dataTecnicos.data;
            actualizarElementoSiExiste('tecnicoEficiente', data.tecnico_eficiente || 'N/A');
            actualizarElementoSiExiste('tecnicoRapido', data.tecnico_rapido || 'N/A');
            actualizarElementoSiExiste('tecnicoMes', data.tecnico_mes || 'N/A');
            actualizarElementoSiExiste('totalTecnicos', data.total_tecnicos || '0');
            
            crearGraficosTecnicos(data.graficos); 
            
        } else {
            throw new Error(dataTecnicos.error || 'Error en los datos de técnicos');
        }
        
    } catch (error) {
        console.error('Error cargando datos de técnicos:', error);
        mostrarError('Error al cargar datos de técnicos: ' + error.message);
    } finally {
        mostrarLoading(false);
    }
}


// --- ACTUALIZACIÓN DE INTERFAZ Y GRÁFICOS (ACTUALIZADO) ---

function actualizarEstadisticasGenerales(data) {
    // Actualizar tarjetas principales con verificación de elementos
    actualizarElementoSiExiste('totalIncidencias', data.total_incidencias || '0');
    actualizarElementoSiExiste('totalClientes', data.total_clientes || '0');
    // USAR EL NUEVO CAMPO DEL BACKEND
    actualizarElementoSiExiste('resueltasMes', data.incidencias_resueltas_rango || '0'); 
    actualizarElementoSiExiste('incidenciasPendientes', data.incidencias_pendientes || '0');
    
    actualizarElementoSiExiste('tiempoPromedio', data.tiempo_promedio || 'N/A');
    
    const totalCreadas = data.total_incidencias || 1;
    const resueltasRango = data.incidencias_resueltas_rango || 0;
    // Tasa de Éxito: (Resueltas en el Rango / Total Creadas en el Rango)
    const eficiencia = Math.round((resueltasRango / totalCreadas) * 100); 
    actualizarElementoSiExiste('eficienciaMensual', `${eficiencia}% de Tasa de Éxito`); // Etiqueta mejorada
    
    // El resto de los placeholders se mantienen igual ya que no hay datos para ellos.
    
    actualizarElementoSiExiste('lastUpdated', `Actualizado: ${new Date().toLocaleTimeString()}`);
}

function crearGraficos(data) {
    
    // Destruir charts existentes
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    const colores = [
        '#4361ee', '#3a0ca3', '#4cc9f0', '#f72585', '#7209b7',
        '#4895ef', '#560bad', '#b5179e', '#f15bb5', '#00bbf9'
    ];
    
    // Gráfico de estatus (Doughnut)
    if (data.por_estatus && data.por_estatus.length > 0) {
        const ctxEstatus = document.getElementById('chartEstatus');
        if (ctxEstatus) {
            charts.estatus = new Chart(ctxEstatus, {
                type: 'doughnut',
                data: {
                    labels: data.por_estatus.map(item => item.estatus || 'Sin estatus'),
                    datasets: [{
                        data: data.por_estatus.map(item => item.cantidad),
                        backgroundColor: colores,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
    } 
    
    // Gráfico por técnico (Barra)
    if (data.por_tecnico && data.por_tecnico.length > 0) {
        const ctxTecnico = document.getElementById('chartTecnico');
        if (ctxTecnico) {
            charts.tecnico = new Chart(ctxTecnico, {
                type: 'bar',
                data: {
                    labels: data.por_tecnico.map(item => item.tecnico || 'Sin técnico'),
                    datasets: [{
                        label: 'Participaciones en Incidencias',
                        data: data.por_tecnico.map(item => item.cantidad),
                        backgroundColor: '#4361ee',
                        borderColor: '#3a0ca3',
                        borderWidth: 1
                    }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        }
    }
    
    // Gráfico por sucursal (Pie)
    if (data.por_sucursal && data.por_sucursal.length > 0) {
        const ctxSucursal = document.getElementById('chartSucursal');
        if (ctxSucursal) {
            charts.sucursal = new Chart(ctxSucursal, {
                type: 'pie',
                data: {
                    labels: data.por_sucursal.map(item => item.sucursal || 'Sin sucursal'),
                    datasets: [{
                        data: data.por_sucursal.map(item => item.cantidad),
                        backgroundColor: colores,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
            });
        }
    }
    
    // Gráfico mensual (Línea)
    if (data.mensuales && data.mensuales.length > 0) {
        const ctxMensual = document.getElementById('chartMensual');
        if (ctxMensual) {
            charts.mensual = new Chart(ctxMensual, {
                type: 'line',
                data: {
                    labels: data.mensuales.map(item => formatearMes(item.mes)),
                    datasets: [{
                        label: 'Incidencias Creadas',
                        data: data.mensuales.map(item => item.cantidad),
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        borderColor: '#4361ee',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        }
    }
    
    // Gráfico Top Fallas (NUEVO - Barra horizontal)
    if (data.top_fallas && data.top_fallas.length > 0) {
        const ctxFallas = document.getElementById('chartFallas'); // DEBES AGREGAR ESTE CANVAS AL HTML
        if (ctxFallas) {
            charts.fallas = new Chart(ctxFallas, {
                type: 'bar',
                data: {
                    labels: data.top_fallas.map(item => item.falla || 'Sin Falla'),
                    datasets: [{
                        label: 'Número de Ocurrencias',
                        data: data.top_fallas.map(item => item.cantidad),
                        backgroundColor: colores.slice(0, data.top_fallas.length),
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    indexAxis: 'y', // Barra horizontal
                    scales: { x: { beginAtZero: true } }
                }
            });
        }
    } 
    
    // Se elimina el gráfico 'chartClientes' original para dar lugar a 'chartFallas' o se mueve/renombra
}

function crearGraficosTecnicos(graficosData) {
    const datosRendimiento = graficosData?.rendimiento || { labels: [], datos: [] };
    const datosTiempos = graficosData?.tiempos || { labels: [], datos: [] };
    const datosSatisfaccion = graficosData?.satisfaccion || { labels: [], datos: [] };

    if (charts.rendimiento) charts.rendimiento.destroy();
    if (charts.tiempos) charts.tiempos.destroy();
    if (charts.satisfaccion) charts.satisfaccion.destroy();
    
    // Gráfico de rendimiento de técnicos (Resueltas)
    const ctxRendimiento = document.getElementById('chartRendimiento');
    if (ctxRendimiento && datosRendimiento.labels.length > 0) {
        charts.rendimiento = new Chart(ctxRendimiento, {
            type: 'bar',
            data: {
                labels: datosRendimiento.labels,
                datasets: [{
                    label: 'Incidencias Resueltas',
                    data: datosRendimiento.datos,
                    backgroundColor: '#4361ee',
                    borderColor: '#3a0ca3',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }
    
    // Gráfico de tiempos de respuesta (Tiempo Promedio en Días)
    const ctxTiempos = document.getElementById('chartTiempos');
    if (ctxTiempos && datosTiempos.labels.length > 0) {
        charts.tiempos = new Chart(ctxTiempos, {
            type: 'bar',
            data: {
                labels: datosTiempos.labels,
                datasets: [{
                    label: 'Tiempo Promedio (Días)', // Etiqueta actualizada
                    data: datosTiempos.datos,
                    backgroundColor: '#4cc9f0',
                    borderColor: '#3a0ca3',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }
    
    // Gráfico de satisfacción (Doughnut)
    const ctxSatisfaccion = document.getElementById('chartSatisfaccion');
    if (ctxSatisfaccion && datosSatisfaccion.labels.length > 0) {
        charts.satisfaccion = new Chart(ctxSatisfaccion, {
            type: 'doughnut',
            data: {
                labels: datosSatisfaccion.labels,
                datasets: [{
                    data: datosSatisfaccion.datos,
                    backgroundColor: ['#28a745', '#20c997', '#ffc107', '#dc3545'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
}


// --- FUNCIONES AUXILIARES Y DE EXPORTACIÓN (SIN CAMBIOS) ---

function formatearMes(mesString) {
    if (!mesString) return 'Sin fecha';
    const [year, month] = mesString.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(month) - 1]} ${year}`;
}

function aplicarFiltros() {
    console.log('Aplicando filtros en la pestaña:', currentTab);
    
    if (currentTab === 'overview') {
        cargarEstadisticas();
    } else if (currentTab === 'tecnicos') {
        cargarDatosTecnicos();
    }
}

function toggleChartType(chartId) {
    const chart = charts[chartId];
    if (!chart) return;
    
    const currentType = chart.config.type;
    let newType = currentType;
    
    if (['bar', 'line', 'pie', 'doughnut'].includes(currentType)) {
        if (currentType === 'bar') newType = 'line';
        else if (currentType === 'line') newType = 'pie';
        else if (currentType === 'pie') newType = 'doughnut';
        else if (currentType === 'doughnut') newType = 'bar';
    } else {
        newType = 'line'; 
    }
    
    chart.config.type = newType;
    chart.update();
}

function downloadChart(chartId) {
    const chart = charts[chartId];
    if (!chart) return;
    
    const link = document.createElement('a');
    link.download = `grafico-${chartId}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = chart.toBase64Image();
    link.click();
}

// ... (Resto de funciones de exportación: exportarDatos, exportarPDF, exportarExcel, exportarImagen) ...
function exportarDatos() {
    const exportOptions = document.getElementById('exportOptions');
    if (exportOptions) {
        exportOptions.style.display = exportOptions.style.display === 'none' ? 'flex' : 'none';
    }
}
function exportarPDF() { alert('Funcionalidad de exportación PDF - En desarrollo'); }
function exportarExcel() { alert('Funcionalidad de exportación Excel - En desarrollo'); }
function exportarImagen() { 
    if (typeof html2canvas === 'undefined') { alert('Para exportar como imagen, necesita incluir la librería html2canvas'); return; }
    html2canvas(document.getElementById('mainContent')).then(canvas => {
        const link = document.createElement('a');
        link.download = `dashboard-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}
// ...

setInterval(() => {
    if (document.visibilityState === 'visible') {
        if (currentTab === 'overview') {
            cargarEstadisticas();
        } else if (currentTab === 'tecnicos') {
            cargarDatosTecnicos();
        }
    }
}, 300000);

window.cargarEstadisticas = cargarEstadisticas;
window.exportarDatos = exportarDatos;
window.exportarPDF = exportarPDF;
window.exportarExcel = exportarExcel;
window.exportarImagen = exportarImagen;
window.toggleChartType = toggleChartType;
window.downloadChart = downloadChart;
window.aplicarFiltros = aplicarFiltros;