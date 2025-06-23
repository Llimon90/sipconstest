<?php
header('Content-Type: application/json');
require 'conexion.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(['exito' => false, 'mensaje' => 'Datos inválidos']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE ventas SET 
        cliente = ?, 
        sucursal = ?, 
        equipo = ?, 
        marca = ?, 
        modelo = ?, 
        numero_serie = ?, 
        garantia = ?, 
        servicio = ?, 
        notas = ?,
        fecha_actualizacion = NOW()
        WHERE id = ?");
    
    $stmt->execute([
        $data['cliente'],
        $data['sucursal'],
        $data['equipo'],
        $data['marca'],
        $data['modelo'],
        $data['numero_serie'],
        $data['garantia'],
        $data['servicio'] ? 1 : 0,
        $data['notas'],
        $data['id']
    ]);
    
    echo json_encode(['exito' => true, 'mensaje' => 'Venta actualizada correctamente']);
} catch (PDOException $e) {
    echo json_encode(['exito' => false, 'mensaje' => 'Error: ' . $e->getMessage()]);
}
?>