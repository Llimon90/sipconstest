<?php
/**
 * Archivo: ../backend/estadisticas.php
 * Endpoint de API para la carga de datos estadísticos.
 * Requiere el archivo de conexión a la base de datos (conexion.php).
 */

// ----------------------------------------------------
// 1. CONFIGURACIÓN INICIAL Y CONEXIÓN
// ----------------------------------------------------

// Define la cabecera para que el navegador y JS esperen un JSON
header('Content-Type: application/json');

// Incluir el archivo de conexión. 
// 🛑 AJUSTA ESTA RUTA si es necesario. Asumo que está dos niveles arriba para llegar a la raíz del proyecto.
// Si tu estructura es:
// /
//   |- conexion.php
//   |- backend/
//        |- estadisticas.php  <-- Estás aquí
require_once 'conexion.php'; 

// La conexión a la base de datos debe estar disponible aquí como una variable,
// por ejemplo: $pdo (si usas PDO) o $conn (si usas MySQLi).
// Si tu archivo conexion.php no devuelve la variable de conexión,
// necesitarás ajustarlo para que sí lo haga.

// ----------------------------------------------------
// 2. UTILERÍAS DE RESPUESTA JSON
// ----------------------------------------------------

/**
 * Función para enviar una respuesta de éxito en formato JSON.
 */
function response(array $data, int $http_code = 200) {
    http_response_code($http_code);
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

/**
 * Función para enviar una respuesta de error en formato JSON.
 */
function error_response(string $message, int $http_code = 400) {
    http_response_code($http_code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}


// ----------------------------------------------------
// 3. OBTENER Y VALIDAR PARÁMETROS DE FILTRO
// ----------------------------------------------------

$action = $_GET['action'] ?? null;

// Obtener filtros con valores predeterminados
$rango = $_GET['rango'] ?? '30';
$tecnico = $_GET['tecnico'] ?? 'all';
$sucursal = $_GET['sucursal'] ?? 'all';
$estatus = $_GET['estatus'] ?? 'all';
$fechaInicio = $_GET['fechaInicio'] ?? null;
$fechaFin = $_GET['fechaFin'] ?? null;

// Validación básica de filtros personalizados
if ($rango === 'custom' && (empty($fechaInicio) || empty($fechaFin))) {
    error_response("Debe especificar las fechas de inicio y fin para el rango personalizado.", 400);
}


// ----------------------------------------------------
// 4. LÓGICA DE ENRUTAMIENTO Y CARGA DE DATOS
// ----------------------------------------------------

if (empty($action)) {
    error_response("Acción no especificada.", 400);
}

// Asumo que tu conexión (por ejemplo, $pdo) está disponible aquí
global $pdo; // Asegúrate de que tu conexión esté disponible globalmente o pásala como parámetro.
if (!isset($pdo)) {
    error_response("Error interno del servidor: La conexión a la BD no está disponible.", 500);
}


try {
    switch ($action) {
        case 'estadisticas_generales':
            $data = obtener_estadisticas_generales($pdo, $rango, $tecnico, $sucursal, $estatus, $fechaInicio, $fechaFin);
            response($data);
            break;

        case 'estadisticas_incidencias':
            $data = obtener_estadisticas_incidencias($pdo, $rango, $tecnico, $sucursal, $estatus, $fechaInicio, $fechaFin);
            response($data);
            break;
            
        case 'estadisticas_tecnicos':
            $data = obtener_estadisticas_tecnicos($pdo, $rango, $tecnico, $sucursal, $estatus, $fechaInicio, $fechaFin);
            response($data);
            break;
            
        case 'get_filtros':
            $filtros_data = obtener_datos_filtros($pdo);
            response($filtros_data);
            break;

        default:
            error_response("Acción '{$action}' no reconocida.", 404);
            break;
    }
} catch (Exception $e) {
    // Captura cualquier excepción generada durante las consultas SQL
    error_response("Error al procesar la solicitud: " . $e->getMessage(), 500);
}


// ----------------------------------------------------
// 5. FUNCIONES DE LÓGICA DE DATOS (INSERTAR CÓDIGO SQL DE PRODUCCIÓN AQUÍ)
// ----------------------------------------------------

/** * Obtiene los datos para llenar los selectores (Técnicos y Sucursales).
 * @param PDO $pdo Objeto de conexión a la BD.
 */
function obtener_datos_filtros(PDO $pdo): array {
    $tecnicos = [];
    $sucursales = [];

    // 🛑 IMPLEMENTAR: Lógica para obtener técnicos (ID y Nombre)
    // Ejemplo PDO:
    $stmt_tec = $pdo->query("SELECT id_tecnico AS id, nombre FROM tecnicos ORDER BY nombre");
    $tecnicos = $stmt_tec->fetchAll(PDO::FETCH_ASSOC);

    // 🛑 IMPLEMENTAR: Lógica para obtener sucursales (ID y Nombre)
    // Ejemplo PDO:
    $stmt_suc = $pdo->query("SELECT id_sucursal AS id, nombre FROM sucursales ORDER BY nombre");
    $sucursales = $stmt_suc->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'tecnicos' => $tecnicos,
        'sucursales' => $sucursales,
    ];
}


/** * Obtiene datos para el resumen general y KPIs.
 * @param PDO $pdo Objeto de conexión a la BD.
 */
function obtener_estadisticas_generales(PDO $pdo, string $rango, string $tecnico, string $sucursal, string $estatus, ?string $fechaInicio, ?string $fechaFin): array {
    // 🛑 IMPLEMENTAR: Aquí debes construir tu(s) consulta(s) SQL usando los parámetros de filtro.
    // **Asegúrate de que la estructura de array devuelta coincida con lo que espera el JS.**

    // Lógica de construcción de WHERE (ejemplo)
    list($where_clause, $params) = build_filter_where_clause($rango, $tecnico, $sucursal, $estatus, $fechaInicio, $fechaFin);

    // --- EJEMPLO DE CÓMO OBTENER KPIs ---
    
    // KPI 1: Total de Incidencias
    $sql_total = "SELECT COUNT(id) as total FROM incidencias {$where_clause}";
    $stmt_total = $pdo->prepare($sql_total);
    $stmt_total->execute($params);
    $total_incidencias = $stmt_total->fetchColumn();

    // KPI 2: Tiempo promedio de resolución (complejidad requiere una función auxiliar)
    $tiempo_promedio = "N/A"; // Debes calcular esto con SQL

    // --- EJEMPLO DE CÓMO OBTENER DATOS PARA GRÁFICOS ---

    // Gráfico 1: Top Clientes
    $sql_top_clientes = "SELECT c.nombre AS label, COUNT(i.id) AS value 
                         FROM incidencias i 
                         JOIN clientes c ON i.id_cliente = c.id
                         {$where_clause} 
                         GROUP BY c.nombre 
                         ORDER BY value DESC 
                         LIMIT 5";
    $stmt_clientes = $pdo->prepare($sql_top_clientes);
    $stmt_clientes->execute($params);
    $top_clientes = $stmt_clientes->fetchAll(PDO::FETCH_ASSOC);

    return [
        // KPIs (Ejemplo)
        'total_incidencias' => $total_incidencias,
        'total_clientes' => "50", // Reemplazar con consulta real
        'incidencias_resueltas_rango' => "120", // Reemplazar con consulta real
        'tiempo_promedio' => $tiempo_promedio,
        
        // Datos para Gráficos
        'top_clientes' => $top_clientes,
        'evolucion_mensual' => [], // Reemplazar con consulta real (ej. SELECT DATE_FORMAT(fecha, '%Y-%m') AS label, COUNT(id) AS value FROM incidencias GROUP BY label)
    ];
}

/** * Obtiene datos para el análisis de incidencias.
 * @param PDO $pdo Objeto de conexión a la BD.
 */
function obtener_estadisticas_incidencias(PDO $pdo, string $rango, string $tecnico, string $sucursal, string $estatus, ?string $fechaInicio, ?string $fechaFin): array {
    // 🛑 IMPLEMENTAR: Aquí debes construir tu(s) consulta(s) SQL para gráficos de distribución.
    list($where_clause, $params) = build_filter_where_clause($rango, $tecnico, $sucursal, $estatus, $fechaInicio, $fechaFin);

    // --- EJEMPLO: Incidencias por Estatus ---
    $sql_estatus = "SELECT estatus AS label, COUNT(id) AS value 
                    FROM incidencias 
                    {$where_clause} 
                    GROUP BY estatus";
    $stmt_estatus = $pdo->prepare($sql_estatus);
    $stmt_estatus->execute($params);
    $incidencias_por_estatus = $stmt_estatus->fetchAll(PDO::FETCH_ASSOC);

    return [
        // KPIs (ejemplo: usar un SELECT COUNT con filtro 'Abierto')
        'incidencias_abiertas_kpi' => "15", // Reemplazar
        'incidencias_asignadas_kpi' => "25", // Reemplazar
        'incidencias_resueltas_rango' => "120", // Reemplazar
        'incidencias_facturadas_kpi' => "80", // Reemplazar

        // Gráficos
        'incidencias_por_estatus' => $incidencias_por_estatus,
        'incidencias_por_sucursal' => [], // Reemplazar con consulta real
        'top_fallas_recurrentes' => [], // Reemplazar con consulta real
        'incidencias_por_prioridad' => [], // Reemplazar con consulta real
    ];
}

/** * Obtiene datos para el rendimiento de técnicos.
 * @param PDO $pdo Objeto de conexión a la BD.
 */
function obtener_estadisticas_tecnicos(PDO $pdo, string $rango, string $tecnico, string $sucursal, string $estatus, ?string $fechaInicio, ?string $fechaFin): array {
    // 🛑 IMPLEMENTAR: Aquí debes construir tu(s) consulta(s) SQL para el rendimiento de técnicos.
    list($where_clause, $params) = build_filter_where_clause($rango, $tecnico, $sucursal, $estatus, $fechaInicio, $fechaFin);

    // --- EJEMPLO: Rendimiento por Técnico ---
    $sql_rendimiento = "SELECT t.nombre AS label, COUNT(i.id) AS value 
                        FROM incidencias i 
                        JOIN tecnicos t ON i.id_tecnico = t.id_tecnico 
                        WHERE i.estatus = 'Cerrado' AND {$where_clause} 
                        GROUP BY t.nombre";
    $stmt_rendimiento = $pdo->prepare($sql_rendimiento);
    $stmt_rendimiento->execute($params);
    $rendimiento_tecnicos = $stmt_rendimiento->fetchAll(PDO::FETCH_ASSOC);

    return [
        // KPIs
        'tecnico_mas_eficiente' => 'N/A', // Reemplazar
        'tecnico_mas_rapido' => 'N/A', // Reemplazar
        'tecnico_del_mes' => 'N/A', // Reemplazar
        'total_tecnicos_activos' => 'N/A', // Reemplazar

        // Gráficos
        'rendimiento_tecnicos' => $rendimiento_tecnicos,
        'tiempos_respuesta' => [], // Reemplazar con consulta real
        'satisfaccion_cliente' => [], // Reemplazar con consulta real
    ];
}


// ----------------------------------------------------
// 6. FUNCIÓN AUXILIAR DE FILTROS (RECOMENDADA)
// ----------------------------------------------------

/**
 * Construye la cláusula WHERE y los parámetros para los filtros.
 * @return array Contiene la cláusula WHERE y el array de parámetros para PDO.
 */
function build_filter_where_clause(string $rango, string $tecnico, string $sucursal, string $estatus, ?string $fechaInicio, ?string $fechaFin): array {
    $where_parts = [];
    $params = [];
    $today = date('Y-m-d');
    $date_field = 'i.fecha_creacion'; // Usa el campo de fecha correcto

    // 1. FILTRO DE RANGO DE FECHAS
    if ($rango === '7') {
        $fecha_limite = date('Y-m-d', strtotime('-7 days', strtotime($today)));
        $where_parts[] = "{$date_field} >= :fecha_limite";
        $params[':fecha_limite'] = $fecha_limite;
    } elseif ($rango === '30') {
        $fecha_limite = date('Y-m-d', strtotime('-30 days', strtotime($today)));
        $where_parts[] = "{$date_field} >= :fecha_limite";
        $params[':fecha_limite'] = $fecha_limite;
    } elseif ($rango === '90') {
        $fecha_limite = date('Y-m-d', strtotime('-90 days', strtotime($today)));
        $where_parts[] = "{$date_field} >= :fecha_limite";
        $params[':fecha_limite'] = $fecha_limite;
    } elseif ($rango === 'custom' && $fechaInicio && $fechaFin) {
        $where_parts[] = "{$date_field} BETWEEN :fecha_inicio AND :fecha_fin";
        $params[':fecha_inicio'] = $fechaInicio;
        $params[':fecha_fin'] = $fechaFin;
    }

    // 2. FILTRO POR TÉCNICO
    if ($tecnico !== 'all') {
        $where_parts[] = "i.id_tecnico = :tecnico";
        $params[':tecnico'] = $tecnico;
    }

    // 3. FILTRO POR SUCURSAL
    if ($sucursal !== 'all') {
        $where_parts[] = "i.id_sucursal = :sucursal";
        $params[':sucursal'] = $sucursal;
    }

    // 4. FILTRO POR ESTATUS
    if ($estatus !== 'all') {
        $where_parts[] = "i.estatus = :estatus";
        $params[':estatus'] = $estatus;
    }
    
    $where_clause = '';
    if (!empty($where_parts)) {
        $where_clause = ' WHERE ' . implode(' AND ', $where_parts);
    }

    return [$where_clause, $params];
}