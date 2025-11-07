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
    // Implementación de mostrarError (tal como estaba)
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


// --- INICIALIZACIÓN Y CAMBIO DE PESTAÑAS ---

// Cargar estadísticas al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando carga de estadísticas...');
    inicializarInterfaz();
    // Cargar la pestaña por defecto (Overview)
    cambiarPestaña(currentTab); 
});

function inicializarInterfaz() {
    // Configurar pestañas
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            cambiarPestaña(tabId);
        });
    });

    // Configurar filtro de fechas personalizadas
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

    // Configurar botón de exportación
    const exportBtn = document.querySelector('.btn-outline');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const exportOptions = document.getElementById('exportOptions');
            if (exportOptions) {
                exportOptions.style.display = exportOptions.style.display === 'none' ? 'flex' : 'none';
            }
        });
    }

    // Inicializar fecha actual para filtros personalizados
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    
    if (fechaInicio) fechaInicio.value = hace30Dias.toISOString().split('T')[0];
    if (fechaFin) fechaFin.value = hoy.toISOString().split('T')[0];
}

function cambiarPestaña(tabId) {
    // Actualizar pestañas activas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Activar pestaña seleccionada
    const tabElement = document.querySelector(`[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(`${tabId}-tab`);
    
    if (tabElement) tabElement.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
    
    // Solo recargar si la pestaña es diferente o es la primera carga
    if (currentTab !== tabId || tabId === 'overview') {
        currentTab = tabId;
        
        // Cargar datos específicos de la pestaña
        if (tabId === 'overview') {
            cargarEstadisticas();
        } else if (tabId === 'tecnicos') {
            cargarDatosTecnicos();
        }
    }
}


// --- CARGA DE DATOS DESDE EL BACKEND (SIN SIMULACIÓN) ---

async function cargarEstadisticas() {
    const filtros = obtenerParametrosFiltro(); // <-- Obtener parámetros de filtro

    try {
        mostrarLoading(true);
        
        // 1. Cargar estadísticas generales con filtros
        const urlGeneral = `../backend/estadisticas.php?action=estadisticas_generales${filtros}`;
        const responseGeneral = await fetch(urlGeneral);
        
        if (!responseGeneral.ok) {
            throw new Error('Error en la respuesta del servidor (General): ' + responseGeneral.status);
        }
        const dataGeneral = await responseGeneral.json();
        
        console.log('Datos generales recibidos:', dataGeneral);
        
        if (dataGeneral.success) {
            actualizarEstadisticasGenerales(dataGeneral.data);
        } else {
            throw new Error(dataGeneral.error || 'Error en los datos generales');
        }
        
        // 2. Cargar estadísticas detalladas de incidencias con filtros
        const urlIncidencias = `../backend/estadisticas.php?action=estadisticas_incidencias${filtros}`;
        const responseIncidencias = await fetch(urlIncidencias);
        
        if (!responseIncidencias.ok) {
            throw new Error('Error en la respuesta del servidor (Incidencias): ' + responseIncidencias.status);
        }
        const dataIncidencias = await responseIncidencias.json();
        
        console.log('Datos de incidencias recibidos:', dataIncidencias);
        
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
    const filtros = obtenerParametrosFiltro(); // <-- Obtener parámetros de filtro
    
    console.log('Cargando datos específicos de técnicos con filtros...');
    
    try {
        mostrarLoading(true);
        
        // Llamada para cargar datos de la pestaña de técnicos con filtros
        const urlTecnicos = `../backend/estadisticas.php?action=estadisticas_tecnicos${filtros}`;
        const responseTecnicos = await fetch(urlTecnicos);
        
        if (!responseTecnicos.ok) {
             throw new Error('Error en la respuesta del servidor (Técnicos): ' + responseTecnicos.status);
        }
        const dataTecnicos = await responseTecnicos.json();
        
        console.log('Datos de técnicos recibidos:', dataTecnicos);

        if (dataTecnicos.success) {
            // Actualizar tarjetas principales de técnicos
            const data = dataTecnicos.data;
            actualizarElementoSiExiste('tecnicoEficiente', data.tecnico_eficiente || 'N/A');
            actualizarElementoSiExiste('tecnicoRapido', data.tecnico_rapido || 'N/A');
            actualizarElementoSiExiste('tecnicoMes', data.tecnico_mes || 'N/A');
            actualizarElementoSiExiste('totalTecnicos', data.total_tecnicos || '0');
            
            // Crear gráficos de técnicos con los datos reales
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


// --- ACTUALIZACIÓN DE INTERFAZ Y GRÁFICOS ---

function actualizarEstadisticasGenerales(data) {
    console.log('Actualizando estadísticas generales:', data);
    
    // Actualizar tarjetas principales con verificación de elementos
    actualizarElementoSiExiste('totalIncidencias', data.total_incidencias || '0');
    actualizarElementoSiExiste('totalClientes', data.total_clientes || '0');
    actualizarElementoSiExiste('resueltasMes', data.incidencias_resueltas_mes || '0');
    actualizarElementoSiExiste('incidenciasPendientes', data.incidencias_pendientes || '0');
    
    // Actualizar tiempo promedio
    actualizarElementoSiExiste('tiempoPromedio', data.tiempo_promedio || '0d');
    
    // Calcular y mostrar tendencias
    const tendencia = data.tendencia_incidencias || 0;
    const elemento = document.getElementById('tendenciaIncidencias');
    if (elemento) {
        elemento.textContent = `${tendencia >= 0 ? '+' : ''}${tendencia}% vs mes anterior`;
        elemento.className = `stat-change ${tendencia >= 0 ? '' : 'negative'}`;
    }
    
    // Calcular eficiencia
    const total = data.total_incidencias || 1;
    const resueltas = data.incidencias_resueltas_mes || 0;
    const eficiencia = Math.round((resueltas / total) * 100);
    actualizarElementoSiExiste('eficienciaMensual', `${eficiencia}% de eficiencia`);
    
    // Actualizar estadísticas de la pestaña de incidencias
    actualizarElementoSiExiste('incidenciasAbiertas', data.incidencias_activas || '0');
    actualizarElementoSiExiste('incidenciasAsignadas', data.incidencias_activas || '0');
    actualizarElementoSiExiste('incidenciasCompletadas', data.incidencias_completadas || '0');
    actualizarElementoSiExiste('incidenciasFacturadas', data.incidencias_facturadas || '0');
    
    // Actualizar última actualización
    actualizarElementoSiExiste('lastUpdated', `Actualizado: ${new Date().toLocaleTimeString()}`);
    
    if (data.detalle_estatus) {
        console.log('Detalle de estatus:', data.detalle_estatus);
    }
}

function crearGraficos(data) {
    console.log('Creando gráficos con datos:', data);
    
    // Destruir charts existentes
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    // Colores para los gráficos
    const colores = [
        '#4361ee', '#3a0ca3', '#4cc9f0', '#f72585', '#7209b7',
        '#4895ef', '#560bad', '#b5179e', '#f15bb5', '#00bbf9'
    ];
    
    // Gráfico de estatus
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
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } else { console.warn('No hay datos para el gráfico de estatus'); }
    
    // Gráfico por técnico
    if (data.por_tecnico && data.por_tecnico.length > 0) {
        const ctxTecnico = document.getElementById('chartTecnico');
        if (ctxTecnico) {
            charts.tecnico = new Chart(ctxTecnico, {
                type: 'bar',
                data: {
                    labels: data.por_tecnico.map(item => item.tecnico || 'Sin técnico'),
                    datasets: [{
                        label: 'Incidencias',
                        data: data.por_tecnico.map(item => item.cantidad),
                        backgroundColor: '#4361ee',
                        borderColor: '#3a0ca3',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
    } else { console.warn('No hay datos para el gráfico de técnicos'); }
    
    // Gráfico por sucursal
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
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
    } else { console.warn('No hay datos para el gráfico de sucursales'); }
    
    // Gráfico mensual
    if (data.mensuales && data.mensuales.length > 0) {
        const ctxMensual = document.getElementById('chartMensual');
        if (ctxMensual) {
            charts.mensual = new Chart(ctxMensual, {
                type: 'line',
                data: {
                    labels: data.mensuales.map(item => formatearMes(item.mes)),
                    datasets: [{
                        label: 'Incidencias',
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
    } else { console.warn('No hay datos para el gráfico mensual'); }
    
    // Gráfico top clientes
    if (data.top_clientes && data.top_clientes.length > 0) {
        const ctxClientes = document.getElementById('chartClientes');
        if (ctxClientes) {
            charts.clientes = new Chart(ctxClientes, {
                type: 'bar',
                data: {
                    labels: data.top_clientes.map(item => item.cliente || 'Sin cliente'),
                    datasets: [{
                        label: 'Número de Incidencias',
                        data: data.top_clientes.map(item => item.cantidad),
                        backgroundColor: colores,
                        borderColor: colores.map(color => color),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    indexAxis: 'y',
                    scales: { x: { beginAtZero: true } }
                }
            });
        }
    } else { console.warn('No hay datos para el gráfico de clientes'); }
}

function crearGraficosTecnicos(graficosData) {
    // Si no hay datos de gráficos de técnicos, usar una estructura vacía para evitar errores
    const datosRendimiento = graficosData?.rendimiento || { labels: [], datos: [] };
    const datosTiempos = graficosData?.tiempos || { labels: [], datos: [] };
    const datosSatisfaccion = graficosData?.satisfaccion || { labels: [], datos: [] };

    // Destruir charts existentes de técnicos
    if (charts.rendimiento) charts.rendimiento.destroy();
    if (charts.tiempos) charts.tiempos.destroy();
    if (charts.satisfaccion) charts.satisfaccion.destroy();
    
    // Gráfico de rendimiento de técnicos
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
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    } else { console.warn('No hay datos para el gráfico de rendimiento de técnicos'); }
    
    // Gráfico de tiempos de respuesta
    const ctxTiempos = document.getElementById('chartTiempos');
    if (ctxTiempos && datosTiempos.labels.length > 0) {
        charts.tiempos = new Chart(ctxTiempos, {
            type: 'bar',
            data: {
                labels: datosTiempos.labels,
                datasets: [{
                    label: 'Tiempo Promedio (días)',
                    data: datosTiempos.datos,
                    backgroundColor: '#4cc9f0',
                    borderColor: '#3a0ca3',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    } else { console.warn('No hay datos para el gráfico de tiempos de técnicos'); }
    
    // Gráfico de satisfacción
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
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    } else { console.warn('No hay datos para el gráfico de satisfacción de técnicos'); }
}


// --- FUNCIONES AUXILIARES Y DE EXPORTACIÓN ---

function formatearMes(mesString) {
    if (!mesString) return 'Sin fecha';
    const [year, month] = mesString.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(month) - 1]} ${year}`;
}

// Función para aplicar filtros (Llama a la carga de datos de la pestaña actual)
function aplicarFiltros() {
    console.log('Aplicando filtros en la pestaña:', currentTab);
    
    // Recarga los datos de la pestaña que esté activa
    if (currentTab === 'overview') {
        cargarEstadisticas();
    } else if (currentTab === 'tecnicos') {
        cargarDatosTecnicos();
    }
}

// Funciones de utilidad para gráficos (mantienen su lógica original)
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
        // Para tipos de gráfico que no están en el ciclo (ej: bar de rendimiento)
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

function exportarDatos() {
    const exportOptions = document.getElementById('exportOptions');
    if (exportOptions) {
        exportOptions.style.display = exportOptions.style.display === 'none' ? 'flex' : 'none';
    }
}

function exportarPDF() {
    alert('Funcionalidad de exportación PDF - En desarrollo');
}

function exportarExcel() {
    alert('Funcionalidad de exportación Excel - En desarrollo');
}

function exportarImagen() {
    if (typeof html2canvas === 'undefined') {
        alert('Para exportar como imagen, necesita incluir la librería html2canvas');
        return;
    }
    
    html2canvas(document.getElementById('mainContent')).then(canvas => {
        const link = document.createElement('a');
        link.download = `dashboard-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

// Actualizar cada 5 minutos
setInterval(() => {
    // Solo recargar si la página está activa (opcional)
    if (document.visibilityState === 'visible') {
        // Recarga la pestaña que esté activa
        if (currentTab === 'overview') {
            cargarEstadisticas();
        } else if (currentTab === 'tecnicos') {
            cargarDatosTecnicos();
        }
    }
}, 300000);

// Hacer funciones globales para los botones HTML
window.cargarEstadisticas = cargarEstadisticas;
window.exportarDatos = exportarDatos;
window.exportarPDF = exportarPDF;
window.exportarExcel = exportarExcel;
window.exportarImagen = exportarImagen;
window.toggleChartType = toggleChartType;
window.downloadChart = downloadChart;
window.aplicarFiltros = aplicarFiltros;

// ... (resto de tu código JavaScript) ...

// Función para aplicar filtros (Llama a la carga de datos de la pestaña actual)
function aplicarFiltros() {
    console.log('Aplicando filtros en la pestaña:', currentTab);
    
    // Recarga los datos de la pestaña que esté activa
    if (currentTab === 'overview') {
        cargarEstadisticas();
    } else if (currentTab === 'tecnicos') {
        cargarDatosTecnicos();
    }
}

// ... (resto de tu código JavaScript) ...