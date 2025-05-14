<?php
require_once 'conexion.php';

header('Content-Type: application/json');

try {
    if (isset($_POST['consulta']) && !empty(trim($_POST['consulta']))) {
        $consulta = trim($conexion->real_escape_string($_POST['consulta']));
        $terminoBusqueda = "%$consulta%";
        
        $sql = "SELECT id, nombre, rfc, direccion, telefono, contactos, email 
                FROM clientes 
                WHERE nombre LIKE ? 
                   OR rfc LIKE ? 
                   OR direccion LIKE ? 
                   OR telefono LIKE ? 
                   OR contactos LIKE ? 
                   OR email LIKE ? 
                ORDER BY nombre
                LIMIT 10";
                
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param('ssssss', 
            $terminoBusqueda, 
            $terminoBusqueda, 
            $terminoBusqueda, 
            $terminoBusqueda, 
            $terminoBusqueda, 
            $terminoBusqueda
        );
        $stmt->execute();
        $resultado = $stmt->get_result();
        
        $clientes = [];
        while ($fila = $resultado->fetch_assoc()) {
            $clientes[] = $fila;
        }
        
        echo json_encode($clientes);
    } else {
        echo json_encode([]);
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>