<?php
require_once 'conexion.php';

header('Content-Type: application/json');

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Construir consulta con filtros
    $sql = "SELECT v.*, c.nombre as cliente 
            FROM ventas v
            JOIN clientes c ON v.cliente_id = c.id
            WHERE 1=1";
    
    $params = [];
    
    if (!empty($_GET['cliente_id'])) {
        $sql .= " AND v.cliente_id = :cliente_id";
        $params[':cliente_id'] = $_GET['cliente_id'];
    }
    
    if (!empty($_GET['fecha'])) {
        $sql .= " AND DATE(v.fecha) = :fecha";
        $params[':fecha'] = $_GET['fecha'];
    }
    
    $sql .= " ORDER BY v.fecha DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    
    $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener números de serie para cada venta
    foreach ($ventas as &$venta) {
        $stmt = $conn->prepare("SELECT numero_serie FROM ventas_series WHERE venta_id = ?");
        $stmt->execute([$venta['id']]);
        $venta['numero_series'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    echo json_encode($ventas);
    
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>