<?php
require_once 'conexion.php';

header('Content-Type: application/json');

try {
    $sql = "SELECT id, nombre, rfc, direccion, telefono, contactos, email 
            FROM clientes 
            ORDER BY nombre";
    
    $resultado = $conexion->query($sql);
    
    if (!$resultado) {
        throw new Exception("Error en la consulta: " . $conexion->error);
    }
    
    $clientes = [];
    while ($fila = $resultado->fetch_assoc()) {
        $clientes[] = $fila;
    }
    
    echo json_encode(['success' => true, 'data' => $clientes]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>