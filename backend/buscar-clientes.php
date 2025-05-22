<?php
header('Content-Type: application/json');
require_once 'conexion.php'; // Asegúrate de incluir tu archivo de conexión

$filtro = isset($_GET['q']) ? $_GET['q'] : '';

try {
    $conn = Conexion::conectar();
    
    $sql = "SELECT * FROM clientes 
            WHERE nombre LIKE :filtro 
            OR rfc LIKE :filtro 
            OR direccion LIKE :filtro 
            OR telefono LIKE :filtro 
            OR contactos LIKE :filtro 
            OR email LIKE :filtro
            ORDER BY nombre";
    
    $stmt = $conn->prepare($sql);
    $paramFiltro = "%$filtro%";
    $stmt->bindParam(':filtro', $paramFiltro);
    $stmt->execute();
    
    $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($clientes);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Error al buscar clientes: ' . $e->getMessage()]);
}
?>