// Variables globales para los charts
let charts = {};

// Cargar estadísticas al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarEstadisticas();
});

async function cargarEstadisticas() {
    try {
        mostrarLoading(true);
        
        // Cargar estadísticas generales
        const responseGeneral = await fetch('estadisticas.php?action=estadisticas_generales');
        const dataGeneral = await responseGeneral.json();
        
        if (dataGeneral.success) {
            actualizarEstadisticasGenerales(dataGeneral.data);
        }
        
        // Cargar estadísticas detalladas de incidencias
        const responseIncidencias = await fetch('estadisticas.php?action=estadisticas_incidencias');
        const dataIncidencias = await responseIncidencias.json();
        
        if (dataIncidencias.success) {
            crearGraficos(dataIncidencias.data);
        }
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        alert('Error al cargar las estadísticas');
    } finally {
        mostrarLoading(false);
    }
}

function actualizarEstadisticasGenerales(data) {
    document.getElementById('totalIncidencias').textContent = data.total_incidencias || '0';
    document.getElementById('totalClientes').textContent = data.total_clientes || '0';
    document.getElementById('resueltasMes').textContent = data.incidencias_resueltas_mes || '0';
    document.getElementById('incidenciasPendientes').textContent = data.incidencias_pendientes || '0';
}

function crearGraficos(data) {
    // Destruir charts existentes
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    // Colores para los gráficos
    const colores = [
        '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1',
        '#e83e8c', '#fd7e14', '#20c997', '#6610f2', '#6c757d'
    ];
    
    // Gráfico de estatus
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
                }
            }
        }
    });
    
    // Gráfico por técnico
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
    
    // Gráfico por sucursal
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
    
    // Gráfico mensual
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
    
    // Gráfico top clientes
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

// Actualizar cada 5 minutos
setInterval(cargarEstadisticas, 300000);