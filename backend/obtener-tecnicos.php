<?php
header('Content-Type: application/json');
require_once 'conexion.php';

try {
    $stmt = $conn->prepare("SELECT id, nombre FROM usuarios WHERE rol = 'tecnico' ORDER BY nombre");
    $stmt->execute();
    $tecnicos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'tecnicos' => $tecnicos
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener técnicos: ' . $e->getMessage()
    ]);
}
?>