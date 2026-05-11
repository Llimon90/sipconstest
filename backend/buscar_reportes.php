<?php
// buscar_reportes.php

require_once 'conexion.php';

if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

$cliente          = isset($_GET['cliente']) ? trim($_GET['cliente']) : '';
$fecha_inicio     = isset($_GET['fecha_inicio']) ? trim($_GET['fecha_inicio']) : '';
$fecha_fin        = isset($_GET['fecha_fin']) ? trim($_GET['fecha_fin']) : '';
$estatus          = isset($_GET['estatus']) ? trim($_GET['estatus']) : '';
$sucursal         = isset($_GET['sucursal']) ? trim($_GET['sucursal']) : '';
$tecnico          = isset($_GET['tecnico']) ? trim($_GET['tecnico']) : '';
$tipo_equipo      = isset($_GET['tipo_equipo']) ? trim($_GET['tipo_equipo']) : '';
$solo_activas     = isset($_GET['solo_activas']) ? trim($_GET['solo_activas']) : '';
$solo_programadas = isset($_GET['solo_programadas']) ? trim($_GET['solo_programadas']) : '';

$params = [];
$types = "";

if (!empty($solo_programadas) && $solo_programadas === '1') {
    // Uso de CONCAT_WS y COALESCE para evitar que valores nulos rompan la consulta
    $sql = "SELECT * FROM (
        SELECT 
            MIN(d.id) as id,
            'PROG-CAL' as numero_incidente,
            CONCAT('Venta #', v.id) as numero,
            v.cliente as cliente,
            v.sucursal as sucursal,
            CONCAT(COUNT(d.id), ' equipo(s) a Calibrar.') as falla,
            d.proxima_calibracion as fecha,
            'Programado' as estatus,
            MAX(d.equipo) as equipo,
            'Por asignar' as tecnico,
            GROUP_CONCAT(CONCAT_WS(' ', d.marca, d.modelo, CONCAT('(Serie: ', COALESCE(d.numero_serie, 'S/N'), ')')) SEPARATOR '||') as detalles_completos
        FROM venta_detalles d
        JOIN ventas v ON d.venta_id = v.id
        WHERE d.calibracion > 0 AND d.proxima_calibracion IS NOT NULL
        GROUP BY v.id, v.cliente, v.sucursal, d.proxima_calibracion
        
        UNION ALL
        
        SELECT 
            MIN(d.id) as id,
            'PROG-SERV' as numero_incidente,
            CONCAT('Venta #', v.id) as numero,
            v.cliente as cliente,
            v.sucursal as sucursal,
            CONCAT(COUNT(d.id), ' equipo(s) a Servicio.') as falla,
            d.proximo_servicio as fecha,
            'Programado' as estatus,
            MAX(d.equipo) as equipo,
            'Por asignar' as tecnico,
            GROUP_CONCAT(CONCAT_WS(' ', d.marca, d.modelo, CONCAT('(Serie: ', COALESCE(d.numero_serie, 'S/N'), ')')) SEPARATOR '||') as detalles_completos
        FROM venta_detalles d
        JOIN ventas v ON d.venta_id = v.id
        WHERE d.servicio = 1 AND d.frecuencia_servicio > 0 AND d.proximo_servicio IS NOT NULL
        GROUP BY v.id, v.cliente, v.sucursal, d.proximo_servicio
    ) AS programadas WHERE 1=1";
} else {
    $sql = "SELECT id, numero_incidente, numero, cliente, sucursal, falla, fecha, estatus, equipo, tecnico, '' as detalles_completos 
            FROM incidencias WHERE 1=1";
            
    if (!empty($solo_activas) && $solo_activas === '1') {
        $sql .= " AND estatus IN ('Abierto', 'Asignado', 'Pendiente', 'Completado')";
    }
    if (!empty($estatus)) {
        $sql .= " AND estatus = ?";
        $params[] = $estatus;
        $types .= "s";
    }
    if (!empty($tecnico)) {
        $sql .= " AND tecnico LIKE ?";
        $params[] = "%$tecnico%";
        $types .= "s";
    }
}

if (!empty($cliente) && $cliente !== 'todos') {
    $sql .= " AND cliente = ?";
    $params[] = $cliente;
    $types .= "s";
}
if (!empty($fecha_inicio)) {
    $sql .= " AND fecha >= ?";
    $params[] = $fecha_inicio;
    $types .= "s";
}
if (!empty($fecha_fin)) {
    $sql .= " AND fecha <= ?";
    $params[] = $fecha_fin;
    $types .= "s";
}
if (!empty($sucursal)) {
    $sql .= " AND sucursal LIKE ?";
    $params[] = "%$sucursal%";
    $types .= "s";
}
if (!empty($tipo_equipo)) {
    $sql .= " AND equipo = ?";
    $params[] = $tipo_equipo;
    $types .= "s";
}

if (!empty($solo_programadas) && $solo_programadas === '1') {
    $sql .= " ORDER BY fecha ASC";
} else {
    $sql .= " ORDER BY id DESC";
}

$stmt = $conn->prepare($sql);
if (!$stmt) {
    // Si la base de datos devuelve error, lo mandamos en JSON limpio para que JS lo pueda leer
    die(json_encode(["error" => $conn->error]));
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();
$incidencias = [];

while ($fila = $result->fetch_assoc()) {
    $incidencias[] = $fila;
}

echo json_encode(empty($incidencias) ? ["message" => "No se encontraron datos"] : $incidencias);

$stmt->close();
$conn->close();
?>