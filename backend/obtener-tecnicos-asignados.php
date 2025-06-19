<?php
header('Content-Type: application/json');
require_once 'conexion.php';

if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
    exit;
}

$idIncidencia = $conn->real_escape_string($_GET['id']);

// Consulta para obtener técnicos asignados a esta incidencia
$sql = "SELECT u.id, u.nombre 
        FROM usuarios u
        JOIN incidencias_tecnicos it ON u.id = it.id_tecnico
        WHERE it.id_incidencia = '$idIncidencia'";

$result = $conn->query($sql);

if (!$result) {
    echo json_encode(['success' => false, 'message' => 'Error en la consulta: ' . $conn->error]);
    exit;
}

$tecnicos = [];
while ($row = $result->fetch_assoc()) {
    $tecnicos[] = $row;
}

echo json_encode(['success' => true, 'data' => $tecnicos]);
$conn->close();
?>