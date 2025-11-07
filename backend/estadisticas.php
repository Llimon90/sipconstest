<?php
header('Content-Type: application/json');

// --- 1. CONFIGURACIÓN DE BASE DE DATOS ---
$servername = "localhost";
$username = "tu_usuario"; 
$password = "tu_contraseña"; 
$dbname = "tu_base_de_datos";

// Nombre de la tabla de incidencias
$tabla_incidencias = "incidencias"; 

// Intentar conexión
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Error de conexión: ' . $conn->connect_error]);
    exit();
}

// --- 2. FUNCIONES DE UTILIDAD ---

/**
 * Recopila y sanea los parámetros de filtro de la URL.
 * @param mysqli $conn La conexión a la base de datos.
 * @return string La cadena de la cláusula WHERE.
 */
function construirFiltros($conn, $tabla_alias = 'i') {
    $filtros = [];
    
    // Rango de fechas
    $rango = $_GET['rango'] ?? 'last30days';
    $campo_fecha = $tabla_alias . ".fecha_cierre"; // Ajusta el nombre de tu campo de fecha
    
    // Obtener las fechas de inicio y fin basadas en el rango
    $fecha_actual = new DateTime();
    $fecha_inicio = null;
    $fecha_fin = $fecha_actual->format('Y-m-d'); // Hoy
    
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
        $filtros[] = "{$campo_fecha} BETWEEN '{$conn->real_escape_string($fecha_inicio)} 00:00:00' AND '{$conn->real_escape_string($fecha_fin)} 23:59:59'";
    }

    // Filtros por selección (tecnico, sucursal, estatus)
    $campos_filtro = ['tecnico', 'sucursal', 'estatus']; // Ajusta los nombres de tus columnas si es necesario
    foreach ($campos_filtro as $campo) {
        if (!empty($_GET[$campo]) && $_GET[$campo] !== 'all') {
            $valor = $conn->real_escape_string($_GET[$campo]);
            // Para el filtro de técnico, usamos LIKE para buscar dentro de la cadena
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
    if ($resultado && $resultado->num_rows > 0) {
        while($fila = $resultado->fetch_assoc()) {
            $data[] = $fila;
        }
    }
    return $data;
}

// --- 3. LÓGICA DE ACCIONES ---

$action = $_GET['action'] ?? '';
$response = ['success' => false, 'data' => [], 'error' => 'Acción no válida.'];
$filtros_where = construirFiltros($conn, 'i');

switch ($action) {
    
    // --- ACCIÓN 1: DATOS GENERALES (OVERVIEW CARDS) ---
    case 'estadisticas_generales':
        // 1. Total de incidencias
        $sql_total = "SELECT COUNT(id) AS total_incidencias FROM {$tabla_incidencias} i {$filtros_where}";
        $total_incidencias = ejecutarConsulta($conn, $sql_total)[0]['total_incidencias'] ?? 0;

        // 2. Otras estadísticas (ejemplo)
        $sql_pendientes = "SELECT COUNT(id) AS incidencias_pendientes FROM {$tabla_incidencias} i {$filtros_where} AND i.estatus NOT IN ('Cerrado', 'Resuelto')";
        $pendientes = ejecutarConsulta($conn, $sql_pendientes)[0]['incidencias_pendientes'] ?? 0;

        // Aquí deberías agregar tus propias consultas para: total_clientes, resueltas_mes, tiempo_promedio, etc.

        $response['success'] = true;
        $response['data'] = [
            'total_incidencias' => (int)$total_incidencias,
            'incidencias_pendientes' => (int)$pendientes,
            'total_clientes' => 0, // Placeholder
            'incidencias_resueltas_mes' => 0, // Placeholder
            'tiempo_promedio' => 'N/A', // Placeholder
            'tendencia_incidencias' => 0 // Placeholder
        ];
        break;

    // --- ACCIÓN 2: GRÁFICOS DE INCIDENCIAS (OVERVIEW CHARTS) ---
    case 'estadisticas_incidencias':
        $data_incidencias = [];

        // Gráfico por estatus
        $sql_estatus = "SELECT estatus, COUNT(id) AS cantidad FROM {$tabla_incidencias} i {$filtros_where} GROUP BY estatus ORDER BY cantidad DESC";
        $data_incidencias['por_estatus'] = ejecutarConsulta($conn, $sql_estatus);

        // Gráfico por sucursal
        $sql_sucursal = "SELECT sucursal, COUNT(id) AS cantidad FROM {$tabla_incidencias} i {$filtros_where} GROUP BY sucursal ORDER BY cantidad DESC LIMIT 5";
        $data_incidencias['por_sucursal'] = ejecutarConsulta($conn, $sql_sucursal);
        
        // Gráfico por mes (ejemplo)
        $sql_mensual = "SELECT DATE_FORMAT(fecha_cierre, '%Y-%m') as mes, COUNT(id) AS cantidad FROM {$tabla_incidencias} i {$filtros_where} GROUP BY mes ORDER BY mes ASC";
        $data_incidencias['mensuales'] = ejecutarConsulta($conn, $sql_mensual);

        // *** LÓGICA PRINCIPAL: CONTABILIZAR TÉCNICOS POR PARTICIPACIÓN (SIN TABLA PIVOTE) ***
        // Se asume que los nombres de los técnicos están separados por comas (',')
        
        /* * NOTA IMPORTANTE: Esta subconsulta (n) debe contener números hasta 
         * la cantidad máxima de técnicos que pueden aparecer en una sola incidencia. 
         */
        $sql_tecnicos = "
            SELECT 
                TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(i.tecnico, ',', n.num), ',', -1)) AS tecnico,
                COUNT(i.id) AS cantidad
            FROM 
                {$tabla_incidencias} i
            JOIN 
                (
                    SELECT 1 AS num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
                    -- AGREGAR MÁS UNION ALL SELECT num SI ES NECESARIO (ej: 6, 7, etc.)
                ) n 
                ON CHAR_LENGTH(i.tecnico) - CHAR_LENGTH(REPLACE(i.tecnico, ',', '')) >= n.num - 1
            {$filtros_where}
            GROUP BY
                tecnico
            HAVING
                tecnico <> ''
            ORDER BY 
                cantidad DESC;
        ";
        $data_incidencias['por_tecnico'] = ejecutarConsulta($conn, $sql_tecnicos);
        // *********************************************************************************
        
        $response['success'] = true;
        $response['data'] = $data_incidencias;
        break;

    // --- ACCIÓN 3: DATOS DE TÉCNICOS (TABS) ---
    case 'estadisticas_tecnicos':
        // *** IMPORTANTE: Usa la misma consulta de técnicos para el gráfico de rendimiento ***
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
            {$filtros_where}
            GROUP BY
                tecnico
            HAVING
                tecnico <> ''
            ORDER BY 
                cantidad DESC;
        ";
        $datos_rendimiento_bruto = ejecutarConsulta($conn, $sql_tecnicos);
        
        // Determinar el técnico más eficiente/rápido (ejemplo simple)
        $tecnico_eficiente = $datos_rendimiento_bruto[0]['tecnico'] ?? 'N/A';
        $total_tecnicos = count($datos_rendimiento_bruto);

        // Formatear los datos para los gráficos de la pestaña 'tecnicos'
        $labels_rendimiento = array_column($datos_rendimiento_bruto, 'tecnico');
        $datos_rendimiento = array_column($datos_rendimiento_bruto, 'cantidad');

        $response['success'] = true;
        $response['data'] = [
            'tecnico_eficiente' => $tecnico_eficiente,
            'tecnico_rapido' => 'N/A', // Placeholder
            'tecnico_mes' => 'N/A', // Placeholder
            'total_tecnicos' => $total_tecnicos,
            'graficos' => [
                'rendimiento' => [
                    'labels' => $labels_rendimiento,
                    'datos' => $datos_rendimiento,
                ],
                // Aquí deberías agregar tus propios datos para 'tiempos' y 'satisfaccion'
                'tiempos' => ['labels' => ['Técnico A', 'Técnico B'], 'datos' => [2.5, 3.1]], // Placeholder
                'satisfaccion' => ['labels' => ['Excelente', 'Bueno', 'Regular', 'Malo'], 'datos' => [60, 25, 10, 5]], // Placeholder
            ]
        ];
        break;

    default:
        // Mensaje de error por defecto ya está establecido.
        break;
}

$conn->close();
echo json_encode($response);
?>