<?php
// buscar_reportes.php

// Incluir tu archivo de conexión (asegúrate que $conn quede como instancia mysqli)
require_once 'conexion.php';

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

// Obtener parámetros de la petición
$cliente       = isset($_GET['cliente']) ? trim($_GET['cliente']) : '';
$fecha_inicio  = isset($_GET['fecha_inicio']) ? trim($_GET['fecha_inicio']) : '';
$fecha_fin     = isset($_GET['fecha_fin']) ? trim($_GET['fecha_fin']) : '';
$estatus       = isset($_GET['estatus']) ? trim($_GET['estatus']) : '';
$sucursal      = isset($_GET['sucursal']) ? trim($_GET['sucursal']) : '';
$tecnico       = isset($_GET['tecnico']) ? trim($_GET['tecnico']) : '';
$tipo_equipo   = isset($_GET['tipo_equipo']) ? trim($_GET['tipo_equipo']) : '';
$solo_activas  = isset($_GET['solo_activas']) ? trim($_GET['solo_activas']) : '';

// Construir la consulta base
$sql = "SELECT * FROM incidencias WHERE 1=1";
$params = [];
$types = "";

// Filtros condicionales
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

if (!empty($solo_activas) && $solo_activas === '1') {
    $sql .= " AND estatus IN ('Abierto', 'Asignado', 'Pendiente', 'Completado')";
}

// Filtro rápido: Mr. Tienda / Mr. Chef
if (!empty($tipo_equipo) && $tipo_equipo !== 'todos') {
    if ($tipo_equipo === 'mr-tienda-chef') {
        // Filtrar los que contengan “Mr. Tienda” o “Mr. Chef”
        $sql .= " AND (cliente LIKE '%Mr. Tienda%' OR cliente LIKE '%Mr. Chef%' OR equipo LIKE '%Mr. Tienda%' OR equipo LIKE '%Mr. Chef%')";
    } elseif ($tipo_equipo === 'otros') {
        // Excluir los que contengan esos valores
        $sql .= " AND (cliente NOT LIKE '%Mr. Tienda%' AND cliente NOT LIKE '%Mr. Chef%' AND equipo NOT LIKE '%Mr. Tienda%' AND equipo NOT LIKE '%Mr. Chef%')";
    }
}

// Orden por más reciente (o lo que prefieras)
$sql .= " ORDER BY id DESC";

// Preparar la consulta
$stmt = $conn->prepare($sql);
if ($stmt === false) {
    die(json_encode(["error" => "Error al preparar la consulta: " . $conn->error]));
}

// Si se tienen parámetros, enlazarlos
if (!empty($params)) {
    // Usamos “...$params” para expandir el array
    $stmt->bind_param($types, ...$params);
}

// Ejecutar
$stmt->execute();

// Obtener resultados
$result = $stmt->get_result();
$incidencias = [];
while ($fila = $result->fetch_assoc()) {
    $incidencias[] = $fila;
}

// Si no hay resultados
if (empty($incidencias)) {
    echo json_encode(["message" => "No se encontraron datos"]);
} else {
    echo json_encode($incidencias);
}

// Cerrar
$stmt->close();
$conn->close();
?>
