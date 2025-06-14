<?php
require_once 'conexion.php';

header('Content-Type: application/json');

if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'error' => 'ID no proporcionado']);
    exit;
}

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->beginTransaction();

    // Eliminar series primero
    $stmt = $conn->prepare("DELETE FROM ventas_series WHERE venta_id = ?");
    $stmt->execute([$_GET['id']]);

    // Luego eliminar la venta
    $stmt = $conn->prepare("DELETE FROM ventas WHERE id = ?");
    $stmt->execute([$_GET['id']]);

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Venta eliminada correctamente']);
    
} catch(PDOException $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>