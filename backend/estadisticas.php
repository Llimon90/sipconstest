<?php
header('Content-Type: application/json');

// --- 1. CONFIGURACIÓN DE BASE DE DATOS (AJUSTA ESTO) ---
$servername = "localhost";
$username = "tu_usuario"; 
$password = "tu_contraseña"; 
$dbname = "tu_base_de_datos";

// Nombre de tu tabla de incidencias
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
    $campo_fecha = $tabla_alias . ".fecha_cierre"; // Asegúrate que es tu columna de cierre/resolución
    
    $fecha_actual = new DateTime();
    $fecha_inicio = null;
    $fecha_fin = $fecha_actual->format('Y-m-d'); 
    
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
    $campos_filtro = ['tecnico', 'sucursal', 'estatus']; 
    foreach ($campos_filtro as $campo) {
        if (!empty($_GET[$campo]) && $_GET[$campo] !== 'all') {
            $valor = $conn->real_escape_string($_GET[$campo]);
            if ($campo === 'tecnico') {
                // Filtro especial: buscar el nombre del técnico dentro de la cadena
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
$filtros_where = construirFiltros($conn, 'i');

switch ($action) {
    
    case 'estadisticas_generales':
        // --- CÓDIGO PARA ESTADÍSTICAS GENERALES (PLACEHOLDERS) ---
        $sql_total = "SELECT COUNT(id) AS total_incidencias FROM {$tabla_incidencias} i {$filtros_where}";
        $total_incidencias = ejecutarConsulta($conn, $sql_total)[0]['total_incidencias'] ?? 0;

        $sql_pendientes = "SELECT COUNT(id) AS incidencias_pendientes FROM {$tabla_incidencias} i {$filtros_where} AND i.estatus NOT IN ('Cerrado', 'Resuelto')";
        $pendientes = ejecutarConsulta($conn, $sql_pendientes)[0]['incidencias_pendientes'] ?? 0;

        $response['success'] = true;
        $response['data'] = [
            'total_incidencias' => (int)$total_incidencias,
            'incidencias_pendientes' => (int)$pendientes,
            'total_clientes' => 125, // Ejemplo
            'incidencias_resueltas_mes' => 80, // Ejemplo
            'tiempo_promedio' => '1d 5h', // Ejemplo
            'tendencia_incidencias' => 15 // Ejemplo
        ];
        break;

    case 'estadisticas_incidencias':
        $data_incidencias = [];

        // Gráfico por estatus
        $sql_estatus = "SELECT estatus, COUNT(id) AS cantidad FROM {$tabla_incidencias} i {$filtros_where} GROUP BY estatus ORDER BY cantidad DESC";
        $data_incidencias['por_estatus'] = ejecutarConsulta($conn, $sql_estatus);

        // Gráfico por sucursal
        $sql_sucursal = "SELECT sucursal, COUNT(id) AS cantidad FROM {$tabla_incidencias} i {$filtros_where} GROUP BY sucursal ORDER BY cantidad DESC LIMIT 5";
        $data_incidencias['por_sucursal'] = ejecutarConsulta($conn, $sql_sucursal);
        
        // Gráfico mensual
        $sql_mensual = "SELECT DATE_FORMAT(fecha_cierre, '%Y-%m') as mes, COUNT(id) AS cantidad FROM {$tabla_incidencias} i {$filtros_where} GROUP BY mes ORDER BY mes ASC";
        $data_incidencias['mensuales'] = ejecutarConsulta($conn, $sql_mensual);

        // *** LÓGICA CLAVE: CONTABILIZAR TÉCNICOS POR PARTICIPACIÓN (SIN TABLA PIVOTE) ***
        $sql_tecnicos = "
            SELECT 
                TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(i.tecnico, ',', n.num), ',', -1)) AS tecnico,
                COUNT(i.id) AS cantidad
            FROM 
                {$tabla_incidencias} i
            JOIN 
                (
                    -- Esto define el número MÁXIMO de técnicos por incidencia. Aumenta si es necesario.
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
        $data_incidencias['por_tecnico'] = ejecutarConsulta($conn, $sql_tecnicos);
        // *********************************************************************************
        
        $response['success'] = true;
        $response['data'] = $data_incidencias;
        break;

    case 'estadisticas_tecnicos':
        // --- CÓDIGO PARA DATOS DE TÉCNICOS ---
        
        // Se reutiliza la lógica de desglose de técnicos para el rendimiento
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
        
        $tecnico_eficiente = $datos_rendimiento_bruto[0]['tecnico'] ?? 'N/A';
        $total_tecnicos = count($datos_rendimiento_bruto);

        $labels_rendimiento = array_column($datos_rendimiento_bruto, 'tecnico');
        $datos_rendimiento = array_column($datos_rendimiento_bruto, 'cantidad');

        $response['success'] = true;
        $response['data'] = [
            'tecnico_eficiente' => $tecnico_eficiente,
            'tecnico_rapido' => 'Tomás Valdéz', // Ejemplo
            'tecnico_mes' => 'Victor Cordoba', // Ejemplo
            'total_tecnicos' => $total_tecnicos,
            'graficos' => [
                'rendimiento' => [
                    'labels' => $labels_rendimiento,
                    'datos' => $datos_rendimiento,
                ],
                // Datos de ejemplo para otros gráficos de técnicos
                'tiempos' => ['labels' => ['Técnico A', 'Técnico B'], 'datos' => [2.5, 3.1]], 
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