<?php
require_once 'conexion.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->beginTransaction();

    // Actualizar datos básicos de la venta
    $stmt = $conn->prepare("UPDATE ventas SET 
                          sucursal = ?, 
                          equipo = ?, 
                          marca = ?, 
                          modelo = ?, 
                          garantia = ?, 
                          calibracion = ?,
                          servicio = ?,
                          notas = ?
                          WHERE id = ?");
    
    $stmt->execute([
        $data['sucursal'],
        $data['equipo'],
        $data['marca'],
        $data['modelo'],
        $data['garantia'],
        $data['calibracion'],
        $data['servicio'] ? 1 : 0,
        $data['notas'],
        $data['id']
    ]);

    // Eliminar series antiguas
    $stmt = $conn->prepare("DELETE FROM ventas_series WHERE venta_id = ?");
    $stmt->execute([$data['id']]);

    // Insertar nuevas series
    $stmt = $conn->prepare("INSERT INTO ventas_series (venta_id, numero_serie) VALUES (?, ?)");
    foreach ($data['numero_series'] as $serie) {
        if (!empty($serie)) {
            $stmt->execute([$data['id'], $serie]);
        }
    }

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Venta actualizada correctamente']);
    
} catch(PDOException $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>