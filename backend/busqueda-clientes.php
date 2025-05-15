<?php
require_once 'conexion.php';

header('Content-Type: application/json');

try {
    $sql = "SELECT id, nombre, rfc, direccion, telefono, contactos, email 
            FROM clientes 
            ORDER BY nombre";
    
    $resultado = $conexion->query($sql);
    
    $clientes = [];
    while ($fila = $resultado->fetch_assoc()) {
        $clientes[] = $fila;
    }
    
    echo json_encode($clientes);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>