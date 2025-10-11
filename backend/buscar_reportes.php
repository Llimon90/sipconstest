<?php
// Configurar conexión con la base de datos
require_once 'conexion.php';

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

// Recibir los parámetros de búsqueda y sanitizarlos
$cliente = isset($_GET['cliente']) ? trim($_GET['cliente']) : '';
$fecha_inicio = isset($_GET['fecha_inicio']) ? trim($_GET['fecha_inicio']) : '';
$fecha_fin = isset($_GET['fecha_fin']) ? trim($_GET['fecha_fin']) : '';
$estatus = isset($_GET['estatus']) ? trim($_GET['estatus']) : '';
$sucursal = isset($_GET['sucursal']) ? trim($_GET['sucursal']) : '';
$tecnico = isset($_GET['tecnico']) ? trim($_GET['tecnico']) : '';
$tipo_equipo = isset($_GET['tipo_equipo']) ? trim($_GET['tipo_equipo']) : '';
$solo_activas = isset($_GET['solo_activas']) ? trim($_GET['solo_activas']) : '';

// Construir la consulta SQL con `prepared statements`
$sql = "SELECT * FROM incidencias WHERE 1";

$params = [];
$types = "";

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

// Filtrar por incidencias activas (Abierto, Asignado, Pendiente, Completado)
if (!empty($solo_activas) && $solo_activas === '1') {
    $sql .= " AND estatus IN ('Abierto', 'Asignado', 'Pendiente', 'Completado')";
}

// Búsqueda por tipo de equipo - FILTROS RÁPIDOS (CORREGIDO)
if (!empty($tipo_equipo) && $tipo_equipo !== 'todos') {
    if ($tipo_equipo === 'mr-tienda-chef') {
        // Filtrar solo equipos Mr. Tienda/Mr. Chef
        $sql .= " AND (equipo LIKE '%Mr. Tienda%' OR equipo LIKE '%Mr. Chef%' OR equipo = 'Mr. Tienda/Mr. Chef')";
    } elseif ($tipo_equipo === 'otros') {
        // Filtrar todos los que NO son Mr. Tienda/Mr. Chef
        $sql .= " AND (equipo NOT LIKE '%Mr. Tienda%' AND equipo NOT LIKE '%Mr. Chef%' AND equipo != 'Mr. Tienda/Mr. Chef')";
    }
}

// Agregar orden de más reciente a más antiguo
$sql .= " ORDER BY id DESC";

// Preparar y ejecutar la consulta
$stmt = $conn->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$incidencias = [];
while ($row = $result->fetch_assoc()) {
    $incidencias[] = $row;
}

echo json_encode($incidencias ?: ["message" => "No se encontraron datos"]);

// Cerrar la conexión
$stmt->close();
$conn->close();
?>