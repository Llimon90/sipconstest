// Variables globales para los charts
let charts = {};
let currentTab = 'overview';

// Cargar estadísticas al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando carga de estadísticas...');
    inicializarInterfaz();
    cargarEstadisticas();
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
    const rangoFecha = document.getElementById('rango');
    if (rangoFecha) {
        rangoFecha.addEventListener('change', function() {
            const customDateRange = document.getElementById('custom-date-range');
            
            if (this.value === 'custom') {
                if (customDateRange) customDateRange.style.display = 'flex';
            } else {
                if (customDateRange) customDateRange.style.display = 'none';
            }
        });
    }

    // Configurar botón de exportación
    const exportBtn = document.getElementById('btnExportar');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const exportOptions = document.getElementById('exportOptions');
            if (exportOptions) {
                exportOptions.style.display = exportOptions.style.display === 'flex' ? 'none' : 'flex';
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
    const tabContent = document.getElementById(tabId);
    
    if (tabElement) tabElement.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
    
    currentTab = tabId;
    
    // Cargar datos específicos de la pestaña si es necesario
    if (tabId === 'tecnicos-tab') {
        cargarDatosTecnicos();
    }
}

async function cargarEstadisticas() {
    try {
        mostrarLoading(true);
        
        // Cargar filtros primero
        await cargarFiltros();
        
        // Cargar estadísticas generales
        const responseGeneral = await fetch('backend/estadisticas.php?action=estadisticas_generales');
        if (!responseGeneral.ok) {
            throw new Error('Error en la respuesta del servidor: ' + responseGeneral.status);
        }
        const dataGeneral = await responseGeneral.json();
        
        console.log('Datos generales recibidos:', dataGeneral);
        
        if (dataGeneral.success) {
            actualizarEstadisticasGenerales(dataGeneral.data);
        } else {
            throw new Error(dataGeneral.error || 'Error en los datos generales');
        }
        
        // Cargar estadísticas detalladas de incidencias
        const responseIncidencias = await fetch('backend/estadisticas.php?action=estadisticas_incidencias');
        if (!responseIncidencias.ok) {
            throw new Error('Error en la respuesta del servidor: ' + responseIncidencias.status);
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

async function cargarFiltros() {
    try {
        const response = await fetch('backend/estadisticas.php?action=get_filtros');
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.success) {
            const tecnicoSelect = document.getElementById('tecnico');
            const sucursalSelect = document.getElementById('sucursal');

            if (tecnicoSelect) {
                tecnicoSelect.innerHTML = '<option value="all">Todos los técnicos</option>';
                data.data.tecnicos.forEach(t => {
                    const option = new Option(t.nombre, t.nombre);
                    tecnicoSelect.add(option);
                });
            }

            if (sucursalSelect) {
                sucursalSelect.innerHTML = '<option value="all">Todas las sucursales</option>';
                data.data.sucursales.forEach(s => {
                    const option = new Option(s.nombre, s.nombre);
                    sucursalSelect.add(option);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando filtros:', error);
    }
}

function actualizarEstadisticasGenerales(data) {
    console.log('Actualizando estadísticas generales:', data);
    
    // Actualizar tarjetas principales con verificación de elementos
    actualizarElementoSiExiste('totalIncidencias', data.total_incidencias || '0');
    actualizarElementoSiExiste('totalClientes', data.total_clientes || '0');
    actualizarElementoSiExiste('resueltasEsteMes', data.incidencias_resueltas_mes || '0');
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
}

function actualizarElementoSiExiste(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = valor;
    } else {
        console.warn(`Elemento con ID '${id}' no encontrado`);
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
        const ctxEstatus = document.getElementById('chartPorEstatus');
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
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
    
    // Gráfico por técnico
    if (data.por_tecnico && data.por_tecnico.length > 0) {
        const ctxTecnico = document.getElementById('chartRendimiento');
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
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
    
    // Gráfico por sucursal
    if (data.por_sucursal && data.por_sucursal.length > 0) {
        const ctxSucursal = document.getElementById('chartPorSucursal');
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
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
    
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
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
    
    // Gráfico top clientes
    if (data.top_clientes && data.top_clientes.length > 0) {
        const ctxClientes = document.getElementById('chartTopClientes');
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
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
}

function cargarDatosTecnicos() {
    // Simular datos de técnicos
    setTimeout(() => {
        actualizarElementoSiExiste('tecnicoEficiente', 'Juan Pérez');
        actualizarElementoSiExiste('tecnicoRapido', 'María García');
        actualizarElementoSiExiste('tecnicoMes', 'Carlos López');
        actualizarElementoSiExiste('totalTecnicos', '8');
    }, 500);
}

function formatearMes(mesString) {
    if (!mesString) return 'Sin fecha';
    const [year, month] = mesString.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(month) - 1]} ${year}`;
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

// Funciones de utilidad para gráficos
function toggleChartType(chartId) {
    const chart = charts[chartId];
    if (!chart) return;
    
    const currentType = chart.config.type;
    let newType = currentType;
    
    if (currentType === 'bar') newType = 'line';
    else if (currentType === 'line') newType = 'pie';
    else if (currentType === 'pie') newType = 'doughnut';
    else if (currentType === 'doughnut') newType = 'bar';
    
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

function exportarPDF() {
    alert('Funcionalidad de exportación PDF - En desarrollo');
}

function exportarExcel() {
    alert('Funcionalidad de exportación Excel - En desarrollo');
}

function exportarImagen() {
    alert('Funcionalidad de exportación imagen - En desarrollo');
}

// Hacer funciones globales
window.cargarEstadisticas = cargarEstadisticas;
window.loadAllStatistics = cargarEstadisticas;
window.toggleChartType = toggleChartType;
window.downloadChart = downloadChart;
window.exportarPDF = exportarPDF;
window.exportarExcel = exportarExcel;
window.exportarImagen = exportarImagen;