<?php
/**
 * Archivo: ../backend/estadisticas.php
 * Endpoint de API para la carga de datos estadísticos.
 */

// ----------------------------------------------------
// 1. CONFIGURACIÓN INICIAL Y CONEXIÓN
// ----------------------------------------------------

// Define la cabecera para que el navegador y JS esperen un JSON
header('Content-Type: application/json');

// Incluir el archivo de conexión. 
// 🛑 AJUSTA ESTA RUTA si es necesario. (Ruta original: '../../conexion.php')
require_once '../../conexion.php'; 

// Asume que la variable de conexión ($pdo, por ejemplo) está disponible aquí.

// ----------------------------------------------------
// 2. UTILERÍAS DE RESPUESTA JSON
// ----------------------------------------------------

/** Función para enviar una respuesta de éxito en formato JSON. */
function response(array $data, int $http_code = 200) {
    http_response_code($http_code);
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

/** Función para enviar una respuesta de error en formato JSON. */
function error_response(string $message, int $http_code = 400) {
    http_response_code($http_code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}


// ----------------------------------------------------
// 3. OBTENER Y VALIDAR PARÁMETROS DE FILTRO
// ----------------------------------------------------

$action = $_GET['action'] ?? null;
$rango = $_GET['rango'] ?? '30';
$tecnico = $_GET['tecnico'] ?? 'all';
$sucursal = $_GET['sucursal'] ?? 'all';
$estatus = $_GET['estatus'] ?? 'all';
$fechaInicio = $_GET['fechaInicio'] ?? null;
$fechaFin = $_GET['fechaFin'] ?? null;

if ($rango === 'custom' && (empty($fechaInicio) || empty($fechaFin))) {
    error_response("Debe especificar las fechas de inicio y fin para el rango personalizado.", 400);
}


// ----------------------------------------------------
// 4. LÓGICA DE ENRUTAMIENTO Y CARGA DE DATOS
// ----------------------------------------------------

if (empty($action)) {
    error_response("Acción no especificada.", 400);
}

// Verifica la conexión
global $pdo; 
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
    error_response("Error al procesar la solicitud: " . $e->getMessage(), 500);
}


// ----------------------------------------------------
// 5. FUNCIONES DE LÓGICA DE DATOS (CON SQL DE EJEMPLO)
// ----------------------------------------------------

/** * Obtiene los datos para llenar los selectores (Técnicos y Sucursales). */
function obtener_datos_filtros(PDO $pdo): array {
    $tecnicos = [];
    $sucursales = [];

    // Lógica para obtener técnicos (ID y Nombre)
    $stmt_tec = $pdo->query("SELECT id_tecnico AS id, nombre FROM tecnicos ORDER BY nombre");
    $tecnicos = $stmt_tec->fetchAll(PDO::FETCH_ASSOC);

    // Lógica para obtener sucursales (ID y Nombre)
    $stmt_suc = $pdo->query("SELECT id_sucursal AS id, nombre FROM sucursales ORDER BY nombre");
    $sucursales = $stmt_suc->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'tecnicos' => $tecnicos,
        'sucursales' => $sucursales,
    ];
}


/** * Obtiene datos para el resumen general y KPIs. */
function obtener_estadisticas_generales(PDO $pdo, string $rango, string $tecnico, string $sucursal, string $estatus, ?string $fechaInicio, ?string $fechaFin): array {
    list($where_clause, $params) = build_filter_where_clause($rango, $tecnico, $sucursal, $estatus, $fechaInicio, $fechaFin);

    // KPI 1: Total de Incidencias
    $sql_total = "SELECT COUNT(id) as total FROM incidencias i {$where_clause}";
    $stmt_total = $pdo->prepare($sql_total);
    $stmt_total->execute($params);
    $total_incidencias = $stmt_total->fetchColumn();

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
        'total_incidencias' => $total_incidencias,
        'total_clientes' => "0", // Reemplazar con consulta real
        'incidencias_resueltas_rango' => "0", // Reemplazar con consulta real
        'tiempo_promedio' => "N/A", // Reemplazar con cálculo real
        
        'top_clientes' => $top_clientes,
        'evolucion_mensual' => [], // Reemplazar con consulta real
    ];
}

/** * Obtiene datos para el análisis de incidencias. */
function obtener_estadisticas_incidencias(PDO $pdo, string $rango, string $tecnico, string $sucursal, string $estatus, ?string $fechaInicio, ?string $fechaFin): array {
    list($where_clause, $params) = build_filter_where_clause($rango, $tecnico, $sucursal, $estatus, $fechaInicio, $fechaFin);

    // EJEMPLO: Incidencias por Estatus
    $sql_estatus = "SELECT estatus AS label, COUNT(id) AS value 
                    FROM incidencias i
                    {$where_clause} 
                    GROUP BY estatus";
    $stmt_estatus = $pdo->prepare($sql_estatus);
    $stmt_estatus->execute($params);
    $incidencias_por_estatus = $stmt_estatus->fetchAll(PDO::FETCH_ASSOC);

    return [
        'incidencias_abiertas_kpi' => "0", // Reemplazar
        'incidencias_asignadas_kpi' => "0", // Reemplazar
        'incidencias_resueltas_rango' => "0", // Reemplazar
        'incidencias_facturadas_kpi' => "0", // Reemplazar

        'incidencias_por_estatus' => $incidencias_por_estatus,
        'incidencias_por_sucursal' => [], 
        'top_fallas_recurrentes' => [], 
        'incidencias_por_prioridad' => [], 
    ];
}

/** * Obtiene datos para el rendimiento de técnicos. */
function obtener_estadisticas_tecnicos(PDO $pdo, string $rango, string $tecnico, string $sucursal, string $estatus, ?string $fechaInicio, ?string $fechaFin): array {
    list($where_clause, $params) = build_filter_where_clause($rango, $tecnico, $sucursal, $estatus, $fechaInicio, $fechaFin);

    // EJEMPLO: Rendimiento por Técnico
    $sql_rendimiento = "SELECT t.nombre AS label, COUNT(i.id) AS value 
                        FROM incidencias i 
                        JOIN tecnicos t ON i.id_tecnico = t.id_tecnico 
                        {$where_clause} 
                        GROUP BY t.nombre";
    $stmt_rendimiento = $pdo->prepare($sql_rendimiento);
    $stmt_rendimiento->execute($params);
    $rendimiento_tecnicos = $stmt_rendimiento->fetchAll(PDO::FETCH_ASSOC);

    return [
        'tecnico_mas_eficiente' => 'N/A', 
        'tecnico_mas_rapido' => 'N/A', 
        'tecnico_del_mes' => 'N/A', 
        'total_tecnicos_activos' => 'N/A', 

        'rendimiento_tecnicos' => $rendimiento_tecnicos,
        'tiempos_respuesta' => [], 
        'satisfaccion_cliente' => [], 
    ];
}


// ----------------------------------------------------
// 6. FUNCIÓN AUXILIAR DE FILTROS (RECOMENDADA)
// ----------------------------------------------------

/** * Construye la cláusula WHERE y los parámetros para los filtros. */
function build_filter_where_clause(string $rango, string $tecnico, string $sucursal, string $estatus, ?string $fechaInicio, ?string $fechaFin): array {
    $where_parts = [];
    $params = [];
    $today = date('Y-m-d');
    $date_field = 'i.fecha_creacion'; 

    // 1. FILTRO DE RANGO DE FECHAS
    if ($rango === '7') {
        $fecha_limite = date('Y-m-d', strtotime('-7 days', strtotime($today)));
        $where_parts[] = "{$date_field} >= :fecha_limite";
        $params[':fecha_limite'] = $fecha_limite;
    } elseif ($rango === '30') {
        $fecha_limite = date('Y-m-d', strtotime('-30 days', strtotime($today)));
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