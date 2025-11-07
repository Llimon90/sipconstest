<?php
header('Content-Type: application/json');

// --- 1. CONEXIÓN DE BASE DE DATOS ---
require_once 'conexion.php'; 

// Verifica la conexión
if (!isset($conn) || $conn->connect_error) {
    echo json_encode([
        'success' => false, 
        'error' => 'Error al cargar la conexión a la base de datos. Por favor, revisa conexion.php.'
    ]);
    exit();
}

// Nombre de la tabla de incidencias
$tabla_incidencias = "incidencias"; 

// --- 2. FUNCIONES DE UTILIDAD ---

/**
 * Recopila y sanea los parámetros de filtro de la URL.
 * Utiliza 'fecha' (creación) como campo principal para los filtros de rango.
 */
function construirFiltros($conn, $tabla_alias = 'i', $campo_fecha = 'fecha') {
    $filtros = [];
    
    $rango = $_GET['rango'] ?? 'last30days';
    $campo_fecha_db = $tabla_alias . "." . $campo_fecha;
    
    $fecha_actual = new DateTime();
    $fecha_inicio = null;
    $fecha_fin = $fecha_actual->format('Y-m-d'); 
    
    // Lógica de rango de fechas (usando el campo pasado como argumento)
    if ($rango === 'custom' && !empty($_GET['fechaInicio']) && !empty($_GET['fechaFin'])) {
        $fecha_inicio = $_GET['fechaInicio'];
        $fecha_fin = $_GET['fechaFin'];
    } elseif ($rango === 'last7days') {
        $fecha_inicio = (clone $fecha_actual)->modify('-7 days')->format('Y-m-d');
    } elseif ($rango === 'last30days') {
        $fecha_inicio = (clone $fecha_actual)->modify('-30 days')->format('Y-m-d');
    } elseif ($rango === 'currentmonth') {
        $fecha_inicio = (clone $fecha_actual)->modify('first day of this month')->format('Y-m-d');
    }
    
    if ($fecha_inicio && $fecha_fin) {
        $filtros[] = "{$campo_fecha_db} BETWEEN '{$conn->real_escape_string($fecha_inicio)} 00:00:00' AND '{$conn->real_escape_string($fecha_fin)} 23:59:59'";
    }

    // Filtros por selección (tecnico, sucursal, estatus)
    $campos_filtro = ['tecnico', 'sucursal', 'estatus']; 
    foreach ($campos_filtro as $campo) {
        if (!empty($_GET[$campo]) && $_GET[$campo] !== 'all') {
            $valor = $conn->real_escape_string($_GET[$campo]);
            if ($campo === 'tecnico') {
                $filtros[] = "{$tabla_alias}.{$campo} LIKE '%{$valor}%'";
            } else {
                $filtros[] = "{$tabla_alias}.{$campo} = '{$valor}'";
            }
        }
    }

    return empty($filtros) ? "" : "WHERE " . implode(" AND ", $filtros);
}

/**
 * Ejecuta una consulta y devuelve los resultados como un array asociativo.
 */
function ejecutarConsulta($conn, $sql) {
    $resultado = $conn->query($sql);
    $data = [];
    if ($resultado === false) {
        error_log("Error SQL: " . $conn->error . "\nConsulta: " . $sql);
        return [];
    }
    if ($resultado->num_rows > 0) {
        while($fila = $resultado->fetch_assoc()) {
            $data[] = $fila;
        }
    }
    return $data;
}


// --- 3. LÓGICA DE ACCIONES ---

$action = $_GET['action'] ?? '';
$response = ['success' => false, 'data' => [], 'error' => 'Acción no válida.'];

// Filtro principal para TODAS las incidencias (usando 'fecha' de creación)
$filtros_where_creacion = construirFiltros($conn, 'i', 'fecha');

switch ($action) {
    
    case 'estadisticas_generales':
        
        // 1. Total de incidencias (basado en fecha de creación)
        $sql_total = "SELECT COUNT(id) AS total_incidencias FROM {$tabla_incidencias} i {$filtros_where_creacion}";
        $total_incidencias = ejecutarConsulta($conn, $sql_total)[0]['total_incidencias'] ?? 0;

        // 2. Incidencias pendientes (sin importar filtro de fecha, ya que son activas)
        $sql_pendientes = "SELECT COUNT(id) AS incidencias_pendientes FROM {$tabla_incidencias} WHERE estatus NOT IN ('Cerrado', 'Resuelto', 'Completada')";
        $pendientes = ejecutarConsulta($conn, $sql_pendientes)[0]['incidencias_pendientes'] ?? 0;
        
        // 3. Incidencias cerradas/resueltas (basado en fecha de cierre y el filtro de rango)
        $filtros_where_cierre = construirFiltros($conn, 'i', 'fecha_cierre');
        $sql_resueltas = "SELECT COUNT(id) AS incidencias_resueltas FROM {$tabla_incidencias} i {$filtros_where_cierre} AND i.estatus IN ('Cerrado', 'Resuelto', 'Completada')";
        $resueltas = ejecutarConsulta($conn, $sql_resueltas)[0]['incidencias_resueltas'] ?? 0;

        // 4. Tiempo promedio de resolución (en segundos, luego convertido a formato legible en PHP/JS)
        $sql_tiempo = "
            SELECT 
                AVG(TIMESTAMPDIFF(SECOND, STR_TO_DATE(fecha, '%Y-%m-%d %H:%i:%s'), STR_TO_DATE(fecha_cierre, '%Y-%m-%d %H:%i:%s'))) AS tiempo_segundos
            FROM 
                {$tabla_incidencias} i {$filtros_where_cierre} 
            WHERE 
                i.estatus IN ('Cerrado', 'Resuelto', 'Completada') AND fecha_cierre IS NOT NULL
        ";
        $tiempo_segundos = ejecutarConsulta($conn, $sql_tiempo)[0]['tiempo_segundos'] ?? 0;

        // Función auxiliar para formatear segundos a Días/Horas/Minutos (para el frontend)
        $tiempo_formateado = "N/A";
        if ($tiempo_segundos > 0) {
            $d = floor($tiempo_segundos / (3600*24));
            $h = floor($tiempo_segundos % (3600*24) / 3600);
            $m = floor($tiempo_segundos % 3600 / 60);
            $tiempo_formateado = "{$d}d {$h}h {$m}m";
        }
        
        // 5. Total de clientes únicos (si tienes una tabla de clientes o confías en la columna 'cliente')
        $sql_clientes = "SELECT COUNT(DISTINCT cliente) AS total_clientes FROM {$tabla_incidencias} i {$filtros_where_creacion} HAVING cliente IS NOT NULL AND cliente <> ''";
        $total_clientes = ejecutarConsulta($conn, $sql_clientes)[0]['total_clientes'] ?? 0;
        
        $response['success'] = true;
        $response['data'] = [
            'total_incidencias' => (int)$total_incidencias,
            'incidencias_pendientes' => (int)$pendientes,
            'incidencias_resueltas_rango' => (int)$resueltas, // Resueltas en el rango de filtro
            'total_clientes' => (int)$total_clientes,
            'tiempo_promedio' => $tiempo_formateado,
            'tendencia_incidencias' => 0 // Se necesitaría una lógica de comparación mensual para esto.
        ];
        break;

    case 'estadisticas_incidencias':
        $data_incidencias = [];

        // Gráfico 1: Por Estatus
        $sql_estatus = "SELECT estatus, COUNT(id) AS cantidad FROM {$tabla_incidencias} i {$filtros_where_creacion} GROUP BY estatus ORDER BY cantidad DESC";
        $data_incidencias['por_estatus'] = ejecutarConsulta($conn, $sql_estatus);

        // Gráfico 2: Por Sucursal
        $sql_sucursal = "SELECT sucursal, COUNT(id) AS cantidad FROM {$tabla_incidencias} i {$filtros_where_creacion} GROUP BY sucursal ORDER BY cantidad DESC LIMIT 5";
        $data_incidencias['por_sucursal'] = ejecutarConsulta($conn, $sql_sucursal);
        
        // Gráfico 3: Histórico mensual de creación
        $sql_mensual = "SELECT DATE_FORMAT(fecha, '%Y-%m') as mes, COUNT(id) AS cantidad FROM {$tabla_incidencias} i {$filtros_where_creacion} GROUP BY mes ORDER BY mes ASC";
        $data_incidencias['mensuales'] = ejecutarConsulta($conn, $sql_mensual);

        // Gráfico 4: Top 5 Falla/Causa Raíz
        // Asumiendo que 'falla' contiene la descripción o tipo de falla
        $sql_falla = "SELECT falla, COUNT(id) AS cantidad FROM {$tabla_incidencias} i {$filtros_where_creacion} GROUP BY falla ORDER BY cantidad DESC LIMIT 5";
        $data_incidencias['top_fallas'] = ejecutarConsulta($conn, $sql_falla);
        
        // Gráfico 5: Conteo de participación de Técnicos (Usando filtro de creación)
        $sql_tecnicos = "
            SELECT 
                TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(i.tecnico, ',', n.num), ',', -1)) AS tecnico,
                COUNT(i.id) AS cantidad
            FROM 
                {$tabla_incidencias} i
            JOIN 
                (
                    SELECT 1 AS num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 
                ) n 
                ON CHAR_LENGTH(i.tecnico) - CHAR_LENGTH(REPLACE(i.tecnico, ',', '')) >= n.num - 1
            {$filtros_where_creacion}
            GROUP BY
                tecnico
            HAVING
                tecnico <> ''
            ORDER BY 
                cantidad DESC;
        ";
        $data_incidencias['por_tecnico'] = ejecutarConsulta($conn, $sql_tecnicos);
        
        $response['success'] = true;
        $response['data'] = $data_incidencias;
        break;

    case 'estadisticas_tecnicos':
        // Filtro para esta sección: solo incidencias CERRADAS/RESUELTAS (fecha_cierre)
        $filtros_where_cierre_tecnicos = construirFiltros($conn, 'i', 'fecha_cierre') . " AND i.estatus IN ('Cerrado', 'Resuelto', 'Completada')";
        
        // Cargar datos de técnicos (Incidencias RESUELTAS)
        $sql_rendimiento = "
            SELECT 
                TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(i.tecnico, ',', n.num), ',', -1)) AS tecnico,
                COUNT(i.id) AS cantidad
            FROM 
                {$tabla_incidencias} i
            JOIN 
                (
                    SELECT 1 AS num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
                ) n 
                ON CHAR_LENGTH(i.tecnico) - CHAR_LENGTH(REPLACE(i.tecnico, ',', '')) >= n.num - 1
            {$filtros_where_cierre_tecnicos}
            GROUP BY
                tecnico
            HAVING
                tecnico <> ''
            ORDER BY 
                cantidad DESC;
        ";
        $datos_rendimiento_bruto = ejecutarConsulta($conn, $sql_rendimiento);
        
        // Cargar tiempos promedio de resolución por técnico
        $sql_tiempos = "
            SELECT 
                TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(i.tecnico, ',', n.num), ',', -1)) AS tecnico,
                AVG(TIMESTAMPDIFF(SECOND, STR_TO_DATE(fecha, '%Y-%m-%d %H:%i:%s'), STR_TO_DATE(fecha_cierre, '%Y-%m-%d %H:%i:%s'))) AS tiempo_segundos
            FROM 
                {$tabla_incidencias} i
            JOIN 
                (
                    SELECT 1 AS num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
                ) n 
                ON CHAR_LENGTH(i.tecnico) - CHAR_LENGTH(REPLACE(i.tecnico, ',', '')) >= n.num - 1
            {$filtros_where_cierre_tecnicos}
            GROUP BY
                tecnico
            HAVING
                tecnico <> ''
            ORDER BY 
                tiempo_segundos ASC;
        ";
        $datos_tiempos_bruto = ejecutarConsulta($conn, $sql_tiempos);
        
        // Encontrar técnico más eficiente (más resueltas) y más rápido (menor tiempo promedio)
        $tecnico_eficiente = $datos_rendimiento_bruto[0]['tecnico'] ?? 'N/A';
        // Convertir el tiempo promedio más bajo a Días/Horas/Minutos para el display
        $tecnico_rapido = $datos_tiempos_bruto[0]['tecnico'] ?? 'N/A';
        $total_tecnicos = count($datos_rendimiento_bruto);
        
        // Mapear datos para gráficos de rendimiento
        $labels_rendimiento = array_column($datos_rendimiento_bruto, 'tecnico');
        $datos_rendimiento = array_column($datos_rendimiento_bruto, 'cantidad');
        
        // Mapear datos para gráficos de tiempo (convertir segundos a días flotantes para el gráfico)
        $labels_tiempos = array_column($datos_tiempos_bruto, 'tecnico');
        $datos_tiempos = array_map(function($segundos) {
            return round($segundos / (3600 * 24), 2); // Días con 2 decimales
        }, array_column($datos_tiempos_bruto, 'tiempo_segundos'));

        $response['success'] = true;
        $response['data'] = [
            'tecnico_eficiente' => $tecnico_eficiente,
            'tecnico_rapido' => $tecnico_rapido,
            'tecnico_mes' => $tecnico_eficiente, // Se puede reutilizar el eficiente como "Técnico del Mes"
            'total_tecnicos' => $total_tecnicos,
            'graficos' => [
                'rendimiento' => [
                    'labels' => $labels_rendimiento,
                    'datos' => $datos_rendimiento,
                ],
                'tiempos' => [
                    'labels' => $labels_tiempos,
                    'datos' => $datos_tiempos
                ],
                'satisfaccion' => ['labels' => ['Excelente', 'Bueno', 'Regular', 'Malo'], 'datos' => [60, 25, 10, 5]], 
            ]
        ];
        break;

    default:
        $response['error'] = 'Acción de API no reconocida.';
        break;
}

$conn->close();
echo json_encode($response);
?>