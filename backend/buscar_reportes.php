<?php
// buscar_reportes.php

require_once 'conexion.php';

if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

// Configuración de cabeceras para API JSON y evitar caché
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

// 1. Recolección de parámetros desde la URL (GET)
$cliente          = isset($_GET['cliente']) ? trim($_GET['cliente']) : '';
$fecha_inicio     = isset($_GET['fecha_inicio']) ? trim($_GET['fecha_inicio']) : '';
$fecha_fin        = isset($_GET['fecha_fin']) ? trim($_GET['fecha_fin']) : '';
$estatus          = isset($_GET['estatus']) ? trim($_GET['estatus']) : '';
$sucursal         = isset($_GET['sucursal']) ? trim($_GET['sucursal']) : '';
$tecnico          = isset($_GET['tecnico']) ? trim($_GET['tecnico']) : '';
$tipo_equipo      = isset($_GET['tipo_equipo']) ? trim($_GET['tipo_equipo']) : '';
$solo_activas     = isset($_GET['solo_activas']) ? trim($_GET['solo_activas']) : '';
// NUEVO: Parámetro para incidencias programadas
$solo_programadas = isset($_GET['solo_programadas']) ? trim($_GET['solo_programadas']) : '';

// 2. Construcción de la consulta base
$sql = "SELECT * FROM incidencias WHERE 1=1";
$params = [];
$types = "";

// 3. Aplicación de filtros dinámicos (Entrelazados)
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
if (!empty($estatus)) {
    $sql .= " AND estatus = ?";
    $params[] = $estatus;
    $types .= "s";
}
if (!empty($sucursal)) {
    $sql .= " AND sucursal LIKE ?";
    $params[] = "%$sucursal%";
    $types .= "s";
}
if (!empty($tecnico)) {
    $sql .= " AND tecnico LIKE ?";
    $params[] = "%$tecnico%";
    $types .= "s";
}

// Filtro de incidencias activas (Estados operativos)
if (!empty($solo_activas) && $solo_activas === '1') {
    $sql .= " AND estatus IN ('Abierto', 'Asignado', 'Pendiente', 'Completado')";
}

// NUEVO: Filtro de incidencias programadas
// Se define como cualquier incidencia que NO esté cerrada con factura.
// Esto permite que se combine con los filtros de fecha de arriba.
if (!empty($solo_programadas) && $solo_programadas === '1') {
    $sql .= " AND estatus <> 'Cerrado con factura'";
}

if (!empty($tipo_equipo)) {
    $sql .= " AND equipo = ?";
    $params[] = $tipo_equipo;
    $types .= "s";
}

$sql .= " ORDER BY id DESC";

// 4. Preparación y ejecución
$stmt = $conn->prepare($sql);
if (!$stmt) {
    die(json_encode(["error" => "Error en prepare(): " . $conn->error]));
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

// 5. Respuesta
if (empty($incidencias)) {
    echo json_encode(["message" => "No se encontraron datos", "debug_sql" => $sql]);
} else {
    echo json_encode($incidencias);
}

$stmt->close();
$conn->close();
?>