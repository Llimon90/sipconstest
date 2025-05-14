<?php
require_once 'conexion.php';

header('Content-Type: application/json');

if (isset($_POST['consulta'])) {
    $consulta = $conexion->real_escape_string($_POST['consulta']);
    $sql = "SELECT nombre, rfc, direccion, telefono, contactos, email 
            FROM clientes 
            WHERE nombre LIKE '%$consulta%' 
               OR rfc LIKE '%$consulta%' 
               OR direccion LIKE '%$consulta%' 
               OR telefono LIKE '%$consulta%' 
               OR contactos LIKE '%$consulta%' 
               OR email LIKE '%$consulta%' 
            LIMIT 10";
    $resultado = $conexion->query($sql);

    $clientes = [];
    while ($fila = $resultado->fetch_assoc()) {
        $clientes[] = $fila;
    }

    echo json_encode($clientes);
} else {
    echo json_encode([]);
}
?>
