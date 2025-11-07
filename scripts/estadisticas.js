// Variables globales para los charts
let charts = {};

// Cargar estadísticas al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando carga de estadísticas...');
    cargarEstadisticas();
});

async function cargarEstadisticas() {
    try {
        mostrarLoading(true);
        
        // Cargar estadísticas generales
        const responseGeneral = await fetch('../backend/estadisticas.php?action=estadisticas_generales');
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
        const responseIncidencias = await fetch('../backend/estadisticas.php?action=estadisticas_incidencias');
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

function actualizarEstadisticasGenerales(data) {
    console.log('Actualizando estadísticas generales:', data);
    
    document.getElementById('totalIncidencias').textContent = data.total_incidencias || '0';
    document.getElementById('totalClientes').textContent = data.total_clientes || '0';
    document.getElementById('resueltasMes').textContent = data.incidencias_resueltas_mes || '0';
    document.getElementById('incidenciasPendientes').textContent = data.incidencias_pendientes || '0';
    
    // Mostrar detalles de estatus en consola para debugging
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
        '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1',
        '#e83e8c', '#fd7e14', '#20c997', '#6610f2', '#6c757d'
    ];
    
    // Gráfico de estatus - CON VALIDACIÓN
    if (data.por_estatus && data.por_estatus.length > 0) {
        const ctxEstatus = document.getElementById('chartEstatus').getContext('2d');
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
                    },
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
    } else {
        console.warn('No hay datos para el gráfico de estatus');
    }
    
    // Gráfico por técnico - CON VALIDACIÓN
    if (data.por_tecnico && data.por_tecnico.length > 0) {
        const ctxTecnico = document.getElementById('chartTecnico').getContext('2d');
        charts.tecnico = new Chart(ctxTecnico, {
            type: 'bar',
            data: {
                labels: data.por_tecnico.map(item => item.tecnico || 'Sin técnico'),
                datasets: [{
                    label: 'Incidencias',
                    data: data.por_tecnico.map(item => item.cantidad),
                    backgroundColor: '#007bff',
                    borderColor: '#0056b3',
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
    } else {
        console.warn('No hay datos para el gráfico de técnicos');
    }
    
    // Gráfico por sucursal - CON VALIDACIÓN
    if (data.por_sucursal && data.por_sucursal.length > 0) {
        const ctxSucursal = document.getElementById('chartSucursal').getContext('2d');
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
    } else {
        console.warn('No hay datos para el gráfico de sucursales');
    }
    
    // Gráfico mensual - CON VALIDACIÓN
    if (data.mensuales && data.mensuales.length > 0) {
        const ctxMensual = document.getElementById('chartMensual').getContext('2d');
        charts.mensual = new Chart(ctxMensual, {
            type: 'line',
            data: {
                labels: data.mensuales.map(item => formatearMes(item.mes)),
                datasets: [{
                    label: 'Incidencias',
                    data: data.mensuales.map(item => item.cantidad),
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderColor: '#007bff',
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
    } else {
        console.warn('No hay datos para el gráfico mensual');
    }
    
    // Gráfico top clientes - CON VALIDACIÓN
    if (data.top_clientes && data.top_clientes.length > 0) {
        const ctxClientes = document.getElementById('chartClientes').getContext('2d');
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
    } else {
        console.warn('No hay datos para el gráfico de clientes');
    }
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
    // Crear o mostrar un mensaje de error
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        errorDiv.style.cssText = `
            background: #dc3545;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        `;
        const mainContent = document.getElementById('mainContent');
        const filters = document.querySelector('.filters');
        mainContent.insertBefore(errorDiv, filters);
    }
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${mensaje}`;
    errorDiv.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Actualizar cada 5 minutos
setInterval(cargarEstadisticas, 300000);