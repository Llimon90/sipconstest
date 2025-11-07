<?php
// Configura el encabezado para responder en formato JSON
header('Content-Type: application/json');

// --- 1. CONFIGURACIÓN Y CONEXIÓN DE BASE DE DATOS ---

// Asegúrate de que este archivo defina la variable de conexión: $conn
// Ejemplo: $conn = new mysqli('localhost', 'usuario', 'password', 'basedatos');
// **¡IMPORTANTE!** Asegúrate de que 'conexion.php' existe y funciona correctamente.
require_once 'conexion.php'; 

// Verifica la conexión a la base de datos
if (!isset($conn) || $conn->connect_error) {
    // Si la conexión falla, devuelve un error JSON
    echo json_encode([
        'success' => false, 
        'error' => 'Error al cargar la conexión a la base de datos. Por favor, revisa conexion.php.',
        'sql_error' => $conn->connect_error ?? 'No se pudo obtener el error de conexión.'
    ]);
    exit();
}

// Nombre de la tabla de incidencias (ajusta si tu tabla se llama diferente)
$tabla_incidencias = "incidencias"; 

// Estatus que se consideran cerrados/finalizados para calcular resoluciones y tiempos
// Estos estatus deben coincidir exactamente con los valores de tu columna 'estatus' en la DB
$estatus_cerrados = "'cerrado con factura', 'cerrado sin factura', 'Completado', 'Finalizada', 'Resuelto'";


// --- 2. FUNCIONES DE UTILIDAD ---

/**
 * Construye la cláusula WHERE a partir de los parámetros GET (filtros de la UI).
 * * @param mysqli $conn Objeto de conexión a la base de datos.
 * @param string $tabla_alias Alias de la tabla en la consulta (ej: 'i').
 * @param string $campo_fecha Nombre del campo de fecha a filtrar (ej: 'fecha' o 'fecha_cierre').
 * @return string Cláusula WHERE completa o una cadena vacía.
 */
function construirFiltros($conn, $tabla_alias = 'i', $campo_fecha = 'fecha') {
    $filtros = [];
    
    // Manejo del Rango de Fechas
    $rango = $_GET['rango'] ?? '30';
    $campo_fecha_db = $tabla_alias . "." . $campo_fecha;
    
    $fecha_actual = new DateTime();
    $fecha_inicio = null;
    $fecha_fin = $fecha_actual->format('Y-m-d'); 
    
    if ($rango === 'custom' && !empty($_GET['fechaInicio']) && !empty($_GET['fechaFin'])) {
        $fecha_inicio = $_GET['fechaInicio'];
        $fecha_fin = $_GET['fechaFin'];
    } elseif (is_numeric($rango)) {
        // Calcula la fecha de inicio según el rango (7, 30, 90, etc.)
        $fecha_inicio = (clone $fecha_actual)->modify("-{$rango} days")->format('Y-m-d');
    }
    
    if ($fecha_inicio && $fecha_fin) {
        // Filtra el rango de fechas, incluyendo todo el día de la fecha de fin
        $filtros[] = "DATE({$campo_fecha_db}) BETWEEN '{$conn->real_escape_string($fecha_inicio)}' AND '{$conn->real_escape_string($fecha_fin)}'";
    }

    // Manejo de otros filtros (Técnico, Sucursal, Estatus)
    $campos_filtro = ['tecnico', 'sucursal', 'estatus']; 
    foreach ($campos_filtro as $campo) {
        if (!empty($_GET[$campo]) && $_GET[$campo] !== 'all' && $_GET[$campo] !== '') {
            $valor = $conn->real_escape_string($_GET[$campo]);
            if ($campo === 'tecnico') {
                // Filtro para técnico: usa LIKE para encontrar el nombre en la cadena
                $filtros[] = "{$tabla_alias}.{$campo} LIKE '%{$valor}%'";
            } else {
                $filtros[] = "{$tabla_alias}.{$campo} = '{$valor}'";
            }
        }
    }

    // El filtro WHERE debe ser el primer elemento si hay filtros.
    // Si la función devuelve algo, siempre debe empezar con "WHERE " si no hay filtros.
    // Para simplificar, la concatenación se hará en la consulta principal si es necesario.
    return empty($filtros) ? "" : " AND " . implode(" AND ", $filtros);
}

/**
 * Ejecuta una consulta SQL y devuelve los resultados como un array asociativo.
 */
function ejecutarConsulta($conn, $sql) {
    $resultado = $conn->query($sql);
    $data = [];
    if ($resultado === false) {
        // Registra el error en los logs del servidor
        error_log("Error SQL: " . $conn->error . "\nConsulta: " . $sql);
        return ['error' => $conn->error, 'sql' => $sql]; // Devolvemos el error para depuración
    }
    if ($resultado->num_rows > 0) {
        while($fila = $resultado->fetch_assoc()) {
            $data[] = $fila;
        }
    }
    return $data;
}

/**
 * Formatea una cantidad de segundos a un formato Días/Horas/Minutos.
 */
function format_time($segundos) {
    if ($segundos <= 0 || $segundos === null) return 'N/A';
    $segundos = round($segundos);
    $d = floor($segundos / (3600*24));
    $h = floor(($segundos % (3600*24)) / 3600);
    $m = floor(($segundos % 3600) / 60);
    
    $partes = [];
    if ($d > 0) $partes[] = "{$d}d";
    if ($h > 0 || $d > 0) $partes[] = "{$h}h"; // Muestra horas si hay días o si es la unidad más grande
    if ($m > 0 || empty($partes)) $partes[] = "{$m}m"; // Muestra minutos si hay o si no hay nada
    
    return implode(' ', array_filter($partes));
}


// --- 3. LÓGICA DE LA API ---

$action = $_GET['action'] ?? '';
$response = ['success' => false, 'data' => [], 'error' => 'Acción no válida.'];

// Los filtros devuelven una cadena vacía o que comienza con " AND "
$filtros_creacion_str = construirFiltros($conn, 'i', 'fecha');
$filtros_cierre_str = construirFiltros($conn, 'i', 'fecha_cierre');

switch ($action) {
    
    case 'estadisticas_generales':
        
        // 1. Total de incidencias CREADAS (basado en fecha de creación Y filtro)
        $sql_total = "SELECT COUNT(id) AS total_incidencias FROM {$tabla_incidencias} i WHERE 1=1 {$filtros_creacion_str}";
        $total_incidencias = ejecutarConsulta($conn, $sql_total)[0]['total_incidencias'] ?? 0;

        // 2. Incidencias ABIERTAS/PENDIENTES (ESTATUS ACTIVO - IGNORA FILTRO DE FECHA DE RANGO, es un KPI actual)
        // Se considera toda la tabla, sin filtros de fecha
        $sql_pendientes = "SELECT COUNT(id) AS incidencias_pendientes FROM {$tabla_incidencias} WHERE estatus NOT IN ({$estatus_cerrados})";
        $pendientes = ejecutarConsulta($conn, $sql_pendientes)[0]['incidencias_pendientes'] ?? 0;
        
        // 3. Incidencias ASIGNADAS (ESTATUS ASIGNADO - IGNORA FILTRO DE FECHA)
        $sql_asignadas = "SELECT COUNT(id) AS incidencias_asignadas FROM {$tabla_incidencias} WHERE estatus = 'asignado'";
        $asignadas = ejecutarConsulta($conn, $sql_asignadas)[0]['incidencias_asignadas'] ?? 0;

        // 4. Incidencias cerradas/resueltas (basado en fecha_cierre Y filtro de rango)
        $sql_resueltas = "SELECT COUNT(id) AS incidencias_resueltas_rango FROM {$tabla_incidencias} i WHERE i.estatus IN ({$estatus_cerrados}) {$filtros_cierre_str}";
        $resueltas = ejecutarConsulta($conn, $sql_resueltas)[0]['incidencias_resueltas_rango'] ?? 0;
        
        // 5. Incidencias Cerradas con Factura 
        $sql_facturadas = "SELECT COUNT(id) AS incidencias_facturadas FROM {$tabla_incidencias} i WHERE i.estatus = 'cerrado con factura' {$filtros_cierre_str}";
        $facturadas = ejecutarConsulta($conn, $sql_facturadas)[0]['incidencias_facturadas'] ?? 0;

        // 6. Tiempo promedio de resolución (usando TIMESTAMPDIFF) - Promedio de todas las resueltas en el rango
        $sql_tiempo = "
            SELECT 
                AVG(TIMESTAMPDIFF(SECOND, fecha, fecha_cierre)) AS tiempo_segundos
            FROM 
                {$tabla_incidencias} i 
            WHERE 
                i.estatus IN ({$estatus_cerrados}) 
                AND fecha_cierre IS NOT NULL
                AND fecha_cierre > fecha 
                {$filtros_cierre_str}
        ";
        $tiempo_segundos = ejecutarConsulta($conn, $sql_tiempo)[0]['tiempo_segundos'] ?? 0;
        $tiempo_formateado = format_time($tiempo_segundos);
        
        // 7. Total de clientes únicos (IGNORA FILTRO DE FECHA, es un KPI general)
        $sql_clientes = "SELECT COUNT(DISTINCT cliente) AS total_clientes FROM {$tabla_incidencias} WHERE cliente IS NOT NULL AND cliente <> ''";
        $total_clientes = ejecutarConsulta($conn, $sql_clientes)[0]['total_clientes'] ?? 0;
        
        // 8. Top 10 Clientes con Más Incidencias (para el gráfico)
        $sql_top_clientes = "
            SELECT 
                cliente, 
                COUNT(id) AS cantidad 
            FROM 
                {$tabla_incidencias} i 
            WHERE 
                1=1 {$filtros_creacion_str}
                AND cliente IS NOT NULL AND cliente <> '' 
            GROUP BY 
                cliente 
            ORDER BY 
                cantidad DESC 
            LIMIT 10
        ";
        $top_clientes = ejecutarConsulta($conn, $sql_top_clientes);
        
        $response['success'] = true;
        $response['data'] = [
            'total_incidencias' => (int)$total_incidencias,
            'incidencias_pendientes' => (int)$pendientes,
            'incidencias_asignadas' => (int)$asignadas,
            'incidencias_resueltas_rango' => (int)$resueltas, // Usado para KPI "Resueltas Este Mes" y "Completadas"
            'incidencias_facturadas' => (int)$facturadas, 
            'total_clientes' => (int)$total_clientes,
            'tiempo_promedio' => $tiempo_formateado,
            'top_clientes' => $top_clientes 
        ];
        break;

    case 'estadisticas_incidencias':
        $data_incidencias = [];

        // Los gráficos usan el filtro de fecha de CREACIÓN
        $where_creacion_graficos = "WHERE 1=1 {$filtros_creacion_str}";

        // Gráfico 1: Por Estatus
        $sql_estatus = "
            SELECT 
                estatus, 
                COUNT(id) AS cantidad 
            FROM 
                {$tabla_incidencias} i {$where_creacion_graficos}
            GROUP BY 
                estatus 
            ORDER BY 
                cantidad DESC
        ";
        $data_incidencias['por_estatus'] = ejecutarConsulta($conn, $sql_estatus);

        // Gráfico 2: Por Sucursal
        $sql_sucursal = "
            SELECT 
                sucursal, 
                COUNT(id) AS cantidad 
            FROM 
                {$tabla_incidencias} i {$where_creacion_graficos} 
            WHERE 
                sucursal IS NOT NULL AND sucursal <> ''
            GROUP BY 
                sucursal 
            ORDER BY 
                cantidad DESC 
            LIMIT 5
        ";
        $data_incidencias['por_sucursal'] = ejecutarConsulta($conn, $sql_sucursal);
        
        // Gráfico 3: Histórico mensual de creación
        $sql_mensual = "
            SELECT 
                DATE_FORMAT(fecha, '%Y-%m') as mes, 
                COUNT(id) AS cantidad 
            FROM 
                {$tabla_incidencias} i {$where_creacion_graficos}
            GROUP BY 
                mes 
            ORDER BY 
                mes ASC
        ";
        $data_incidencias['mensuales'] = ejecutarConsulta($conn, $sql_mensual);

        // Gráfico 4: Top 5 Falla/Causa Raíz
        $sql_falla = "
            SELECT 
                falla, 
                COUNT(id) AS cantidad 
            FROM 
                {$tabla_incidencias} i {$where_creacion_graficos} 
            WHERE 
                falla IS NOT NULL AND falla <> ''
            GROUP BY 
                falla 
            ORDER BY 
                cantidad DESC 
            LIMIT 5
        ";
        $data_incidencias['top_fallas'] = ejecutarConsulta($conn, $sql_falla);
        
        // Gráfico 5: Distribución por Prioridad (asumiendo columna 'prioridad')
        $sql_prioridad = "
            SELECT 
                prioridad, 
                COUNT(id) AS cantidad 
            FROM 
                {$tabla_incidencias} i {$where_creacion_graficos}
            WHERE 
                prioridad IS NOT NULL AND prioridad <> ''
            GROUP BY 
                prioridad 
            ORDER BY 
                CASE prioridad WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 WHEN 'Baja' THEN 3 ELSE 4 END ASC
        ";
        $data_incidencias['por_prioridad'] = ejecutarConsulta($conn, $sql_prioridad);

        // También incluimos el rendimiento por técnico para el gráfico de la pestaña "Resumen General"
        $sql_tecnico = "
            SELECT 
                tecnico, 
                COUNT(id) AS cantidad 
            FROM 
                {$tabla_incidencias} i {$where_creacion_graficos} 
            WHERE 
                tecnico IS NOT NULL AND tecnico <> ''
            GROUP BY 
                tecnico 
            ORDER BY 
                cantidad DESC 
            LIMIT 5
        ";
        $data_incidencias['por_tecnico'] = ejecutarConsulta($conn, $sql_tecnico);

        $response['success'] = true;
        $response['data'] = $data_incidencias;
        break;

    case 'estadisticas_tecnicos':
        // **BLOQUE CORREGIDO PARA CONTAR MÚLTIPLES TÉCNICOS**
        
        // Filtro para rendimiento: solo incidencias CERRADAS/RESUELTAS (fecha_cierre)
        $where_cierre_tecnicos = "WHERE i.estatus IN ({$estatus_cerrados}) AND i.tecnico IS NOT NULL AND i.tecnico <> '' {$filtros_cierre_str}";
        
        // --- 1. Rendimiento: Incidencias Resueltas por Técnico (Usa la técnica de subconsulta/JOIN para manejar múltiples técnicos)
        $sql_rendimiento = "
            SELECT 
                TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(i.tecnico, ',', n.num), ',', -1)) AS tecnico,
                COUNT(i.id) AS cantidad
            FROM 
                {$tabla_incidencias} i
            JOIN 
                (
                    -- Generamos hasta 10 números, asumiendo que no hay más de 10 técnicos por incidencia
                    SELECT 1 AS num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 
                    UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
                ) n 
                -- Esta condición asegura que el JOIN se haga tantas veces como comas + 1 haya en el campo tecnico
                ON CHAR_LENGTH(i.tecnico) - CHAR_LENGTH(REPLACE(i.tecnico, ',', '')) >= n.num - 1
            {$where_cierre_tecnicos}
            GROUP BY
                tecnico
            HAVING
                tecnico <> ''
            ORDER BY 
                cantidad DESC;
        ";
        $datos_rendimiento_bruto = ejecutarConsulta($conn, $sql_rendimiento);
        
        // --- 2. Tiempos promedio de resolución por técnico
        $sql_tiempos = "
            SELECT 
                TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(i.tecnico, ',', n.num), ',', -1)) AS tecnico,
                AVG(TIMESTAMPDIFF(SECOND, fecha, fecha_cierre)) AS tiempo_segundos
            FROM 
                {$tabla_incidencias} i
            JOIN 
                (
                    SELECT 1 AS num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
                    UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
                ) n 
                ON CHAR_LENGTH(i.tecnico) - CHAR_LENGTH(REPLACE(i.tecnico, ',', '')) >= n.num - 1
            WHERE 
                i.estatus IN ({$estatus_cerrados}) 
                AND i.fecha_cierre IS NOT NULL
                AND i.fecha_cierre > i.fecha
                AND i.tecnico IS NOT NULL AND i.tecnico <> ''
                {$filtros_cierre_str}
            GROUP BY
                tecnico
            HAVING
                tecnico <> ''
            ORDER BY 
                tiempo_segundos ASC;
        ";
        $datos_tiempos_bruto = ejecutarConsulta($conn, $sql_tiempos);
        
        // --- 3. Datos de Satisfacción del Cliente (Usando datos de ejemplo ya que no hay una tabla de satisfacción)
        // **Reemplaza esta sección si tienes datos reales.**
        $datos_satisfaccion = [
            ['nivel' => 'Excelente', 'cantidad' => 60],
            ['nivel' => 'Bueno', 'cantidad' => 25],
            ['nivel' => 'Regular', 'cantidad' => 10],
            ['nivel' => 'Malo', 'cantidad' => 5],
        ];

        // --- 4. Determinar KPI de técnicos
        $tecnico_eficiente = $datos_rendimiento_bruto[0]['tecnico'] ?? 'N/A'; // Más resueltas
        $tecnico_rapido = $datos_tiempos_bruto[0]['tecnico'] ?? 'N/A'; // Menor tiempo
        $tecnico_mes = $tecnico_eficiente; // Usamos la eficiencia como "Técnico del Mes"
        
        // Conteo total de técnicos únicos que tienen tareas resueltas en el rango
        $total_tecnicos = count(array_unique(array_column($datos_rendimiento_bruto, 'tecnico'))); 
        
        // Mapeo para gráficos
        $labels_tiempos = array_column($datos_tiempos_bruto, 'tecnico');
        $datos_tiempos = array_map(function($segundos) {
            // Convierte segundos a días (más legible en el gráfico de rendimiento)
            return round($segundos / (3600 * 24), 2); 
        }, array_column($datos_tiempos_bruto, 'tiempo_segundos'));
        
        $response['success'] = true;
        $response['data'] = [
            'tecnico_eficiente' => $tecnico_eficiente,
            'tecnico_rapido' => $tecnico_rapido,
            'tecnico_mes' => $tecnico_mes, 
            'total_tecnicos' => $total_tecnicos,
            'graficos' => [
                'rendimiento' => ['labels' => array_column($datos_rendimiento_bruto, 'tecnico'), 'datos' => array_column($datos_rendimiento_bruto, 'cantidad')],
                'tiempos' => ['labels' => $labels_tiempos, 'datos' => $datos_tiempos],
                'satisfaccion' => ['labels' => array_column($datos_satisfaccion, 'nivel'), 'datos' => array_column($datos_satisfaccion, 'cantidad')], 
            ]
        ];
        break;

    default:
        $response['error'] = 'Acción de API no reconocida. Asegúrate de que el parámetro "action" esté presente y sea válido.';
        break;
}

// Cierra la conexión y devuelve la respuesta JSON
$conn->close();
echo json_encode($response);

// Si ocurrió un error en la ejecución, puedes añadir una depuración aquí
if (isset($response['data']) && is_array($response['data']) && isset($response['data']['error'])) {
    error_log("Error en la respuesta de la API: " . json_encode($response));
}

?>