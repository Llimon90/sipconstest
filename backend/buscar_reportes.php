<?php
// buscar_reportes.php

require_once 'conexion.php';

if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

// Configuración de cabeceras para API y evitar caché
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

// 1. Recibir parámetros
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

// 2. Determinar la fuente de datos
if (!empty($solo_programadas) && $solo_programadas === '1') {
    // Si se activa "Programadas", extraemos directamente de venta_detalles (Futuras)
    $sql = "SELECT * FROM (
        SELECT 
            d.id as id,
            'PROG-CAL' as numero_incidente,
            CONCAT('Venta #', v.id) as numero,
            v.cliente as cliente,
            v.sucursal as sucursal,
            CONCAT('Calibración: ', d.marca, ' ', d.modelo, ' (S/N: ', d.numero_serie, ')') as falla,
            d.proxima_calibracion as fecha,
            'Programado' as estatus,
            d.equipo as equipo,
            'Por asignar' as tecnico
        FROM venta_detalles d
        JOIN ventas v ON d.venta_id = v.id
        WHERE d.calibracion > 0 AND d.proxima_calibracion IS NOT NULL
        
        UNION ALL
        
        SELECT 
            d.id as id,
            'PROG-SERV' as numero_incidente,
            CONCAT('Venta #', v.id) as numero,
            v.cliente as cliente,
            v.sucursal as sucursal,
            CONCAT('Servicio: ', d.marca, ' ', d.modelo, ' (S/N: ', d.numero_serie, ')') as falla,
            d.proximo_servicio as fecha,
            'Programado' as estatus,
            d.equipo as equipo,
            'Por asignar' as tecnico
        FROM venta_detalles d
        JOIN ventas v ON d.venta_id = v.id
        WHERE d.servicio = 1 AND d.frecuencia_servicio > 0 AND d.proximo_servicio IS NOT NULL
    ) AS programadas WHERE 1=1";
} else {
    // Si no está activo, buscamos en el historial real de incidencias
    $sql = "SELECT id, numero_incidente, numero, cliente, sucursal, falla, fecha, estatus, equipo, tecnico 
            FROM incidencias WHERE 1=1";
            
    // Estos filtros solo aplican a incidencias reales
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

// 3. Filtros compartidos (Aplican sin importar si es de incidencias o de venta_detalles)
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

// 4. Ordenamiento inteligente
if (!empty($solo_programadas) && $solo_programadas === '1') {
    $sql .= " ORDER BY fecha ASC"; // Fechas más cercanas primero para programadas
} else {
    $sql .= " ORDER BY id DESC"; // Más recientes primero para tickets normales
}

// Ejecutar
$stmt = $conn->prepare($sql);
if (!$stmt) {
    die(json_encode(["error" => "Error SQL: " . $conn->error]));
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