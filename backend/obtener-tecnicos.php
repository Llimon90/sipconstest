<?php
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

require_once 'conexion.php';

if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $conn->connect_error,
        'data' => []
    ]));
}

$sql = "SELECT id, nombre FROM usuarios 
        WHERE (rol = 'Técnico' OR rol = 'Administrativo/Técnico') 
  
        ORDER BY nombre";

$result = $conn->query($sql);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Error en la consulta: ' . $conn->error,
        'data' => []
    ]);
    exit;
}

$tecnicos = [];
while ($row = $result->fetch_assoc()) {
    $tecnicos[] = $row;
}

// Estructura de respuesta consistente
echo json_encode([
    'success' => true,
    'message' => count($tecnicos) ? 'Técnicos obtenidos' : 'No hay técnicos',
    'data' => $tecnicos
]);

$conn->close();
?>