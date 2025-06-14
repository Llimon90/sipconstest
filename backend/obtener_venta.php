<?php
require_once 'conexion.php';

header('Content-Type: application/json');

if (!isset($_GET['id'])) {
    echo json_encode(['error' => 'ID no proporcionado']);
    exit;
}

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Obtener datos básicos de la venta
    $stmt = $conn->prepare("SELECT v.*, c.nombre as cliente 
                          FROM ventas v
                          JOIN clientes c ON v.cliente_id = c.id
                          WHERE v.id = ?");
    $stmt->execute([$_GET['id']]);
    $venta = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$venta) {
        echo json_encode(['error' => 'Venta no encontrada']);
        exit;
    }

    // Obtener números de serie
    $stmt = $conn->prepare("SELECT numero_serie FROM ventas_series WHERE venta_id = ?");
    $stmt->execute([$_GET['id']]);
    $venta['numero_series'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode($venta);
    
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>